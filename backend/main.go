package main

import (
	"log"
	"net/http"
	"os"
	"sync"
	"sync/atomic"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/nyay-suraksha/backend/app"
	"github.com/nyay-suraksha/backend/config"
	"github.com/nyay-suraksha/backend/crypto"
	"github.com/nyay-suraksha/backend/db"
)

func main() {
	// Load configuration
	cfg := config.Load()
	cfg.Validate() // F-019: Validate critical security configuration at startup

	// Initialize database
	database, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}
	defer database.Close()
	log.Println("✅ Database connected")

	// Seed default demo officers and cases
	if err := app.SeedDefaultUsers(database); err != nil {
		log.Printf("⚠️  User seed warning: %v", err)
	}
	if err := app.SeedDefaultCases(database); err != nil {
		log.Printf("⚠️  Case seed warning: %v", err)
	}

	// Initialize Merkle tree from existing leaves
	merkleTree := crypto.NewMerkleTree()
	if err := merkleTree.LoadFromDB(database); err != nil {
		log.Printf("⚠️  Merkle tree load warning: %v", err)
	}
	log.Printf("✅ Merkle tree loaded (%d leaves)", merkleTree.LeafCount())

	// Initialize Storage Manager (MinIO with local vault fallback)
	app.InitStorage(cfg)

	// Initialize Gin router
	router := gin.Default()

	// F-042: Set maximum multipart form memory limit
	router.MaxMultipartMemory = 512 << 20 // 512 MB

	// F-033: Global per-IP rate limiting (120 requests/minute)
	router.Use(newRateLimiter(time.Minute, 120))

	// F-048, F-049: Production security headers
	router.Use(securityHeaders(cfg))

	// CORS middleware — allows frontend to connect
	router.Use(func(c *gin.Context) {
		origin := cfg.CORSOrigin
		// F-041: Block wildcard CORS in production
		if origin == "*" && cfg.Environment == "production" {
			log.Println("⚠️  CORS wildcard blocked in production — rejecting cross-origin request")
			origin = ""
		}
		if origin != "" {
			c.Header("Access-Control-Allow-Origin", origin)
		}
		c.Header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Header("Access-Control-Allow-Credentials", "true")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	// ═══════════════════════════════════════════════════
	// HEALTH CHECK (F-043: Internal state removed from unauthenticated endpoint)
	// ═══════════════════════════════════════════════════
	router.GET("/api/v1/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data": gin.H{
				"status":  "operational",
				"service": "nyay-suraksha-backend",
				"version": "0.2.0",
			},
		})
	})

	// ═══════════════════════════════════════════════════
	// DEV 2 — APP & AUTH ENGINE
	// Auth must be registered BEFORE evidence routes to provide authHandler middleware
	// ═══════════════════════════════════════════════════
	authHandler := app.RegisterAuthRoutes(router, database, cfg)
	app.RegisterCaseRoutes(router, database, cfg, authHandler)
	app.RegisterDocumentRoutes(router, database, cfg, authHandler)
	app.RegisterCustodyRoutes(router, database, cfg, authHandler)
	app.RegisterAuditRoutes(router, database, cfg, authHandler)
	app.RegisterRedactionRoutes(router, database, cfg, authHandler)

	// ═══════════════════════════════════════════════════
	// DEV 1 — CRYPTO & INTEGRITY ENGINE
	// F-039: All evidence routes now require authentication
	// ═══════════════════════════════════════════════════
	cryptoHandler := crypto.NewHandler(database, merkleTree, cfg)

	evidence := router.Group("/api/v1/evidence")
	evidence.Use(authHandler.AuthRequired()) // F-039: Authentication gate
	{
		evidence.POST("/upload", cryptoHandler.UploadEvidence)
		evidence.POST("/verify/:id", cryptoHandler.VerifyIntegrity)
		evidence.GET("/:id/certificate", cryptoHandler.GenerateCertificate)

		// F-040: Tamper simulation strictly restricted to non-production environments
		if cfg.Environment != "production" {
			evidence.POST("/tamper/:id", cryptoHandler.SimulateTamper)
			log.Println("⚠️  DEMO ONLY: /tamper/:id endpoint active (non-production environment)")
		}
	}

	merkle := router.Group("/api/v1/merkle")
	merkle.Use(authHandler.AuthRequired()) // F-039: Authentication gate
	{
		merkle.GET("/root", cryptoHandler.GetMerkleRoot)
		merkle.GET("/proof/:id", cryptoHandler.GetMerkleProof)
	}

	// ═══════════════════════════════════════════════════
	// START SERVER
	// ═══════════════════════════════════════════════════
	port := cfg.Port
	if port == "" {
		port = "8080"
	}
	log.Printf("🚀 Nyay Suraksha Backend running on :%s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("❌ Server failed: %v", err)
		os.Exit(1)
	}
}

// securityHeaders adds hardened HTTP response headers (F-048, F-049)
func securityHeaders(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Header("Content-Security-Policy", "default-src 'self'")
		c.Header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		if cfg.Environment == "production" {
			c.Header("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
		}
		c.Next()
	}
}

// newRateLimiter creates a per-IP sliding-window rate limiter (F-033)
func newRateLimiter(window time.Duration, maxRequests int) gin.HandlerFunc {
	type entry struct {
		count     int64
		windowEnd int64 // UnixNano
	}
	var store sync.Map

	// Background cleanup of expired entries
	go func() {
		for {
			time.Sleep(window)
			now := time.Now().UnixNano()
			store.Range(func(key, value any) bool {
				e := value.(*entry)
				if atomic.LoadInt64(&e.windowEnd) < now {
					store.Delete(key)
				}
				return true
			})
		}
	}()

	return func(c *gin.Context) {
		ip := c.ClientIP()
		now := time.Now().UnixNano()
		windowEnd := time.Now().Add(window).UnixNano()

		val, loaded := store.LoadOrStore(ip, &entry{count: 1, windowEnd: windowEnd})
		if !loaded {
			c.Next()
			return
		}

		e := val.(*entry)

		// Window expired — reset
		if atomic.LoadInt64(&e.windowEnd) < now {
			atomic.StoreInt64(&e.count, 1)
			atomic.StoreInt64(&e.windowEnd, windowEnd)
			c.Next()
			return
		}

		current := atomic.AddInt64(&e.count, 1)
		if current > int64(maxRequests) {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"data":    nil,
				"error":   "Rate limit exceeded. Please retry after a brief period.",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
