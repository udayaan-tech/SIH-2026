package app

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"database/sql"
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

	log.Println("🔑 Generating new RSA 2048-bit keypair for RS256 JWT signing...")
	privKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return nil, nil, fmt.Errorf("unable to generate RSA key: %w", err)
	}

	// Persist to disk if directory exists or can be created
	if err := os.MkdirAll(filepath.Dir(privPath), 0700); err == nil {
		privBytes := pem.EncodeToMemory(&pem.Block{
			Type:  "RSA PRIVATE KEY",
			Bytes: x509.MarshalPKCS1PrivateKey(privKey),
		})
		pubBytes := pem.EncodeToMemory(&pem.Block{
			Type:  "PUBLIC KEY",
			Bytes: x509.MarshalPKCS1PublicKey(&privKey.PublicKey),
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

	// Brute-force lockout check: max 5 failed attempts locks account for 15 minutes
	if val, ok := h.loginAttempts.Load(req.BadgeID); ok {
		att := val.(loginAttempt)
		if time.Now().Before(att.LockedUntil) {
			remainingSec := int(time.Until(att.LockedUntil).Seconds())
			c.JSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"data":    nil,
				"error":   fmt.Sprintf("Account locked due to excessive failed attempts. Please retry after %d seconds.", remainingSec),
			})
			return
		}
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
		// Increment failed login attempt
		var att loginAttempt
		if val, ok := h.loginAttempts.Load(req.BadgeID); ok {
			att = val.(loginAttempt)
		}
		att.Count++
		if att.Count >= 5 {
			att.LockedUntil = time.Now().Add(15 * time.Minute)
			log.Printf("⚠️ Account %s locked for 15 minutes due to 5 consecutive failed attempts", req.BadgeID)
		}
		h.loginAttempts.Store(req.BadgeID, att)

		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"data":    nil,
			"error":   "Invalid badge ID or password",
		})
		return
	}

	// Reset failed attempts on success
	h.loginAttempts.Delete(req.BadgeID)

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

	// Log OTP to terminal (mocking NIC SMS gateway)
	log.Printf("📱 [NIC SMS GATEWAY] Dispatching 2FA OTP for Officer %s (%s): %s (Valid for 5 mins)", user.Name, user.BadgeID, otp)

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
	} else if req.BadgeID != "" {
		// Fallback lookup by badge
		h.otpSessions.Range(func(key, value any) bool {
			s := value.(OTPSession)
			if s.BadgeID == req.BadgeID {
				session = s
				sessionFound = true
				return false
			}
			return true
		})
	}

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
	badgeIDToLookup := req.BadgeID
	if sessionFound && badgeIDToLookup == "" {
		badgeIDToLookup = session.BadgeID
	}
	if badgeIDToLookup == "" {
		badgeIDToLookup = "DL-4821" // Default demo officer
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
			"error":   fmt.Sprintf("Failed to sign access token: %v", err),
		})
		return
	}

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

	// Check if already blacklisted
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

	// Revoke old token
	h.tokenCache.Store(tokenStr, true)

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

	// Blacklist token in memory cache
	h.tokenCache.Store(tokenStr, true)

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
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
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

		// Check if token has been revoked
		if _, revoked := h.tokenCache.Load(tokenStr); revoked {
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
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"data":    nil,
				"error":   fmt.Sprintf("Unauthorized: %v", err),
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
	}

	log.Println("✅ Auth routes registered (/api/v1/auth)")
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
