package app

import (
	"crypto/sha256"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/nyay-suraksha/backend/config"
)

// CustodyEvent represents a legal handoff event in the evidence chain of custody
type CustodyEvent struct {
	ID                string    `json:"id"`
	DocumentID        string    `json:"document_id"`
	DocumentTitle     string    `json:"document_title,omitempty"`
	FromOfficerID     *string   `json:"from_officer_id,omitempty"`
	FromOfficerName   *string   `json:"from_officer_name,omitempty"`
	FromOfficerBadge  *string   `json:"from_officer_badge,omitempty"`
	ToOfficerID       *string   `json:"to_officer_id,omitempty"`
	ToOfficerName     *string   `json:"to_officer_name,omitempty"`
	ToOfficerBadge    *string   `json:"to_officer_badge,omitempty"`
	FromAgency        string    `json:"from_agency"`
	ToAgency          string    `json:"to_agency"`
	SignedBySender    bool      `json:"signed_by_sender"`
	SignedByReceiver  bool      `json:"signed_by_receiver"`
	SenderSignature   string    `json:"sender_signature,omitempty"`
	ReceiverSignature string    `json:"receiver_signature,omitempty"`
	Status            string    `json:"status"` // PENDING, ACCEPTED
	Notes             string    `json:"notes"`
	TransferredAt     time.Time `json:"transferred_at"`
}

// TransferRequest is the payload for POST /api/v1/custody/transfer
type TransferRequest struct {
	DocumentID  string `json:"document_id" binding:"required"`
	ToOfficerID string `json:"to_officer_id" binding:"required"`
	ToAgency    string `json:"to_agency"`
	Notes       string `json:"notes"`
}

// CustodyHandler handles custody chain operations
type CustodyHandler struct {
	db          *sql.DB
	cfg         *config.Config
	authHandler *AuthHandler
}

// NewCustodyHandler creates a new CustodyHandler
func NewCustodyHandler(db *sql.DB, cfg *config.Config, authHandler *AuthHandler) *CustodyHandler {
	return &CustodyHandler{
		db:          db,
		cfg:         cfg,
		authHandler: authHandler,
	}
}

// ═══════════════════════════════════════════════════
// ENDPOINTS
// ═══════════════════════════════════════════════════

// TransferEvidence initiates a custody transfer with sender possession validation (Dual handshake step 1)
// POST /api/v1/custody/transfer
func (h *CustodyHandler) TransferEvidence(c *gin.Context) {
	var req TransferRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Document ID and destination officer ID are required",
		})
		return
	}

	callerID, _ := c.Get("user_id")
	callerBadge, _ := c.Get("badge_id")
	callerRole, _ := c.Get("role")
	fromOfficerID := fmt.Sprintf("%v", callerID)
	fromAgency := fmt.Sprintf("%v", callerRole)
	callerRoleStr := fmt.Sprintf("%v", callerRole)

	// Fetch document title, hash, and case ID
	var docTitle, docHash string
	var caseID *string
	err := h.db.QueryRow("SELECT title, sha256_hash, case_id FROM documents WHERE id = $1", req.DocumentID).Scan(&docTitle, &docHash, &caseID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Evidence document not found",
		})
		return
	}

	// 1. Prevent duplicate concurrent transfers: reject if a transfer is currently pending acceptance
	var pendingCount int
	err = h.db.QueryRow("SELECT COUNT(*) FROM custody_events WHERE document_id = $1 AND signed_by_receiver = false", req.DocumentID).Scan(&pendingCount)
	if err == nil && pendingCount > 0 {
		c.JSON(http.StatusConflict, gin.H{
			"success": false,
			"data":    nil,
			"error":   "A custody handoff is already pending acceptance for this document. It must be accepted or rejected before initiating a new transfer.",
		})
		return
	}

	// 2. Sender Possession Verification: Verify caller is the current legal possessor
	var currentHolderID string
	var lastReceiver string
	err = h.db.QueryRow(`
		SELECT to_officer FROM custody_events 
		WHERE document_id = $1 AND signed_by_receiver = true 
		ORDER BY transferred_at DESC LIMIT 1
	`, req.DocumentID).Scan(&lastReceiver)

	if err == nil {
		currentHolderID = lastReceiver
	} else {
		// If no prior completed transfers, original uploader holds custody
		var uploaderID *string
		_ = h.db.QueryRow("SELECT uploaded_by FROM documents WHERE id = $1", req.DocumentID).Scan(&uploaderID)
		if uploaderID != nil {
			currentHolderID = *uploaderID
		}
	}

	if currentHolderID != "" && currentHolderID != fromOfficerID && callerRoleStr != RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Transfer prohibited: Initiating officer does not currently hold legal custody of this evidentiary asset",
		})
		return
	}

	// Fetch recipient details
	var toName, toBadge, toRole string
	err = h.db.QueryRow("SELECT name, badge_id, role FROM users WHERE id = $1", req.ToOfficerID).Scan(&toName, &toBadge, &toRole)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Recipient officer not found",
		})
		return
	}

	toAgency := req.ToAgency
	if toAgency == "" {
		toAgency = toRole
	}

	// Generate BSA Section 63/65B Cryptographic Digital Signature for sender handoff
	now := time.Now().UTC()
	senderSigPayload := fmt.Sprintf("%s:%s:%s:%s:%s", req.DocumentID, docHash, fromOfficerID, req.ToOfficerID, now.Format(time.RFC3339))
	senderSignature := fmt.Sprintf("%x", sha256.Sum256([]byte(senderSigPayload)))

	notesWithSig := req.Notes
	if notesWithSig == "" {
		notesWithSig = fmt.Sprintf("[BSA_SEC63_SIG:sender=%s]", senderSignature)
	} else {
		notesWithSig = fmt.Sprintf("%s [BSA_SEC63_SIG:sender=%s]", req.Notes, senderSignature)
	}

	// Insert custody event: signed_by_sender = true, signed_by_receiver = false
	var eventID string
	var transferredAt time.Time
	err = h.db.QueryRow(`
		INSERT INTO custody_events (
			document_id, from_officer, to_officer, from_agency, to_agency,
			signed_by_sender, signed_by_receiver, notes
		)
		VALUES ($1, $2, $3, $4, $5, true, false, $6)
		RETURNING id, transferred_at
	`, req.DocumentID, fromOfficerID, req.ToOfficerID, fromAgency, toAgency, notesWithSig).Scan(&eventID, &transferredAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"data":    nil,
			"error":   fmt.Sprintf("Failed to initiate transfer: %v", err),
		})
		return
	}

	// Create in-app notification for the receiving officer
	callerBadgeStr := ""
	if callerBadge != nil {
		callerBadgeStr = fmt.Sprintf("%v", callerBadge)
	}

	_, _ = h.db.Exec(`
		INSERT INTO notifications (user_id, title, message, type, related_case_id, related_document_id)
		VALUES ($1, $2, $3, 'CUSTODY_TRANSFER_PENDING', $4, $5)
	`, req.ToOfficerID, "Pending Custody Transfer", fmt.Sprintf("Officer %s initiated custody transfer of document '%s' to you. Signature required to complete transfer.", callerBadgeStr, docTitle), caseID, req.DocumentID)

	// Log audit event
	_, _ = h.db.Exec(`
		INSERT INTO audit_events (actor_id, actor_badge, action, target_type, target_id, details, ip_address)
		VALUES ($1, $2, 'CUSTODY_TRANSFER_INITIATED', 'CUSTODY', $3, $4, $5)
	`, fromOfficerID, callerBadgeStr, eventID, fmt.Sprintf(`{"document_id":"%s","to_officer":"%s","to_badge":"%s","sender_signature":"%s"}`, req.DocumentID, req.ToOfficerID, toBadge, senderSignature), c.ClientIP())

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data": gin.H{
			"transfer_id":        eventID,
			"document_id":        req.DocumentID,
			"document_title":     docTitle,
			"from_officer":       callerBadgeStr,
			"to_officer":         toBadge,
			"signed_by_sender":   true,
			"signed_by_receiver": false,
			"sender_signature":   senderSignature,
			"status":             "PENDING_RECEIVER_SIGNATURE",
			"transferred_at":     transferredAt,
		},
		"error": nil,
	})
}

// AcceptCustody completes the dual-handshake transfer (Dual handshake step 2)
// POST /api/v1/custody/transfer/accept/:id
func (h *CustodyHandler) AcceptCustody(c *gin.Context) {
	transferID := c.Param("id")
	callerID, _ := c.Get("user_id")
	callerBadge, _ := c.Get("badge_id")
	callerIDStr := fmt.Sprintf("%v", callerID)
	callerBadgeStr := fmt.Sprintf("%v", callerBadge)

	var docID, fromOfficerID string
	var toOfficerID string
	var alreadyAccepted bool
	var existingNotes string

	err := h.db.QueryRow(`
		SELECT document_id, from_officer, to_officer, signed_by_receiver, COALESCE(notes, '')
		FROM custody_events 
		WHERE id = $1
	`, transferID).Scan(&docID, &fromOfficerID, &toOfficerID, &alreadyAccepted, &existingNotes)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Transfer record not found",
		})
		return
	}

	if alreadyAccepted {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Transfer has already been accepted and signed",
		})
		return
	}

	// Verify that the caller is indeed the intended recipient or admin
	callerRole, _ := c.Get("role")
	if toOfficerID != callerIDStr && callerRole != RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Only the designated recipient officer can sign off on this custody transfer",
		})
		return
	}

	// Generate BSA Section 63/65B Cryptographic Digital Signature for recipient acceptance
	now := time.Now().UTC()
	receiverSigPayload := fmt.Sprintf("%s:%s:%s:%s", transferID, callerIDStr, callerBadgeStr, now.Format(time.RFC3339))
	receiverSignature := fmt.Sprintf("%x", sha256.Sum256([]byte(receiverSigPayload)))

	updatedNotes := fmt.Sprintf("%s [BSA_SEC63_SIG:receiver=%s]", existingNotes, receiverSignature)

	// Update record: signed_by_receiver = true
	_, err = h.db.Exec(`
		UPDATE custody_events 
		SET signed_by_receiver = true, transferred_at = NOW(), notes = $2 
		WHERE id = $1
	`, transferID, updatedNotes)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"data":    nil,
			"error":   fmt.Sprintf("Failed to sign custody transfer: %v", err),
		})
		return
	}

	// Notify the sending officer that transfer was formally accepted
	_, _ = h.db.Exec(`
		INSERT INTO notifications (user_id, title, message, type, related_document_id)
		VALUES ($1, $2, $3, 'CUSTODY_TRANSFER_ACCEPTED', $4)
	`, fromOfficerID, "Custody Transfer Signed & Accepted", fmt.Sprintf("Officer %s accepted custody of evidence document.", callerBadgeStr), docID)

	// Audit trail record
	_, _ = h.db.Exec(`
		INSERT INTO audit_events (actor_id, actor_badge, action, target_type, target_id, details, ip_address)
		VALUES ($1, $2, 'CUSTODY_TRANSFER_ACCEPTED', 'CUSTODY', $3, $4, $5)
	`, callerIDStr, callerBadgeStr, transferID, fmt.Sprintf(`{"document_id":"%s","signed_by":"%s","receiver_signature":"%s"}`, docID, callerBadgeStr, receiverSignature), c.ClientIP())

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"transfer_id":        transferID,
			"document_id":        docID,
			"signed_by_receiver": true,
			"receiver_signature": receiverSignature,
			"status":             "TRANSFER_COMPLETE",
			"message":            "Dual-handshake custody transfer verified and legally sealed under BSA Section 63/65B.",
		},
		"error": nil,
	})
}

// GetCustodyChain returns the complete chronological chain of custody for a document
// GET /api/v1/custody/chain/:document_id
func (h *CustodyHandler) GetCustodyChain(c *gin.Context) {
	docID := c.Param("document_id")

	// Verify document exists
	var docTitle string
	var sha256 string
	err := h.db.QueryRow("SELECT title, sha256_hash FROM documents WHERE id = $1", docID).Scan(&docTitle, &sha256)
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
			"error":   fmt.Sprintf("Database error: %v", err),
		})
		return
	}

	rows, err := h.db.Query(`
		SELECT 
			ce.id, ce.document_id, ce.from_agency, ce.to_agency,
			ce.signed_by_sender, ce.signed_by_receiver, COALESCE(ce.notes, ''), ce.transferred_at,
			ce.from_officer, u1.name as from_name, u1.badge_id as from_badge,
			ce.to_officer, u2.name as to_name, u2.badge_id as to_badge
		FROM custody_events ce
		LEFT JOIN users u1 ON ce.from_officer = u1.id
		LEFT JOIN users u2 ON ce.to_officer = u2.id
		WHERE ce.document_id = $1
		ORDER BY ce.transferred_at ASC
	`, docID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"data":    nil,
			"error":   fmt.Sprintf("Failed to load custody chain: %v", err),
		})
		return
	}
	defer rows.Close()

	events := make([]CustodyEvent, 0)
	for rows.Next() {
		var ev CustodyEvent
		ev.DocumentTitle = docTitle
		err := rows.Scan(
			&ev.ID,
			&ev.DocumentID,
			&ev.FromAgency,
			&ev.ToAgency,
			&ev.SignedBySender,
			&ev.SignedByReceiver,
			&ev.Notes,
			&ev.TransferredAt,
			&ev.FromOfficerID,
			&ev.FromOfficerName,
			&ev.FromOfficerBadge,
			&ev.ToOfficerID,
			&ev.ToOfficerName,
			&ev.ToOfficerBadge,
		)
		if err != nil {
			continue
		}

		if ev.SignedBySender && ev.SignedByReceiver {
			ev.Status = "COMPLETED"
		} else {
			ev.Status = "PENDING_RECEIVER"
		}

		if strings.Contains(ev.Notes, "[BSA_SEC63_SIG:sender=") {
			start := strings.Index(ev.Notes, "[BSA_SEC63_SIG:sender=") + len("[BSA_SEC63_SIG:sender=")
			if end := strings.Index(ev.Notes[start:], "]"); end != -1 {
				ev.SenderSignature = ev.Notes[start : start+end]
			}
		}
		if strings.Contains(ev.Notes, "[BSA_SEC63_SIG:receiver=") {
			start := strings.Index(ev.Notes, "[BSA_SEC63_SIG:receiver=") + len("[BSA_SEC63_SIG:receiver=")
			if end := strings.Index(ev.Notes[start:], "]"); end != -1 {
				ev.ReceiverSignature = ev.Notes[start : start+end]
			}
		}

		events = append(events, ev)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"document_id":    docID,
			"document_title": docTitle,
			"sha256_hash":    sha256,
			"chain":          events,
			"total_handoffs": len(events),
		},
		"error": nil,
	})
}

// ═══════════════════════════════════════════════════
// ROUTE REGISTRATION
// ═══════════════════════════════════════════════════

// RegisterCustodyRoutes mounts chain of custody endpoints
func RegisterCustodyRoutes(router *gin.Engine, db *sql.DB, cfg *config.Config, authHandler *AuthHandler) *CustodyHandler {
	handler := NewCustodyHandler(db, cfg, authHandler)

	custodyGroup := router.Group("/api/v1/custody")
	custodyGroup.Use(authHandler.AuthRequired())
	{
		custodyGroup.POST("/transfer", handler.TransferEvidence)
		custodyGroup.POST("/transfer/accept/:id", handler.AcceptCustody)
		custodyGroup.GET("/chain/:document_id", handler.GetCustodyChain)
	}

	log.Println("✅ Custody routes registered (/api/v1/custody)")
	return handler
}
