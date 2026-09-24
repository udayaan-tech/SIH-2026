package config

import "os"

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
		CORSOrigin:  getEnv("CORS_ORIGIN", "http://localhost:3000"),
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

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
