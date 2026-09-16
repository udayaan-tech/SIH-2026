# 🏛️ NYAY SURAKSHA DMS — National Government-Grade Architecture

## System Name: **न्याय सुरक्षा (Nyay Suraksha)** — Secure Legal Document Management System
### For: Ministry of Home Affairs / NCRB / Women Safety Division
### Problem Statement: SIH26190

---

## 1. NATIONAL DEPLOYMENT TOPOLOGY

This is how the system would be deployed across India for all 36 States/UTs, 17,000+ police stations, 700+ district courts, and 50+ forensic science laboratories.

```
                        ┌─────────────────────────────────────┐
                        │     🏛️ NATIONAL DATA CENTER (NDC)    │
                        │     NIC, New Delhi (Primary)         │
                        │                                     │
                        │  • Central API Gateway              │
                        │  • Master Database (PostgreSQL)     │
                        │  • Merkle Ledger Root Authority     │
                        │  • Key Management Service (Vault)   │
                        │  • AI/ML Processing Cluster         │
                        │  • CERT-In Compliance Engine        │
                        │  • National Analytics Dashboard     │
                        └──────────────┬──────────────────────┘
                                       │
                          Encrypted VPN Backbone
                          (NIC / NICNET / SWAN)
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
              ▼                        ▼                        ▼
   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
   │  🏢 STATE NODE    │    │  🏢 STATE NODE    │    │  🏢 STATE NODE    │
   │  Delhi SCRB       │    │  Maharashtra SCRB │    │  Tamil Nadu SCRB │
   │                   │    │                   │    │                   │
   │ • Regional Cache  │    │ • Regional Cache  │    │ • Regional Cache  │
   │ • State DB Replica│    │ • State DB Replica│    │ • State DB Replica│
   │ • Local Merkle    │    │ • Local Merkle    │    │ • Local Merkle    │
   │   Anchor Node     │    │   Anchor Node     │    │   Anchor Node     │
   └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
            │                        │                        │
     ┌──────┼──────┐          ┌──────┼──────┐          ┌──────┼──────┐
     ▼      ▼      ▼          ▼      ▼      ▼          ▼      ▼      ▼
   [PS]   [PS]   [PS]       [PS]   [PS]   [PS]       [PS]   [PS]   [PS]
   [FSL]  [Court]            [FSL]  [Court]            [FSL]  [Court]
```

### Deployment Nodes

| Node Type | Count | Location | Purpose |
|---|---|---|---|
| **National Data Center (NDC)** | 1 Primary + 1 DR | NIC Delhi + NIC Hyderabad | Central authority, master DB, key vault, AI cluster |
| **Disaster Recovery (DR)** | 1 | NIC Hyderabad / NIC Pune | Hot standby, auto-failover within 4 hours (RTO) |
| **State Relay Nodes** | 36 | Each State/UT SCRB | Cached replicas, regional processing, reduced latency |
| **Police Station Endpoints** | 17,000+ | Every PS in India | PWA + offline mode, document capture, case management |
| **FSL Endpoints** | 50+ | CFSL + State FSLs | Evidence intake, forensic report upload |
| **Court Integration Points** | 700+ District Courts | e-Courts eCIS servers | Verified case bundle delivery, BSA 65B certificates |

### Network Architecture

| Layer | Technology | Purpose |
|---|---|---|
| **WAN Backbone** | NICNET / SWAN (State Wide Area Network) | Encrypted inter-state government backbone |
| **VPN Overlay** | WireGuard / IPSec tunnels | End-to-end encryption between all nodes |
| **CDN Edge** | NIC CDN / Cloudflare Gov | Static asset delivery, DDoS protection |
| **Last Mile** | BSNL / State broadband + 4G/5G fallback | Police station connectivity |
| **Offline Mode** | PWA Service Worker + IndexedDB | Zero-connectivity document capture |

---

## 2. SIX-LAYER SECURITY ARCHITECTURE

Every government-grade system must implement defense-in-depth. Our system has 6 concentric security layers:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ LAYER 1: NETWORK SECURITY                                                           │
│ • NICNET/SWAN encrypted backbone  • WAF (Web Application Firewall)                  │
│ • DDoS protection (rate limiting) • IP whitelisting for admin endpoints              │
│ • Network segmentation (DMZ for public APIs, internal zone for DB/Vault)             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ LAYER 2: TRANSPORT SECURITY                                                         │
│ • TLS 1.3 enforced (no fallback)  • Certificate pinning on mobile/desktop clients   │
│ • Mutual TLS (mTLS) for inter-agency API calls                                      │
│ • HSTS headers (max-age=31536000; includeSubDomains; preload)                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ LAYER 3: APPLICATION SECURITY                                                       │
│ • OWASP Top 10 mitigations        • CSP headers (no inline scripts)                 │
│ • Parameterized queries only      • File upload validation (magic bytes + size)      │
│ • Sandboxed document viewer       • EXIF metadata stripping on ingestion             │
│ • Rate limiting per user/endpoint • Malware scanning (ClamAV) on all uploads         │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ LAYER 4: DATA SECURITY                                                              │
│ • Envelope Encryption (DEK per document + KEK in Vault)                             │
│ • AES-256-GCM encryption at rest  • SHA-256 integrity hashing                       │
│ • Merkle tree with external anchoring • Crypto-shredding on case sealing             │
│ • Key rotation every 90 days      • Encrypted backups with separate keys             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ LAYER 5: IDENTITY & ACCESS SECURITY                                                │
│ • RBAC + ABAC hybrid              • JWT RS256 (asymmetric signing)                  │
│ • 15-min access tokens + refresh  • Device fingerprint binding                      │
│ • MFA (OTP via SMS/TOTP app)      • Break-glass emergency protocol                  │
│ • Dual-authorization for deletes  • Behavioral anomaly detection                    │
│ • Session timeout (15 min idle)   • IP range + duty hours enforcement               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ LAYER 6: AUDIT & COMPLIANCE                                                         │
│ • Append-only cryptographic audit log  • 180-day minimum retention (CERT-In)        │
│ • NTP sync with ntp.nic.in             • DPDPA 2023 consent & retention engine      │
│ • 6-hour breach notification pipeline  • GIGW/WCAG 2.1 AA accessibility             │
│ • Forensic watermarking on all views   • Export logs for RTI/judicial review         │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. COMPLETE MODULE ARCHITECTURE

### Module Map (10 Modules)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     न्याय सुरक्षा (NYAY SURAKSHA) DMS                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │  M1: AUTH &  │  │ M2: CASE &  │  │ M3: SMART   │  │ M4: CRYPTO  │           │
│  │  IDENTITY    │  │  DOCUMENT   │  │  INGESTION  │  │  INTEGRITY  │           │
│  │  GATEWAY     │  │  MANAGER    │  │  ENGINE     │  │  ENGINE     │           │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘           │
│         │                │                │                │                    │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐           │
│  │  M5: AI     │  │ M6: MULTI-  │  │ M7: LEGAL   │  │ M8: ANTI-   │           │
│  │  REDACTION  │  │  AGENCY     │  │  CERT GEN   │  │  LEAK       │           │
│  │  ENGINE     │  │  WORKFLOW   │  │  (BSA 65B)  │  │  VIEWER     │           │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘           │
│         │                │                │                │                    │
│  ┌──────┴──────────────────────┐  ┌──────┴──────────────────────┐              │
│  │  M9: NATIONAL ANALYTICS    │  │ M10: GOV INTEGRATION LAYER  │              │
│  │  & COMMAND DASHBOARD       │  │ (CCTNS / ICJS / eCourts)    │              │
│  └────────────────────────────┘  └──────────────────────────────┘              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### MODULE 1: Authentication & Identity Gateway

**Purpose**: Zero-trust identity verification for every request.

```
┌──────────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                                │
│                                                                      │
│  Officer opens app                                                   │
│       │                                                              │
│       ▼                                                              │
│  [1] Enter Service ID (Badge Number)                                 │
│       │                                                              │
│       ▼                                                              │
│  [2] Enter Password (hashed with bcrypt, 12 rounds)                  │
│       │                                                              │
│       ▼                                                              │
│  [3] MFA Challenge                                                   │
│       ├── Option A: OTP to registered mobile (via NIC SMS Gateway)   │
│       ├── Option B: TOTP app (Google Authenticator / Gov Kavach)     │
│       └── Option C: Aadhaar eKYC (for high-security operations)      │
│       │                                                              │
│       ▼                                                              │
│  [4] Device Fingerprint Captured                                     │
│       │  (Browser hash + IP range + geo-location check)              │
│       │                                                              │
│       ▼                                                              │
│  [5] JWT Access Token Issued (RS256, 15-min expiry)                  │
│       │  Contains: userId, role, stationCode, jurisdiction,          │
│       │            assignedCases[], deviceHash, iat, exp              │
│       │                                                              │
│       ▼                                                              │
│  [6] Refresh Token stored in HttpOnly Secure SameSite cookie         │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Role Hierarchy** (Maps to real Indian Police structure):

```
NATIONAL LEVEL
├── Director General (NCRB)          → Full read access to national analytics
├── CERT-In Compliance Officer       → Security logs & breach reports only
│
STATE LEVEL
├── Director General of Police (DGP) → State-wide read access + override authority
├── Inspector General (IG)           → Range-level oversight
├── Superintendent of Police (SP)    → District-level full access
│
STATION LEVEL
├── Station House Officer (SHO)      → Station-level: approve, sign, oversee
├── Investigating Officer (IO)       → Case-level: create, upload, edit, forward
├── Sub-Inspector (SI)               → Case-level: upload, edit (no forward/sign)
├── Constable / Clerk                → Case-level: view assigned docs only
│
EXTERNAL AGENCIES
├── FSL Scientist                    → Evidence assigned to them: view + upload report
├── Public Prosecutor (PP)           → Assigned cases: view all + generate court bundle
├── Magistrate / Judge               → Assigned cases: read-only + verification view
├── Defense Lawyer                   → Redacted view of charge sheet + evidence list only
```

**ABAC Policy Engine** (Attribute-Based Access Control):

Every API request is evaluated against ALL of these conditions:

```
ALLOW access IF AND ONLY IF:
  ✓ user.role ∈ [allowed_roles_for_endpoint]
  ✓ user.jurisdiction COVERS document.stationCode
  ✓ user.userId ∈ case.assignedPersonnel[]
  ✓ case.status ≠ "SEALED" (unless user.role = "MAGISTRATE")
  ✓ request.ip ∈ user.allowedIPRanges[]
  ✓ request.time ∈ user.dutyHours (OR break-glass flag is active)
  ✓ user.anomalyScore < THRESHOLD (no suspicious behavior pattern)
  ✗ DENY and log the attempt otherwise
```

---

### MODULE 2: Case & Document Manager

**Database Schema** (PostgreSQL):

```sql
-- ═══════════════════════════════════════════════════════════
-- CORE TABLES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE cases (
    case_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fir_number          VARCHAR(50) NOT NULL,          -- e.g., "142/2026"
    police_station_code VARCHAR(20) NOT NULL,          -- e.g., "DL-SN-01"
    district            VARCHAR(100) NOT NULL,
    state_code          VARCHAR(5) NOT NULL,           -- e.g., "DL"
    
    -- Legal Classification
    applicable_sections JSONB NOT NULL,                -- ["BNS-64", "POCSO-4"]
    case_category       VARCHAR(50) NOT NULL,          -- COGNIZABLE / NON_COGNIZABLE
    sensitivity_level   VARCHAR(20) NOT NULL           -- PUBLIC / CONFIDENTIAL / TOP_SECRET
                        CHECK (sensitivity_level IN 
                        ('PUBLIC','CONFIDENTIAL','SECRET','TOP_SECRET')),
    is_pocso            BOOLEAN DEFAULT FALSE,
    is_women_safety     BOOLEAN DEFAULT FALSE,
    
    -- Personnel
    io_user_id          UUID NOT NULL REFERENCES users(user_id),
    sho_user_id         UUID NOT NULL REFERENCES users(user_id),
    assigned_prosecutor UUID REFERENCES users(user_id),
    assigned_judge      UUID REFERENCES users(user_id),
    
    -- Status
    status              VARCHAR(30) NOT NULL DEFAULT 'REGISTERED'
                        CHECK (status IN ('REGISTERED','UNDER_INVESTIGATION',
                        'CHARGESHEET_FILED','TRIAL','CONVICTED','ACQUITTED',
                        'CLOSED','SEALED')),
    
    -- Timestamps
    fir_date            TIMESTAMPTZ NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sealed_at           TIMESTAMPTZ                    -- When case was sealed by court
);

CREATE TABLE documents (
    document_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id             UUID NOT NULL REFERENCES cases(case_id),
    
    -- Document Classification
    doc_type            VARCHAR(50) NOT NULL
                        CHECK (doc_type IN ('FIR','CASE_DIARY','WITNESS_STATEMENT',
                        'SEIZURE_MEMO','CHARGESHEET','FORENSIC_REPORT',
                        'COURT_ORDER','EVIDENCE_PHOTO','EVIDENCE_VIDEO',
                        'CDR_RECORD','DIGITAL_EVIDENCE','LEGAL_NOTICE',
                        'JUDGMENT','OTHER')),
    title               VARCHAR(500) NOT NULL,
    description         TEXT,
    
    -- Storage (Envelope Encryption)
    encrypted_blob_path VARCHAR(500) NOT NULL,         -- Path to AES-256 encrypted file
    dek_encrypted       BYTEA NOT NULL,                -- Document Encryption Key (encrypted by KEK)
    kek_version         INTEGER NOT NULL,              -- Which KEK version encrypted the DEK
    original_filename   VARCHAR(255),
    mime_type           VARCHAR(100) NOT NULL,
    file_size_bytes     BIGINT NOT NULL,
    
    -- Integrity
    sha256_hash         CHAR(64) NOT NULL,             -- SHA-256 of ORIGINAL plaintext file
    merkle_leaf_id      UUID REFERENCES merkle_leaves(leaf_id),
    
    -- Redaction
    has_redacted_copy   BOOLEAN DEFAULT FALSE,
    redacted_blob_path  VARCHAR(500),
    redaction_approved_by UUID REFERENCES users(user_id),
    redaction_approved_at TIMESTAMPTZ,
    
    -- OCR & AI Metadata
    ocr_text            TEXT,                          -- Extracted text (encrypted at rest)
    ocr_language        VARCHAR(10),                   -- "en", "hi", "ta", etc.
    ocr_confidence      DECIMAL(5,2),                  -- 0.00 to 100.00
    ai_tags             JSONB,                         -- Auto-detected: weapon, location, etc.
    
    -- Custody
    uploaded_by         UUID NOT NULL REFERENCES users(user_id),
    current_custodian   UUID NOT NULL REFERENCES users(user_id),
    custody_chain       JSONB NOT NULL DEFAULT '[]',   -- Array of custody transfer records
    
    -- Status
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                        CHECK (status IN ('ACTIVE','ARCHIVED','QUARANTINED','SEALED')),
    is_court_submitted  BOOLEAN DEFAULT FALSE,
    sec_65b_cert_id     UUID REFERENCES evidence_certificates(cert_id),
    
    -- Timestamps
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- MERKLE AUDIT TRAIL (Append-Only, No UPDATE/DELETE allowed)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE audit_log (
    log_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- What happened
    action              VARCHAR(50) NOT NULL
                        CHECK (action IN ('DOCUMENT_UPLOADED','DOCUMENT_VIEWED',
                        'DOCUMENT_DOWNLOADED','DOCUMENT_FORWARDED',
                        'DOCUMENT_SIGNED','CUSTODY_TRANSFERRED',
                        'REDACTION_APPLIED','REDACTION_APPROVED',
                        'CASE_STATUS_CHANGED','CERT_GENERATED',
                        'ACCESS_DENIED','BREAK_GLASS_ACTIVATED',
                        'TAMPER_DETECTED','LOGIN','LOGOUT',
                        'ANOMALY_FLAGGED')),
    
    -- Who did it
    user_id             UUID NOT NULL,
    user_role           VARCHAR(50) NOT NULL,
    user_badge          VARCHAR(50),
    
    -- Context
    case_id             UUID,
    document_id         UUID,
    target_user_id      UUID,                          -- For transfers/forwards
    
    -- Device & Network
    ip_address          INET NOT NULL,
    device_fingerprint  VARCHAR(255),
    geo_latitude        DECIMAL(10,8),
    geo_longitude       DECIMAL(11,8),
    user_agent          TEXT,
    
    -- Integrity Chain
    previous_log_hash   CHAR(64),                      -- SHA-256 of previous log entry
    current_log_hash    CHAR(64) NOT NULL,             -- SHA-256 of this entry
    
    -- Timestamp (NTP synchronized)
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ntp_verified        BOOLEAN DEFAULT TRUE
);

-- CRITICAL: Prevent any modification to audit logs
REVOKE UPDATE, DELETE ON audit_log FROM PUBLIC;
CREATE RULE prevent_audit_update AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE RULE prevent_audit_delete AS ON DELETE TO audit_log DO INSTEAD NOTHING;

-- ═══════════════════════════════════════════════════════════
-- MERKLE TREE STRUCTURE
-- ═══════════════════════════════════════════════════════════

CREATE TABLE merkle_leaves (
    leaf_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_hash       CHAR(64) NOT NULL,             -- SHA-256 of document
    leaf_hash           CHAR(64) NOT NULL,             -- Hash of (document_hash + metadata)
    tree_level          INTEGER NOT NULL DEFAULT 0,
    parent_hash         CHAR(64),
    merkle_root         CHAR(64),                      -- Root at time of insertion
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE merkle_anchors (
    anchor_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merkle_root         CHAR(64) NOT NULL,
    anchor_target       VARCHAR(50) NOT NULL           -- 'ETHEREUM', 'NIC_TSA', 'STATE_CID'
                        CHECK (anchor_target IN 
                        ('ETHEREUM','POLYGON','NIC_TSA','STATE_CID','NCRB_BACKUP')),
    anchor_proof        TEXT NOT NULL,                 -- Transaction hash or TSA receipt
    documents_count     INTEGER NOT NULL,
    anchored_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- EVIDENCE CERTIFICATES (BSA 2023 / Sec 65B)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE evidence_certificates (
    cert_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id         UUID NOT NULL REFERENCES documents(document_id),
    case_id             UUID NOT NULL REFERENCES cases(case_id),
    
    -- Certificate Data (as per BSA 2023)
    document_hash       CHAR(64) NOT NULL,
    hash_algorithm      VARCHAR(20) NOT NULL DEFAULT 'SHA-256',
    source_device       TEXT,                          -- Device that produced the document
    custodian_name      VARCHAR(200) NOT NULL,
    custodian_badge      VARCHAR(50) NOT NULL,
    custodian_designation VARCHAR(100) NOT NULL,
    
    -- Verification
    merkle_root_at_time CHAR(64) NOT NULL,
    integrity_verified  BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Digital Signature
    signed_by           UUID NOT NULL REFERENCES users(user_id),
    digital_signature   TEXT,                          -- DSC or Aadhaar eSign signature
    
    -- Generated PDF
    cert_pdf_path       VARCHAR(500) NOT NULL,
    
    generated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### MODULE 3: Smart Ingestion Engine

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     DOCUMENT INGESTION PIPELINE                          │
│                                                                          │
│  UPLOAD                                                                  │
│    │                                                                     │
│    ▼                                                                     │
│  [1] FILE VALIDATION                                                     │
│    │  • Check magic bytes (not just extension)                           │
│    │  • Enforce size limit (50MB max)                                    │
│    │  • Reject executable/script files                                   │
│    │  • Validate MIME type against whitelist:                            │
│    │    PDF, JPEG, PNG, TIFF, MP4, MP3, DOCX                            │
│    │                                                                     │
│    ▼                                                                     │
│  [2] MALWARE SCAN                                                        │
│    │  • ClamAV virus scan                                                │
│    │  • Reject if infected → quarantine + alert                          │
│    │                                                                     │
│    ▼                                                                     │
│  [3] METADATA EXTRACTION & STRIPPING                                     │
│    │  • Extract EXIF data (GPS, device info, timestamps)                 │
│    │  • Store extracted metadata in encrypted metadata vault              │
│    │  • Strip ALL metadata from the stored copy                          │
│    │                                                                     │
│    ▼                                                                     │
│  [4] MULTILINGUAL OCR                                                    │
│    │  • Auto-detect language (English / Hindi / Regional)                │
│    │  • Tesseract OCR with trained models                                │
│    │  • Extract: Case No., Station, Sections, Names, Dates              │
│    │  • Confidence score calculated per page                             │
│    │                                                                     │
│    ▼                                                                     │
│  [5] AI ENTITY EXTRACTION & AUTO-TAGGING                                 │
│    │  • Named Entity Recognition (NER):                                  │
│    │    PERSON, LOCATION, DATE, WEAPON, VEHICLE, PHONE, AADHAAR         │
│    │  • Auto-suggest document type (FIR / Statement / Report)            │
│    │  • Auto-link to applicable BNS/IPC sections                        │
│    │                                                                     │
│    ▼                                                                     │
│  [6] INTEGRITY HASHING                                                   │
│    │  • Generate SHA-256 hash of original plaintext file                 │
│    │  • Insert hash as leaf node in Merkle tree                          │
│    │  • Record in audit log                                              │
│    │                                                                     │
│    ▼                                                                     │
│  [7] ENVELOPE ENCRYPTION & STORAGE                                       │
│    │  • Generate unique DEK (AES-256-GCM)                                │
│    │  • Encrypt document with DEK                                        │
│    │  • Encrypt DEK with current KEK (from Vault)                        │
│    │  • Store encrypted blob + encrypted DEK + KEK version               │
│    │                                                                     │
│    ▼                                                                     │
│  [8] CONFIRMATION                                                        │
│       • Return document_id, hash, Merkle proof                           │
│       • Show green "✓ Securely Stored & Verified" badge                  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### MODULE 4: Cryptographic Integrity Engine (Merkle Tree)

```
                    MERKLE TREE STRUCTURE
                    
                         [ROOT HASH]  ◄── Anchored externally every 1 hour
                        /            \
                   [H(AB)]          [H(CD)]
                   /     \          /     \
               [H(A)]  [H(B)]  [H(C)]  [H(D)]
                 │        │       │       │
               Doc-1   Doc-2   Doc-3   Doc-4
               FIR     Photo   CDR     Report
               
    VERIFICATION PROCESS:
    ═══════════════════
    To verify Doc-2 (H(B)) is authentic:
    1. Recompute SHA-256 of stored Doc-2 → H(B')
    2. If H(B') ≠ H(B) → 🔴 TAMPERED
    3. Recompute H(AB) = SHA-256(H(A) + H(B'))
    4. Recompute ROOT = SHA-256(H(AB) + H(CD))
    5. Compare ROOT with externally anchored root
    6. If ROOT matches → 🟢 VERIFIED AUTHENTIC
    7. If ROOT differs → 🔴 TREE COMPROMISED
```

**External Anchoring Strategy** (Defense against server admin rebuilding the tree):

```
┌────────────────────┐     ┌──────────────────────┐     ┌────────────────────┐
│ ANCHOR TARGET #1   │     │ ANCHOR TARGET #2     │     │ ANCHOR TARGET #3   │
│                    │     │                      │     │                    │
│ Public Blockchain  │     │ NIC Timestamp        │     │ Cross-Agency Node  │
│ (Polygon/Ethereum) │     │ Authority (TSA)      │     │ (State CID Server) │
│                    │     │                      │     │                    │
│ • Merkle root hash │     │ • RFC 3161 timestamp │     │ • Replicated root  │
│   stored as tx data│     │   from NIC servers   │     │   on independent   │
│ • Immutable, public│     │ • Gov-certified time │     │   state server     │
│ • Verifiable by    │     │ • Legally admissible  │     │ • Police can't     │
│   anyone           │     │   in Indian courts   │     │   control both     │
└────────────────────┘     └──────────────────────┘     └────────────────────┘
```

---

### MODULE 5: AI PII Redaction Engine (Women Safety Division)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                  AI REDACTION WORKFLOW (HUMAN-IN-THE-LOOP)                │
│                                                                          │
│  ORIGINAL DOCUMENT                                                       │
│    │                                                                     │
│    ▼                                                                     │
│  [1] NER MODEL PROCESSING                                               │
│    │  Detects entities:                                                   │
│    │  • VICTIM_NAME      → "Priya Sharma"        [Confidence: 94%]      │
│    │  • VICTIM_ADDRESS   → "42, Lajpat Nagar"    [Confidence: 91%]      │
│    │  • VICTIM_PHONE     → "9876543210"           [Confidence: 99%]      │
│    │  • VICTIM_AGE       → "14 years"             [Confidence: 87%]      │
│    │  • ACCUSED_NAME     → "Rajiv Mehta"          [Confidence: 92%]      │
│    │  • WITNESS_NAME     → "Sunita Devi"          [Confidence: 78%] ⚠️  │
│    │                                                                     │
│    ▼                                                                     │
│  [2] REDACTION PREVIEW (shown to designated Redaction Officer)           │
│    │                                                                     │
│    │  ┌─────────────────────────────────────────────────────────┐        │
│    │  │  "The victim ██████████████ (age ██) residing at       │        │
│    │  │   ██████████████████ reported that the accused          │        │
│    │  │   Rajiv Mehta assaulted her on 15/06/2026..."           │        │
│    │  │                                                         │        │
│    │  │  [REVIEW PANEL]                                         │        │
│    │  │  ✅ "Priya Sharma" → REDACT (94% confidence)            │        │
│    │  │  ✅ "42, Lajpat Nagar" → REDACT (91% confidence)       │        │
│    │  │  ✅ "9876543210" → REDACT (99% confidence)              │        │
│    │  │  ✅ "14 years" → REDACT (87% confidence)                │        │
│    │  │  ❌ "Rajiv Mehta" → KEEP (Accused - public record)      │        │
│    │  │  ⚠️ "Sunita Devi" → MANUAL REVIEW (78% - low conf.)   │        │
│    │  │                                                         │        │
│    │  │  [APPROVE REDACTION]  [MODIFY]  [REJECT ALL]            │        │
│    │  └─────────────────────────────────────────────────────────┘        │
│    │                                                                     │
│    ▼                                                                     │
│  [3] HUMAN CONFIRMATION → Generate 2 copies:                             │
│       • MASTER COPY: Full unredacted (encrypted, TOP_SECRET access only) │
│       • REDACTED COPY: For court filings, defense lawyers, RTI           │
│       • LOG: "Redaction approved by SI Meena Kumari, Badge UP-2847"      │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### MODULE 6: Multi-Agency Case Workflow

```
COMPLETE CASE LIFECYCLE (FIR → JUDGMENT)
════════════════════════════════════════

[1] REGISTRATION (Police Station)
│   IO creates case → Uploads FIR scan → OCR extracts details
│   System auto-generates: Case ID, assigns IO/SHO, sets jurisdiction
│
▼
[2] INVESTIGATION (IO in field)
│   IO uploads: witness statements, seizure memos, scene photos
│   IO requests forensic analysis → System creates FSL work order
│   IO records: case diary entries (daily, as mandated by BNSS)
│   ├── 📱 Mobile: Quick-capture at crime scene (offline capable)
│   └── 💻 Desktop: Detailed uploads at station
│
▼
[3] FORENSIC ANALYSIS (FSL)
│   FSL Scientist sees assigned evidence in their queue
│   FSL downloads evidence → Custody transferred (logged)
│   FSL uploads signed forensic report → Hash verified
│   IO + SHO get notified: "Forensic report ready for Case 142/2026"
│
▼
[4] CHARGE SHEET PREPARATION (IO + Prosecutor)
│   IO compiles all documents into a charge sheet bundle
│   System generates document index with integrity status:
│   │  ✅ FIR_142_2026.pdf         SHA-256: a3f8c2... VERIFIED
│   │  ✅ Witness_Stmt_01.pdf      SHA-256: 7b2e91... VERIFIED
│   │  ✅ FSL_Report_BIO_0847.pdf  SHA-256: d4c1a0... VERIFIED
│   │  ✅ Scene_Photo_01.jpg       SHA-256: 9e3f7b... VERIFIED
│   │
│   Prosecutor reviews → Requests additional evidence if needed
│   IO + SHO digitally sign the charge sheet (dual authorization)
│
▼
[5] COURT SUBMISSION
│   Prosecutor clicks "Generate Court Bundle"
│   System produces:
│   ├── Indexed PDF bundle with all case documents
│   ├── BSA 2023 / Sec 65B Certificate for EACH digital document
│   ├── Merkle verification report (proves no tampering)
│   ├── Redacted copies (for defense lawyer access)
│   └── Chain of custody report (who handled what, when)
│
▼
[6] TRIAL (Court)
│   Magistrate/Judge accesses the verified case bundle
│   Document viewer shows: 🟢 VERIFIED or 🔴 TAMPERED per document
│   Defense lawyer gets redacted view only
│   Judge can request additional documents from IO (logged)
│
▼
[7] JUDGMENT & CLOSURE
│   Judge uploads judgment → Case status → CONVICTED / ACQUITTED
│   If ACQUITTED: DPDPA data retention review triggered
│   If CONVICTED: Case archived, documents preserved per retention policy
│   Case SEALED by court order → Crypto-shredding option available
```

---

### MODULE 8: Anti-Leak Forensic Document Viewer

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    ANTI-LEAK DOCUMENT VIEWER                             │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  ╔══════════════════════════════════════════════════════════════╗  │  │
│  │  ║                                                              ║  │  │
│  │  ║   F I R  No. 142/2026                                       ║  │  │
│  │  ║   P.S. Sarojini Nagar, New Delhi                            ║  │  │
│  │  ║                                                              ║  │  │
│  │  ║   ╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱  ║  │  │
│  │  ║  ╱ INSP. RAJESH KUMAR | DL-4821 | 10.42.1.88 | 10:15:30 ╱  ║  │  │
│  │  ║ ╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱  ║  │  │
│  │  ║                                                              ║  │  │
│  │  ║   Complainant: [REDACTED]                                    ║  │  │
│  │  ║   Address: [REDACTED]                                        ║  │  │
│  │  ║   Accused: Rajiv Mehta, s/o Ramesh Mehta                    ║  │  │
│  │  ║                                                              ║  │  │
│  │  ╚══════════════════════════════════════════════════════════════╝  │  │
│  │                                                                    │  │
│  │  🟢 INTEGRITY: VERIFIED (SHA-256 match confirmed)                 │  │
│  │  🔒 CLASSIFICATION: CONFIDENTIAL (POCSO)                         │  │
│  │  📋 CUSTODY: IO R. Kumar → FSL Delhi → PP A. Singh → Court       │  │
│  │                                                                    │  │
│  │  [🔍 Verify Hash]  [📄 Gen Sec 65B Cert]  [📤 Forward]           │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ANTI-LEAK MEASURES ACTIVE:                                              │
│  ✓ Dynamic watermark with viewer identity + IP + timestamp               │
│  ✓ Right-click disabled, Ctrl+C/Ctrl+P blocked                          │
│  ✓ CSS print media: shows only "UNAUTHORIZED PRINT ATTEMPT" message      │
│  ✓ Document rendered as canvas (not selectable DOM text)                  │
│  ✓ Screenshot detection: document blurs if window loses focus            │
│  ✓ Session recorded in audit log with duration                           │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### MODULE 9: National Analytics Command Dashboard

For NCRB Director General and MHA officials — a real-time national overview:

```
┌──────────────────────────────────────────────────────────────────────────┐
│  न्याय सुरक्षा — NATIONAL COMMAND DASHBOARD                             │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │ 📄 1,24,567   │ │ 🔒 99.97%    │ │ ⚠️  23       │ │ 🏛️ 4,521     │   │
│  │ Total Docs   │ │ Integrity    │ │ Anomalies    │ │ Active Cases │   │
│  │ Managed      │ │ Score        │ │ This Week    │ │ Nationwide   │   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────┐ ┌────────────────────────────────┐ │
│  │ 🗺️ INDIA HEAT MAP               │ │ 📊 CASE STATUS DISTRIBUTION    │ │
│  │                                 │ │                                │ │
│  │  [Interactive map showing       │ │  Investigation:  ████████ 45%  │ │
│  │   document volume per state     │ │  Chargesheet:    █████   28%  │ │
│  │   with color coding:            │ │  Trial:          ███     17%  │ │
│  │   🟢 Healthy                    │ │  Closed:         ██      10%  │ │
│  │   🟡 Pending reviews            │ │                                │ │
│  │   🔴 Anomalies detected]        │ │                                │ │
│  └─────────────────────────────────┘ └────────────────────────────────┘ │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ 🔴 RECENT SECURITY ALERTS                                          │ │
│  │                                                                     │ │
│  │ [2 min ago]  ANOMALY: SI Pradeep (MP-BPL-03) viewed 38 cases in   │ │
│  │              5 minutes — auto-flagged, session suspended             │ │
│  │ [1 hr ago]   BREAK-GLASS: SP Gupta (RJ-JP-01) accessed sealed     │ │
│  │              Case 89/2025 — justified: court order #CR/2026/445     │ │
│  │ [3 hr ago]   TAMPER ALERT: Document hash mismatch in Case          │ │
│  │              204/2026, PS Andheri (MH-MUM-12) — quarantined         │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### MODULE 10: Government Integration Layer

```
┌──────────────────────────────────────────────────────────────────────────┐
│                 GOVERNMENT SYSTEM INTEGRATION MAP                        │
│                                                                          │
│  ┌─────────────────┐                          ┌─────────────────┐       │
│  │ CCTNS            │ ◄──── REST API ────►    │ NYAY SURAKSHA   │       │
│  │ (Crime Tracking) │  Pull: FIR data, case   │ DMS             │       │
│  │                  │  status, accused records │                 │       │
│  └─────────────────┘                          │                 │       │
│                                                │                 │       │
│  ┌─────────────────┐                          │                 │       │
│  │ ICJS             │ ◄──── FHIR/XML ────►    │                 │       │
│  │ (Interoperable   │  Sync: case records     │                 │       │
│  │  Criminal Justice│  across police, court,   │                 │       │
│  │  System)         │  prison, forensic        │                 │       │
│  └─────────────────┘                          │                 │       │
│                                                │                 │       │
│  ┌─────────────────┐                          │                 │       │
│  │ e-Courts (eCIS)  │ ◄──── REST API ────►    │                 │       │
│  │ (NIC Court Mgmt) │  Push: verified case    │                 │       │
│  │                  │  bundle + 65B certs     │                 │       │
│  └─────────────────┘                          │                 │       │
│                                                │                 │       │
│  ┌─────────────────┐                          │                 │       │
│  │ Aadhaar eSign    │ ◄──── eSign API ────►   │                 │       │
│  │ (UIDAI)          │  Digital signatures     │                 │       │
│  └─────────────────┘                          │                 │       │
│                                                │                 │       │
│  ┌─────────────────┐                          │                 │       │
│  │ NIC SMS Gateway  │ ◄──── SMS API ────►     │                 │       │
│  │                  │  OTP delivery           │                 │       │
│  └─────────────────┘                          │                 │       │
│                                                │                 │       │
│  ┌─────────────────┐                          │                 │       │
│  │ DigiLocker       │ ◄──── API ────►         │                 │       │
│  │ (MeitY)          │  Verified doc issuance  │                 │       │
│  └─────────────────┘                          └─────────────────┘       │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. COMPLIANCE MATRIX

| Compliance Standard | Requirement | Our Implementation |
|---|---|---|
| **BNSS 2023** | Digital case diaries, electronic processes | Digital case diary module, e-summons integration |
| **BSA 2023 / Sec 65B** | Electronic evidence certification | Automated Sec 65B certificate generator |
| **DPDPA 2023** | Consent, data minimization, breach notification | Consent capture, retention engine, CERT-In auto-report |
| **CERT-In Directives** | 180-day logs, NTP sync, 6-hr breach reporting | Append-only audit logs, ntp.nic.in sync, alert pipeline |
| **GIGW Guidelines** | Bilingual, accessible, WCAG 2.1 AA | Hindi/English toggle, ARIA labels, keyboard nav, high contrast |
| **IT Act 2000 Sec 43A** | Reasonable security practices for sensitive data | Six-layer security architecture, encryption at rest & transit |
| **POCSO Act** | Victim identity protection | AI redaction + human-in-the-loop + dual-copy system |
| **BNS Sec 72** | Non-disclosure of victim identity in sexual offenses | Automated redaction with legal compliance checks |
| **RTI Act 2005** | Certain case info may be requested via RTI | Redacted export mode for RTI compliance |

---

## 5. SCALABILITY PLAN (17,000+ Police Stations)

| Metric | Target | Strategy |
|---|---|---|
| **Concurrent Users** | 50,000+ | Stateless API servers behind load balancer, horizontal scaling |
| **Document Storage** | Petabytes | Object storage (MinIO/S3-compatible) with tiered storage (hot/warm/cold) |
| **Search Performance** | < 500ms | Elasticsearch cluster with state-level sharding |
| **API Response Time** | < 200ms (p95) | Redis caching, DB connection pooling, CDN for static assets |
| **Availability** | 99.9% uptime | Multi-AZ deployment, auto-failover, health checks |
| **Backup** | RPO: 1 hour, RTO: 4 hours | Streaming replication to DR site, encrypted daily snapshots |

---

## 6. HACKATHON PROTOTYPE EXECUTION PLAN

For the SIH demo, we will build a **fully functional prototype** demonstrating all 10 modules with realistic data:

| Phase | What We Build | Duration |
|---|---|---|
| **Phase 1** | Project scaffold (Vite + React), design system, dark/light theme, responsive layout | Day 1 |
| **Phase 2** | Auth system (JWT RS256 + RBAC + role switcher), user management | Day 1-2 |
| **Phase 3** | Case management + document upload + file validation + ingestion pipeline | Day 2-3 |
| **Phase 4** | SHA-256 hashing + Merkle tree + tamper detection + live verification demo | Day 3-4 |
| **Phase 5** | AI PII redaction engine (NER model) + human-in-the-loop review UI | Day 4-5 |
| **Phase 6** | Anti-leak document viewer + dynamic watermarking + print protection | Day 5 |
| **Phase 7** | BSA 2023 / Sec 65B certificate generator + court bundle export | Day 5-6 |
| **Phase 8** | Multi-agency workflow (IO → FSL → Prosecutor → Court) with notifications | Day 6 |
| **Phase 9** | National analytics dashboard with India map + security alerts | Day 6-7 |
| **Phase 10** | Polish, realistic test data, demo script, presentation slides | Day 7 |

---

> [!IMPORTANT]
> **This architecture addresses all 25 gaps identified in the security audit.** Every vulnerability has a corresponding defense, every compliance requirement has an implementation, and every judge question has a prepared answer. Review and approve to begin Phase 1 immediately.
