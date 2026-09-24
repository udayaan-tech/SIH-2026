package app

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
	"github.com/nyay-suraksha/backend/config"
)

var firRegex = regexp.MustCompile(`^(?i)FIR[-/][0-9]{4}[-/][A-Z0-9]{2,10}[-/][0-9]{1,8}$`)

// Case statuses
const (
	CaseStatusActive      = "ACTIVE"
	CaseStatusChargeSheet = "CHARGE_SHEET"
	CaseStatusTrial       = "TRIAL"
	CaseStatusClosed      = "CLOSED"
)

// Case represents a legal FIR / criminal matter in Nyay Suraksha
type Case struct {
	ID            string     `json:"id"`
	FIRNumber     string     `json:"fir_number"`
	LegalSections []string   `json:"legal_sections"`
	Status        string     `json:"status"`
	IsPOCSO       bool       `json:"is_pocso"`
	IOID          *string    `json:"io_id,omitempty"`
	IOName        *string    `json:"io_name,omitempty"`
	IOBadge       *string    `json:"io_badge,omitempty"`
	Station       string     `json:"station"`
	IncidentDate  *time.Time `json:"incident_date,omitempty"`
	Description   string     `json:"description"`
	DocumentCount int        `json:"document_count,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
}

// CaseDetail includes the case metadata plus all associated evidence documents
type CaseDetail struct {
	Case
	Documents []CaseDocument `json:"documents"`
}

// CaseDocument represents an evidence file linked to a case
type CaseDocument struct {
	ID             string    `json:"id"`
	CaseID         string    `json:"case_id"`
	Title          string    `json:"title"`
	Type           string    `json:"type"`
	FileSize       int64     `json:"file_size"`
	SHA256Hash     string    `json:"sha256_hash"`
	MerkleLeafID   *int      `json:"merkle_leaf_id,omitempty"`
	Classification string    `json:"classification"`
	StorageKey     *string   `json:"storage_key,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}

// CreateCaseRequest is the payload for POST /api/v1/cases
type CreateCaseRequest struct {
	FIRNumber     string    `json:"fir_number" binding:"required"`
	LegalSections []string  `json:"legal_sections" binding:"required"`
	IsPOCSO       bool      `json:"is_pocso"`
	Station       string    `json:"station"`
	IncidentDate  string    `json:"incident_date"`
	Description   string    `json:"description"`
	IOID          string    `json:"io_id"`
}

// UpdateCaseStatusRequest is the payload for PATCH /api/v1/cases/:id/status
type UpdateCaseStatusRequest struct {
	Status string `json:"status" binding:"required"`
	Notes  string `json:"notes"`
}

// CaseHandler handles case endpoints
type CaseHandler struct {
	db          *sql.DB
	cfg         *config.Config
	authHandler *AuthHandler
}

// NewCaseHandler creates a new CaseHandler instance
func NewCaseHandler(db *sql.DB, cfg *config.Config, authHandler *AuthHandler) *CaseHandler {
	return &CaseHandler{
		db:          db,
		cfg:         cfg,
		authHandler: authHandler,
	}
}

// ═══════════════════════════════════════════════════
// ENDPOINTS
// ═══════════════════════════════════════════════════

// CreateCase registers a new FIR/case
// POST /api/v1/cases
func (h *CaseHandler) CreateCase(c *gin.Context) {
	var req CreateCaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Invalid request payload. Please check input fields.",
		})
		return
	}

	req.FIRNumber = strings.ToUpper(strings.TrimSpace(req.FIRNumber))
	if !firRegex.MatchString(req.FIRNumber) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"data":    nil,
			"error":   fmt.Sprintf("Invalid FIR number format '%s'. Must match format 'FIR-YYYY-STATE-XXXXX' (e.g., FIR-2026-DL-00192)", req.FIRNumber),
		})
		return
	}

	// F-017: Enforce description length limit
	if len(req.Description) > 5000 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Description exceeds maximum length of 5000 characters",
		})
		return
	}

	// F-018: Validate legal sections array
	if len(req.LegalSections) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"data":    nil,
			"error":   "At least one legal section is required",
		})
		return
	}
	if len(req.LegalSections) > 50 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Too many legal sections (max 50)",
		})
		return
	}
	for _, s := range req.LegalSections {
		if len(s) > 200 {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"data":    nil,
				"error":   fmt.Sprintf("Legal section entry exceeds maximum length of 200 characters: '%s'", s[:50]),
			})
			return
		}
	}

	callerID, _ := c.Get("user_id")
	callerStation, _ := c.Get("station")
	callerBadge, _ := c.Get("badge_id")

	// Determine IO ID
	ioID := req.IOID
	if ioID == "" && callerID != nil {
		ioID = fmt.Sprintf("%v", callerID)
	}

	// Determine Police Station
	station := req.Station
	if station == "" && callerStation != nil {
		station = fmt.Sprintf("%v", callerStation)
	}
	if station == "" {
		station = "National Central Jurisdiction"
	}

	// Parse incident date if provided
	var incidentDate *time.Time
	if req.IncidentDate != "" {
		if parsed, err := time.Parse(time.RFC3339, req.IncidentDate); err == nil {
			incidentDate = &parsed
		} else if parsed, err := time.Parse("2006-01-02", req.IncidentDate); err == nil {
			incidentDate = &parsed
		}
	}
	if incidentDate == nil {
		now := time.Now()
		incidentDate = &now
	}

	var newCase Case
	err := h.db.QueryRow(`
		INSERT INTO cases (fir_number, legal_sections, status, is_pocso, io_id, station, incident_date, description)
		VALUES ($1, $2, 'ACTIVE', $3, $4, $5, $6, $7)
		RETURNING id, fir_number, legal_sections, status, is_pocso, io_id, station, incident_date, description, created_at
	`, req.FIRNumber, pq.Array(req.LegalSections), req.IsPOCSO, ioID, station, incidentDate, req.Description).Scan(
		&newCase.ID,
		&newCase.FIRNumber,
		pq.Array(&newCase.LegalSections),
		&newCase.Status,
		&newCase.IsPOCSO,
		&newCase.IOID,
		&newCase.Station,
		&newCase.IncidentDate,
		&newCase.Description,
		&newCase.CreatedAt,
	)

	if err != nil {
		if strings.Contains(err.Error(), "unique constraint") || strings.Contains(err.Error(), "duplicate key") {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"data":    nil,
				"error":   fmt.Sprintf("Case with FIR number '%s' already exists", req.FIRNumber),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Failed to register case. Please contact support.",
		})
		return
	}

	// Record in append-only audit trail
	actorBadge := ""
	if callerBadge != nil {
		actorBadge = fmt.Sprintf("%v", callerBadge)
	}
	actorID := ""
	if callerID != nil {
		actorID = fmt.Sprintf("%v", callerID)
	}

	// F-015, F-020: Record in append-only cryptographic hash chain
	auditDetails, _ := json.Marshal(map[string]interface{}{"fir_number": newCase.FIRNumber, "is_pocso": newCase.IsPOCSO})
	_ = RecordAuditEvent(h.db, actorID, actorBadge, "CASE_CREATED", "CASE", newCase.ID, string(auditDetails), c.ClientIP())

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    newCase,
		"error":   nil,
	})
}

// ListCases returns role-filtered cases
// GET /api/v1/cases
func (h *CaseHandler) ListCases(c *gin.Context) {
	callerID, _ := c.Get("user_id")
	callerRole, _ := c.Get("role")
	statusFilter := c.Query("status")
	pocsoFilter := c.Query("is_pocso")
	search := c.Query("search")

	roleStr := ""
	if callerRole != nil {
		roleStr = strings.ToUpper(fmt.Sprintf("%v", callerRole))
	}
	userIDStr := ""
	if callerID != nil {
		userIDStr = fmt.Sprintf("%v", callerID)
	}

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

	// Role-based visibility rules:
	// - IO: Can only see their own assigned cases
	// - FSL: Can ONLY see cases with evidence explicitly transferred to FSL or their custody (courtroom isolation)
	// - PROSECUTOR / JUDGE: Can see active court-stage cases
	// - ADMIN: Can see everything
	switch roleStr {
	case RoleIO:
		whereClause += fmt.Sprintf(" AND c.io_id = $%d", argIdx)
		args = append(args, userIDStr)
		argIdx++
	case RoleFSL:
		whereClause += fmt.Sprintf(` AND c.id IN (
			SELECT d.case_id FROM documents d 
			JOIN custody_events ce ON d.id = ce.document_id 
			WHERE ce.to_officer = $%d OR ce.to_agency = 'FSL'
		)`, argIdx)
		args = append(args, userIDStr)
		argIdx++
	case RoleProsecutor, RoleJudge:
		// Full visibility for court officers over assigned jurisdictions
	case RoleAdmin:
		// Full visibility
	default:
		if userIDStr != "" {
			whereClause += fmt.Sprintf(" AND c.io_id = $%d", argIdx)
			args = append(args, userIDStr)
			argIdx++
		}
	}

	// Additional query filters
	if statusFilter != "" {
		whereClause += fmt.Sprintf(" AND c.status = $%d", argIdx)
		args = append(args, strings.ToUpper(statusFilter))
		argIdx++
	}

	if pocsoFilter != "" {
		isPocso := strings.ToLower(pocsoFilter) == "true"
		whereClause += fmt.Sprintf(" AND c.is_pocso = $%d", argIdx)
		args = append(args, isPocso)
		argIdx++
	}

	if search != "" {
		whereClause += fmt.Sprintf(" AND (c.fir_number ILIKE $%d OR c.description ILIKE $%d OR c.station ILIKE $%d)", argIdx, argIdx, argIdx)
		args = append(args, "%"+search+"%")
		argIdx++
	}

	// Compute total count matching query
	var totalCount int
	countQuery := "SELECT COUNT(*) FROM cases c " + whereClause
	if err := h.db.QueryRow(countQuery, args...).Scan(&totalCount); err != nil {
		totalCount = 0
	}

	query := `
		SELECT 
			c.id, c.fir_number, c.legal_sections, c.status, c.is_pocso, 
			c.io_id, u.name as io_name, u.badge_id as io_badge,
			c.station, c.incident_date, c.description, c.created_at,
			COALESCE(doc_counts.cnt, 0) as document_count
		FROM cases c
		LEFT JOIN users u ON c.io_id = u.id
		LEFT JOIN (
			SELECT case_id, COUNT(*) as cnt FROM documents GROUP BY case_id
		) doc_counts ON c.id = doc_counts.case_id
	` + whereClause + fmt.Sprintf(" ORDER BY c.created_at DESC LIMIT $%d OFFSET $%d", argIdx, argIdx+1)

	pagedArgs := append(args, limit, offset)
	rows, err := h.db.Query(query, pagedArgs...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Failed to list cases. Please contact support.",
		})
		return
	}
	defer rows.Close()

	cases := make([]Case, 0)
	for rows.Next() {
		var item Case
		err := rows.Scan(
			&item.ID,
			&item.FIRNumber,
			pq.Array(&item.LegalSections),
			&item.Status,
			&item.IsPOCSO,
			&item.IOID,
			&item.IOName,
			&item.IOBadge,
			&item.Station,
			&item.IncidentDate,
			&item.Description,
			&item.CreatedAt,
			&item.DocumentCount,
		)
		if err != nil {
			log.Printf("⚠️ Error scanning case row: %v", err)
			continue
		}
		cases = append(cases, item)
	}

	if err := rows.Err(); err != nil {
		log.Printf("⚠️ Error iterating case rows: %v", err)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"cases":  cases,
			"total":  totalCount,
			"limit":  limit,
			"offset": offset,
			"role":   roleStr,
		},
		"error": nil,
	})
}

// GetCase retrieves a single case by ID with its attached evidence documents
// GET /api/v1/cases/:id
func (h *CaseHandler) GetCase(c *gin.Context) {
	caseID := c.Param("id")
	if caseID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Case ID is required",
		})
		return
	}

	// F-010: BOLA/IDOR access control — enforce role-based visibility on single case lookup
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

	// Non-privileged roles must have a direct relationship with the case
	if roleStr == RoleIO {
		var count int
		_ = h.db.QueryRow("SELECT COUNT(*) FROM cases WHERE id = $1 AND io_id = $2", caseID, userIDStr).Scan(&count)
		if count == 0 {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"data":    nil,
				"error":   "Access denied: Officer is not assigned as IO on this case",
			})
			return
		}
	} else if roleStr == RoleFSL {
		var count int
		_ = h.db.QueryRow(`
			SELECT COUNT(*) FROM cases c WHERE c.id = $1 AND c.id IN (
				SELECT d.case_id FROM documents d
				JOIN custody_events ce ON d.id = ce.document_id
				WHERE ce.to_officer = $2 OR ce.to_agency = 'FSL'
			)
		`, caseID, userIDStr).Scan(&count)
		if count == 0 {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"data":    nil,
				"error":   "Access denied: FSL officer has no custody of evidence from this case",
			})
			return
		}
	}
	// PROSECUTOR, JUDGE, ADMIN have full visibility

	var detail CaseDetail
	err := h.db.QueryRow(`
		SELECT 
			c.id, c.fir_number, c.legal_sections, c.status, c.is_pocso, 
			c.io_id, u.name as io_name, u.badge_id as io_badge,
			c.station, c.incident_date, c.description, c.created_at
		FROM cases c
		LEFT JOIN users u ON c.io_id = u.id
		WHERE c.id = $1
	`, caseID).Scan(
		&detail.ID,
		&detail.FIRNumber,
		pq.Array(&detail.LegalSections),
		&detail.Status,
		&detail.IsPOCSO,
		&detail.IOID,
		&detail.IOName,
		&detail.IOBadge,
		&detail.Station,
		&detail.IncidentDate,
		&detail.Description,
		&detail.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"data":    nil,
				"error":   "Case not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Failed to load case",
		})
		return
	}

	// Fetch attached documents
	docRows, err := h.db.Query(`
		SELECT id, case_id, title, type, COALESCE(file_size, 0), sha256_hash, merkle_leaf_id, classification, storage_key, created_at
		FROM documents
		WHERE case_id = $1
		ORDER BY created_at DESC
	`, caseID)

	detail.Documents = make([]CaseDocument, 0)
	if err == nil {
		defer docRows.Close()
		for docRows.Next() {
			var doc CaseDocument
			if err := docRows.Scan(
				&doc.ID,
				&doc.CaseID,
				&doc.Title,
				&doc.Type,
				&doc.FileSize,
				&doc.SHA256Hash,
				&doc.MerkleLeafID,
				&doc.Classification,
				&doc.StorageKey,
				&doc.CreatedAt,
			); err == nil {
				detail.Documents = append(detail.Documents, doc)
			} else {
				log.Printf("⚠️ Error scanning case document: %v", err)
			}
		}
		if err := docRows.Err(); err != nil {
			log.Printf("⚠️ Error iterating case documents: %v", err)
		}
	}
	detail.DocumentCount = len(detail.Documents)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    detail,
		"error":   nil,
	})
}

// UpdateCaseStatus advances a case through its legal lifecycle
// PATCH /api/v1/cases/:id/status
func (h *CaseHandler) UpdateCaseStatus(c *gin.Context) {
	caseID := c.Param("id")
	var req UpdateCaseStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Status is required",
		})
		return
	}

	validStatuses := map[string]bool{
		CaseStatusActive:      true,
		CaseStatusChargeSheet: true,
		CaseStatusTrial:       true,
		CaseStatusClosed:      true,
	}

	newStatus := strings.ToUpper(req.Status)
	if !validStatuses[newStatus] {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"data":    nil,
			"error":   fmt.Sprintf("Invalid status '%s'. Allowed: ACTIVE, CHARGE_SHEET, TRIAL, CLOSED", req.Status),
		})
		return
	}

	callerID, _ := c.Get("user_id")
	callerBadge, _ := c.Get("badge_id")

	var prevStatus, firNumber string
	var ioID *string
	err := h.db.QueryRow(`
		SELECT status, fir_number, io_id FROM cases WHERE id = $1
	`, caseID).Scan(&prevStatus, &firNumber, &ioID)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Case not found",
		})
		return
	}

	callerRole, _ := c.Get("role")
	callerRoleStr := ""
	if callerRole != nil {
		callerRoleStr = strings.ToUpper(fmt.Sprintf("%v", callerRole))
	}

	statusOrder := map[string]int{
		CaseStatusActive:      1,
		CaseStatusChargeSheet: 2,
		CaseStatusTrial:       3,
		CaseStatusClosed:      4,
	}

	prevOrder := statusOrder[prevStatus]
	newOrder := statusOrder[newStatus]

	// Enforce directional lifecycle state-machine
	// Reversal or reopening of closed cases requires Judicial or Administrative authority
	if newOrder < prevOrder || (prevStatus == CaseStatusClosed && newStatus != CaseStatusClosed) {
		if callerRoleStr != RoleAdmin && callerRoleStr != RoleJudge {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"data":    nil,
				"error":   fmt.Sprintf("Unauthorized status transition: moving case from %s to %s requires Judicial or Administrative order", prevStatus, newStatus),
			})
			return
		}
	}

	// F-026: Use optimistic locking — only update if status hasn't changed since we read it
	result, err := h.db.Exec(`
		UPDATE cases SET status = $1 WHERE id = $2 AND status = $3
	`, newStatus, caseID, prevStatus)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Failed to update case status",
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusConflict, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Case status was modified by another user. Please refresh and retry.",
		})
		return
	}

	// Record in audit log
	actorBadge := ""
	if callerBadge != nil {
		actorBadge = fmt.Sprintf("%v", callerBadge)
	}
	actorID := ""
	if callerID != nil {
		actorID = fmt.Sprintf("%v", callerID)
	}

	// F-015, F-020: Record in append-only cryptographic hash chain
	statusAudit, _ := json.Marshal(map[string]interface{}{"fir_number": firNumber, "from": prevStatus, "to": newStatus, "notes": req.Notes})
	_ = RecordAuditEvent(h.db, actorID, actorBadge, "CASE_STATUS_UPDATED", "CASE", caseID, string(statusAudit), c.ClientIP())

	// Dispatch in-app notification to the assigned IO if status changed by another party
	if ioID != nil && *ioID != actorID {
		_, _ = h.db.Exec(`
			INSERT INTO notifications (user_id, title, message, type, related_case_id)
			VALUES ($1, $2, $3, 'CASE_STATUS_CHANGE', $4)
		`, *ioID, fmt.Sprintf("Case Status Updated: %s", firNumber), fmt.Sprintf("Case status was changed from %s to %s by officer %s", prevStatus, newStatus, actorBadge), caseID)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"id":         caseID,
			"fir_number": firNumber,
			"old_status": prevStatus,
			"new_status": newStatus,
			"notes":      req.Notes,
		},
		"error": nil,
	})
}

// ═══════════════════════════════════════════════════
// ROUTE REGISTRATION & SEEDING
// ═══════════════════════════════════════════════════

// RegisterCaseRoutes mounts case management routes on the Gin router
func RegisterCaseRoutes(router *gin.Engine, db *sql.DB, cfg *config.Config, authHandler *AuthHandler) *CaseHandler {
	handler := NewCaseHandler(db, cfg, authHandler)

	casesGroup := router.Group("/api/v1/cases")
	casesGroup.Use(authHandler.AuthRequired())
	{
		casesGroup.POST("", RequireRole(RoleIO, RoleAdmin), handler.CreateCase)
		casesGroup.GET("", handler.ListCases)
		casesGroup.GET("/:id", handler.GetCase)
		casesGroup.PATCH("/:id/status", RequireRole(RoleIO, RoleProsecutor, RoleJudge, RoleAdmin), handler.UpdateCaseStatus)
	}

	log.Println("✅ Case routes registered (/api/v1/cases)")
	return handler
}

// SeedDefaultCases populates initial Indian justice system FIR cases for testing
func SeedDefaultCases(db *sql.DB) error {
	var count int
	if err := db.QueryRow("SELECT COUNT(*) FROM cases").Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return nil // Cases already exist
	}

	// Retrieve IO user ID
	var ioID string
	err := db.QueryRow("SELECT id FROM users WHERE badge_id = 'DL-4821'").Scan(&ioID)
	if err != nil {
		// If IO not found, lookup any user
		_ = db.QueryRow("SELECT id FROM users LIMIT 1").Scan(&ioID)
	}

	demoCases := []struct {
		fir       string
		sections  []string
		status    string
		pocso     bool
		station   string
		desc      string
		daysPrior int
	}{
		{
			fir:       "FIR-2026-DL-00192",
			sections:  []string{"BNS 303(2) (Theft)", "BNS 317(2) (Stolen Property)"},
			status:    CaseStatusActive,
			pocso:     false,
			station:   "Rohini District, Delhi",
			desc:      "High-value corporate surveillance hardware theft from regional data center premises.",
			daysPrior: 3,
		},
		{
			fir:       "FIR-2026-DL-00045",
			sections:  []string{"POCSO Sec 4 (Penetrative Assault)", "POCSO Sec 6", "BNS 64"},
			status:    CaseStatusChargeSheet,
			pocso:     true,
			station:   "Rohini District, Delhi",
			desc:      "Protected juvenile cyber exploitation incident. Strict PII redaction and judicial sealing required.",
			daysPrior: 14,
		},
		{
			fir:       "FIR-2026-DL-00388",
			sections:  []string{"BNS 111 (Organized Crime Syndicate)", "BNS 318(4) (Cheating & Fraud)"},
			status:    CaseStatusTrial,
			pocso:     false,
			station:   "Rohini District, Delhi",
			desc:      "Cross-border hawala syndicate money laundering via forged cryptographic credentials.",
			daysPrior: 45,
		},
	}

	for _, dc := range demoCases {
		incidentDate := time.Now().AddDate(0, 0, -dc.daysPrior)
		_, err := db.Exec(`
			INSERT INTO cases (fir_number, legal_sections, status, is_pocso, io_id, station, incident_date, description)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			ON CONFLICT (fir_number) DO NOTHING
		`, dc.fir, pq.Array(dc.sections), dc.status, dc.pocso, nilIfEmptyString(ioID), dc.station, incidentDate, dc.desc)
		if err != nil {
			log.Printf("⚠️ Failed to seed case %s: %v", dc.fir, err)
		}
	}

	log.Println("🌱 Seeded default FIR cases into 'cases' table")
	return nil
}

func nilIfEmptyString(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}
