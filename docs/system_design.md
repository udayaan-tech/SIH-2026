# 🏛️ NYAY SURAKSHA — COMPLETE SYSTEM DESIGN

## Problem Statement: SIH26190 — Secure Digital Document Management System for Legal & Investigation Documents
## System Name: न्याय सुरक्षा (Nyay Suraksha)

---

## 1. HIGH-LEVEL ARCHITECTURE (HLA)

```mermaid
graph TB
    subgraph CLIENTS["👥 CLIENTS"]
        WEB["🖥️ Web App<br/>(Next.js PWA)"]
        MOB["📱 Mobile Browser<br/>(Responsive PWA)"]
        OFFLINE["📴 Offline Mode<br/>(Service Worker + IndexedDB)"]
    end

    subgraph EDGE["🌐 EDGE LAYER"]
        CDN["☁️ CloudFront CDN<br/>(Static Assets + DDoS Shield)"]
        WAF["🛡️ WAF<br/>(Web Application Firewall)"]
    end

    subgraph GATEWAY["🚪 API GATEWAY"]
        NGINX["⚡ Nginx<br/>(TLS 1.3 + Rate Limit + CSP Headers)"]
        MWARE["🔐 Auth Middleware<br/>(JWT RS256 + ABAC Policy Engine)"]
    end

    subgraph CORE["⚙️ CORE SERVICES"]
        API["🐍 FastAPI Server<br/>(Main Application API)"]
        GO["🔵 Go Crypto Service<br/>(Merkle + Hashing + Anchoring)"]
        CELERY["⚡ Celery Workers<br/>(Background AI Tasks)"]
    end

    subgraph AI["🧠 AI / ML ENGINE"]
        NER["📝 spaCy NER<br/>(PII Detection)"]
        OCR["🔍 Tesseract OCR<br/>(Multilingual Text Extraction)"]
        CLASSIFY["📂 Document Classifier<br/>(Auto-categorization)"]
    end

    subgraph DATA["🗄️ DATA LAYER"]
        PG["🐘 PostgreSQL 16<br/>(Cases, Docs, Users, Audit)"]
        REDIS["⚡ Redis 7<br/>(Sessions, Cache, Rate Limits)"]
        ES["🔎 Elasticsearch 8<br/>(Full-Text Search)"]
        S3["📦 MinIO / S3<br/>(Encrypted Document Blobs)"]
    end

    subgraph SECURITY["🔒 SECURITY INFRASTRUCTURE"]
        VAULT["🗝️ AWS KMS / Vault<br/>(KEK Storage)"]
        POLYGON["⛓️ Polygon PoS<br/>(Merkle Root Anchoring)"]
        NTP["🕐 NTP Server<br/>(ntp.nic.in)"]
    end

    subgraph GOVINT["🏛️ GOVERNMENT INTEGRATIONS"]
        CCTNS["CCTNS<br/>(Crime Tracking)"]
        ECOURTS["e-Courts<br/>(Case Bundles)"]
        ESIGN["Aadhaar eSign<br/>(Digital Signatures)"]
        SMS["NIC SMS Gateway<br/>(OTP Delivery)"]
    end

    WEB --> CDN
    MOB --> CDN
    OFFLINE -.->|"Sync when online"| CDN
    CDN --> WAF --> NGINX --> MWARE --> API

    API --> GO
    API --> CELERY
    CELERY --> NER
    CELERY --> OCR
    CELERY --> CLASSIFY

    API --> PG
    API --> REDIS
    API --> ES
    API --> S3

    GO --> PG
    GO --> POLYGON
    API --> VAULT
    API --> NTP

    API -.-> CCTNS
    API -.-> ECOURTS
    API -.-> ESIGN
    API -.-> SMS
```

---

## 2. MICROSERVICES COMPONENT MAP

```mermaid
graph LR
    subgraph FRONTEND["FRONTEND SERVICE (Next.js)"]
        direction TB
        F1["Auth Pages<br/>(Login + MFA)"]
        F2["Case Dashboard"]
        F3["Document Manager"]
        F4["Secure Viewer<br/>(Watermarked)"]
        F5["Redaction Review UI"]
        F6["Analytics Dashboard<br/>(India Map + Charts)"]
        F7["Admin Panel"]
        F8["Role Switcher"]
    end

    subgraph BACKEND["MAIN API SERVICE (Python FastAPI)"]
        direction TB
        B1["Auth Router<br/>(/api/v1/auth)"]
        B2["Cases Router<br/>(/api/v1/cases)"]
        B3["Documents Router<br/>(/api/v1/documents)"]
        B4["Redaction Router<br/>(/api/v1/redaction)"]
        B5["Analytics Router<br/>(/api/v1/analytics)"]
        B6["Admin Router<br/>(/api/v1/admin)"]
        B7["Cert Generator<br/>(/api/v1/certs)"]
    end

    subgraph CRYPTO["CRYPTO SERVICE (Go)"]
        direction TB
        C1["SHA-256 Hasher"]
        C2["Merkle Tree Engine"]
        C3["Proof Generator"]
        C4["Polygon Anchor"]
        C5["Integrity Verifier"]
    end

    subgraph WORKERS["AI WORKERS (Celery)"]
        direction TB
        W1["OCR Worker"]
        W2["NER Worker"]
        W3["Classification Worker"]
        W4["Malware Scan Worker"]
    end

    FRONTEND -->|"REST API (HTTPS)"| BACKEND
    BACKEND -->|"gRPC / REST"| CRYPTO
    BACKEND -->|"Redis Queue"| WORKERS
```

---

## 3. DATA FLOW DIAGRAMS

### 3.1 Document Upload Flow (Critical Path)

```mermaid
sequenceDiagram
    actor IO as Investigating Officer
    participant FE as Frontend (Next.js)
    participant GW as Nginx Gateway
    participant API as FastAPI Server
    participant VAL as File Validator
    participant AV as Malware Scanner
    participant STRIP as EXIF Stripper
    participant CRYPTO as Go Crypto Service
    participant VAULT as Key Vault (KMS)
    participant S3 as MinIO / S3
    participant PG as PostgreSQL
    participant Q as Celery Queue
    participant AI as AI Workers

    IO->>FE: Select file + fill metadata
    FE->>GW: POST /api/v1/documents/upload (multipart + JWT)
    GW->>GW: TLS decrypt + Rate limit check
    GW->>API: Forward (verified)

    API->>API: JWT verify (RS256) + ABAC policy check
    Note over API: Is user.role=IO?<br/>Is case assigned to this IO?<br/>Is case status ACTIVE?

    API->>VAL: Validate file
    VAL->>VAL: Check magic bytes (not just extension)
    VAL->>VAL: Check size ≤ 50MB
    VAL->>VAL: Whitelist MIME type
    VAL-->>API: ✅ Valid

    API->>AV: Scan for malware
    AV-->>API: ✅ Clean

    API->>STRIP: Strip EXIF metadata
    STRIP->>STRIP: Extract GPS, device info → store separately
    STRIP->>STRIP: Remove all metadata from file
    STRIP-->>API: Cleaned file

    API->>CRYPTO: POST /hash (file bytes)
    CRYPTO->>CRYPTO: SHA-256(file) → hash
    CRYPTO->>CRYPTO: Insert hash as Merkle leaf
    CRYPTO->>CRYPTO: Recompute Merkle root
    CRYPTO-->>API: {hash, merkle_leaf_id, merkle_proof}

    API->>VAULT: Request new DEK
    VAULT->>VAULT: Generate AES-256-GCM key (DEK)
    VAULT->>VAULT: Encrypt DEK with current KEK
    VAULT-->>API: {encrypted_dek, kek_version}

    API->>API: Encrypt file with DEK (AES-256-GCM)
    API->>S3: Store encrypted blob
    S3-->>API: blob_path

    API->>PG: INSERT into documents table
    Note over PG: doc_id, case_id, hash,<br/>encrypted_blob_path,<br/>encrypted_dek, kek_version,<br/>merkle_leaf_id, custody_chain

    API->>PG: INSERT into audit_log
    Note over PG: action=DOCUMENT_UPLOADED<br/>user_id, case_id, doc_id<br/>ip, device_hash, timestamp

    API->>Q: Queue background tasks
    Q->>AI: OCR Task (extract text)
    Q->>AI: NER Task (detect PII entities)
    Q->>AI: Classification Task (auto-tag doc type)

    API-->>FE: 201 Created {doc_id, hash, status: "processing"}
    FE-->>IO: ✅ "Document uploaded & secured. AI processing..."

    Note over AI: Background processing completes
    AI->>PG: UPDATE documents SET ocr_text, ai_tags, ocr_confidence
    AI->>FE: WebSocket notification: "Processing complete"
```

### 3.2 Document Verification Flow (Tamper Detection)

```mermaid
sequenceDiagram
    actor USER as Any Authorized User
    participant FE as Frontend
    participant API as FastAPI
    participant S3 as MinIO / S3
    participant VAULT as Key Vault
    participant CRYPTO as Go Crypto Service
    participant PG as PostgreSQL
    participant POLYGON as Polygon Blockchain

    USER->>FE: Click "Verify Integrity" on document
    FE->>API: GET /api/v1/documents/{id}/verify

    API->>PG: Fetch document record (hash, merkle_leaf_id)
    PG-->>API: {stored_hash, encrypted_dek, blob_path, merkle_leaf_id}

    API->>S3: Download encrypted blob
    S3-->>API: encrypted_file

    API->>VAULT: Decrypt DEK
    VAULT-->>API: plaintext_dek

    API->>API: Decrypt file with DEK
    API->>API: Compute SHA-256 of decrypted file → current_hash

    alt current_hash == stored_hash
        API->>CRYPTO: GET /merkle/verify/{leaf_id}
        CRYPTO->>PG: Fetch Merkle leaf + path to root
        CRYPTO->>CRYPTO: Recompute root from leaf
        CRYPTO->>PG: Fetch latest anchor record
        
        alt Computed root matches anchored root
            CRYPTO->>POLYGON: Verify on-chain anchor
            POLYGON-->>CRYPTO: ✅ Anchor confirmed
            CRYPTO-->>API: ✅ FULLY VERIFIED (file + tree + blockchain)
            API-->>FE: 🟢 VERIFIED AUTHENTIC
            Note over FE: "Document integrity confirmed.<br/>Hash: a3f8c2...<br/>Merkle root anchored on Polygon<br/>Tx: 0x7a2b..."
        else Root mismatch
            CRYPTO-->>API: ⚠️ TREE INCONSISTENCY
            API->>PG: INSERT audit_log (TAMPER_DETECTED)
            API-->>FE: 🟡 WARNING: Merkle tree inconsistency
        end
    else current_hash ≠ stored_hash
        API->>PG: INSERT audit_log (TAMPER_DETECTED)
        API->>API: Quarantine document (status → QUARANTINED)
        API->>REDIS: Publish alert to admin channel
        API-->>FE: 🔴 TAMPERED — INTEGRITY VIOLATION
        Note over FE: "ALERT: Document has been modified!<br/>Expected: a3f8c2...<br/>Found: 9e1d4b...<br/>Document quarantined. Admin notified."
    end
```

### 3.3 AI Redaction Flow (Women Safety / POCSO)

```mermaid
sequenceDiagram
    actor IO as Investigating Officer
    participant FE as Frontend
    participant API as FastAPI
    participant PG as PostgreSQL
    participant NER as spaCy NER Model
    participant REGEX as Regex Engine

    IO->>FE: Click "Auto-Redact" on POCSO case document
    FE->>API: POST /api/v1/redaction/{doc_id}/analyze

    API->>PG: Fetch document OCR text
    PG-->>API: ocr_text (extracted text)

    par Run NER Model
        API->>NER: Process text with spaCy
        NER->>NER: Detect PERSON, GPE, ORG entities
        NER-->>API: entities[] with confidence scores
    and Run Regex Patterns
        API->>REGEX: Match Indian patterns
        REGEX->>REGEX: Aadhaar: XXXX-XXXX-XXXX
        REGEX->>REGEX: Phone: 10-digit
        REGEX->>REGEX: PAN: ABCDE1234F
        REGEX-->>API: regex_matches[]
    end

    API->>API: Merge NER entities + regex matches
    API->>API: Classify: VICTIM_PII vs ACCUSED vs WITNESS
    API->>API: Flag low-confidence (<85%) for mandatory review

    API-->>FE: {suggestions[], confidence_scores[]}

    FE->>FE: Render redaction preview with highlights
    Note over FE: Yellow = AI suggested redaction<br/>Red border = Low confidence (manual review needed)<br/>Green = Keep (accused name, public info)

    IO->>FE: Review, adjust, and click "Approve Redaction"
    FE->>API: POST /api/v1/redaction/{doc_id}/approve {confirmed_redactions[]}

    API->>API: Generate redacted copy (blackout confirmed PII)
    API->>PG: Store redacted copy metadata
    API->>PG: INSERT audit_log (REDACTION_APPROVED, approved_by: IO)
    API-->>FE: ✅ Redacted copy generated

    Note over API: TWO copies now exist:<br/>1. MASTER (full, encrypted, TOP_SECRET)<br/>2. REDACTED (for court filings, defense, RTI)
```

### 3.4 Multi-Agency Document Transfer Flow

```mermaid
sequenceDiagram
    actor IO as Investigating Officer (Police)
    participant API as FastAPI
    participant PG as PostgreSQL
    participant CRYPTO as Go Crypto Service
    actor FSL as FSL Scientist (Forensics)
    actor PP as Public Prosecutor
    actor JUDGE as Magistrate / Judge

    Note over IO,JUDGE: PHASE 1: Police → Forensic Lab

    IO->>API: POST /documents/{id}/forward {target: FSL_DELHI, reason: "DNA analysis needed"}
    API->>API: Verify IO is custodian + case is UNDER_INVESTIGATION
    API->>PG: UPDATE document SET current_custodian = FSL_SCIENTIST_ID
    API->>PG: APPEND to custody_chain [{from: IO, to: FSL, timestamp, reason}]
    API->>CRYPTO: Generate custody transfer hash
    CRYPTO-->>API: transfer_hash (signed)
    API->>PG: INSERT audit_log (CUSTODY_TRANSFERRED)
    API-->>FSL: 📩 Notification: "Evidence assigned to you for Case 142/2026"

    FSL->>API: GET /documents/{id}/view (watermarked, logged)
    FSL->>API: POST /documents/upload {case_id, type: FORENSIC_REPORT, parent_doc: evidence_id}
    API->>CRYPTO: Hash + Merkle insert for forensic report
    API->>PG: Link forensic report to original evidence
    API-->>IO: 📩 "Forensic report ready for Case 142/2026"

    Note over IO,JUDGE: PHASE 2: Police → Prosecutor

    IO->>API: POST /cases/{id}/status {status: CHARGESHEET_FILED}
    API->>API: Requires DUAL AUTHORIZATION (IO + SHO)
    API->>PG: UPDATE case status
    API->>API: Compile charge sheet document index
    API-->>PP: 📩 "Charge sheet filed for Case 142/2026 — review case bundle"

    PP->>API: GET /cases/{id}/bundle (all docs + integrity status)
    PP->>API: POST /certs/{doc_id} (generate Sec 65B certificate per document)

    Note over IO,JUDGE: PHASE 3: Prosecutor → Court

    PP->>API: POST /cases/{id}/court-submit
    API->>API: Generate complete court bundle PDF
    API->>CRYPTO: Verify ALL document hashes in the case
    CRYPTO-->>API: {all_verified: true, merkle_root, polygon_tx}
    API->>PG: Mark all docs as is_court_submitted = true
    API-->>JUDGE: 📩 "Verified case bundle ready for Case 142/2026"

    JUDGE->>API: GET /cases/{id}/bundle (read-only, verification badges visible)
    Note over JUDGE: Each document shows:<br/>🟢 VERIFIED + hash + Merkle proof<br/>📋 Chain of custody trail<br/>📄 Sec 65B certificate attached
```

### 3.5 BSA 2023 / Sec 65B Certificate Generation Flow

```mermaid
sequenceDiagram
    actor PP as Public Prosecutor
    participant FE as Frontend
    participant API as FastAPI
    participant CRYPTO as Go Crypto Service
    participant PG as PostgreSQL
    participant POLYGON as Polygon
    participant PDF as ReportLab PDF Engine
    participant ESIGN as Aadhaar eSign API

    PP->>FE: Click "Generate Sec 65B Certificate" on document
    FE->>API: POST /api/v1/certs/{doc_id}

    API->>PG: Fetch document metadata
    PG-->>API: {hash, upload_date, uploaded_by, device_info, custody_chain}

    API->>CRYPTO: GET /merkle/verify/{leaf_id}
    CRYPTO->>POLYGON: Verify anchored root
    POLYGON-->>CRYPTO: ✅ Anchor confirmed at block #12345678
    CRYPTO-->>API: {verified: true, merkle_root, polygon_tx, anchor_time}

    API->>PDF: Generate certificate PDF
    Note over PDF: CERTIFICATE UNDER SEC 65B<br/>BHARATIYA SAKSHYA ADHINIYAM 2023<br/><br/>Document: FIR_142_2026.pdf<br/>SHA-256: a3f8c244e9...<br/>Algorithm: SHA-256<br/>Uploaded: 15/06/2026 10:32:00 IST<br/>Uploaded By: Insp. Rajesh Kumar (DL-4821)<br/>Source Device: Dell Latitude 5540<br/>Merkle Root: 7b2e91f3a8...<br/>Blockchain Anchor: Polygon Tx 0x7a2b...<br/>Custodian: PP Arun Singh (DL-PP-291)<br/><br/>I hereby certify that the above<br/>electronic record is authentic and<br/>has not been altered since creation.

    PDF-->>API: cert_pdf_bytes

    API->>ESIGN: Request digital signature (Aadhaar eSign)
    ESIGN-->>API: Signed certificate

    API->>PG: INSERT into evidence_certificates
    API->>PG: UPDATE document SET sec_65b_cert_id
    API->>PG: INSERT audit_log (CERT_GENERATED)

    API-->>FE: ✅ Certificate generated + signed
    FE-->>PP: Download/view Sec 65B certificate PDF
```

---

## 4. DATABASE ENTITY-RELATIONSHIP DIAGRAM

```mermaid
erDiagram
    USERS ||--o{ CASES : "creates/assigned"
    USERS ||--o{ DOCUMENTS : "uploads"
    USERS ||--o{ AUDIT_LOG : "generates"
    USERS ||--o{ EVIDENCE_CERTS : "signs"

    CASES ||--o{ DOCUMENTS : "contains"
    CASES ||--o{ CASE_PERSONNEL : "has assigned"
    CASES }o--|| USERS : "IO assigned"
    CASES }o--|| USERS : "SHO assigned"

    DOCUMENTS ||--o| MERKLE_LEAVES : "hashed in"
    DOCUMENTS ||--o| EVIDENCE_CERTS : "certified by"
    DOCUMENTS ||--o{ CUSTODY_TRANSFERS : "tracked via"
    DOCUMENTS ||--o| REDACTED_COPIES : "has redacted version"

    MERKLE_LEAVES }o--|| MERKLE_ANCHORS : "rolled up to"

    USERS {
        uuid user_id PK
        varchar badge_number UK
        varchar full_name
        varchar email UK
        varchar password_hash
        varchar role
        varchar rank
        varchar station_code
        varchar jurisdiction
        varchar phone
        jsonb allowed_ip_ranges
        jsonb duty_hours
        boolean mfa_enabled
        varchar mfa_secret
        boolean is_active
        timestamp created_at
    }

    CASES {
        uuid case_id PK
        varchar fir_number
        varchar police_station_code
        varchar district
        varchar state_code
        jsonb applicable_sections
        varchar case_category
        varchar sensitivity_level
        boolean is_pocso
        boolean is_women_safety
        uuid io_user_id FK
        uuid sho_user_id FK
        uuid prosecutor_id FK
        uuid judge_id FK
        varchar status
        timestamp fir_date
        timestamp created_at
        timestamp sealed_at
    }

    DOCUMENTS {
        uuid document_id PK
        uuid case_id FK
        varchar doc_type
        varchar title
        text description
        varchar encrypted_blob_path
        bytea dek_encrypted
        integer kek_version
        varchar mime_type
        bigint file_size_bytes
        char sha256_hash
        uuid merkle_leaf_id FK
        boolean has_redacted_copy
        uuid redaction_approved_by FK
        text ocr_text
        varchar ocr_language
        decimal ocr_confidence
        jsonb ai_tags
        uuid uploaded_by FK
        uuid current_custodian FK
        jsonb custody_chain
        varchar status
        boolean is_court_submitted
        uuid sec_65b_cert_id FK
        timestamp created_at
    }

    AUDIT_LOG {
        uuid log_id PK
        varchar action
        uuid user_id FK
        varchar user_role
        varchar user_badge
        uuid case_id FK
        uuid document_id FK
        uuid target_user_id FK
        inet ip_address
        varchar device_fingerprint
        decimal geo_latitude
        decimal geo_longitude
        char previous_log_hash
        char current_log_hash
        timestamp created_at
        boolean ntp_verified
    }

    MERKLE_LEAVES {
        uuid leaf_id PK
        char document_hash
        char leaf_hash
        integer tree_level
        char parent_hash
        char merkle_root
        timestamp created_at
    }

    MERKLE_ANCHORS {
        uuid anchor_id PK
        char merkle_root
        varchar anchor_target
        text anchor_proof
        integer documents_count
        timestamp anchored_at
    }

    EVIDENCE_CERTS {
        uuid cert_id PK
        uuid document_id FK
        uuid case_id FK
        char document_hash
        varchar hash_algorithm
        text source_device
        varchar custodian_name
        varchar custodian_badge
        char merkle_root_at_time
        boolean integrity_verified
        uuid signed_by FK
        text digital_signature
        varchar cert_pdf_path
        timestamp generated_at
    }

    CASE_PERSONNEL {
        uuid id PK
        uuid case_id FK
        uuid user_id FK
        varchar role_in_case
        timestamp assigned_at
        timestamp removed_at
    }

    CUSTODY_TRANSFERS {
        uuid transfer_id PK
        uuid document_id FK
        uuid from_user_id FK
        uuid to_user_id FK
        varchar reason
        char transfer_hash
        timestamp transferred_at
    }

    REDACTED_COPIES {
        uuid redacted_id PK
        uuid original_doc_id FK
        varchar redacted_blob_path
        jsonb redacted_entities
        uuid approved_by FK
        timestamp created_at
    }
```

---

## 5. AUTHENTICATION & AUTHORIZATION SEQUENCE

```mermaid
sequenceDiagram
    actor OFFICER as Police Officer
    participant FE as Frontend
    participant API as FastAPI
    participant PG as PostgreSQL
    participant REDIS as Redis
    participant SMS as NIC SMS Gateway
    participant VAULT as Key Vault

    OFFICER->>FE: Enter Badge Number + Password
    FE->>API: POST /auth/login {badge: "DL-4821", password: "***"}

    API->>PG: SELECT * FROM users WHERE badge_number = 'DL-4821'
    PG-->>API: user_record

    API->>API: bcrypt.verify(password, user.password_hash)

    alt Password Invalid
        API->>PG: INSERT audit_log (LOGIN_FAILED)
        API->>REDIS: INCREMENT failed_attempts:DL-4821
        Note over REDIS: If failed_attempts > 5<br/>→ Lock account 30 min
        API-->>FE: 401 Unauthorized
    else Password Valid
        API->>API: Generate MFA challenge
        API->>SMS: Send OTP to user.phone
        SMS-->>OFFICER: 📱 SMS: "Your OTP is 847291"
        API->>REDIS: SET mfa_pending:DL-4821 = {otp_hash, expires: 5min}
        API-->>FE: 200 {mfa_required: true, session_token: "temp_xxx"}
    end

    OFFICER->>FE: Enter OTP: 847291
    FE->>API: POST /auth/mfa/verify {session: "temp_xxx", otp: "847291"}

    API->>REDIS: GET mfa_pending:DL-4821
    API->>API: Verify OTP hash + not expired

    alt OTP Valid
        API->>API: Capture device fingerprint
        Note over API: Browser hash + IP + geo
        API->>VAULT: Sign JWT with RSA private key
        Note over VAULT: JWT Payload:<br/>{userId, role: "IO",<br/>stationCode: "DL-SN-01",<br/>jurisdiction: "SOUTH_DELHI",<br/>assignedCases: [...],<br/>deviceHash: "abc123",<br/>exp: +15min}
        VAULT-->>API: Signed JWT (RS256)

        API->>REDIS: SET session:user_id = {refresh_token, device_hash, login_time}
        API->>PG: INSERT audit_log (LOGIN, ip, device, geo)

        API-->>FE: 200 {access_token: "eyJ...", expires_in: 900}
        Note over FE: Access token in memory<br/>Refresh token in HttpOnly cookie
    else OTP Invalid
        API->>PG: INSERT audit_log (MFA_FAILED)
        API-->>FE: 401 Invalid OTP
    end

    Note over FE,API: SUBSEQUENT API REQUESTS

    FE->>API: GET /cases (Authorization: Bearer eyJ...)
    API->>API: Verify JWT signature (RS256 public key)
    API->>API: Check token not expired
    API->>API: Check token not in blacklist (Redis)
    API->>API: ABAC Policy Check
    Note over API: ✓ role = IO<br/>✓ stationCode matches request scope<br/>✓ IP in allowedRanges<br/>✓ deviceHash matches<br/>✓ within duty hours<br/>✓ anomaly score < threshold
    API->>PG: SELECT cases WHERE station_code = user.station_code
    API-->>FE: 200 {cases: [...]}
```

---

## 6. CACHING & PERFORMANCE ARCHITECTURE

```mermaid
graph TB
    subgraph REQUEST["Incoming Request"]
        REQ["GET /cases/uuid-123"]
    end

    subgraph CACHE_LAYERS["Cache Layers (fastest → slowest)"]
        L1["🟢 L1: Redis Cache<br/>(TTL: 60s for case metadata)<br/>(TTL: 0 for audit logs — never cache)"]
        L2["🟡 L2: PostgreSQL Connection Pool<br/>(pgBouncer: 100 connections)"]
        L3["🟠 L3: Elasticsearch<br/>(for search queries only)"]
        L4["🔴 L4: S3 / MinIO<br/>(for document blob retrieval)"]
    end

    REQ --> L1
    L1 -->|"Cache HIT"| RESPONSE["Return cached data"]
    L1 -->|"Cache MISS"| L2
    L2 --> DB_QUERY["PostgreSQL Query"]
    DB_QUERY --> POPULATE["Populate Redis cache"]
    POPULATE --> RESPONSE

    style L1 fill:#22c55e,color:#000
    style L2 fill:#eab308,color:#000
    style L3 fill:#f97316,color:#000
    style L4 fill:#ef4444,color:#000
```

### What Gets Cached vs What NEVER Gets Cached

| Data | Cached? | TTL | Reason |
|---|---|---|---|
| Case metadata (title, status, station) | ✅ Redis | 60 seconds | Read-heavy, changes rarely |
| Document metadata (title, hash, type) | ✅ Redis | 60 seconds | Read-heavy |
| User profile + role | ✅ Redis | 5 minutes | Rarely changes |
| JWT blacklist | ✅ Redis | Token expiry time | Must be instant |
| Rate limit counters | ✅ Redis | Per window (1 min) | Must be fast |
| **Audit logs** | ❌ NEVER | — | Security critical — always read from DB |
| **Document content (blobs)** | ❌ NEVER | — | Too large + must be decrypted per-request |
| **Merkle proofs** | ❌ NEVER | — | Must be computed fresh for verification |

---

## 7. MESSAGE QUEUE & BACKGROUND TASK ARCHITECTURE

```mermaid
graph LR
    subgraph PRODUCER["API Server (FastAPI)"]
        UP["Document Upload Handler"]
        RED["Redaction Request Handler"]
        ANC["Hourly Anchor Scheduler"]
    end

    subgraph BROKER["Redis (Message Broker)"]
        Q1["🔵 ocr_queue<br/>(priority: medium)"]
        Q2["🟣 ner_queue<br/>(priority: medium)"]
        Q3["🟡 anchor_queue<br/>(priority: low)"]
        Q4["🔴 scan_queue<br/>(priority: high)"]
    end

    subgraph WORKERS["Celery Workers"]
        W1["OCR Worker ×2<br/>(CPU intensive)"]
        W2["NER Worker ×2<br/>(GPU optional)"]
        W3["Anchor Worker ×1<br/>(network I/O)"]
        W4["Scan Worker ×1<br/>(ClamAV)"]
    end

    subgraph RESULTS["Result Backend"]
        REDIS_R["Redis<br/>(task results)"]
    end

    UP --> Q1
    UP --> Q2
    UP --> Q4
    RED --> Q2
    ANC --> Q3

    Q1 --> W1
    Q2 --> W2
    Q3 --> W3
    Q4 --> W4

    W1 --> REDIS_R
    W2 --> REDIS_R
    W3 --> REDIS_R
    W4 --> REDIS_R

    REDIS_R -->|"WebSocket notification"| PRODUCER
```

---

## 8. OFFLINE-FIRST PWA SYNC STRATEGY

```mermaid
sequenceDiagram
    actor IO as IO at Rural Station
    participant PWA as PWA (Service Worker)
    participant IDB as IndexedDB (Local)
    participant API as FastAPI (Remote)

    Note over IO,API: SCENARIO: No internet at crime scene

    IO->>PWA: Upload crime scene photo + notes
    PWA->>PWA: Check navigator.onLine → false
    PWA->>IDB: Store locally with timestamp
    Note over IDB: {file: blob, metadata: {...},<br/>status: PENDING_SYNC,<br/>local_hash: sha256(file),<br/>created_offline: true}
    PWA-->>IO: ✅ "Saved offline. Will sync when online."

    IO->>PWA: Upload 2 more photos
    PWA->>IDB: Queue all 3 documents

    Note over IO,API: Later: IO returns to station (internet available)

    PWA->>PWA: Service Worker detects online
    PWA->>PWA: Background Sync API triggers

    loop For each PENDING_SYNC document
        PWA->>API: POST /documents/upload (with offline_timestamp)
        API->>API: Full ingestion pipeline (validate → hash → encrypt → store)
        API-->>PWA: {doc_id, server_hash, status: "uploaded"}
        PWA->>IDB: UPDATE status = SYNCED, server_doc_id = doc_id
    end

    PWA-->>IO: 📩 "3 documents synced successfully"

    Note over PWA: Conflict Resolution:<br/>If server rejects (duplicate hash) → mark as CONFLICT<br/>If network fails mid-sync → retry with exponential backoff<br/>Local copies retained until server confirms
```

---

## 9. SECURITY THREAT MODEL

```mermaid
graph TB
    subgraph THREATS["⚔️ THREAT ACTORS"]
        T1["🔴 External Hacker<br/>(SQLi, XSS, DDoS)"]
        T2["🟠 Insider Threat<br/>(Corrupt Officer)"]
        T3["🟡 Defense Lawyer<br/>(Challenges evidence integrity)"]
        T4["🟣 Network Attacker<br/>(MITM on police network)"]
        T5["⚫ Supply Chain<br/>(Compromised npm/pip package)"]
    end

    subgraph DEFENSES["🛡️ DEFENSES"]
        D1["WAF + Rate Limiting + CSP"]
        D2["ABAC + Anomaly Detection + Break-Glass Audit"]
        D3["Merkle Proof + Polygon Anchor + Sec 65B Cert"]
        D4["TLS 1.3 + mTLS + Certificate Pinning"]
        D5["Lockfile integrity + npm audit + minimal deps"]
    end

    T1 -->|"Attacks"| D1
    T2 -->|"Attacks"| D2
    T3 -->|"Challenges"| D3
    T4 -->|"Attacks"| D4
    T5 -->|"Attacks"| D5

    D1 -->|"Mitigates"| SAFE["🟢 System Secure"]
    D2 -->|"Mitigates"| SAFE
    D3 -->|"Proves"| SAFE
    D4 -->|"Mitigates"| SAFE
    D5 -->|"Mitigates"| SAFE
```

---

## 10. DEPLOYMENT & DISASTER RECOVERY

```mermaid
graph TB
    subgraph PRIMARY["🟢 PRIMARY REGION (AWS ap-south-1 Mumbai)"]
        ALB1["Application Load Balancer"]
        ECS1["ECS Cluster<br/>(Frontend + API + Workers)"]
        RDS1["RDS PostgreSQL<br/>(Multi-AZ Primary)"]
        REDIS1["ElastiCache Redis<br/>(Primary)"]
        S31["S3 Bucket<br/>(Encrypted Documents)"]
    end

    subgraph DR["🟡 DR REGION (AWS ap-south-2 Hyderabad)"]
        ALB2["Application Load Balancer<br/>(Standby)"]
        ECS2["ECS Cluster<br/>(Standby - scaled to 0)"]
        RDS2["RDS PostgreSQL<br/>(Read Replica → Promote on failover)"]
        REDIS2["ElastiCache Redis<br/>(Replica)"]
        S32["S3 Bucket<br/>(Cross-Region Replication)"]
    end

    subgraph MONITORING["📊 MONITORING"]
        CW["CloudWatch<br/>(Metrics + Alarms)"]
        SENTRY["Sentry<br/>(Error Tracking)"]
        PAGER["PagerDuty / SNS<br/>(Incident Alerts)"]
    end

    RDS1 -->|"Async Replication"| RDS2
    S31 -->|"Cross-Region Replication"| S32
    REDIS1 -->|"Global Datastore"| REDIS2

    PRIMARY -->|"Health Check Fails"| ROUTE53["Route53<br/>DNS Failover"]
    ROUTE53 -->|"Auto-switch traffic"| DR

    PRIMARY --> CW
    DR --> CW
    CW --> PAGER

    style PRIMARY fill:#22c55e20,stroke:#22c55e
    style DR fill:#eab30820,stroke:#eab308
```

### Recovery Objectives

| Metric | Target | Method |
|---|---|---|
| **RPO (Recovery Point Objective)** | ≤ 1 hour | Async DB replication + S3 cross-region sync |
| **RTO (Recovery Time Objective)** | ≤ 4 hours | DNS failover + promote read replica + scale ECS |
| **Backup Frequency** | Every 6 hours | Automated RDS snapshots + S3 versioning |
| **Backup Retention** | 90 days (CERT-In: 180 days for logs) | Lifecycle policies with Glacier archival |
| **Backup Encryption** | AES-256 with separate backup KEK | AWS KMS with cross-account key |

---

## 11. MONITORING & OBSERVABILITY

```mermaid
graph LR
    subgraph APP["Application"]
        API["FastAPI"]
        GO["Go Crypto"]
        CELERY["Celery"]
    end

    subgraph COLLECT["Collection"]
        PROM["Prometheus<br/>(Metrics Scraping)"]
        LOKI["Loki<br/>(Log Aggregation)"]
        JAEGER["Jaeger<br/>(Distributed Tracing)"]
    end

    subgraph VISUALIZE["Visualization"]
        GRAFANA["Grafana Dashboard<br/>(Unified View)"]
    end

    subgraph ALERT["Alerting"]
        SENTRY["Sentry<br/>(Error Tracking)"]
        SLACK["Slack / Email<br/>(Incident Notifications)"]
    end

    API --> PROM
    GO --> PROM
    CELERY --> PROM

    API --> LOKI
    GO --> LOKI
    CELERY --> LOKI

    API --> JAEGER

    PROM --> GRAFANA
    LOKI --> GRAFANA
    JAEGER --> GRAFANA

    API --> SENTRY
    GRAFANA -->|"Alert Rules"| SLACK
    SENTRY --> SLACK
```

### Key Metrics to Track

| Metric | Source | Alert Threshold |
|---|---|---|
| API response time (p95) | Prometheus | > 500ms |
| Failed login attempts per user | Redis counter | > 5 in 10 min |
| Document integrity check failures | Audit log | Any occurrence |
| Celery task queue depth | Prometheus | > 100 pending |
| Database connection pool usage | pgBouncer | > 80% |
| S3 storage usage | CloudWatch | > 80% capacity |
| Anomalous access patterns | Custom detector | Score > threshold |

---

> [!IMPORTANT]
> This system design covers every component, every data flow, every security layer, and every failure scenario. Review the diagrams and flows — once approved, we begin scaffolding code in your workspace.
