-- ==============================================================================
-- CASEVAULT — Secure Digital Case & Document Management System
-- Database Schema: PostgreSQL 14+ / ANSI SQL Compatible
-- Design: Zero-Trust, Audited, Immutable Logs, Relational Integrity
-- ==============================================================================

-- 1. DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    jurisdiction VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. ROLES
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    hierarchy_level INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. PERMISSIONS
CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    description TEXT
);

-- 4. ROLE_PERMISSIONS
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id VARCHAR(50) REFERENCES roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(50) REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 5. USERS (Officers / Personnel)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    officer_id VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    department_id VARCHAR(50) REFERENCES departments(id),
    role_id VARCHAR(50) REFERENCES roles(id),
    badge_number VARCHAR(50) NOT NULL UNIQUE,
    designation VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    mfa_enabled BOOLEAN DEFAULT TRUE,
    account_status VARCHAR(20) DEFAULT 'ACTIVE',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. CASES
CREATE TABLE IF NOT EXISTS cases (
    id VARCHAR(50) PRIMARY KEY,
    case_number VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    case_type VARCHAR(100) NOT NULL,
    department_id VARCHAR(50) REFERENCES departments(id),
    jurisdiction VARCHAR(255) NOT NULL,
    lead_officer_id VARCHAR(50) REFERENCES users(id),
    priority VARCHAR(20) DEFAULT 'HIGH',
    status VARCHAR(50) DEFAULT 'ACTIVE',
    confidentiality_level VARCHAR(50) DEFAULT 'CONFIDENTIAL',
    description TEXT,
    investigation_progress INT DEFAULT 0,
    fir_number VARCHAR(100),
    acts_sections TEXT,
    date_opened DATE NOT NULL,
    date_closed DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. CASE_MEMBERS
CREATE TABLE IF NOT EXISTS case_members (
    case_id VARCHAR(50) REFERENCES cases(id) ON DELETE CASCADE,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    access_level VARCHAR(50) DEFAULT 'WRITE',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by VARCHAR(50) REFERENCES users(id),
    PRIMARY KEY (case_id, user_id)
);

-- 8. DOCUMENTS
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(50) PRIMARY KEY,
    document_number VARCHAR(100) NOT NULL UNIQUE,
    case_id VARCHAR(50) REFERENCES cases(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    version VARCHAR(20) DEFAULT 'v1',
    uploaded_by VARCHAR(50) REFERENCES users(id),
    security_classification VARCHAR(50) DEFAULT 'CONFIDENTIAL',
    verification_status VARCHAR(50) DEFAULT 'VERIFIED',
    signature_status VARCHAR(50) DEFAULT 'VALID',
    digital_signature TEXT,
    ocr_extracted_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. DOCUMENT_VERSIONS
CREATE TABLE IF NOT EXISTS document_versions (
    id VARCHAR(50) PRIMARY KEY,
    document_id VARCHAR(50) REFERENCES documents(id) ON DELETE CASCADE,
    version_number VARCHAR(20) NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    change_summary TEXT,
    created_by VARCHAR(50) REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. EVIDENCE
CREATE TABLE IF NOT EXISTS evidence (
    id VARCHAR(50) PRIMARY KEY,
    evidence_number VARCHAR(100) NOT NULL UNIQUE,
    case_id VARCHAR(50) REFERENCES cases(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    evidence_type VARCHAR(100) NOT NULL,
    collected_by VARCHAR(50) REFERENCES users(id),
    collection_date DATE NOT NULL,
    collection_location VARCHAR(255) NOT NULL,
    storage_location VARCHAR(255) NOT NULL,
    current_custodian_id VARCHAR(50) REFERENCES users(id),
    integrity_status VARCHAR(50) DEFAULT 'SECURE',
    sha256_hash VARCHAR(64) NOT NULL,
    digital_signature TEXT,
    serial_barcode VARCHAR(100),
    custody_state VARCHAR(50) DEFAULT 'STORED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. CHAIN_OF_CUSTODY
CREATE TABLE IF NOT EXISTS chain_of_custody (
    id VARCHAR(50) PRIMARY KEY,
    evidence_id VARCHAR(50) REFERENCES evidence(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    from_officer_id VARCHAR(50) REFERENCES users(id),
    to_officer_id VARCHAR(50) REFERENCES users(id),
    from_department VARCHAR(100),
    to_department VARCHAR(100),
    transfer_reason TEXT,
    storage_location VARCHAR(255),
    digital_signature TEXT NOT NULL,
    sha256_verification VARCHAR(64) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. AUDIT_LOGS (Immutable Ledger)
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(50),
    officer_id VARCHAR(50),
    officer_name VARCHAR(255),
    department VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100),
    resource_name VARCHAR(500),
    endpoint VARCHAR(255),
    http_method VARCHAR(10),
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    result VARCHAR(20) NOT NULL,
    reason TEXT,
    request_id VARCHAR(64) NOT NULL,
    checksum VARCHAR(64)
);

-- 13. SECURITY_EVENTS
CREATE TABLE IF NOT EXISTS security_events (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    source_ip VARCHAR(45),
    officer_id VARCHAR(50),
    resource_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'OPEN'
);

-- 14. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'NORMAL',
    resource_type VARCHAR(50),
    resource_id VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR ZERO-TRUST / HIGH-PERFORMANCE SEARCH
CREATE INDEX IF NOT EXISTS idx_cases_dept ON cases(department_id);
CREATE INDEX IF NOT EXISTS idx_cases_lead ON cases(lead_officer_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_docs_case ON documents(case_id);
CREATE INDEX IF NOT EXISTS idx_docs_hash ON documents(sha256_hash);
CREATE INDEX IF NOT EXISTS idx_evidence_case ON evidence(case_id);
CREATE INDEX IF NOT EXISTS idx_custody_evidence ON chain_of_custody(evidence_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_security_severity ON security_events(severity);
