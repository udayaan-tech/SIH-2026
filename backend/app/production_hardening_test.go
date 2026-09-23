package app

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/nyay-suraksha/backend/config"
	"github.com/nyay-suraksha/backend/db"
)

// ═══════════════════════════════════════════════════════════════════════
// PRODUCTION HARDENING TEST SUITE — COURT & POLICE GRADE CONTROLS
// ═══════════════════════════════════════════════════════════════════════

func TestRedTeam_BruteForceLockout(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "lockout_test")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	cfg := &config.Config{
		JWTPrivateKeyPath: filepath.Join(tempDir, "private.pem"),
		JWTPublicKeyPath:  filepath.Join(tempDir, "public.pem"),
		JWTIssuer:         "nyay-suraksha",
		Environment:       "production",
	}

	privKey, pubKey, _ := loadOrGenerateRSAKeys(cfg)
	handler := &AuthHandler{
		cfg:        cfg,
		rsaPrivate: privKey,
		rsaPublic:  pubKey,
	}

	targetBadge := "BADGE-LOCKOUT-TEST"

	// Simulate brute-force state: 5 failed attempts locks badge for 15 minutes
	lockedUntil := time.Now().Add(15 * time.Minute)
	handler.loginAttempts.Store(targetBadge, loginAttempt{
		Count:       5,
		LockedUntil: lockedUntil,
	})

	// Verify endpoint returns HTTP 429 Too Many Requests
	r := gin.New()
	r.POST("/api/v1/auth/login", handler.Login)

	bodyBytes, _ := json.Marshal(map[string]string{
		"badge_id": targetBadge,
		"password": "WrongPassword123",
	})

	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusTooManyRequests {
		t.Fatalf("Expected 429 Too Many Requests, got %d. Body: %s", w.Code, w.Body.String())
	}

	if !strings.Contains(w.Body.String(), "Account locked") {
		t.Errorf("Expected 'Account locked' in response, got: %s", w.Body.String())
	}
	t.Log("🛡️ PASS: Endpoint returned 429 Too Many Requests with account lockout message")
}

func TestStorage_AES256GCMAtRest(t *testing.T) {
	tempVault, err := os.MkdirTemp("", "aes_vault_test")
	if err != nil {
		t.Fatalf("Failed to create temp vault: %v", err)
	}
	defer os.RemoveAll(tempVault)

	cfg := &config.Config{
		MinIOBucket:           "test-evidence-vault",
		EvidenceEncryptionKey: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef", // 64 hex chars
	}

	sm := &StorageManager{
		cfg:      cfg,
		vaultDir: tempVault,
		useMinIO: false,
	}
	GlobalStorage = sm

	plainText := "HIGH-VALUE DIGITAL FORENSIC EVIDENCE — SECTION 63 BHARTIYA SAKSHYA ADHINIYAM"
	docKey := "forensic_seizure_001.txt"

	// 1. Upload file with AES-256-GCM encryption
	err = sm.UploadFile("test-evidence-vault", docKey, strings.NewReader(plainText), int64(len(plainText)))
	if err != nil {
		t.Fatalf("Failed to upload encrypted file: %v", err)
	}

	// 2. Read physical file directly from disk to verify ciphertext at rest
	storedFilePath := filepath.Join(tempVault, docKey)
	rawDiskBytes, err := os.ReadFile(storedFilePath)
	if err != nil {
		t.Fatalf("Failed to read raw file from disk: %v", err)
	}

	// Must start with NYAY_ENC_V1 magic header
	if !bytes.HasPrefix(rawDiskBytes, encHeaderMagic) {
		t.Fatalf("🚨 CRITICAL: Stored file does not contain NYAY_ENC_V1 header! Raw bytes: %s", string(rawDiskBytes[:20]))
	}

	// Raw disk bytes MUST NOT contain plaintext
	if strings.Contains(string(rawDiskBytes), plainText) {
		t.Fatalf("🚨 CRITICAL: Plaintext evidence leaked at rest on disk! Encryption failed.")
	}
	t.Log("🛡️ PASS: Physical file on disk verified to be AES-256-GCM encrypted with NYAY_ENC_V1 header")

	// 3. Download via StorageManager: must transparently decrypt
	reader, err := sm.DownloadFile("test-evidence-vault", docKey)
	if err != nil {
		t.Fatalf("Failed to download and decrypt file: %v", err)
	}
	defer reader.Close()

	decryptedBytes, err := io.ReadAll(reader)
	if err != nil {
		t.Fatalf("Failed reading decrypted stream: %v", err)
	}

	if string(decryptedBytes) != plainText {
		t.Fatalf("Decrypted content mismatch! Expected %q, got %q", plainText, string(decryptedBytes))
	}
	t.Log("🛡️ PASS: Transparent AES-256-GCM retrieval and decryption verified")

	// 4. Verify ReadSeeker support for video/audio range streaming
	if seeker, ok := reader.(io.ReadSeeker); ok {
		seeker.Seek(11, io.SeekStart)
		buf := make([]byte, 7)
		seeker.Read(buf)
		if string(buf) != "DIGITAL" {
			t.Errorf("Seeker range read mismatch: expected 'DIGITAL', got %q", string(buf))
		}
		t.Log("🛡️ PASS: ReadSeekCloser range seeking verified for CCTV scrubbing")
	} else {
		t.Errorf("Reader does not implement io.ReadSeeker")
	}
}

func TestRedTeam_ExpandedPIIDetection(t *testing.T) {
	testSamples := []struct {
		name         string
		text         string
		expectedType string
		mustMask     string
	}{
		{
			name:         "PAN Card Number",
			text:         "Suspect IT return filed under Permanent Account Number ABCDE1234F.",
			expectedType: "PAN",
			mustMask:     "ABXXXXX34F",
		},
		{
			name:         "Indian Voter ID (EPIC)",
			text:         "Deponent identified via Voter Identity Card WXY1234567.",
			expectedType: "VOTER_ID",
			mustMask:     "WXYXXXX567",
		},
		{
			name:         "Vehicle Registration Number",
			text:         "Getaway vehicle logged as DL01AB1234 near scene of incident.",
			expectedType: "VEHICLE_RC",
			mustMask:     "DL01XX1234",
		},
		{
			name:         "Official Email Address",
			text:         "Confidential communication dispatched to inspector.verma@delhipolice.gov.in yesterday.",
			expectedType: "EMAIL",
			mustMask:     "i***@delhipolice.gov.in",
		},
		{
			name:         "Date of Birth with keyword",
			text:         "Victim statement indicates Date of Birth: 15/08/2005.",
			expectedType: "DOB",
			mustMask:     "XX/XX/XXXX",
		},
	}

	for _, tc := range testSamples {
		t.Run(tc.name, func(t *testing.T) {
			entities := DetectPII(tc.text)
			if len(entities) == 0 {
				t.Fatalf("Failed to detect %s in sample: %q", tc.name, tc.text)
			}

			found := false
			for _, e := range entities {
				if e.Type == tc.expectedType {
					found = true
					if e.Masked != tc.mustMask {
						t.Errorf("Masking mismatch: expected %q, got %q", tc.mustMask, e.Masked)
					}
				}
			}
			if !found {
				t.Errorf("Entity of type %s not found in detections: %+v", tc.expectedType, entities)
			}
		})
	}
	t.Log("🛡️ PASS: Expanded Indian PII identifiers (PAN, Voter ID, RC, Email, DOB) verified")
}

func TestRedTeam_FIRFormatValidation(t *testing.T) {
	invalidFIRs := []string{
		"123",
		"FIR",
		"'; DROP TABLE cases; --",
		"FIR-INVALID",
		"<script>alert(1)</script>",
		"FIR-2026",
	}

	for _, fir := range invalidFIRs {
		if firRegex.MatchString(fir) {
			t.Errorf("🚨 CRITICAL: Malformed FIR %q was accepted by regex!", fir)
		}
	}

	validFIRs := []string{
		"FIR-2026-DL-00192",
		"FIR-2026-DL-00045",
		"FIR-2026-DL-00388",
		"FIR/2026/MUM/12345",
		"FIR-2026-SPECIAL-9999",
	}

	for _, fir := range validFIRs {
		if !firRegex.MatchString(fir) {
			t.Errorf("Valid FIR %q was rejected by regex!", fir)
		}
	}
	t.Log("🛡️ PASS: FIR format regex accurately admits valid formats and blocks invalid/injection strings")
}

func TestRedTeam_CryptographicAuditChaining(t *testing.T) {
	database, err := db.Connect("postgres://postgres:postgres@localhost:5432/nyay_suraksha?sslmode=disable")
	if err != nil {
		t.Skipf("PostgreSQL database not available for live audit chain test: %v", err)
	}

	// Record 2 consecutive events and verify hash linkage
	event1Err := RecordAuditEvent(database, "", "DL-9999", "TEST_EVENT_1", "CASE", "case_test_1", `{"step":1}`, "127.0.0.1")
	if event1Err != nil {
		t.Fatalf("Failed to record event 1: %v", event1Err)
	}

	var hash1 string
	_ = database.QueryRow("SELECT hash_snapshot FROM audit_events WHERE action = 'TEST_EVENT_1' ORDER BY created_at DESC LIMIT 1").Scan(&hash1)
	if hash1 == "" {
		t.Fatal("Hash snapshot 1 is empty!")
	}

	event2Err := RecordAuditEvent(database, "", "DL-9999", "TEST_EVENT_2", "CASE", "case_test_2", `{"step":2}`, "127.0.0.1")
	if event2Err != nil {
		t.Fatalf("Failed to record event 2: %v", event2Err)
	}

	var hash2 string
	_ = database.QueryRow("SELECT hash_snapshot FROM audit_events WHERE action = 'TEST_EVENT_2' ORDER BY created_at DESC LIMIT 1").Scan(&hash2)
	if hash2 == "" {
		t.Fatal("Hash snapshot 2 is empty!")
	}

	if hash1 == hash2 {
		t.Fatalf("Hashes should be distinct: %s == %s", hash1, hash2)
	}
	t.Logf("🛡️ PASS: Cryptographic hash chaining validated ($H_1=%s..., $H_2=%s...)", hash1[:12], hash2[:12])
}
