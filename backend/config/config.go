package config

import (
	"log"
	"os"
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

		// Evidence
		EvidenceEncryptionKey: getEnv("EVIDENCE_ENCRYPTION_KEY", "0000000000000000000000000000000000000000000000000000000000000000"),
	}
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

	// Warn in all environments about insecure defaults
	if c.EvidenceEncryptionKey == allZeros {
		log.Println("⚠️  WARNING: Using default zero encryption key. Evidence encryption is effectively disabled. Set EVIDENCE_ENCRYPTION_KEY for real protection.")
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
