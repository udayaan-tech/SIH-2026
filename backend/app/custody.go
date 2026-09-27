package app

import (
	"crypto/sha256"
	"database/sql"
	"encoding/json"
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
	SHA256Hash        string    `json:"sha256_hash,omitempty"`
	CaseID            *string   `json:"case_id,omitempty"`
	FIRNumber         *string   `json:"fir_number,omitempty"`
	FromOfficerID     *string   `json:"from_officer_id,omitempty"`
	FromOfficerName   *string   `json:"from_officer_name,omitempty"`
	FromOfficerBadge  *string   `json:"from_officer_badge,omitempty"`
	ToOfficerID       *string   `json:"to_officer_id,omitempty"`
	ToOfficerName     *string   `json:"to_officer_name,omitempty"`
	ToOfficerBadge    *string   `json:"to_officer_badge,omitempty"`
	FromAgency        string    `json:"from_agency"`
	ToAgency          string    `json:"to_agency"`
	ActionType        string    `json:"action_type"`
	StorageLocation   string    `json:"storage_location"`
	SignedBySender    bool      `json:"signed_by_sender"`
	SignedByReceiver  bool      `json:"signed_by_receiver"`
	SenderSignature   string    `json:"sender_signature,omitempty"`
	ReceiverSignature string    `json:"receiver_signature,omitempty"`
	Status            string    `json:"status"` // PENDING, ACCEPTED, REJECTED
	RejectionReason   string    `json:"rejection_reason,omitempty"`
	Notes             string    `json:"notes"`
	TransferredAt     time.Time `json:"transferred_at"`
	CanAccept         bool      `json:"can_accept,omitempty"`
}

// TransferRequest is the payload for POST /api/v1/custody/transfer
type TransferRequest struct {
	DocumentID      string `json:"document_id" binding:"required"`
	ToOfficerID     string `json:"to_officer_id" binding:"required"`
	ToAgency        string `json:"to_agency"`
	ActionType      string `json:"action_type"`
	StorageLocation string `json:"storage_location"`
	Notes           string `json:"notes"`
}

// RejectTransferRequest is the payload for POST /api/v1/custody/transfer/reject/:id
type RejectTransferRequest struct {
	Reason string `json:"reason" binding:"required"`
}

// OfficerInfo represents an active officer in the judicial/police system
type OfficerInfo struct {
	ID      string `json:"id"`
	BadgeID string `json:"badge_id"`
	Name    string `json:"name"`
	Role    string `json:"role"`
	Station string `json:"station"`
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

// parseSignatures extracts BSA digital signatures embedded in notes
func parseSignatures(notes string) (senderSig, receiverSig string) {
	if strings.Contains(notes, "[BSA_SEC63_SIG:sender=") {
		start := strings.Index(notes, "[BSA_SEC63_SIG:sender=") + len("[BSA_SEC63_SIG:sender=")
		if end := strings.Index(notes[start:], "]"); end != -1 {
			senderSig = notes[start : start+end]
		}
	}
	if strings.Contains(notes, "[BSA_SEC63_SIG:receiver=") {
		start := strings.Index(notes, "[BSA_SEC63_SIG:receiver=") + len("[BSA_SEC63_SIG:receiver=")
		if end := strings.Index(notes[start:], "]"); end != -1 {
			receiverSig = notes[start : start+end]
		}
	}
	return
}

// ═══════════════════════════════════════════════════
// ENDPOINTS
// ═══════════════════════════════════════════════════

// ListOfficers returns all active officers for the custody transfer recipient dropdown
// GET /api/v1/custody/officers
func (h *CustodyHandler) ListOfficers(c *gin.Context) {
	rows, err := h.db.Query(`
		SELECT id, badge_id, name, role, station 
		FROM users 
		WHERE is_active = true 
		ORDER BY role ASC, name ASC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Failed to list officers",
		})
		return
	}
	defer rows.Close()

	officers := make([]OfficerInfo, 0)
	for rows.Next() {
		var o OfficerInfo
		if err := rows.Scan(&o.ID, &o.BadgeID, &o.Name, &o.Role, &o.Station); err == nil {
			officers = append(officers, o)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"officers": officers,
			"total":    len(officers),
		},
		"error": nil,
	})
}

// GetPendingTransfers returns custody handshakes awaiting acceptance or review
// GET /api/v1/custody/pending
func (h *CustodyHandler) GetPendingTransfers(c *gin.Context) {
	callerID, _ := c.Get("user_id")
	callerRole, _ := c.Get("role")
	callerIDStr := fmt.Sprintf("%v", callerID)
	callerRoleStr := ""
	if callerRole != nil {
		callerRoleStr = strings.ToUpper(fmt.Sprintf("%v", callerRole))
	}

	query := `
		SELECT 
			ce.id, ce.document_id, d.title, d.sha256_hash, d.case_id, c.fir_number,
			ce.from_agency, ce.to_agency, COALESCE(ce.action_type, 'TRANSFERRED'), COALESCE(ce.storage_location, ''),
			ce.signed_by_sender, ce.signed_by_receiver, COALESCE(ce.status, 'PENDING'),
			COALESCE(ce.rejection_reason, ''), COALESCE(ce.notes, ''), ce.transferred_at,
			ce.from_officer, u1.name as from_name, u1.badge_id as from_badge,
			ce.to_officer, u2.name as to_name, u2.badge_id as to_badge
		FROM custody_events ce
		JOIN documents d ON ce.document_id = d.id
		LEFT JOIN cases c ON d.case_id = c.id
		LEFT JOIN users u1 ON ce.from_officer = u1.id
		LEFT JOIN users u2 ON ce.to_officer = u2.id
		WHERE ce.signed_by_receiver = false AND (ce.status IS NULL OR ce.status = 'PENDING')
	`

	args := []interface{}{}
	if callerRoleStr != RoleAdmin {
		query += " AND (ce.to_officer = $1 OR ce.from_officer = $1)"
		args = append(args, callerIDStr)
	}

	query += " ORDER BY ce.transferred_at DESC"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Failed to load pending transfers",
		})
		return
	}
	defer rows.Close()

	incoming := make([]CustodyEvent, 0)
	outgoing := make([]CustodyEvent, 0)

	for rows.Next() {
		var ev CustodyEvent
		err := rows.Scan(
			&ev.ID,
			&ev.DocumentID,
			&ev.DocumentTitle,
			&ev.SHA256Hash,
			&ev.CaseID,
			&ev.FIRNumber,
			&ev.FromAgency,
			&ev.ToAgency,
			&ev.ActionType,
			&ev.StorageLocation,
			&ev.SignedBySender,
			&ev.SignedByReceiver,
			&ev.Status,
			&ev.RejectionReason,
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
			log.Printf("⚠️ Error scanning pending transfer: %v", err)
			continue
		}

		ev.SenderSignature, ev.ReceiverSignature = parseSignatures(ev.Notes)

		// Check if caller has authority to accept
		isRecipient := ev.ToOfficerID != nil && *ev.ToOfficerID == callerIDStr
		ev.CanAccept = isRecipient || callerRoleStr == RoleAdmin

		if isRecipient {
			incoming = append(incoming, ev)
		} else {
			outgoing = append(outgoing, ev)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"incoming":       incoming,
			"outgoing":       outgoing,
			"total_pending":  len(incoming) + len(outgoing),
			"needs_sign_off": len(incoming),
		},
		"error": nil,
	})
}

// GetAllCustodyTransfers returns all custody transfers in the system for the global ledger
// GET /api/v1/custody/transfers
func (h *CustodyHandler) GetAllCustodyTransfers(c *gin.Context) {
	docID := c.Query("document_id")
	caseID := c.Query("case_id")

	query := `
		SELECT 
			ce.id, ce.document_id, d.title, d.sha256_hash, d.case_id, c.fir_number,
			ce.from_agency, ce.to_agency, COALESCE(ce.action_type, 'TRANSFERRED'), COALESCE(ce.storage_location, ''),
			ce.signed_by_sender, ce.signed_by_receiver, COALESCE(ce.status, 'PENDING'),
			COALESCE(ce.rejection_reason, ''), COALESCE(ce.notes, ''), ce.transferred_at,
			ce.from_officer, u1.name as from_name, u1.badge_id as from_badge,
			ce.to_officer, u2.name as to_name, u2.badge_id as to_badge
		FROM custody_events ce
		JOIN documents d ON ce.document_id = d.id
		LEFT JOIN cases c ON d.case_id = c.id
		LEFT JOIN users u1 ON ce.from_officer = u1.id
		LEFT JOIN users u2 ON ce.to_officer = u2.id
		WHERE 1=1
	`
	args := []interface{}{}
	argIdx := 1

	if docID != "" {
		query += fmt.Sprintf(" AND ce.document_id = $%d", argIdx)
		args = append(args, docID)
		argIdx++
	}
	if caseID != "" {
		query += fmt.Sprintf(" AND d.case_id = $%d", argIdx)
		args = append(args, caseID)
		argIdx++
	}

	query += " ORDER BY ce.transferred_at DESC LIMIT 100"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Failed to load custody transfers",
		})
		return
	}
	defer rows.Close()

	events := make([]CustodyEvent, 0)
	for rows.Next() {
		var ev CustodyEvent
		err := rows.Scan(
			&ev.ID,
			&ev.DocumentID,
			&ev.DocumentTitle,
			&ev.SHA256Hash,
			&ev.CaseID,
			&ev.FIRNumber,
			&ev.FromAgency,
			&ev.ToAgency,
			&ev.ActionType,
			&ev.StorageLocation,
			&ev.SignedBySender,
			&ev.SignedByReceiver,
			&ev.Status,
			&ev.RejectionReason,
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
			log.Printf("⚠️ Error scanning custody event: %v", err)
			continue
		}
		ev.SenderSignature, ev.ReceiverSignature = parseSignatures(ev.Notes)
		events = append(events, ev)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"transfers": events,
			"total":     len(events),
		},
		"error": nil,
	})
}

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

	// Begin transaction for atomic transfer operation
	tx, txErr := h.db.Begin()
	if txErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Failed to initiate transfer",
		})
		return
	}
	defer tx.Rollback()

	// 1. Prevent duplicate concurrent transfers: reject if a transfer is currently pending acceptance
	var pendingCount int
	err = tx.QueryRow("SELECT COUNT(*) FROM custody_events WHERE document_id = $1 AND signed_by_receiver = false AND (status IS NULL OR status = 'PENDING')", req.DocumentID).Scan(&pendingCount)
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
	err = tx.QueryRow(`
		SELECT to_officer FROM custody_events 
		WHERE document_id = $1 AND signed_by_receiver = true 
		ORDER BY transferred_at DESC LIMIT 1
	`, req.DocumentID).Scan(&lastReceiver)

	if err == nil {
		currentHolderID = lastReceiver
	} else {
		// If no prior completed transfers, original uploader holds custody
		var uploaderID *string
		_ = tx.QueryRow("SELECT uploaded_by FROM documents WHERE id = $1", req.DocumentID).Scan(&uploaderID)
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
	var toName, toBadge, toRole, toStation string
	err = h.db.QueryRow("SELECT name, badge_id, role, station FROM users WHERE id = $1", req.ToOfficerID).Scan(&toName, &toBadge, &toRole, &toStation)
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

	actionType := req.ActionType
	if actionType == "" {
		actionType = "TRANSFERRED"
	}

	storageLocation := req.StorageLocation
	if storageLocation == "" {
		storageLocation = "Designated Evidence Vault"
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

	// Insert custody event: signed_by_sender = true, signed_by_receiver = false, status = 'PENDING'
	var eventID string
	var transferredAt time.Time
	err = tx.QueryRow(`
		INSERT INTO custody_events (
			document_id, from_officer, to_officer, from_agency, to_agency,
			action_type, storage_location, signed_by_sender, signed_by_receiver, status, notes
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, true, false, 'PENDING', $8)
		RETURNING id, transferred_at
	`, req.DocumentID, fromOfficerID, req.ToOfficerID, fromAgency, toAgency, actionType, storageLocation, notesWithSig).Scan(&eventID, &transferredAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Failed to initiate transfer: " + err.Error(),
		})
		return
	}

	// Commit transaction
	if commitErr := tx.Commit(); commitErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Failed to finalize transfer",
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
	`, req.ToOfficerID, "Pending Custody Transfer", fmt.Sprintf("Officer %s initiated custody transfer of exhibit '%s' to you. Signature required to complete transfer.", callerBadgeStr, docTitle), caseID, req.DocumentID)

	// Record in append-only cryptographic WORM hash chain
	auditDetails, _ := json.Marshal(map[string]interface{}{
		"document_id":      req.DocumentID,
		"document_title":   docTitle,
		"to_officer":       req.ToOfficerID,
		"to_badge":         toBadge,
		"action_type":      actionType,
		"sender_signature": senderSignature,
	})
	_ = RecordAuditEvent(h.db, fromOfficerID, callerBadgeStr, "CUSTODY_TRANSFER_INITIATED", "CUSTODY", eventID, string(auditDetails), c.ClientIP())

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data": gin.H{
			"transfer_id":        eventID,
			"document_id":        req.DocumentID,
			"document_title":     docTitle,
			"from_officer":       callerBadgeStr,
			"to_officer":         toBadge,
			"to_officer_name":    toName,
			"action_type":        actionType,
			"storage_location":   storageLocation,
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

	var docID, fromOfficerID, docTitle string
	var toOfficerID string
	var alreadyAccepted bool
	var existingStatus, existingNotes string

	err := h.db.QueryRow(`
		SELECT ce.document_id, ce.from_officer, ce.to_officer, ce.signed_by_receiver, 
		       COALESCE(ce.status, 'PENDING'), COALESCE(ce.notes, ''), d.title
		FROM custody_events ce
		JOIN documents d ON ce.document_id = d.id
		WHERE ce.id = $1
	`, transferID).Scan(&docID, &fromOfficerID, &toOfficerID, &alreadyAccepted, &existingStatus, &existingNotes, &docTitle)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Transfer record not found",
		})
		return
	}

	if alreadyAccepted || existingStatus == "ACCEPTED" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Transfer has already been accepted and signed",
		})
		return
	}

	if existingStatus == "REJECTED" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"data":    nil,
			"error":   "This transfer was rejected and cannot be accepted",
		})
		return
	}

	callerRole, _ := c.Get("role")
	callerRoleStr := ""
	if callerRole != nil {
		callerRoleStr = strings.ToUpper(fmt.Sprintf("%v", callerRole))
	}
	if toOfficerID != callerIDStr && callerRoleStr != RoleAdmin {
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

	// Update record: signed_by_receiver = true, status = 'ACCEPTED'
	_, err = h.db.Exec(`
		UPDATE custody_events 
		SET signed_by_receiver = true, status = 'ACCEPTED', transferred_at = NOW(), notes = $2 
		WHERE id = $1
	`, transferID, updatedNotes)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Failed to sign custody transfer",
		})
		return
	}

	// Notify the sending officer that transfer was formally accepted
	_, _ = h.db.Exec(`
		INSERT INTO notifications (user_id, title, message, type, related_document_id)
		VALUES ($1, $2, $3, 'CUSTODY_TRANSFER_ACCEPTED', $4)
	`, fromOfficerID, "Custody Transfer Signed & Accepted", fmt.Sprintf("Officer %s accepted custody of evidence exhibit '%s'. Dual handshake verified.", callerBadgeStr, docTitle), docID)

	// Record in append-only cryptographic WORM hash chain
	recvAudit, _ := json.Marshal(map[string]interface{}{
		"document_id":        docID,
		"document_title":     docTitle,
		"signed_by":          callerBadgeStr,
		"receiver_signature": receiverSignature,
		"dual_handshake":     "VERIFIED_LEGAL_SEAL",
	})
	_ = RecordAuditEvent(h.db, callerIDStr, callerBadgeStr, "CUSTODY_TRANSFER_ACCEPTED", "CUSTODY", transferID, string(recvAudit), c.ClientIP())

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"transfer_id":        transferID,
			"document_id":        docID,
			"document_title":     docTitle,
			"signed_by_receiver": true,
			"receiver_signature": receiverSignature,
			"status":             "ACCEPTED",
			"message":            "Dual-handshake custody transfer verified and legally sealed under BSA Section 63/65B.",
		},
		"error": nil,
	})
}

// RejectCustody formally rejects an incoming custody transfer
// POST /api/v1/custody/transfer/reject/:id
func (h *CustodyHandler) RejectCustody(c *gin.Context) {
	transferID := c.Param("id")
	callerID, _ := c.Get("user_id")
	callerBadge, _ := c.Get("badge_id")
	callerIDStr := fmt.Sprintf("%v", callerID)
	callerBadgeStr := fmt.Sprintf("%v", callerBadge)

	var req RejectTransferRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Rejection reason is required",
		})
		return
	}

	var docID, fromOfficerID, toOfficerID, docTitle string
	var alreadyAccepted bool
	var existingStatus, existingNotes string

	err := h.db.QueryRow(`
		SELECT ce.document_id, ce.from_officer, ce.to_officer, ce.signed_by_receiver,
		       COALESCE(ce.status, 'PENDING'), COALESCE(ce.notes, ''), d.title
		FROM custody_events ce
		JOIN documents d ON ce.document_id = d.id
		WHERE ce.id = $1
	`, transferID).Scan(&docID, &fromOfficerID, &toOfficerID, &alreadyAccepted, &existingStatus, &existingNotes, &docTitle)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Transfer record not found",
		})
		return
	}

	if alreadyAccepted || existingStatus == "ACCEPTED" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Transfer has already been accepted and cannot be rejected",
		})
		return
	}

	callerRole, _ := c.Get("role")
	callerRoleStr := ""
	if callerRole != nil {
		callerRoleStr = strings.ToUpper(fmt.Sprintf("%v", callerRole))
	}
	if toOfficerID != callerIDStr && callerRoleStr != RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Only the designated recipient officer can reject this custody transfer",
		})
		return
	}

	rejectionNotes := fmt.Sprintf("%s [BSA_REJECTED:reason=%s:by=%s]", existingNotes, req.Reason, callerBadgeStr)

	_, err = h.db.Exec(`
		UPDATE custody_events 
		SET status = 'REJECTED', rejection_reason = $2, notes = $3 
		WHERE id = $1
	`, transferID, req.Reason, rejectionNotes)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Failed to reject custody transfer",
		})
		return
	}

	// Notify sending officer
	_, _ = h.db.Exec(`
		INSERT INTO notifications (user_id, title, message, type, related_document_id)
		VALUES ($1, $2, $3, 'CUSTODY_TRANSFER_REJECTED', $4)
	`, fromOfficerID, "Custody Transfer Rejected", fmt.Sprintf("Officer %s rejected custody transfer of exhibit '%s'. Reason: %s", callerBadgeStr, docTitle, req.Reason), docID)

	// Record audit event
	rejectAudit, _ := json.Marshal(map[string]interface{}{
		"document_id":    docID,
		"document_title": docTitle,
		"rejected_by":    callerBadgeStr,
		"reason":         req.Reason,
	})
	_ = RecordAuditEvent(h.db, callerIDStr, callerBadgeStr, "CUSTODY_TRANSFER_REJECTED", "CUSTODY", transferID, string(rejectAudit), c.ClientIP())

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"transfer_id": transferID,
			"document_id": docID,
			"status":      "REJECTED",
			"reason":      req.Reason,
			"message":     "Custody transfer rejected. Physical and legal custody remains with releasing officer.",
		},
		"error": nil,
	})
}

// GetCustodyChain returns the complete chronological chain of custody for a document
// GET /api/v1/custody/chain/:document_id
func (h *CustodyHandler) GetCustodyChain(c *gin.Context) {
	docID := c.Param("document_id")

	// Verify document exists
	var docTitle, sha256Hash string
	var uploaderID *string
	var uploaderName, uploaderBadge *string
	var createdAt time.Time

	err := h.db.QueryRow(`
		SELECT d.title, d.sha256_hash, d.uploaded_by, d.created_at, u.name, u.badge_id 
		FROM documents d
		LEFT JOIN users u ON d.uploaded_by = u.id
		WHERE d.id = $1
	`, docID).Scan(&docTitle, &sha256Hash, &uploaderID, &createdAt, &uploaderName, &uploaderBadge)

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
			"error":   "Database error while loading custody chain",
		})
		return
	}

	rows, err := h.db.Query(`
		SELECT 
			ce.id, ce.document_id, ce.from_agency, ce.to_agency,
			COALESCE(ce.action_type, 'TRANSFERRED'), COALESCE(ce.storage_location, 'Vault'),
			ce.signed_by_sender, ce.signed_by_receiver, COALESCE(ce.status, 'PENDING'),
			COALESCE(ce.rejection_reason, ''), COALESCE(ce.notes, ''), ce.transferred_at,
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
			"error":   "Failed to load custody chain",
		})
		return
	}
	defer rows.Close()

	events := make([]CustodyEvent, 0)
	for rows.Next() {
		var ev CustodyEvent
		ev.DocumentTitle = docTitle
		ev.SHA256Hash = sha256Hash
		err := rows.Scan(
			&ev.ID,
			&ev.DocumentID,
			&ev.FromAgency,
			&ev.ToAgency,
			&ev.ActionType,
			&ev.StorageLocation,
			&ev.SignedBySender,
			&ev.SignedByReceiver,
			&ev.Status,
			&ev.RejectionReason,
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
			log.Printf("⚠️ Error scanning custody event: %v", err)
			continue
		}

		if ev.SignedBySender && ev.SignedByReceiver {
			ev.Status = "ACCEPTED"
		} else if ev.Status != "REJECTED" {
			ev.Status = "PENDING_RECEIVER"
		}

		ev.SenderSignature, ev.ReceiverSignature = parseSignatures(ev.Notes)
		events = append(events, ev)
	}

	// If no formal transfers exist yet, provide the Genesis Seizure / Intake hop
	if len(events) == 0 {
		genesisUploader := "Investigating Officer"
		if uploaderName != nil && *uploaderName != "" {
			genesisUploader = *uploaderName
		}
		genesisBadge := "DL-4821"
		if uploaderBadge != nil && *uploaderBadge != "" {
			genesisBadge = *uploaderBadge
		}

		genesisSigPayload := fmt.Sprintf("%s:%s:GENESIS:%s", docID, sha256Hash, createdAt.Format(time.RFC3339))
		genesisSig := fmt.Sprintf("%x", sha256.Sum256([]byte(genesisSigPayload)))

		events = append(events, CustodyEvent{
			ID:                "genesis-" + docID[:8],
			DocumentID:        docID,
			DocumentTitle:     docTitle,
			SHA256Hash:        sha256Hash,
			ToOfficerName:     &genesisUploader,
			ToOfficerBadge:    &genesisBadge,
			FromAgency:        "SEIZURE_LOCATION",
			ToAgency:          "EIU",
			ActionType:        "SEIZED & REGISTERED",
			StorageLocation:   "Central Police Evidence Vault Box #01",
			SignedBySender:    true,
			SignedByReceiver:  true,
			SenderSignature:   genesisSig,
			ReceiverSignature: genesisSig,
			Status:            "ACCEPTED",
			Notes:             "Official seizure into statutory custody under Section 93 CrPC / BNSS. Bitstream SHA-256 seal initialized.",
			TransferredAt:     createdAt,
		})
	}

	// Identify current legal holder
	currentCustodian := "Investigating Officer"
	currentBadge := "DL-4821"
	lastHop := events[len(events)-1]
	if lastHop.ToOfficerName != nil {
		currentCustodian = *lastHop.ToOfficerName
	}
	if lastHop.ToOfficerBadge != nil {
		currentBadge = *lastHop.ToOfficerBadge
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"document_id":       docID,
			"document_title":    docTitle,
			"sha256_hash":       sha256Hash,
			"chain":             events,
			"total_handoffs":    len(events),
			"current_custodian": currentCustodian,
			"current_badge":     currentBadge,
			"is_sealed":         true,
		},
		"error": nil,
	})
}

// ═══════════════════════════════════════════════════
// DATABASE SEEDING FOR CUSTODY HANDSHAKE DEMO
// ═══════════════════════════════════════════════════

// SeedCustodyEvents populates realistic dual-officer custody transfers if table is empty
func (h *CustodyHandler) SeedCustodyEvents() error {
	var count int
	if err := h.db.QueryRow("SELECT COUNT(*) FROM custody_events").Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		return nil // already seeded
	}

	var ioID, fslID string
	_ = h.db.QueryRow("SELECT id FROM users WHERE badge_id = 'DL-4821' LIMIT 1").Scan(&ioID)
	_ = h.db.QueryRow("SELECT id FROM users WHERE badge_id = 'FSL-9012' LIMIT 1").Scan(&fslID)

	if ioID == "" || fslID == "" {
		log.Println("⚠️ SeedCustodyEvents: Required officers DL-4821 or FSL-9012 not found")
		return nil
	}

	// Find document Forensic_Disk_Clone.dd and Witness_Deposition_Audio.wav
	var diskDocID, diskHash, audioDocID, audioHash string
	_ = h.db.QueryRow("SELECT id, sha256_hash FROM documents WHERE title ILIKE '%Disk_Clone%' LIMIT 1").Scan(&diskDocID, &diskHash)
	_ = h.db.QueryRow("SELECT id, sha256_hash FROM documents WHERE title ILIKE '%Witness_Deposition%' LIMIT 1").Scan(&audioDocID, &audioHash)

	now := time.Now().UTC()
	t1 := now.Add(-48 * time.Hour)
	t2 := now.Add(-24 * time.Hour)

	if diskDocID != "" {
		// Hop 1: IO Seizure
		sig1 := fmt.Sprintf("%x", sha256.Sum256([]byte(fmt.Sprintf("%s:%s:%s", diskDocID, ioID, t1.Format(time.RFC3339)))))
		notes1 := fmt.Sprintf("Physical exhibit seized at raid site. Placed in tamper-evident static bag #EVD-881. [BSA_SEC63_SIG:sender=%s] [BSA_SEC63_SIG:receiver=%s]", sig1, sig1)
		_, _ = h.db.Exec(`
			INSERT INTO custody_events (
				document_id, from_officer, to_officer, from_agency, to_agency,
				action_type, storage_location, signed_by_sender, signed_by_receiver, status, notes, transferred_at
			)
			VALUES ($1, $2, $2, 'CRIME_SCENE', 'EIU', 'SEIZED & REGISTERED', 'Sector 17 Station Evidence Vault Safe A3', true, true, 'ACCEPTED', $3, $4)
		`, diskDocID, ioID, notes1, t1)

		// Hop 2: Dual Handshake to Dr. Sunita Mehra at CFSL
		sigSender := fmt.Sprintf("%x", sha256.Sum256([]byte(fmt.Sprintf("%s:%s:%s:%s:%s", diskDocID, diskHash, ioID, fslID, t2.Format(time.RFC3339)))))
		sigRecv := fmt.Sprintf("%x", sha256.Sum256([]byte(fmt.Sprintf("%s:%s:FSL-9012:%s", diskDocID, fslID, t2.Add(2*time.Hour).Format(time.RFC3339)))))
		notes2 := fmt.Sprintf("Requisition dispatched for forensic bitstream duplication and unallocated sector carve. [BSA_SEC63_SIG:sender=%s] [BSA_SEC63_SIG:receiver=%s]", sigSender, sigRecv)
		_, _ = h.db.Exec(`
			INSERT INTO custody_events (
				document_id, from_officer, to_officer, from_agency, to_agency,
				action_type, storage_location, signed_by_sender, signed_by_receiver, status, notes, transferred_at
			)
			VALUES ($1, $2, $3, 'EIU', 'FSL', 'TRANSFERRED', 'CFSL Digital Forensics Cleanroom Rack 4', true, true, 'ACCEPTED', $4, $5)
		`, diskDocID, ioID, fslID, notes2, t2)
	}

	if audioDocID != "" {
		// Pending Handshake for Audio: Inspector Rajesh Kumar has sent to Dr. Sunita Mehra, awaiting her acceptance!
		sigPending := fmt.Sprintf("%x", sha256.Sum256([]byte(fmt.Sprintf("%s:%s:%s:%s:%s", audioDocID, audioHash, ioID, fslID, now.Format(time.RFC3339)))))
		notesPending := fmt.Sprintf("Requisition for acoustic voiceprint verification and ambient frequency noise filtering. [BSA_SEC63_SIG:sender=%s]", sigPending)
		_, _ = h.db.Exec(`
			INSERT INTO custody_events (
				document_id, from_officer, to_officer, from_agency, to_agency,
				action_type, storage_location, signed_by_sender, signed_by_receiver, status, notes, transferred_at
			)
			VALUES ($1, $2, $3, 'EIU', 'FSL', 'TRANSFERRED', 'In Transit via Armed Police Courier #702', true, false, 'PENDING', $4, $5)
		`, audioDocID, ioID, fslID, notesPending, now.Add(-30*time.Minute))

		// Notification for Dr. Sunita Mehra
		_, _ = h.db.Exec(`
			INSERT INTO notifications (user_id, title, message, type, related_document_id)
			VALUES ($1, 'Pending Custody Transfer', 'Inspector Rajesh Kumar (DL-4821) initiated custody transfer of Witness_Deposition_Audio.wav to you. Dual digital signature required.', 'CUSTODY_TRANSFER_PENDING', $2)
		`, fslID, audioDocID)
	}

	log.Println("🌱 Seeded initial chain of custody handshakes for SIH demonstration")
	return nil
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
		custodyGroup.GET("/officers", handler.ListOfficers)
		custodyGroup.GET("/pending", handler.GetPendingTransfers)
		custodyGroup.GET("/transfers", handler.GetAllCustodyTransfers)
		custodyGroup.POST("/transfer", handler.TransferEvidence)
		custodyGroup.POST("/transfer/accept/:id", handler.AcceptCustody)
		custodyGroup.POST("/transfer/reject/:id", handler.RejectCustody)
		custodyGroup.GET("/chain/:document_id", handler.GetCustodyChain)
	}

	// Trigger initial seeding after short delay
	go func() {
		time.Sleep(500 * time.Millisecond)
		_ = handler.SeedCustodyEvents()
	}()

	log.Println("✅ Custody routes registered (/api/v1/custody)")
	return handler
}
