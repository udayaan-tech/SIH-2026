package db

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

// Connect establishes a connection pool to PostgreSQL.
func Connect(databaseURL string) (*sql.DB, error) {
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Connection pool settings
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)

	// Verify connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// Run schema migration
	if err := runMigrations(db); err != nil {
		log.Printf("⚠️  Migration warning (non-fatal): %v", err)
	}

	return db, nil
}

// runMigrations creates tables if they don't exist.
func runMigrations(db *sql.DB) error {
	schema := `
	-- ═══════════════════════════════════════════════
	-- DEV 2 TABLES (App & Auth Engine)
	-- ═══════════════════════════════════════════════

	CREATE TABLE IF NOT EXISTS users (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		badge_id VARCHAR(20) UNIQUE NOT NULL,
		name VARCHAR(100) NOT NULL,
		role VARCHAR(20) NOT NULL,
		station VARCHAR(200),
		password_hash VARCHAR(255) NOT NULL,
		mfa_secret VARCHAR(100),
		is_active BOOLEAN DEFAULT true,
		created_at TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS cases (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		fir_number VARCHAR(50) UNIQUE NOT NULL,
		legal_sections TEXT[],
		status VARCHAR(30) DEFAULT 'ACTIVE',
		is_pocso BOOLEAN DEFAULT false,
		io_id UUID REFERENCES users(id),
		station VARCHAR(200),
		incident_date TIMESTAMPTZ,
		description TEXT,
		created_at TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS documents (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		case_id UUID REFERENCES cases(id),
		title VARCHAR(255) NOT NULL,
		type VARCHAR(50),
		file_size BIGINT DEFAULT 0,
		storage_key VARCHAR(500),
		sha256_hash VARCHAR(64),
		merkle_leaf_id INTEGER,
		classification VARCHAR(30) DEFAULT 'CONFIDENTIAL',
		uploaded_by UUID REFERENCES users(id),
		created_at TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS custody_events (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		document_id UUID REFERENCES documents(id),
		from_officer UUID REFERENCES users(id),
		to_officer UUID REFERENCES users(id),
		from_agency VARCHAR(50),
		to_agency VARCHAR(50),
		signed_by_sender BOOLEAN DEFAULT false,
		signed_by_receiver BOOLEAN DEFAULT false,
		notes TEXT,
		transferred_at TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS notifications (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		user_id UUID REFERENCES users(id),
		title VARCHAR(255),
		message TEXT,
		type VARCHAR(50),
		is_read BOOLEAN DEFAULT false,
		related_case_id UUID,
		related_document_id UUID,
		created_at TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS redaction_queue (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		document_id UUID REFERENCES documents(id),
		detected_entities JSONB,
		status VARCHAR(20) DEFAULT 'PENDING',
		reviewed_by UUID REFERENCES users(id),
		reviewed_at TIMESTAMPTZ,
		created_at TIMESTAMPTZ DEFAULT NOW()
	);

	-- ═══════════════════════════════════════════════
	-- DEV 1 TABLES (Crypto & Integrity Engine)
	-- ═══════════════════════════════════════════════

	CREATE TABLE IF NOT EXISTS merkle_leaves (
		id SERIAL PRIMARY KEY,
		document_id UUID REFERENCES documents(id),
		hash VARCHAR(64) NOT NULL,
		position INTEGER NOT NULL,
		created_at TIMESTAMPTZ DEFAULT NOW()
	);

	-- WORM (Write-Once-Read-Many) append-only ledger
	CREATE TABLE IF NOT EXISTS audit_events (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		actor_id UUID,
		actor_badge VARCHAR(20),
		action VARCHAR(100) NOT NULL,
		target_type VARCHAR(50),
		target_id UUID,
		details JSONB,
		hash_snapshot VARCHAR(64),
		ip_address VARCHAR(45),
		created_at TIMESTAMPTZ DEFAULT NOW()
	);

	-- Indexes for performance
	CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents(case_id);
	CREATE INDEX IF NOT EXISTS idx_documents_hash ON documents(sha256_hash);
	CREATE INDEX IF NOT EXISTS idx_custody_document ON custody_events(document_id);
	CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_events(actor_id);
	CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_events(target_id);
	CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
	CREATE INDEX IF NOT EXISTS idx_merkle_document ON merkle_leaves(document_id);
	`

	_, err := db.Exec(schema)
	return err
}
