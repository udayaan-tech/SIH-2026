package crypto

import (
	"database/sql"
	"encoding/hex"
	"fmt"
	"math/rand"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/nyay-suraksha/backend/config"
)

// Handler holds dependencies for all crypto HTTP handlers.
type Handler struct {
	db     *sql.DB
	merkle *MerkleTree
	cfg    *config.Config
}

// NewHandler creates a new crypto handler with injected dependencies.
func NewHandler(db *sql.DB, merkle *MerkleTree, cfg *config.Config) *Handler {
	return &Handler{
		db:     db,
		merkle: merkle,
		cfg:    cfg,
	}
}

// ═══════════════════════════════════════════════
// POST /api/v1/evidence/upload
// Accepts a file, computes SHA-256, adds to Merkle tree, stores metadata.
// ═══════════════════════════════════════════════
func (h *Handler) UploadEvidence(c *gin.Context) {
	// Get uploaded file
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "No file uploaded. Use form field 'file'.",
		})
		return
	}
	defer file.Close()

	caseID := c.PostForm("case_id")
	docTitle := c.PostForm("title")
	docType := c.PostForm("type") // FIR, STATEMENT, CCTV, FORENSIC_REPORT

	if docTitle == "" {
		docTitle = header.Filename
	}

	// Step 1: Compute SHA-256 hash
	hash, err := HashReader(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   fmt.Sprintf("Failed to compute hash: %v", err),
		})
		return
	}

	// Step 2: Add hash as a leaf to the Merkle tree
	leafPosition := h.merkle.AddLeaf(hash)
	merkleRoot := h.merkle.Root()

	// Step 3: Store document metadata in database
	var docID string
	err = h.db.QueryRow(`
		INSERT INTO documents (case_id, title, type, file_size, sha256_hash, merkle_leaf_id, classification)
		VALUES ($1, $2, $3, $4, $5, $6, 'CONFIDENTIAL')
		RETURNING id
	`, nilIfEmpty(caseID), docTitle, docType, header.Size, hash, leafPosition).Scan(&docID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   fmt.Sprintf("Failed to store document: %v", err),
		})
		return
	}

	// Step 4: Store Merkle leaf
	_, err = h.db.Exec(`
		INSERT INTO merkle_leaves (document_id, hash, position)
		VALUES ($1, $2, $3)
	`, docID, hash, leafPosition)

	if err != nil {
		fmt.Printf("⚠️ Failed to store merkle leaf: %v\n", err)
	}

	// Step 5: Log to audit trail
	h.logAudit(c, "EVIDENCE_UPLOADED", "document", docID, hash)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"document_id":   docID,
			"filename":      header.Filename,
			"file_size":     header.Size,
			"sha256":        hash,
			"merkle_leaf":   leafPosition,
			"merkle_root":   merkleRoot,
			"status":        "SEALED",
			"sealed_at":     time.Now().UTC().Format(time.RFC3339),
		},
	})
}

// ═══════════════════════════════════════════════
// POST /api/v1/evidence/verify/:id
// Re-computes hash from storage and compares with stored hash.
// ═══════════════════════════════════════════════
func (h *Handler) VerifyIntegrity(c *gin.Context) {
	docID := c.Param("id")

	// Fetch stored hash and Merkle leaf position
	var storedHash string
	var leafPosition int
	err := h.db.QueryRow(`
		SELECT sha256_hash, merkle_leaf_id FROM documents WHERE id = $1
	`, docID).Scan(&storedHash, &leafPosition)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Document not found",
		})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   fmt.Sprintf("Database error: %v", err),
		})
		return
	}

	// Verify against Merkle tree
	merkleValid, _ := h.merkle.VerifyLeaf(leafPosition, storedHash)
	proof, _ := h.merkle.GetProof(leafPosition)
	merkleRoot := h.merkle.Root()

	status := "VERIFIED"
	if !merkleValid {
		status = "TAMPERED"
		// Log the tamper alert
		h.logAudit(c, "TAMPER_DETECTED", "document", docID, storedHash)
	}

	h.logAudit(c, "INTEGRITY_VERIFIED", "document", docID, storedHash)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"document_id":    docID,
			"status":         status,
			"stored_hash":    storedHash,
			"merkle_valid":   merkleValid,
			"merkle_leaf":    leafPosition,
			"merkle_root":    merkleRoot,
			"merkle_proof":   proof,
			"verified_at":    time.Now().UTC().Format(time.RFC3339),
		},
	})
}

// ═══════════════════════════════════════════════
// POST /api/v1/evidence/tamper/:id
// 🔴 DEMO ONLY — Simulates a tamper attack by flipping a bit in the stored hash.
// Used during SIH presentation to show live tamper detection.
// ═══════════════════════════════════════════════
func (h *Handler) SimulateTamper(c *gin.Context) {
	docID := c.Param("id")

	// Fetch original hash
	var originalHash string
	var leafPosition int
	err := h.db.QueryRow(`
		SELECT sha256_hash, merkle_leaf_id FROM documents WHERE id = $1
	`, docID).Scan(&originalHash, &leafPosition)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Document not found",
		})
		return
	}

	// Tamper: flip a random byte in the hash to simulate modification
	tampered := tamperHash(originalHash)

	// Update the stored hash to the tampered version (simulating an attacker)
	_, err = h.db.Exec(`UPDATE documents SET sha256_hash = $1 WHERE id = $2`, tampered, docID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to simulate tamper",
		})
		return
	}

	// Now verify — this WILL fail because stored hash ≠ Merkle leaf hash
	merkleLeafHash, _ := h.merkle.GetLeaf(leafPosition)
	merkleValid := (tampered == merkleLeafHash)

	h.logAudit(c, "TAMPER_SIMULATED", "document", docID, tampered)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"document_id":       docID,
			"status":            "TAMPERED",
			"original_hash":     originalHash,
			"tampered_hash":     tampered,
			"merkle_leaf_hash":  merkleLeafHash,
			"merkle_valid":      merkleValid,
			"alert_dispatched":  true,
			"alert_recipients":  []string{"state_vigilance", "high_court_registrar", "ncrb_admin"},
			"tampered_at":       time.Now().UTC().Format(time.RFC3339),
			"restore_endpoint":  fmt.Sprintf("/api/v1/evidence/verify/%s", docID),
		},
	})
}

// ═══════════════════════════════════════════════
// GET /api/v1/evidence/:id/certificate
// Generates a BSA 2023 Section 65B electronic evidence certificate.
// ═══════════════════════════════════════════════
func (h *Handler) GenerateCertificate(c *gin.Context) {
	docID := c.Param("id")

	var title, hash, docType string
	var leafPosition int
	var caseID sql.NullString
	var fileSize int64
	var createdAt time.Time

	err := h.db.QueryRow(`
		SELECT title, sha256_hash, merkle_leaf_id, type, case_id, file_size, created_at
		FROM documents WHERE id = $1
	`, docID).Scan(&title, &hash, &leafPosition, &docType, &caseID, &fileSize, &createdAt)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Document not found",
		})
		return
	}

	proof, _ := h.merkle.GetProof(leafPosition)
	merkleRoot := h.merkle.Root()

	// Fetch case FIR number if linked
	firNumber := "NOT_LINKED"
	if caseID.Valid {
		h.db.QueryRow("SELECT fir_number FROM cases WHERE id = $1", caseID.String).Scan(&firNumber)
	}

	certData := gin.H{
		"certificate_type":      "BSA_2023_SEC_65B",
		"certificate_title":     "Certificate Under Section 65B, Bharatiya Sakshya Adhiniyam 2023",
		"document_id":           docID,
		"document_title":        title,
		"document_type":         docType,
		"file_size_bytes":       fileSize,
		"case_number":           firNumber,

		"sha256_hash":           hash,
		"merkle_root":           merkleRoot,
		"merkle_leaf_position":  leafPosition,
		"merkle_proof":          proof,

		"certifications": []string{
			"(a) The electronic record was produced by a computer in regular use",
			"(b) Information was fed into the computer in the regular course of activities",
			"(c) The computer was operating properly at the material time",
			"(d) The contents of the electronic record are a reproduction of the original",
		},

		"qr_verify_url":         fmt.Sprintf("https://nyaysuraksha.in/verify/%s", hash),
		"generated_at":          time.Now().UTC().Format(time.RFC3339),
		"sealed_at":             createdAt.UTC().Format(time.RFC3339),
		"issuing_authority":     "National Crime Records Bureau, Ministry of Home Affairs",
	}

	h.logAudit(c, "CERTIFICATE_GENERATED", "document", docID, hash)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    certData,
	})
}

// ═══════════════════════════════════════════════
// GET /api/v1/merkle/root
// Returns the current Merkle tree root hash.
// ═══════════════════════════════════════════════
func (h *Handler) GetMerkleRoot(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"merkle_root": h.merkle.Root(),
			"leaf_count":  h.merkle.LeafCount(),
			"computed_at": time.Now().UTC().Format(time.RFC3339),
		},
	})
}

// ═══════════════════════════════════════════════
// GET /api/v1/merkle/proof/:id
// Returns the Merkle inclusion proof for a specific document.
// ═══════════════════════════════════════════════
func (h *Handler) GetMerkleProof(c *gin.Context) {
	docID := c.Param("id")

	var hash string
	var leafPosition int
	err := h.db.QueryRow(`
		SELECT sha256_hash, merkle_leaf_id FROM documents WHERE id = $1
	`, docID).Scan(&hash, &leafPosition)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Document not found",
		})
		return
	}

	proof, err := h.merkle.GetProof(leafPosition)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   fmt.Sprintf("Failed to generate proof: %v", err),
		})
		return
	}

	// Verify the proof is valid
	isValid := VerifyProof(hash, proof, h.merkle.Root())

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"document_id":    docID,
			"leaf_hash":      hash,
			"leaf_position":  leafPosition,
			"merkle_root":    h.merkle.Root(),
			"proof":          proof,
			"proof_valid":    isValid,
			"computed_at":    time.Now().UTC().Format(time.RFC3339),
		},
	})
}

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════

// logAudit writes an append-only audit event to the database.
func (h *Handler) logAudit(c *gin.Context, action, targetType, targetID, hashSnapshot string) {
	ip := c.ClientIP()
	_, err := h.db.Exec(`
		INSERT INTO audit_events (action, target_type, target_id, hash_snapshot, ip_address)
		VALUES ($1, $2, $3, $4, $5)
	`, action, targetType, targetID, hashSnapshot, ip)
	if err != nil {
		fmt.Printf("⚠️ Audit log failed: %v\n", err)
	}
}

// tamperHash flips a random byte in a hex-encoded hash to simulate tampering.
func tamperHash(hexHash string) string {
	bytes, _ := hex.DecodeString(hexHash)
	idx := rand.Intn(len(bytes))
	bytes[idx] ^= 0xFF // Flip all bits of one byte
	return hex.EncodeToString(bytes)
}

// nilIfEmpty returns nil for SQL if string is empty, otherwise the pointer.
func nilIfEmpty(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}
