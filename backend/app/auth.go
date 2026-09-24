package app

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"database/sql"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
	"unicode"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/nyay-suraksha/backend/config"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
)

// Standard roles in Nyay Suraksha
const (
	RoleIO         = "IO"
	RoleFSL        = "FSL"
	RoleProsecutor = "PROSECUTOR"
	RoleJudge      = "JUDGE"
	RoleAdmin      = "ADMIN"
)

// User represents an officer/operator in the system
type User struct {
	ID           string    `json:"id"`
	BadgeID      string    `json:"badge_id"`
	Name         string    `json:"name"`
	Role         string    `json:"role"`
	Station      string    `json:"station"`
	PasswordHash string    `json:"-"`
	MFASecret    string    `json:"-"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
}

// JWTClaims represents the RS256 token payload
type JWTClaims struct {
	UserID  string `json:"user_id"`
	BadgeID string `json:"badge_id"`
	Role    string `json:"role"`
	Station string `json:"station"`
	Name    string `json:"name"`
	jwt.RegisteredClaims
}

// LoginRequest is the payload for /api/v1/auth/login
type LoginRequest struct {
	BadgeID  string `json:"badge_id" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// MFAVerifyRequest is the payload for /api/v1/auth/mfa/verify
type MFAVerifyRequest struct {
	SessionToken string `json:"session_token"`
	BadgeID      string `json:"badge_id"`
	OTP          string `json:"otp" binding:"required"`
}

// RefreshTokenRequest is the payload for /api/v1/auth/refresh
type RefreshTokenRequest struct {
	Token string `json:"token"`
}

// OTPSession stores temporary state between login and MFA verification
type OTPSession struct {
	BadgeID   string
	UserID    string
	OTP       string
	ExpiresAt time.Time
}

// loginAttempt tracks failed authentication attempts for brute-force protection
type loginAttempt struct {
	Count       int
	LockedUntil time.Time
}

// AuthHandler holds state and dependencies for authentication
type AuthHandler struct {
	db            *sql.DB
	cfg           *config.Config
	rsaPrivate    *rsa.PrivateKey
	rsaPublic     *rsa.PublicKey
	tokenCache    sync.Map // In-memory fallback blacklist for revoked tokens
	otpSessions   sync.Map // In-memory fallback session_token -> OTPSession
	loginAttempts sync.Map // badge_id -> loginAttempt (rate limiting / brute-force lockout)
	userSessions  sync.Map // user_id -> latest token string (F-046: concurrent session tracking)
	redisClient   *redis.Client
}

// NewAuthHandler initializes cryptographic keys and creates the handler
func NewAuthHandler(db *sql.DB, cfg *config.Config) (*AuthHandler, error) {
	privKey, pubKey, err := loadOrGenerateRSAKeys(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize RSA keys: %w", err)
	}

	handler := &AuthHandler{
		db:         db,
		cfg:        cfg,
		rsaPrivate: privKey,
		rsaPublic:  pubKey,
	}

	// Attempt Redis connection for distributed sessions & token revocation
	if cfg.RedisURL != "" {
		opt, err := redis.ParseURL(cfg.RedisURL)
		if err == nil {
			rdb := redis.NewClient(opt)
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			defer cancel()
			if err := rdb.Ping(ctx).Err(); err == nil {
				handler.redisClient = rdb
				log.Println("⚡ Connected to Redis for distributed token blacklist and MFA sessions")
			} else {
				log.Printf("ℹ️ Redis not reachable at %s, using local synchronized memory store", cfg.RedisURL)
			}
		}
	}

	// F-004: Start background cleanup for expired OTP sessions, login lockouts, and token blacklist
	go handler.cleanupExpiredEntries()

	return handler, nil
}

// loadOrGenerateRSAKeys loads existing RSA keys from disk or creates new 2048-bit keys
func loadOrGenerateRSAKeys(cfg *config.Config) (*rsa.PrivateKey, *rsa.PublicKey, error) {
	privPath := cfg.JWTPrivateKeyPath
	pubPath := cfg.JWTPublicKeyPath

	if privPath == "" {
		privPath = "keys/private.pem"
	}
	if pubPath == "" {
		pubPath = "keys/public.pem"
	}

	// Try reading existing private key
	if privBytes, err := os.ReadFile(privPath); err == nil {
		block, _ := pem.Decode(privBytes)
		if block != nil {
			if privKey, err := x509.ParsePKCS1PrivateKey(block.Bytes); err == nil {
				return privKey, &privKey.PublicKey, nil
			} else if keyInterface, err := x509.ParsePKCS8PrivateKey(block.Bytes); err == nil {
				if pk, ok := keyInterface.(*rsa.PrivateKey); ok {
					return pk, &pk.PublicKey, nil
				}
			}
		}
	}

	// F-007: Use 4096-bit RSA keys for post-2025 compliance
	log.Println("🔑 Generating new RSA 4096-bit keypair for RS256 JWT signing...")
	privKey, err := rsa.GenerateKey(rand.Reader, 4096)
	if err != nil {
		return nil, nil, fmt.Errorf("unable to generate RSA key: %w", err)
	}

	// Persist to disk if directory exists or can be created
	if err := os.MkdirAll(filepath.Dir(privPath), 0700); err == nil {
		privBytes := pem.EncodeToMemory(&pem.Block{
			Type:  "RSA PRIVATE KEY",
			Bytes: x509.MarshalPKCS1PrivateKey(privKey),
		})
		// F-008: Use PKIX (SubjectPublicKeyInfo) encoding to match "PUBLIC KEY" PEM label
		pubDER, _ := x509.MarshalPKIXPublicKey(&privKey.PublicKey)
		pubBytes := pem.EncodeToMemory(&pem.Block{
			Type:  "PUBLIC KEY",
			Bytes: pubDER,
		})

		_ = os.WriteFile(privPath, privBytes, 0600)
		_ = os.WriteFile(pubPath, pubBytes, 0644)
		log.Printf("✅ Saved RSA keypair to %s and %s", privPath, pubPath)
	}

	return privKey, &privKey.PublicKey, nil
}

// ═══════════════════════════════════════════════════
// ENDPOINTS
// ═══════════════════════════════════════════════════

// Login handles officer credentials and initiates MFA verification
// POST /api/v1/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Badge ID and password are required",
		})
		return
	}

	// Brute-force lockout check (F-002: in-memory + Redis)
	if locked, remainingSec := h.isAccountLocked(req.BadgeID); locked {
		c.JSON(http.StatusTooManyRequests, gin.H{
			"success": false,
			"data":    nil,
			"error":   fmt.Sprintf("Account locked due to excessive failed attempts. Please retry after %d seconds.", remainingSec),
		})
		return
	}

	// Query user by badge_id
	var user User
	err := h.db.QueryRow(`
		SELECT id, badge_id, name, role, station, password_hash, is_active, created_at
		FROM users
		WHERE badge_id = $1
	`, req.BadgeID).Scan(
		&user.ID,
		&user.BadgeID,
		&user.Name,
		&user.Role,
		&user.Station,
		&user.PasswordHash,
		&user.IsActive,
		&user.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"data":    nil,
				"error":   "Invalid badge ID or password",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Database error during authentication",
		})
		return
	}

	if !user.IsActive {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Account is inactive. Contact your supervisory administrator.",
		})
		return
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		h.recordFailedLogin(req.BadgeID)

		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Invalid badge ID or password",
		})
		return
	}

	// Reset failed attempts on success
	h.resetLoginAttempts(req.BadgeID)

	// Generate 6-digit OTP
	n, _ := rand.Int(rand.Reader, big.NewInt(900000))
	otp := fmt.Sprintf("%06d", n.Int64()+100000)

	sessionToken := uuid.New().String()
	h.otpSessions.Store(sessionToken, OTPSession{
		BadgeID:   user.BadgeID,
		UserID:    user.ID,
		OTP:       otp,
		ExpiresAt: time.Now().Add(5 * time.Minute),
	})

	// F-029: Log OTP only in non-production environments
	if h.cfg.Environment != "production" {
		log.Printf("📱 [NIC SMS GATEWAY] Dispatching 2FA OTP for Officer %s (%s): %s (Valid for 5 mins)", user.Name, user.BadgeID, otp)
	} else {
		log.Printf("📱 [NIC SMS GATEWAY] OTP dispatched to registered terminal for Officer %s", user.BadgeID)
	}

	respData := gin.H{
		"session_token": sessionToken,
		"badge_id":      user.BadgeID,
		"role":          user.Role,
		"mfa_required":  true,
		"message":       "MFA verification code dispatched to registered officer terminal",
	}

	// Only expose demo_otp in non-production environments
	if h.cfg.Environment != "production" {
		respData["demo_otp"] = otp
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    respData,
		"error":   nil,
	})
}

// MFAVerify checks the 6-digit OTP and returns signed RS256 JWT
// POST /api/v1/auth/mfa/verify
func (h *AuthHandler) MFAVerify(c *gin.Context) {
	var req MFAVerifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"data":    nil,
			"error":   "OTP is required",
		})
		return
	}

	var session OTPSession
	var sessionFound bool

	if req.SessionToken != "" {
		if val, ok := h.otpSessions.Load(req.SessionToken); ok {
			session = val.(OTPSession)
			sessionFound = true
		}
	}
	// F-009: Removed insecure Range-based badge_id fallback lookup that could match wrong sessions

	// Master demo OTP "123456" is strictly restricted to development environments
	isMasterOTP := (h.cfg.Environment != "production") && (req.OTP == "123456")

	if !sessionFound && !isMasterOTP {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"data":    nil,
			"error":   "MFA session expired or invalid. Please login again.",
		})
		return
	}

	if sessionFound {
		if time.Now().After(session.ExpiresAt) && !isMasterOTP {
			h.otpSessions.Delete(req.SessionToken)
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"data":    nil,
				"error":   "OTP has expired. Please initiate login again.",
			})
			return
		}

		if session.OTP != req.OTP && !isMasterOTP {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"data":    nil,
				"error":   "Invalid OTP code. Please check your SMS/terminal.",
			})
			return
		}
	}

	// Retrieve user profile to generate token claims
	// F-001: Require explicit badge_id — removed default "DL-4821" fallback
	badgeIDToLookup := req.BadgeID
	if sessionFound && badgeIDToLookup == "" {
		badgeIDToLookup = session.BadgeID
	}
	if badgeIDToLookup == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Badge ID is required for MFA verification",
		})
		return
	}

	var user User
	err := h.db.QueryRow(`
		SELECT id, badge_id, name, role, station, is_active, created_at
		FROM users
		WHERE badge_id = $1
	`, badgeIDToLookup).Scan(
		&user.ID,
		&user.BadgeID,
		&user.Name,
		&user.Role,
		&user.Station,
		&user.IsActive,
		&user.CreatedAt,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Failed to load user profile for token issuance",
		})
		return
	}

	// Generate RS256 JWT
	tokenString, claims, err := h.generateJWT(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"data":    nil,
			// F-006: Do not leak internal crypto error details to client
			"error":   "Failed to issue access token. Please contact administrator.",
		})
		return
	}

	// F-046: Concurrent session detection — enforce single active session per officer
	if prevToken, exists := h.userSessions.Load(user.ID); exists {
		log.Printf("⚠️ SECURITY NOTICE: Concurrent session detected for Officer %s (%s). Invalidating prior session.", user.Name, user.BadgeID)
		if prevStr, ok := prevToken.(string); ok && prevStr != "" {
			h.revokeToken(prevStr)
		}
	}
	h.userSessions.Store(user.ID, tokenString)

	// Clean up OTP session
	if req.SessionToken != "" {
		h.otpSessions.Delete(req.SessionToken)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"token":      tokenString,
			"token_type": "Bearer",
			"expires_at": claims.ExpiresAt.Time.Unix(),
			"user": gin.H{
				"id":       user.ID,
				"badge_id": user.BadgeID,
				"name":     user.Name,
				"role":     user.Role,
				"station":  user.Station,
			},
		},
		"error": nil,
	})
}

// Refresh generates a new JWT using an existing valid token
// POST /api/v1/auth/refresh
func (h *AuthHandler) Refresh(c *gin.Context) {
	tokenStr := extractTokenFromHeaderOrBody(c)
	if tokenStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Token is required for refresh",
		})
		return
	}

	// Check if already blacklisted (F-034: value is now time.Time, not bool)
	if _, blacklisted := h.tokenCache.Load(tokenStr); blacklisted {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Token has been revoked",
		})
		return
	}

	// Validate current token
	claims := &JWTClaims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return h.rsaPublic, nil
	})

	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Invalid or expired token",
		})
		return
	}

	// Fetch fresh user data from DB
	var user User
	err = h.db.QueryRow(`
		SELECT id, badge_id, name, role, station, is_active
		FROM users
		WHERE id = $1
	`, claims.UserID).Scan(
		&user.ID,
		&user.BadgeID,
		&user.Name,
		&user.Role,
		&user.Station,
		&user.IsActive,
	)

	if err != nil || !user.IsActive {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"data":    nil,
			"error":   "User account inactive or not found",
		})
		return
	}

	// Revoke old token — F-003, F-034: store timestamp and sync with Redis
	h.revokeToken(tokenStr)

	// Issue new token
	newTokenStr, newClaims, err := h.generateJWT(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Failed to issue refreshed token",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"token":      newTokenStr,
			"token_type": "Bearer",
			"expires_at": newClaims.ExpiresAt.Time.Unix(),
			"user": gin.H{
				"id":       user.ID,
				"badge_id": user.BadgeID,
				"name":     user.Name,
				"role":     user.Role,
				"station":  user.Station,
			},
		},
		"error": nil,
	})
}

// Logout blacklists the active JWT token
// POST /api/v1/auth/logout
func (h *AuthHandler) Logout(c *gin.Context) {
	tokenStr := extractTokenFromHeaderOrBody(c)
	if tokenStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"data":    nil,
			"error":   "No token provided to revoke",
		})
		return
	}

	// Blacklist token in memory cache and Redis — F-003, F-034
	h.revokeToken(tokenStr)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"message": "Token revoked successfully",
		},
		"error": nil,
	})
}

// Me returns the active user profile from JWT context
// GET /api/v1/auth/me
func (h *AuthHandler) Me(c *gin.Context) {
	userID, _ := c.Get("user_id")
	badgeID, _ := c.Get("badge_id")
	name, _ := c.Get("user_name")
	role, _ := c.Get("role")
	station, _ := c.Get("station")

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"id":       userID,
			"badge_id": badgeID,
			"name":     name,
			"role":     role,
			"station":  station,
		},
		"error": nil,
	})
}

// ChangePasswordRequest payload for password modification (F-044)
type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required"`
}

// validatePasswordComplexity enforces password complexity standards (F-044)
func validatePasswordComplexity(p string) error {
	if len(p) < 8 {
		return errors.New("password must be at least 8 characters long")
	}
	var hasUpper, hasLower, hasDigit, hasSpecial bool
	for _, c := range p {
		switch {
		case unicode.IsUpper(c):
			hasUpper = true
		case unicode.IsLower(c):
			hasLower = true
		case unicode.IsDigit(c):
			hasDigit = true
		case unicode.IsPunct(c) || unicode.IsSymbol(c):
			hasSpecial = true
		}
	}
	if !hasUpper {
		return errors.New("password must contain at least one uppercase letter")
	}
	if !hasLower {
		return errors.New("password must contain at least one lowercase letter")
	}
	if !hasDigit {
		return errors.New("password must contain at least one number")
	}
	if !hasSpecial {
		return errors.New("password must contain at least one special character")
	}
	return nil
}

// ChangePassword updates an officer's password with strict complexity validation (F-044)
// POST /api/v1/auth/change-password
func (h *AuthHandler) ChangePassword(c *gin.Context) {
	callerID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Unauthorized"})
		return
	}
	callerBadge, _ := c.Get("badge_id")
	callerIDStr := fmt.Sprintf("%v", callerID)
	callerBadgeStr := fmt.Sprintf("%v", callerBadge)

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "old_password and new_password are required"})
		return
	}

	if req.OldPassword == req.NewPassword {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "New password cannot be identical to current password"})
		return
	}

	if err := validatePasswordComplexity(req.NewPassword); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	var currentHash string
	err := h.db.QueryRow("SELECT password_hash FROM users WHERE id = $1", callerIDStr).Scan(&currentHash)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to verify account"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(currentHash), []byte(req.OldPassword)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Incorrect current password"})
		return
	}

	newHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), 12)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to secure new password"})
		return
	}

	_, err = h.db.Exec("UPDATE users SET password_hash = $1 WHERE id = $2", string(newHash), callerIDStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to update password"})
		return
	}

	// F-015, F-020: Record in append-only cryptographic hash chain
	auditDetails, _ := json.Marshal(map[string]interface{}{"event": "password_changed", "badge_id": callerBadgeStr})
	_ = RecordAuditEvent(h.db, callerIDStr, callerBadgeStr, "USER_PASSWORD_CHANGED", "USER", callerIDStr, string(auditDetails), c.ClientIP())

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"message": "Password updated successfully. Please re-authenticate.",
		},
		"error": nil,
	})
}

// Helper methods for token revocation and login lockout (F-002, F-003)
func (h *AuthHandler) revokeToken(tokenStr string) {
	h.tokenCache.Store(tokenStr, time.Now())
	if h.redisClient != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 500*time.Millisecond)
		defer cancel()
		_ = h.redisClient.Set(ctx, "revoked:"+tokenStr, "1", 35*time.Minute).Err()
	}
}

func (h *AuthHandler) isTokenRevoked(tokenStr string) bool {
	if _, revoked := h.tokenCache.Load(tokenStr); revoked {
		return true
	}
	if h.redisClient != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 500*time.Millisecond)
		defer cancel()
		if val, err := h.redisClient.Get(ctx, "revoked:"+tokenStr).Result(); err == nil && val != "" {
			h.tokenCache.Store(tokenStr, time.Now())
			return true
		}
	}
	return false
}

func (h *AuthHandler) isAccountLocked(badgeID string) (bool, int) {
	// 1. Check Redis if available (F-002: persistence across restarts and replicas)
	if h.redisClient != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 500*time.Millisecond)
		defer cancel()
		ttl, err := h.redisClient.TTL(ctx, "lockout:"+badgeID).Result()
		if err == nil && ttl > 0 {
			return true, int(ttl.Seconds())
		}
	}
	// 2. Check local in-memory fallback
	if val, ok := h.loginAttempts.Load(badgeID); ok {
		att := val.(loginAttempt)
		if time.Now().Before(att.LockedUntil) {
			return true, int(time.Until(att.LockedUntil).Seconds())
		}
	}
	return false, 0
}

func (h *AuthHandler) recordFailedLogin(badgeID string) {
	var att loginAttempt
	if val, ok := h.loginAttempts.Load(badgeID); ok {
		att = val.(loginAttempt)
	}
	att.Count++
	if att.Count >= 5 {
		att.LockedUntil = time.Now().Add(15 * time.Minute)
		log.Printf("⚠️ Account %s locked for 15 minutes due to 5 consecutive failed attempts", badgeID)
	}
	h.loginAttempts.Store(badgeID, att)

	if h.redisClient != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 500*time.Millisecond)
		defer cancel()
		if att.Count >= 5 {
			_ = h.redisClient.Set(ctx, "lockout:"+badgeID, "locked", 15*time.Minute).Err()
		} else {
			_ = h.redisClient.Incr(ctx, "attempts:"+badgeID).Err()
			_ = h.redisClient.Expire(ctx, "attempts:"+badgeID, 15*time.Minute).Err()
		}
	}
}

func (h *AuthHandler) resetLoginAttempts(badgeID string) {
	h.loginAttempts.Delete(badgeID)
	if h.redisClient != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 500*time.Millisecond)
		defer cancel()
		_ = h.redisClient.Del(ctx, "lockout:"+badgeID, "attempts:"+badgeID).Err()
	}
}

// ═══════════════════════════════════════════════════
// TOKEN GENERATION & HELPERS
// ═══════════════════════════════════════════════════

func (h *AuthHandler) generateJWT(user *User) (string, *JWTClaims, error) {
	issuer := h.cfg.JWTIssuer
	if issuer == "" {
		issuer = "nyay-suraksha"
	}

	claims := &JWTClaims{
		UserID:  user.ID,
		BadgeID: user.BadgeID,
		Role:    user.Role,
		Station: user.Station,
		Name:    user.Name,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    issuer,
			Subject:   user.ID,
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			// F-005: 30-minute token lifetime for high-security legal system (was 24h)
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(30 * time.Minute)),
			ID:        uuid.New().String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	tokenString, err := token.SignedString(h.rsaPrivate)
	if err != nil {
		return "", nil, err
	}

	return tokenString, claims, nil
}

// cleanupExpiredEntries runs periodically to prevent unbounded growth of in-memory maps (F-004, F-034)
func (h *AuthHandler) cleanupExpiredEntries() {
	ticker := time.NewTicker(2 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		now := time.Now()
		// Clean expired OTP sessions
		h.otpSessions.Range(func(key, value any) bool {
			session := value.(OTPSession)
			if now.After(session.ExpiresAt) {
				h.otpSessions.Delete(key)
			}
			return true
		})
		// Clean expired login lockouts
		h.loginAttempts.Range(func(key, value any) bool {
			att := value.(loginAttempt)
			if !att.LockedUntil.IsZero() && now.After(att.LockedUntil) {
				h.loginAttempts.Delete(key)
			}
			return true
		})
		// F-034: Clean token blacklist entries older than max JWT lifetime
		h.tokenCache.Range(func(key, value any) bool {
			if t, ok := value.(time.Time); ok {
				if now.Sub(t) > 1*time.Hour {
					h.tokenCache.Delete(key)
				}
			}
			return true
		})
	}
}

func extractTokenFromHeaderOrBody(c *gin.Context) string {
	authHeader := c.GetHeader("Authorization")
	if strings.HasPrefix(authHeader, "Bearer ") {
		return strings.TrimPrefix(authHeader, "Bearer ")
	}

	var req RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err == nil && req.Token != "" {
		return req.Token
	}

	return ""
}

// ═══════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════

// AuthRequired validates the JWT RS256 token and injects claims into Gin context
func (h *AuthHandler) AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"data":    nil,
				"error":   "Missing or invalid Authorization header. Expected 'Bearer <token>'",
			})
			c.Abort()
			return
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

		// Check if token has been revoked (F-003, F-034)
		if h.isTokenRevoked(tokenStr) {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"data":    nil,
				"error":   "Token has been revoked. Please authenticate again.",
			})
			c.Abort()
			return
		}

		claims := &JWTClaims{}
		token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodRSA); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
			}
			return h.rsaPublic, nil
		})

		if err != nil || !token.Valid {
			// F-006: Do not leak JWT parsing internals to client
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"data":    nil,
				"error":   "Token is invalid or has expired. Please authenticate again.",
			})
			c.Abort()
			return
		}

		// Inject user metadata into gin.Context
		c.Set("user_id", claims.UserID)
		c.Set("badge_id", claims.BadgeID)
		c.Set("user_name", claims.Name)
		c.Set("role", claims.Role)
		c.Set("station", claims.Station)
		c.Set("claims", claims)

		c.Next()
	}
}

// RequireRole checks whether the authenticated user has one of the allowed roles
func RequireRole(allowedRoles ...string) gin.HandlerFunc {
	roleSet := make(map[string]bool)
	for _, r := range allowedRoles {
		roleSet[strings.ToUpper(r)] = true
	}

	return func(c *gin.Context) {
		roleVal, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"data":    nil,
				"error":   "Access denied: User role could not be verified",
			})
			c.Abort()
			return
		}

		userRole := strings.ToUpper(fmt.Sprintf("%v", roleVal))

		// ADMIN always bypasses role checks
		if userRole == RoleAdmin || roleSet[userRole] {
			c.Next()
			return
		}

		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"data":    nil,
			"error":   fmt.Sprintf("Access denied: Role '%s' does not have permission for this resource", userRole),
		})
		c.Abort()
	}
}

// ═══════════════════════════════════════════════════
// ROUTE REGISTRATION
// ═══════════════════════════════════════════════════

// RegisterAuthRoutes mounts auth endpoints to the Gin router
func RegisterAuthRoutes(router *gin.Engine, db *sql.DB, cfg *config.Config) *AuthHandler {
	handler, err := NewAuthHandler(db, cfg)
	if err != nil {
		log.Fatalf("❌ Failed to initialize AuthHandler: %v", err)
	}

	authGroup := router.Group("/api/v1/auth")
	{
		authGroup.POST("/login", handler.Login)
		authGroup.POST("/mfa/verify", handler.MFAVerify)
		authGroup.POST("/refresh", handler.Refresh)
		authGroup.POST("/logout", handler.Logout)

		// Protected endpoints
		authGroup.GET("/me", handler.AuthRequired(), handler.Me)
		authGroup.POST("/change-password", handler.AuthRequired(), handler.ChangePassword)
	}

	log.Println("✅ Auth routes registered (/api/v1/auth)")

	// F-044: Warn about default passwords in non-production
	if cfg.Environment != "production" {
		log.Println("⚠️  WARNING: Demo officers seeded with default password 'password123'. Enforce password change in production.")
	}

	return handler
}

// ═══════════════════════════════════════════════════
// DATABASE SEEDING
// ═══════════════════════════════════════════════════

// SeedDefaultUsers populates standard officers for testing and role demonstration
func SeedDefaultUsers(db *sql.DB) error {
	var count int
	if err := db.QueryRow("SELECT COUNT(*) FROM users").Scan(&count); err != nil {
		return err
	}

	if count > 0 {
		return nil // Already seeded
	}

	defaultPassword := "password123"
	hash, err := bcrypt.GenerateFromPassword([]byte(defaultPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	hashStr := string(hash)

	type seedUser struct {
		badge   string
		name    string
		role    string
		station string
	}

	users := []seedUser{
		{badge: "DL-4821", name: "Inspector Rajesh Kumar", role: RoleIO, station: "Rohini District, Delhi"},
		{badge: "FSL-9012", name: "Dr. Sunita Mehra", role: RoleFSL, station: "Central Forensic Science Lab, Delhi"},
		{badge: "PROS-3310", name: "Adv. Amit Sharma", role: RoleProsecutor, station: "Delhi High Court Prosecution Wing"},
		{badge: "JUDGE-1001", name: "Justice P. K. Iyer", role: RoleJudge, station: "Rohini District Court, Room 4"},
		{badge: "ADMIN-0001", name: "System Administrator", role: RoleAdmin, station: "National Informatics Centre HQ"},
	}

	for _, u := range users {
		_, err := db.Exec(`
			INSERT INTO users (badge_id, name, role, station, password_hash, is_active)
			VALUES ($1, $2, $3, $4, $5, true)
			ON CONFLICT (badge_id) DO NOTHING
		`, u.badge, u.name, u.role, u.station, hashStr)
		if err != nil {
			log.Printf("⚠️ Failed to seed user %s: %v", u.badge, err)
		}
	}

	log.Println("🌱 Seeded standard demo officers into 'users' table")
	return nil
}
