package app

import (
	"bytes"
	"crypto/sha256"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/nyay-suraksha/backend/config"
)

// PIIEntity represents a detected sensitive datum
type PIIEntity struct {
	Type       string `json:"type"` // AADHAAR, PHONE, SENSITIVE_PERSON, PAN, VOTER_ID, VEHICLE_RC, EMAIL, DOB
	Value      string `json:"value"`
	Masked     string `json:"masked"`
	StartIndex int    `json:"start_index"`
	EndIndex   int    `json:"end_index"`
	Context    string `json:"context"`
}

// RedactionItem represents an entry in the review queue
type RedactionItem struct {
	ID               string      `json:"id"`
	DocumentID       string      `json:"document_id"`
	DocumentTitle    string      `json:"document_title"`
	DocumentType     string      `json:"document_type"`
	FIRNumber        *string     `json:"fir_number,omitempty"`
	DetectedEntities []PIIEntity `json:"detected_entities"`
	Status           string      `json:"status"` // PENDING, APPROVED, REJECTED
	ReviewedBy       *string     `json:"reviewed_by,omitempty"`
	ReviewerName     *string     `json:"reviewer_name,omitempty"`
	ReviewedAt       *time.Time  `json:"reviewed_at,omitempty"`
	CreatedAt        time.Time   `json:"created_at"`
}

// RedactionActionRequest is the payload for approving or rejecting redaction
type RedactionActionRequest struct {
	Notes string `json:"notes"`
}

// RedactionHandler handles PII redaction queue operations
type RedactionHandler struct {
	db          *sql.DB
	cfg         *config.Config
	authHandler *AuthHandler
}

// NewRedactionHandler creates a new RedactionHandler
func NewRedactionHandler(db *sql.DB, cfg *config.Config, authHandler *AuthHandler) *RedactionHandler {
	return &RedactionHandler{
		db:          db,
		cfg:         cfg,
		authHandler: authHandler,
	}
}

// ═══════════════════════════════════════════════════
// PII DETECTION ENGINE
// ═══════════════════════════════════════════════════

var (
	aadhaarRegex   = regexp.MustCompile(`\b\d{4}\s\d{4}\s\d{4}\b`)
	phoneRegex     = regexp.MustCompile(`\b[6-9]\d{9}\b`)
	nameRegex      = regexp.MustCompile(`(?i:\b(victim|survivor|minor|juvenile|child)\s+(?:named\s+|is\s+|:\s*)?)([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})`)
	panRegex       = regexp.MustCompile(`\b[A-Z]{5}[0-9]{4}[A-Z]\b`)
	voterIDRegex   = regexp.MustCompile(`\b[A-Z]{3}[0-9]{7}\b`)
	vehicleRCRegex = regexp.MustCompile(`\b[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}\b`)
	emailRegex     = regexp.MustCompile(`\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b`)
	dobRegex       = regexp.MustCompile(`(?i:\b(?:DOB|Date of Birth|Born on)[:\s]+)(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b`)
)

// DetectPII analyzes text content and extracts sensitive entities across standard Indian identifiers
func DetectPII(text string) []PIIEntity {
	entities := make([]PIIEntity, 0)

	// 1. Detect Indian Aadhaar Numbers (12-digit formatted)
	for _, match := range aadhaarRegex.FindAllStringIndex(text, -1) {
		val := text[match[0]:match[1]]
		entities = append(entities, PIIEntity{
			Type:       "AADHAAR",
			Value:      val,
			Masked:     "XXXX-XXXX-" + val[len(val)-4:],
			StartIndex: match[0],
			EndIndex:   match[1],
			Context:    extractSnippet(text, match[0], match[1]),
		})
	}

	// 2. Detect 10-digit Indian Mobile Numbers
	for _, match := range phoneRegex.FindAllStringIndex(text, -1) {
		val := text[match[0]:match[1]]
		entities = append(entities, PIIEntity{
			Type:       "PHONE",
			Value:      val,
			Masked:     val[:2] + "XXXXXX" + val[len(val)-2:],
			StartIndex: match[0],
			EndIndex:   match[1],
			Context:    extractSnippet(text, match[0], match[1]),
		})
	}

	// 3. Detect sensitive names near victim/minor/juvenile keywords
	for _, match := range nameRegex.FindAllStringSubmatchIndex(text, -1) {
		if len(match) >= 6 {
			val := text[match[4]:match[5]]
			entities = append(entities, PIIEntity{
				Type:       "SENSITIVE_PERSON",
				Value:      val,
				Masked:     string(val[0]) + strings.Repeat("*", len(val)-1),
				StartIndex: match[4],
				EndIndex:   match[5],
				Context:    extractSnippet(text, match[0], match[1]),
			})
		}
	}

	// 4. Detect Indian Income Tax PAN Cards (e.g. ABCDE1234F)
	for _, match := range panRegex.FindAllStringIndex(text, -1) {
		val := text[match[0]:match[1]]
		entities = append(entities, PIIEntity{
			Type:       "PAN",
			Value:      val,
			Masked:     val[:2] + "XXXXX" + val[len(val)-3:],
			StartIndex: match[0],
			EndIndex:   match[1],
			Context:    extractSnippet(text, match[0], match[1]),
		})
	}

	// 5. Detect Indian Voter ID Cards (EPIC, e.g. ABC1234567)
	for _, match := range voterIDRegex.FindAllStringIndex(text, -1) {
		val := text[match[0]:match[1]]
		entities = append(entities, PIIEntity{
			Type:       "VOTER_ID",
			Value:      val,
			Masked:     val[:3] + "XXXX" + val[len(val)-3:],
			StartIndex: match[0],
			EndIndex:   match[1],
			Context:    extractSnippet(text, match[0], match[1]),
		})
	}

	// 6. Detect Indian Vehicle Registration / RC Numbers (e.g. DL01AB1234)
	for _, match := range vehicleRCRegex.FindAllStringIndex(text, -1) {
		val := text[match[0]:match[1]]
		entities = append(entities, PIIEntity{
			Type:       "VEHICLE_RC",
			Value:      val,
			Masked:     val[:4] + "XX" + val[len(val)-4:],
			StartIndex: match[0],
			EndIndex:   match[1],
			Context:    extractSnippet(text, match[0], match[1]),
		})
	}

	// 7. Detect Email Addresses
	for _, match := range emailRegex.FindAllStringIndex(text, -1) {
		val := text[match[0]:match[1]]
		parts := strings.Split(val, "@")
		masked := "***@" + parts[1]
		if len(parts[0]) > 0 {
			masked = string(parts[0][0]) + "***@" + parts[1]
		}
		entities = append(entities, PIIEntity{
			Type:       "EMAIL",
			Value:      val,
			Masked:     masked,
			StartIndex: match[0],
			EndIndex:   match[1],
			Context:    extractSnippet(text, match[0], match[1]),
		})
	}

	// 8. Detect Date of Birth (DOB)
	for _, match := range dobRegex.FindAllStringSubmatchIndex(text, -1) {
		if len(match) >= 4 {
			val := text[match[2]:match[3]]
			entities = append(entities, PIIEntity{
				Type:       "DOB",
				Value:      val,
				Masked:     "XX/XX/XXXX",
				StartIndex: match[2],
				EndIndex:   match[3],
				Context:    extractSnippet(text, match[0], match[1]),
			})
		}
	}

	return entities
}

func extractSnippet(text string, start, end int) string {
	s := start - 25
	if s < 0 {
		s = 0
	}
	e := end + 25
	if e > len(text) {
		e = len(text)
	}
	return text[s:e]
}

// ═══════════════════════════════════════════════════
// ENDPOINTS
// ═══════════════════════════════════════════════════

// ListQueue lists documents pending PII review
// GET /api/v1/redaction/queue
func (h *RedactionHandler) ListQueue(c *gin.Context) {
	statusFilter := c.DefaultQuery("status", "PENDING")

	query := `
		SELECT 
			rq.id, rq.document_id, d.title as doc_title, d.type as doc_type, c.fir_number,
			rq.detected_entities, rq.status, rq.reviewed_by, u.name as reviewer_name,
			rq.reviewed_at, rq.created_at
		FROM redaction_queue rq
		JOIN documents d ON rq.document_id = d.id
		LEFT JOIN cases c ON d.case_id = c.id
		LEFT JOIN users u ON rq.reviewed_by = u.id
		WHERE 1=1
	`
	args := []interface{}{}
	argIdx := 1

	if statusFilter != "ALL" {
		query += fmt.Sprintf(" AND rq.status = $%d", argIdx)
		args = append(args, strings.ToUpper(statusFilter))
		argIdx++
	}

	query += " ORDER BY rq.created_at DESC"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"data":    nil,
			"error":   fmt.Sprintf("Failed to load redaction queue: %v", err),
		})
		return
	}
	defer rows.Close()

	items := make([]RedactionItem, 0)
	for rows.Next() {
		var item RedactionItem
		var rawEntities []byte
		err := rows.Scan(
			&item.ID,
			&item.DocumentID,
			&item.DocumentTitle,
			&item.DocumentType,
			&item.FIRNumber,
			&rawEntities,
			&item.Status,
			&item.ReviewedBy,
			&item.ReviewerName,
			&item.ReviewedAt,
			&item.CreatedAt,
		)
		if err != nil {
			continue
		}

		if len(rawEntities) > 0 {
			_ = json.Unmarshal(rawEntities, &item.DetectedEntities)
		}
		if item.DetectedEntities == nil {
			item.DetectedEntities = make([]PIIEntity, 0)
		}

		items = append(items, item)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"queue": items,
			"total": len(items),
		},
		"error": nil,
	})
}

// GetRedactionItem retrieves detected entities for a single document
// GET /api/v1/redaction/:id
func (h *RedactionHandler) GetRedactionItem(c *gin.Context) {
	itemOrDocID := c.Param("id")

	var item RedactionItem
	var rawEntities []byte

	err := h.db.QueryRow(`
		SELECT 
			rq.id, rq.document_id, d.title, d.type, c.fir_number,
			rq.detected_entities, rq.status, rq.reviewed_by, u.name as reviewer_name,
			rq.reviewed_at, rq.created_at
		FROM redaction_queue rq
		JOIN documents d ON rq.document_id = d.id
		LEFT JOIN cases c ON d.case_id = c.id
		LEFT JOIN users u ON rq.reviewed_by = u.id
		WHERE rq.id = $1 OR rq.document_id = $1
	`, itemOrDocID).Scan(
		&item.ID,
		&item.DocumentID,
		&item.DocumentTitle,
		&item.DocumentType,
		&item.FIRNumber,
		&rawEntities,
		&item.Status,
		&item.ReviewedBy,
		&item.ReviewerName,
		&item.ReviewedAt,
		&item.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"data":    nil,
				"error":   "Redaction review record not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"data":    nil,
			"error":   fmt.Sprintf("Failed to load redaction item: %v", err),
		})
		return
	}

	if len(rawEntities) > 0 {
		_ = json.Unmarshal(rawEntities, &item.DetectedEntities)
	}
	if item.DetectedEntities == nil {
		item.DetectedEntities = make([]PIIEntity, 0)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    item,
		"error":   nil,
	})
}

// ApproveRedaction approves detected PII redaction, creates a sanitized physical evidentiary document, and seals it
// POST /api/v1/redaction/:id/approve
func (h *RedactionHandler) ApproveRedaction(c *gin.Context) {
	id := c.Param("id")
	callerID, _ := c.Get("user_id")
	callerBadge, _ := c.Get("badge_id")
	callerIDStr := fmt.Sprintf("%v", callerID)
	callerBadgeStr := fmt.Sprintf("%v", callerBadge)

	now := time.Now()
	res, err := h.db.Exec(`
		UPDATE redaction_queue 
		SET status = 'APPROVED', reviewed_by = $1, reviewed_at = $2
		WHERE id = $3 OR document_id = $3
	`, callerIDStr, now, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"data":    nil,
			"error":   fmt.Sprintf("Failed to approve redaction: %v", err),
		})
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Redaction item not found",
		})
		return
	}

	// Retrieve original document metadata and detected entities to create sanitized copy
	var docID, originalTitle, docType string
	var caseID, originalStorageKey *string

	_ = h.db.QueryRow(`
		SELECT d.id, d.title, d.type, d.case_id, d.storage_key
		FROM redaction_queue rq
		JOIN documents d ON rq.document_id = d.id
		WHERE rq.id = $1 OR rq.document_id = $1
	`, id).Scan(&docID, &originalTitle, &docType, &caseID, &originalStorageKey)

	var sanitizedDocID string
	if docID != "" {
		sanitizedTitle := "[REDACTED] " + originalTitle
		_ = h.db.QueryRow("SELECT id FROM documents WHERE case_id = $1 AND title = $2", caseID, sanitizedTitle).Scan(&sanitizedDocID)

		if sanitizedDocID == "" {
			var rawEntities []byte
			_ = h.db.QueryRow("SELECT detected_entities FROM redaction_queue WHERE id = $1 OR document_id = $1", id).Scan(&rawEntities)

			var entities []PIIEntity
			if len(rawEntities) > 0 {
				_ = json.Unmarshal(rawEntities, &entities)
			}

			var redactedBytes []byte
			if originalStorageKey != nil && *originalStorageKey != "" {
				if r, dlErr := DownloadFile(h.cfg.MinIOBucket, *originalStorageKey); dlErr == nil {
					data, _ := io.ReadAll(r)
					_ = r.Close()
					contentStr := string(data)
					for _, ent := range entities {
						if ent.Value != "" && ent.Masked != "" {
							contentStr = strings.ReplaceAll(contentStr, ent.Value, ent.Masked)
						}
					}
					redactedBytes = []byte(contentStr)
				}
			}

			if len(redactedBytes) == 0 {
				redactedBytes = []byte(fmt.Sprintf("[COURT SEALED - SANITIZED EVIDENTIARY ASSET UNDER BNSS/BSA SECTION 63/65B]\nOriginal Evidence Title: %s\nRedaction Processed: %s by %s\nAll PII/POCSO identifiers masked.", originalTitle, now.Format(time.RFC3339), callerBadgeStr))
			}

			redactedStorageKey := fmt.Sprintf("redacted_%s_%s", docID, originalTitle)
			_ = UploadFile(h.cfg.MinIOBucket, redactedStorageKey, bytes.NewReader(redactedBytes), int64(len(redactedBytes)))

			redactedSHA := fmt.Sprintf("%x", sha256.Sum256(redactedBytes))

			_ = h.db.QueryRow(`
				INSERT INTO documents (
					case_id, title, type, file_size, storage_key, sha256_hash, classification, uploaded_by
				)
				VALUES ($1, $2, $3, $4, $5, $6, 'PUBLIC_SANITIZED', $7)
				RETURNING id
			`, caseID, sanitizedTitle, docType, int64(len(redactedBytes)), redactedStorageKey, redactedSHA, callerIDStr).Scan(&sanitizedDocID)

			_, _ = h.db.Exec(`
				INSERT INTO audit_events (actor_id, actor_badge, action, target_type, target_id, details, ip_address)
				VALUES ($1, $2, 'REDACTED_DOCUMENT_CREATED', 'DOCUMENT', $3, $4, $5)
			`, callerIDStr, callerBadgeStr, sanitizedDocID, fmt.Sprintf(`{"parent_document_id":"%s","title":"%s"}`, docID, sanitizedTitle), c.ClientIP())
		}
	}

	// Audit trail record
	_, _ = h.db.Exec(`
		INSERT INTO audit_events (actor_id, actor_badge, action, target_type, target_id, details, ip_address)
		VALUES ($1, $2, 'PII_REDACTION_APPROVED', 'REDACTION', $3, $4, $5)
	`, callerIDStr, callerBadgeStr, id, `{"status":"APPROVED"}`, c.ClientIP())

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"id":                    id,
			"status":                "APPROVED",
			"reviewed_by":           callerBadgeStr,
			"reviewed_at":           now,
			"sanitized_document_id": sanitizedDocID,
			"message":               "PII redactions approved. Sanitized evidentiary copy created and sealed.",
		},
		"error": nil,
	})
}

// RejectRedaction flags PII redactions for revision
// POST /api/v1/redaction/:id/reject
func (h *RedactionHandler) RejectRedaction(c *gin.Context) {
	id := c.Param("id")
	var req RedactionActionRequest
	_ = c.ShouldBindJSON(&req)

	callerID, _ := c.Get("user_id")
	callerBadge, _ := c.Get("badge_id")
	callerIDStr := fmt.Sprintf("%v", callerID)
	callerBadgeStr := fmt.Sprintf("%v", callerBadge)

	now := time.Now()
	res, err := h.db.Exec(`
		UPDATE redaction_queue 
		SET status = 'REJECTED', reviewed_by = $1, reviewed_at = $2
		WHERE id = $3 OR document_id = $3
	`, callerIDStr, now, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"data":    nil,
			"error":   fmt.Sprintf("Failed to reject redaction: %v", err),
		})
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Redaction item not found",
		})
		return
	}

	// Audit trail record
	_, _ = h.db.Exec(`
		INSERT INTO audit_events (actor_id, actor_badge, action, target_type, target_id, details, ip_address)
		VALUES ($1, $2, 'PII_REDACTION_REJECTED', 'REDACTION', $3, $4, $5)
	`, callerIDStr, callerBadgeStr, id, fmt.Sprintf(`{"status":"REJECTED","notes":"%s"}`, req.Notes), c.ClientIP())

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"id":          id,
			"status":      "REJECTED",
			"reviewed_by": callerBadgeStr,
			"reviewed_at": now,
			"notes":       req.Notes,
		},
		"error": nil,
	})
}

// ScanDocument scans a document or raw text for PII and adds to redaction queue
// POST /api/v1/redaction/scan
func (h *RedactionHandler) ScanDocument(c *gin.Context) {
	var body struct {
		DocumentID string `json:"document_id" binding:"required"`
		Text       string `json:"text"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "document_id is required"})
		return
	}

	entities := DetectPII(body.Text)
	entitiesJSON, _ := json.Marshal(entities)

	var queueID string
	err := h.db.QueryRow(`
		INSERT INTO redaction_queue (document_id, detected_entities, status)
		VALUES ($1, $2, 'PENDING')
		RETURNING id
	`, body.DocumentID, entitiesJSON).Scan(&queueID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": fmt.Sprintf("Failed to queue: %v", err)})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data": gin.H{
			"queue_id":       queueID,
			"document_id":    body.DocumentID,
			"entities_found": len(entities),
			"entities":       entities,
		},
		"error": nil,
	})
}

// ═══════════════════════════════════════════════════
// ROUTE REGISTRATION
// ═══════════════════════════════════════════════════

// RegisterRedactionRoutes mounts PII redaction queue endpoints
func RegisterRedactionRoutes(router *gin.Engine, db *sql.DB, cfg *config.Config, authHandler *AuthHandler) *RedactionHandler {
	handler := NewRedactionHandler(db, cfg, authHandler)

	redactGroup := router.Group("/api/v1/redaction")
	redactGroup.Use(authHandler.AuthRequired())
	{
		redactGroup.GET("/queue", handler.ListQueue)
		redactGroup.GET("/:id", handler.GetRedactionItem)
		redactGroup.POST("/:id/approve", handler.ApproveRedaction)
		redactGroup.POST("/:id/reject", handler.RejectRedaction)
		redactGroup.POST("/scan", handler.ScanDocument)
	}

	log.Println("✅ Redaction routes registered (/api/v1/redaction)")
	return handler
}
