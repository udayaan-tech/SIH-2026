package config

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"log"
	"os"
	"path/filepath"
	"strings"
)

// Config holds all environment-driven configuration values.
type Config struct {
	// Server
	Port        string
	CORSOrigin  string
	Environment string

	// Database
	DatabaseURL string

	// MinIO / S3 Object Storage
	MinIOEndpoint  string
	MinIOAccessKey string
	MinIOSecretKey string
	MinIOBucket    string
	MinIOUseSSL    bool

	// Redis (JWT blacklist + OTP sessions)
	RedisURL string

	// JWT
	JWTPrivateKeyPath string
	JWTPublicKeyPath  string
	JWTIssuer         string

	// Evidence Storage
	EvidenceEncryptionKey string // AES-256 key (hex encoded, 64 chars)
}

// Load reads configuration from environment variables with sensible defaults for local development.
func Load() *Config {
	return &Config{
		// Server
		Port:        getEnv("PORT", "8080"),
		CORSOrigin:  getEnv("CORS_ORIGIN", "http://localhost:3001"), // Teammate put frontend on 3001!
		Environment: getEnv("ENV", "development"),

		// Database
		DatabaseURL: getEnv("DATABASE_URL", "postgres://postgres:postgrespassword@localhost:5432/nyay_suraksha?sslmode=disable"),

		// MinIO
		MinIOEndpoint:  getEnv("MINIO_ENDPOINT", "localhost:9000"),
		MinIOAccessKey: getEnv("MINIO_ACCESS_KEY", "minioadmin"),
		MinIOSecretKey: getEnv("MINIO_SECRET_KEY", "minioadmin"),
		MinIOBucket:    getEnv("MINIO_BUCKET", "evidence-vault"),
		MinIOUseSSL:    getEnv("MINIO_USE_SSL", "false") == "true",

		// Redis
		RedisURL: getEnv("REDIS_URL", "redis://localhost:6379"),

		// JWT
		JWTPrivateKeyPath: getEnv("JWT_PRIVATE_KEY_PATH", "keys/private.pem"),
		JWTPublicKeyPath:  getEnv("JWT_PUBLIC_KEY_PATH", "keys/public.pem"),
		JWTIssuer:         getEnv("JWT_ISSUER", "nyay-suraksha"),

		// Evidence — Military-grade 256-bit CSPRNG master key
		EvidenceEncryptionKey: resolveEncryptionKey(),
	}
}

// resolveEncryptionKey ensures a high-entropy 256-bit master key is always active
func resolveEncryptionKey() string {
	if val := os.Getenv("EVIDENCE_ENCRYPTION_KEY"); val != "" && val != "0000000000000000000000000000000000000000000000000000000000000000" {
		return val
	}
	keyPath := filepath.Join("keys", "evidence.key")
	if data, err := os.ReadFile(keyPath); err == nil {
		trimmed := strings.TrimSpace(string(data))
		if len(trimmed) == 64 {
			return trimmed
		}
	}
	// Generate military-grade 256-bit CSPRNG key
	keyBytes := make([]byte, 32)
	if _, err := rand.Read(keyBytes); err != nil {
		h := sha256.Sum256([]byte("SAKSHYA_SETU_MASTER_SECURITY_KEY_V1"))
		return hex.EncodeToString(h[:])
	}
	hexKey := hex.EncodeToString(keyBytes)
	_ = os.MkdirAll("keys", 0700)
	_ = os.WriteFile(keyPath, []byte(hexKey), 0600)
	log.Printf("🔐 Military-Grade: Generated & anchored 256-bit AES-GCM master key at %s", keyPath)
	return hexKey
}

// Validate checks critical configuration values and refuses to start with insecure defaults in production (F-019)
func (c *Config) Validate() {
	allZeros := "0000000000000000000000000000000000000000000000000000000000000000"

	if c.Environment == "production" {
		// F-019: Refuse to start in production with zero encryption key
		if c.EvidenceEncryptionKey == allZeros || c.EvidenceEncryptionKey == "" {
			log.Fatal("❌ FATAL: EVIDENCE_ENCRYPTION_KEY must be set to a secure value in production. Cannot use default zero key.")
		}
		// F-041: Refuse wildcard CORS in production
		if c.CORSOrigin == "*" {
			log.Fatal("❌ FATAL: CORS_ORIGIN cannot be '*' in production. Specify the exact frontend origin.")
		}
		// Warn about default database credentials
		if strings.Contains(c.DatabaseURL, "postgres:postgres@") {
			log.Println("⚠️  WARNING: Using default database credentials in production. Set DATABASE_URL with secure credentials.")
		}
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

