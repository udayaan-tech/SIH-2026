package app

import (
	"bytes"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/nyay-suraksha/backend/config"
)

func init() {
	gin.SetMode(gin.TestMode)
}

// ═══════════════════════════════════════════════════
// 1. TEST PII DETECTION ENGINE (redaction.go)
// ═══════════════════════════════════════════════════
func TestDetectPII(t *testing.T) {
	sampleText := `The victim named Ananya Sharma stated that her phone number is 9876543210 and her Aadhaar card number is 4532 8912 6734.`

	entities := DetectPII(sampleText)
	if len(entities) == 0 {
		t.Fatalf("Expected detected PII entities, got 0")
	}

	foundAadhaar := false
	foundPhone := false
	foundSensitive := false

	for _, e := range entities {
		switch e.Type {
		case "AADHAAR":
			foundAadhaar = true
			if e.Value != "4532 8912 6734" {
				t.Errorf("Unexpected Aadhaar value: %s", e.Value)
			}
			if e.Masked != "XXXX-XXXX-6734" {
				t.Errorf("Unexpected masked Aadhaar: %s", e.Masked)
			}
		case "PHONE":
			foundPhone = true
			if e.Value != "9876543210" {
				t.Errorf("Unexpected phone value: %s", e.Value)
			}
			if e.Masked != "98XXXXXX10" {
				t.Errorf("Unexpected masked phone: %s", e.Masked)
			}
		case "SENSITIVE_PERSON":
			foundSensitive = true
			if e.Value != "Ananya Sharma" {
				t.Errorf("Unexpected sensitive person name: %s", e.Value)
			}
		}
	}

	if !foundAadhaar {
		t.Errorf("Aadhaar detection failed")
	}
	if !foundPhone {
		t.Errorf("Phone detection failed")
	}
	if !foundSensitive {
		t.Errorf("Sensitive person detection failed")
	}
}

// ═══════════════════════════════════════════════════
// 2. TEST RSA KEY GENERATION & RS256 JWT (auth.go)
// ═══════════════════════════════════════════════════
func TestRSAAndJWTTokenGeneration(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "nyay_jwt_test")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	cfg := &config.Config{
		JWTPrivateKeyPath: filepath.Join(tempDir, "private.pem"),
		JWTPublicKeyPath:  filepath.Join(tempDir, "public.pem"),
		JWTIssuer:         "nyay-suraksha-test",
	}

	privKey, pubKey, err := loadOrGenerateRSAKeys(cfg)
	if err != nil {
		t.Fatalf("Failed to generate RSA keys: %v", err)
	}
	if privKey == nil || pubKey == nil {
		t.Fatalf("Keys should not be nil")
	}

	handler := &AuthHandler{
		cfg:        cfg,
		rsaPrivate: privKey,
		rsaPublic:  pubKey,
	}

	testUser := &User{
		ID:      "usr_test_123",
		BadgeID: "DL-4821",
		Name:    "Inspector Rajesh Kumar",
		Role:    RoleIO,
		Station: "Rohini District, Delhi",
	}

	tokenStr, claims, err := handler.generateJWT(testUser)
	if err != nil {
		t.Fatalf("Failed to sign JWT: %v", err)
	}
	if tokenStr == "" {
		t.Fatalf("Token string is empty")
	}

	if claims.UserID != testUser.ID || claims.Role != testUser.Role || claims.BadgeID != testUser.BadgeID {
		t.Errorf("Claims mismatch: %+v", claims)
	}
}

// ═══════════════════════════════════════════════════
// 3. TEST RBAC MIDDLEWARE (auth.go)
// ═══════════════════════════════════════════════════
func TestRequireRoleMiddleware(t *testing.T) {
	r := gin.New()

	// Mock endpoint restricted to JUDGE and PROSECUTOR
	r.GET("/court-room", func(c *gin.Context) {
		// Mock caller role injected from test query
		role := c.Query("role")
		c.Set("role", role)
		c.Next()
	}, RequireRole(RoleJudge, RoleProsecutor), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "granted"})
	})

	// Case A: IO should be forbidden (403)
	wA := httptest.NewRecorder()
	reqA, _ := http.NewRequest("GET", "/court-room?role=IO", nil)
	r.ServeHTTP(wA, reqA)
	if wA.Code != http.StatusForbidden {
		t.Errorf("Expected 403 Forbidden for IO role, got %d", wA.Code)
	}

	// Case B: PROSECUTOR should be allowed (200)
	wB := httptest.NewRecorder()
	reqB, _ := http.NewRequest("GET", "/court-room?role=PROSECUTOR", nil)
	r.ServeHTTP(wB, reqB)
	if wB.Code != http.StatusOK {
		t.Errorf("Expected 200 OK for PROSECUTOR role, got %d", wB.Code)
	}

	// Case C: ADMIN should always bypass (200)
	wC := httptest.NewRecorder()
	reqC, _ := http.NewRequest("GET", "/court-room?role=ADMIN", nil)
	r.ServeHTTP(wC, reqC)
	if wC.Code != http.StatusOK {
		t.Errorf("Expected 200 OK for ADMIN role bypass, got %d", wC.Code)
	}
}

// ═══════════════════════════════════════════════════
// 4. TEST STORAGE WORM POLICY (storage.go)
// ═══════════════════════════════════════════════════
func TestStorageWORMAndVaultFallback(t *testing.T) {
	tempVault, err := os.MkdirTemp("", "vault_test")
	if err != nil {
		t.Fatalf("Failed to create temp vault: %v", err)
	}
	defer os.RemoveAll(tempVault)

	sm := &StorageManager{
		cfg: &config.Config{
			MinIOBucket:           "test-bucket",
			EvidenceEncryptionKey: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
		},
		vaultDir: tempVault,
		useMinIO: false,
	}
	GlobalStorage = sm

	// Test WORM deletion prevention
	err = sm.DeleteFile("test-bucket", "evidence_doc.pdf")
	if err == nil {
		t.Errorf("Expected deletion error enforcing WORM compliance, got nil")
	}

	// Test upload and download from vault
	content := []byte("CRIMINAL EVIDENTIARY HASH DATA - SECTION 65B BNSS")
	err = sm.UploadFile("test-bucket", "doc_test.bin", bytes.NewReader(content), int64(len(content)))
	if err != nil {
		t.Fatalf("Vault upload failed: %v", err)
	}

	reader, err := sm.DownloadFile("test-bucket", "doc_test.bin")
	if err != nil {
		t.Fatalf("Vault download failed: %v", err)
	}
	defer reader.Close()

	readBytes, err := io.ReadAll(reader)
	if err != nil {
		t.Fatalf("Failed to read downloaded content: %v", err)
	}

	if string(readBytes) != string(content) {
		t.Errorf("Content mismatch: expected %q, got %q", string(content), string(readBytes))
	}
}

// ═══════════════════════════════════════════════════
// 5. TEST AUTH REQUIRED MIDDLEWARE (auth.go)
// ═══════════════════════════════════════════════════
func TestAuthRequiredMiddleware(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "nyay_auth_req_test")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	cfg := &config.Config{
		JWTPrivateKeyPath: filepath.Join(tempDir, "private.pem"),
		JWTPublicKeyPath:  filepath.Join(tempDir, "public.pem"),
		JWTIssuer:         "nyay-suraksha-test",
	}

	privKey, pubKey, _ := loadOrGenerateRSAKeys(cfg)
	handler := &AuthHandler{
		cfg:        cfg,
		rsaPrivate: privKey,
		rsaPublic:  pubKey,
	}

	testUser := &User{
		ID:      "usr_abc789",
		BadgeID: "DL-4821",
		Name:    "Inspector Rajesh Kumar",
		Role:    RoleIO,
		Station: "Rohini District, Delhi",
	}
	validToken, _, err := handler.generateJWT(testUser)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}

	r := gin.New()
	r.GET("/protected", handler.AuthRequired(), func(c *gin.Context) {
		userID, _ := c.Get("user_id")
		badgeID, _ := c.Get("badge_id")
		role, _ := c.Get("role")
		c.JSON(http.StatusOK, gin.H{
			"user_id":  userID,
			"badge_id": badgeID,
			"role":     role,
		})
	})

	// Case 1: Missing Authorization Header -> 401
	w1 := httptest.NewRecorder()
	req1, _ := http.NewRequest("GET", "/protected", nil)
	r.ServeHTTP(w1, req1)
	if w1.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401 Unauthorized for missing header, got %d", w1.Code)
	}

	// Case 2: Malformed Header -> 401
	w2 := httptest.NewRecorder()
	req2, _ := http.NewRequest("GET", "/protected", nil)
	req2.Header.Set("Authorization", "InvalidHeaderFormat")
	r.ServeHTTP(w2, req2)
	if w2.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401 Unauthorized for malformed header, got %d", w2.Code)
	}

	// Case 3: Valid Token -> 200 OK
	w3 := httptest.NewRecorder()
	req3, _ := http.NewRequest("GET", "/protected", nil)
	req3.Header.Set("Authorization", "Bearer "+validToken)
	r.ServeHTTP(w3, req3)
	if w3.Code != http.StatusOK {
		t.Errorf("Expected 200 OK for valid Bearer token, got %d", w3.Code)
	}

	// Case 4: Revoked/Blacklisted Token -> 401 Unauthorized
	handler.tokenCache.Store(validToken, true)
	w4 := httptest.NewRecorder()
	req4, _ := http.NewRequest("GET", "/protected", nil)
	req4.Header.Set("Authorization", "Bearer "+validToken)
	r.ServeHTTP(w4, req4)
	if w4.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401 Unauthorized for blacklisted token, got %d", w4.Code)
	}
}

