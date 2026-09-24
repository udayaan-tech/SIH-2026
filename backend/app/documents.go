package app

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/nyay-suraksha/backend/config"
)

// Document represents an evidentiary asset in Nyay Suraksha
type Document struct {
	ID             string    `json:"id"`
	CaseID         *string   `json:"case_id,omitempty"`
	FIRNumber      *string   `json:"fir_number,omitempty"`
	Title          string    `json:"title"`
	Type           string    `json:"type"`
	FileSize       int64     `json:"file_size"`
	StorageKey     *string   `json:"storage_key,omitempty"`
	SHA256Hash     string    `json:"sha256_hash"`
	MerkleLeafID   *int      `json:"merkle_leaf_id,omitempty"`
	Classification string    `json:"classification"`
	UploadedBy     *string   `json:"uploaded_by,omitempty"`
	UploaderName   *string   `json:"uploader_name,omitempty"`
	UploaderBadge  *string   `json:"uploader_badge,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}

// DocumentHandler handles document metadata and retrieval
type DocumentHandler struct {
	db          *sql.DB
	cfg         *config.Config
	authHandler *AuthHandler
}

// NewDocumentHandler creates a new DocumentHandler instance
func NewDocumentHandler(db *sql.DB, cfg *config.Config, authHandler *AuthHandler) *DocumentHandler {
	return &DocumentHandler{
		db:          db,
		cfg:         cfg,
		authHandler: authHandler,
	}
}

// hasDocumentAccess verifies that caller has legitimate legal custody, case assignment, or court jurisdiction
func (h *DocumentHandler) hasDocumentAccess(c *gin.Context, docID string) (bool, error) {
	callerRole, _ := c.Get("role")
	roleStr := ""
	if callerRole != nil {
		roleStr = strings.ToUpper(fmt.Sprintf("%v", callerRole))
	}

	// Court officers and system administrators have full jurisdiction access
	if roleStr == RoleAdmin || roleStr == RoleJudge || roleStr == RoleProsecutor {
		return true, nil
	}

	callerID, _ := c.Get("user_id")
	userIDStr := ""
	if callerID != nil {
		userIDStr = fmt.Sprintf("%v", callerID)
	}
	if userIDStr == "" {
		return false, nil
	}

	// Check if caller uploaded the document, is the assigned IO of the case, or received custody
	var count int
	err := h.db.QueryRow(`
		SELECT COUNT(*) FROM documents d
		LEFT JOIN cases c ON d.case_id = c.id
		WHERE d.id = $1 AND (
			d.uploaded_by = $2 
			OR c.io_id = $2
			OR EXISTS (
				SELECT 1 FROM custody_events ce 
				WHERE ce.document_id = d.id 
				  AND (ce.to_officer = $2 OR ($3 = 'FSL' AND ce.to_agency = 'FSL'))
			)
		)
	`, docID, userIDStr, roleStr).Scan(&count)

	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// ═══════════════════════════════════════════════════
// ENDPOINTS
// ═══════════════════════════════════════════════════

// ListDocuments lists evidence documents with role filtering and pagination
// GET /api/v1/documents
func (h *DocumentHandler) ListDocuments(c *gin.Context) {
	callerID, _ := c.Get("user_id")
	callerRole, _ := c.Get("role")
	roleStr := ""
	if callerRole != nil {
		roleStr = strings.ToUpper(fmt.Sprintf("%v", callerRole))
	}
	userIDStr := ""
	if callerID != nil {
		userIDStr = fmt.Sprintf("%v", callerID)
	}

	caseID := c.Query("case_id")
	docType := c.Query("type")
	classification := c.Query("classification")
	search := c.Query("search")

	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsedLimit, err := strconv.Atoi(l); err == nil && parsedLimit > 0 {
			if parsedLimit > 100 {
				limit = 100
			} else {
				limit = parsedLimit
			}
		}
	}
	offset := 0
	if o := c.Query("offset"); o != "" {
		if parsedOffset, err := strconv.Atoi(o); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	whereClause := " WHERE 1=1"
	args := []interface{}{}
	argIdx := 1

	// Role-based document visibility rules
	switch roleStr {
	case RoleIO:
		whereClause += fmt.Sprintf(` AND (
			d.uploaded_by = $%d 
			OR c.io_id = $%d 
			OR EXISTS (SELECT 1 FROM custody_events ce WHERE ce.document_id = d.id AND ce.to_officer = $%d)
		)`, argIdx, argIdx, argIdx)
		args = append(args, userIDStr)
		argIdx++
	case RoleFSL:
		whereClause += fmt.Sprintf(` AND EXISTS (
			SELECT 1 FROM custody_events ce 
			WHERE ce.document_id = d.id AND (ce.to_officer = $%d OR ce.to_agency = 'FSL')
		)`, argIdx)
		args = append(args, userIDStr)
		argIdx++
	}

	if caseID != "" {
		whereClause += fmt.Sprintf(" AND d.case_id = $%d", argIdx)
		args = append(args, caseID)
		argIdx++
	}

	if docType != "" {
		whereClause += fmt.Sprintf(" AND d.type = $%d", argIdx)
		args = append(args, strings.ToUpper(docType))
		argIdx++
	}

	if classification != "" {
		whereClause += fmt.Sprintf(" AND d.classification = $%d", argIdx)
		args = append(args, strings.ToUpper(classification))
		argIdx++
	}

	if search != "" {
		whereClause += fmt.Sprintf(" AND (d.title ILIKE $%d OR d.sha256_hash ILIKE $%d)", argIdx, argIdx)
		args = append(args, "%"+search+"%")
		argIdx++
	}

	// Compute total count
	var totalCount int
	countQuery := "SELECT COUNT(*) FROM documents d LEFT JOIN cases c ON d.case_id = c.id " + whereClause
	if err := h.db.QueryRow(countQuery, args...).Scan(&totalCount); err != nil {
		totalCount = 0
	}

	query := `
		SELECT 
			d.id, d.case_id, c.fir_number, d.title, d.type, COALESCE(d.file_size, 0),
			d.storage_key, d.sha256_hash, d.merkle_leaf_id, d.classification,
			d.uploaded_by, u.name as uploader_name, u.badge_id as uploader_badge,
			d.created_at
		FROM documents d
		LEFT JOIN cases c ON d.case_id = c.id
		LEFT JOIN users u ON d.uploaded_by = u.id
	` + whereClause + fmt.Sprintf(" ORDER BY d.created_at DESC LIMIT $%d OFFSET $%d", argIdx, argIdx+1)

	pagedArgs := append(args, limit, offset)
	rows, err := h.db.Query(query, pagedArgs...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Failed to list documents. Please contact support.",
		})
		return
	}
	defer rows.Close()

	docs := make([]Document, 0)
	for rows.Next() {
		var d Document
		err := rows.Scan(
			&d.ID,
			&d.CaseID,
			&d.FIRNumber,
			&d.Title,
			&d.Type,
			&d.FileSize,
			&d.StorageKey,
			&d.SHA256Hash,
			&d.MerkleLeafID,
			&d.Classification,
			&d.UploadedBy,
			&d.UploaderName,
			&d.UploaderBadge,
			&d.CreatedAt,
		)
		if err != nil {
			log.Printf("⚠️ Error scanning document row: %v", err)
			continue
		}
		docs = append(docs, d)
	}

	if err := rows.Err(); err != nil {
		log.Printf("⚠️ Error iterating document rows: %v", err)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"documents": docs,
			"total":     totalCount,
			"limit":     limit,
			"offset":    offset,
		},
		"error": nil,
	})
}

// GetDocument retrieves single document metadata with BOLA/IDOR protection
// GET /api/v1/documents/:id
func (h *DocumentHandler) GetDocument(c *gin.Context) {
	docID := c.Param("id")
	if docID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Document ID is required",
		})
		return
	}

	allowed, err := h.hasDocumentAccess(c, docID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Access validation check failed",
		})
		return
	}
	if !allowed {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Access denied: Officer lacks jurisdictional assignment or custody clearance for this evidentiary document",
		})
		return
	}

	var d Document
	err = h.db.QueryRow(`
		SELECT 
			d.id, d.case_id, c.fir_number, d.title, d.type, COALESCE(d.file_size, 0),
			d.storage_key, d.sha256_hash, d.merkle_leaf_id, d.classification,
			d.uploaded_by, u.name as uploader_name, u.badge_id as uploader_badge,
			d.created_at
		FROM documents d
		LEFT JOIN cases c ON d.case_id = c.id
		LEFT JOIN users u ON d.uploaded_by = u.id
		WHERE d.id = $1
	`, docID).Scan(
		&d.ID,
		&d.CaseID,
		&d.FIRNumber,
		&d.Title,
		&d.Type,
		&d.FileSize,
		&d.StorageKey,
		&d.SHA256Hash,
		&d.MerkleLeafID,
		&d.Classification,
		&d.UploadedBy,
		&d.UploaderName,
		&d.UploaderBadge,
		&d.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"data":    nil,
				"error":   "Document not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Failed to load document",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    d,
		"error":   nil,
	})
}

// DownloadDocument streams the actual evidentiary binary to authenticated callers with HTTP Range support
// GET /api/v1/documents/:id/download
func (h *DocumentHandler) DownloadDocument(c *gin.Context) {
	docID := c.Param("id")

	allowed, err := h.hasDocumentAccess(c, docID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Access validation check failed",
		})
		return
	}
	if !allowed {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Access denied: Officer lacks jurisdictional assignment or custody clearance for this evidentiary document",
		})
		return
	}

	var title string
	var storageKey *string
	var createdAt time.Time
	err = h.db.QueryRow("SELECT title, storage_key, created_at FROM documents WHERE id = $1", docID).Scan(&title, &storageKey, &createdAt)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Document not found",
		})
		return
	}

	if storageKey == nil || *storageKey == "" {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"data":    nil,
			"error":   "File content not stored on disk or object storage",
		})
		return
	}

	reader, err := DownloadFile(h.cfg.MinIOBucket, *storageKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Failed to retrieve file from vault",
		})
		return
	}
	defer reader.Close()

	// Record audit download event
	callerID, _ := c.Get("user_id")
	callerBadge, _ := c.Get("badge_id")
	actorBadge := ""
	if callerBadge != nil {
		actorBadge = fmt.Sprintf("%v", callerBadge)
	}
	actorID := ""
	if callerID != nil {
		actorID = fmt.Sprintf("%v", callerID)
	}

	// F-015, F-020: Record in append-only cryptographic hash chain
	docAudit, _ := json.Marshal(map[string]interface{}{"title": title})
	_ = RecordAuditEvent(h.db, actorID, actorBadge, "DOCUMENT_DOWNLOADED", "DOCUMENT", docID, string(docAudit), c.ClientIP())

	// Support HTTP Range Requests (essential for CCTV scrubbing and video playback in court)
	if seeker, ok := reader.(io.ReadSeeker); ok {
		c.Header("Content-Disposition", fmt.Sprintf("inline; filename=%q", filepath.Base(title)))
		http.ServeContent(c.Writer, c.Request, filepath.Base(title), createdAt, seeker)
		return
	}

	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%q", filepath.Base(title)))
	c.Header("Content-Type", "application/octet-stream")
	_, _ = io.Copy(c.Writer, reader)
}

// ═══════════════════════════════════════════════════
// ROUTE REGISTRATION
// ═══════════════════════════════════════════════════

// RegisterDocumentRoutes mounts document metadata endpoints
func RegisterDocumentRoutes(router *gin.Engine, db *sql.DB, cfg *config.Config, authHandler *AuthHandler) *DocumentHandler {
	handler := NewDocumentHandler(db, cfg, authHandler)

	docsGroup := router.Group("/api/v1/documents")
	docsGroup.Use(authHandler.AuthRequired())
	{
		docsGroup.GET("", handler.ListDocuments)
		docsGroup.GET("/:id", handler.GetDocument)
		docsGroup.GET("/:id/download", handler.DownloadDocument)
	}

	log.Println("✅ Document routes registered (/api/v1/documents)")
	return handler
}
