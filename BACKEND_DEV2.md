# 👩‍💻 HEY DEV 2 — YOUR BACKEND ASSIGNMENT

**Project:** Nyay Suraksha — SIH 2026 (PS #190)
**Your Role:** App & Auth Engine Developer
**Partner:** Divya (Crypto & Integrity Engine)

> **READ THIS FULLY BEFORE WRITING A SINGLE LINE OF CODE.**

---

## Step 0 — Wait For Divya First

Before you start, Divya will push:
- `backend/main.go` — the HTTP server & router
- `backend/go.mod` — Go module file
- `backend/db/db.go` — PostgreSQL connection pool
- `backend/db/schema.sql` — All database tables

**Pull her code first. Register your routes on her router in `main.go`. Do not create your own `main.go`.**

---

## Your Folder

You own everything inside `backend/app/`:

```
backend/
└── app/
    ├── auth.go          ← START HERE
    ├── cases.go
    ├── documents.go
    ├── storage.go
    ├── custody.go
    ├── audit.go
    └── redaction.go
```

---

## Your API Endpoints (Build in This Exact Order)

### 1. `auth.go` — Authentication (Build First, Everything Else Needs This)

| Method | Endpoint | What It Does |
|---|---|---|
| POST | `/api/v1/auth/login` | Badge ID + password → return JWT token |
| POST | `/api/v1/auth/mfa/verify` | Verify 6-digit OTP → return full access token |
| POST | `/api/v1/auth/refresh` | Refresh expired JWT |
| POST | `/api/v1/auth/logout` | Blacklist token in Redis |

**How login works:**
1. Officer sends `badge_id` + `password`
2. You verify password using `bcrypt.CompareHashAndPassword`
3. Check their role from DB (`IO`, `FSL`, `PROSECUTOR`, `JUDGE`, `ADMIN`)
4. Send OTP via NIC SMS (for now just log it to console — mock it)
5. After OTP verified → return a signed JWT RS256 token with payload:
```json
{
  "user_id": "usr_abc123",
  "badge_id": "DL-4821",
  "role": "IO",
  "station": "Rohini District, Delhi",
  "exp": 1234567890
}
```

---

### 2. `cases.go` — Case Management

| Method | Endpoint | What It Does |
|---|---|---|
| POST | `/api/v1/cases` | Register a new FIR/case |
| GET | `/api/v1/cases` | List all cases (filtered by role) |
| GET | `/api/v1/cases/:id` | Get single case detail |
| PATCH | `/api/v1/cases/:id/status` | Update case status (Active → Charge Sheet → Trial → Closed) |

**Important rules:**
- IO can only see their own cases
- FSL can see cases where evidence has been transferred to them
- Prosecutor and Judge can see all cases assigned to them
- Admin sees everything

---

### 3. `storage.go` — MinIO File Storage Wrapper

This is NOT a route file. It's a helper used by `documents.go`.

**Functions to write:**
```go
func UploadFile(bucketName, objectKey string, fileReader io.Reader, fileSize int64) error
func DownloadFile(bucketName, objectKey string) (io.ReadCloser, error)
func DeleteFile(bucketName, objectKey string) error  // NOTE: disable in production (WORM)
```

MinIO runs locally on `localhost:9000`. Credentials from `config.go` (Divya sets these up).

---

### 4. `documents.go` — Document Metadata

| Method | Endpoint | What It Does |
|---|---|---|
| GET | `/api/v1/documents` | List documents (optionally filter by `?case_id=xxx`) |
| GET | `/api/v1/documents/:id` | Single document metadata |

**Note:** Document UPLOAD is handled by Divya's `/api/v1/evidence/upload` endpoint (she does hashing + Merkle + encryption). You just store and serve the metadata.

---

### 5. `custody.go` — Chain of Custody

| Method | Endpoint | What It Does |
|---|---|---|
| POST | `/api/v1/custody/transfer` | Initiate a custody transfer (IO → FSL or FSL → Prosecutor etc.) |
| GET | `/api/v1/custody/chain/:document_id` | Get full custody chain for one document |

**How transfer works (dual-handshake):**
1. Officer A calls `POST /custody/transfer` with `{document_id, to_officer_id}`
2. System creates a `custody_events` row with `signed_by_sender = true`
3. Officer B gets a notification
4. Officer B calls `POST /custody/transfer/accept/:transfer_id`
5. Row updated with `signed_by_receiver = true` → transfer complete

---

### 6. `audit.go` — Audit Trail & Notifications

| Method | Endpoint | What It Does |
|---|---|---|
| GET | `/api/v1/audit/logs` | Paginated list of all audit events (admin only) |
| GET | `/api/v1/notifications` | Notifications for the logged-in officer |
| PATCH | `/api/v1/notifications/:id/read` | Mark notification as read |

**Audit rule:** Every time any action happens (login, upload, transfer, view), write a row to the `audit_events` table. This table is **APPEND ONLY** — no UPDATE or DELETE ever.

---

### 7. `redaction.go` — PII Redaction Review Queue

| Method | Endpoint | What It Does |
|---|---|---|
| GET | `/api/v1/redaction/queue` | List documents pending PII review |
| GET | `/api/v1/redaction/:id` | Get detected PII entities for one document |
| POST | `/api/v1/redaction/:id/approve` | Approve redaction → seal the sanitized copy |
| POST | `/api/v1/redaction/:id/reject` | Reject → send back for re-review |

**PII detection (keep it simple for now):**
Use regex to detect:
- Aadhaar numbers: `\d{4}\s\d{4}\s\d{4}`
- Phone numbers: `[6-9]\d{9}`
- Names near keywords "victim", "survivor", "minor"

---

## Database Tables You Own

```sql
CREATE TABLE users (
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

CREATE TABLE cases (
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

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id),
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    storage_key VARCHAR(500),
    sha256_hash VARCHAR(64),
    merkle_leaf_id INTEGER,
    classification VARCHAR(30) DEFAULT 'CONFIDENTIAL',
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE custody_events (
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

CREATE TABLE notifications (
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

CREATE TABLE redaction_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id),
    detected_entities JSONB,
    status VARCHAR(20) DEFAULT 'PENDING',
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Go Packages You Need

```bash
go get github.com/gin-gonic/gin
go get github.com/golang-jwt/jwt/v5
go get github.com/pquerna/otp/totp
go get github.com/redis/go-redis/v9
go get github.com/minio/minio-go/v7
go get github.com/lib/pq
go get golang.org/x/crypto/bcrypt
```

---

## Standard Response Format

```go
// Success
c.JSON(http.StatusOK, gin.H{
    "success": true,
    "data":    yourData,
    "error":   nil,
})

// Error
c.JSON(http.StatusBadRequest, gin.H{
    "success": false,
    "data":    nil,
    "error":   "Invalid badge ID or password",
})
```

---

## Git Workflow

```bash
git checkout -b dev/teammate-app

# Work only on backend/app/ — never touch main.go or crypto/

git add backend/app/
git commit -m "feat: add auth endpoints"
git push origin dev/teammate-app
```

---

## Done Checklist

- [ ] `POST /api/v1/auth/login` returns a JWT token
- [ ] `POST /api/v1/auth/mfa/verify` validates OTP
- [ ] `POST /api/v1/cases` creates a case in DB
- [ ] `GET /api/v1/cases` returns role-filtered list
- [ ] `POST /api/v1/custody/transfer` creates pending transfer
- [ ] `GET /api/v1/audit/logs` returns chronological event log
- [ ] `GET /api/v1/notifications` returns unread alerts

---

**Questions? Check `NYAY_SURAKSHA_MASTER_DOCUMENT.md` or ping Divya.**
