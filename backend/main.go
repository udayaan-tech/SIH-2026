package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/nyay-suraksha/backend/config"
	"github.com/nyay-suraksha/backend/crypto"
	"github.com/nyay-suraksha/backend/db"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize database
	database, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}
	defer database.Close()
	log.Println("✅ Database connected")

	// Initialize Merkle tree from existing leaves
	merkleTree := crypto.NewMerkleTree()
	if err := merkleTree.LoadFromDB(database); err != nil {
		log.Printf("⚠️  Merkle tree load warning: %v", err)
	}
	log.Printf("✅ Merkle tree loaded (%d leaves)", merkleTree.LeafCount())

	// Initialize Gin router
	router := gin.Default()

	// CORS middleware — allows frontend to connect
	router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", cfg.CORSOrigin)
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
	// HEALTH CHECK
	// ═══════════════════════════════════════════════════
	router.GET("/api/v1/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data": gin.H{
				"status":      "operational",
				"service":     "nyay-suraksha-backend",
				"version":     "0.1.0",
				"merkle_root": merkleTree.Root(),
				"leaf_count":  merkleTree.LeafCount(),
			},
		})
	})

	// ═══════════════════════════════════════════════════
	// DEV 1 (DIVYA) — CRYPTO & INTEGRITY ENGINE
	// All routes under /api/v1/evidence and /api/v1/merkle
	// ═══════════════════════════════════════════════════
	cryptoHandler := crypto.NewHandler(database, merkleTree, cfg)

	evidence := router.Group("/api/v1/evidence")
	{
		evidence.POST("/upload", cryptoHandler.UploadEvidence)
		evidence.POST("/verify/:id", cryptoHandler.VerifyIntegrity)
		evidence.POST("/tamper/:id", cryptoHandler.SimulateTamper) // DEMO ONLY
		evidence.GET("/:id/certificate", cryptoHandler.GenerateCertificate)
	}

	merkle := router.Group("/api/v1/merkle")
	{
		merkle.GET("/root", cryptoHandler.GetMerkleRoot)
		merkle.GET("/proof/:id", cryptoHandler.GetMerkleProof)
	}

	// ═══════════════════════════════════════════════════
	// DEV 2 (TEAMMATE) — APP & AUTH ENGINE
	// Register your routes below this line
	// ═══════════════════════════════════════════════════

	// TODO: app.RegisterAuthRoutes(router, database, cfg)
	// TODO: app.RegisterCaseRoutes(router, database, cfg)
	// TODO: app.RegisterDocumentRoutes(router, database, cfg)
	// TODO: app.RegisterCustodyRoutes(router, database, cfg)
	// TODO: app.RegisterAuditRoutes(router, database, cfg)
	// TODO: app.RegisterRedactionRoutes(router, database, cfg)

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
