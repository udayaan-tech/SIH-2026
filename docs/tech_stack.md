# ⚡ NYAY SURAKSHA — FINAL TECH STACK SELECTION

## Design Principle
> **Every technology chosen must satisfy 3 criteria:**
> 1. **Used by real Indian Government systems** (NIC, CDAC, or MeitY projects) — so judges can't say "this won't work in gov"
> 2. **Production-grade & battle-tested** — not experimental, not a toy
> 3. **Your team can ship it in 7 days** — no 3-month learning curves

---

## THE STACK AT A GLANCE

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        न्याय सुरक्षा TECH STACK                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   FRONTEND          │  Next.js 14 (App Router) + TypeScript             │
│                     │  Tailwind CSS + shadcn/ui + Framer Motion         │
│                     │  PDF.js (sandboxed viewer) + Leaflet (India map)  │
│                     │  PWA (Service Worker for offline mode)            │
│─────────────────────┼─────────────────────────────────────────────────  │
│   BACKEND (APIs)    │  Python FastAPI (main API server)                 │
│                     │  Pydantic v2 (validation) + SQLAlchemy (ORM)      │
│                     │  Uvicorn + Gunicorn (ASGI production server)      │
│─────────────────────┼─────────────────────────────────────────────────  │
│   AI / ML ENGINE    │  Python spaCy (NER for PII detection)             │
│                     │  Tesseract OCR (multilingual: en + hi + ta)       │
│                     │  HuggingFace Transformers (fallback NER model)    │
│─────────────────────┼─────────────────────────────────────────────────  │
│   DATABASE          │  PostgreSQL 16 (primary ACID-compliant DB)        │
│                     │  Redis 7 (session cache, rate limiting, pub/sub)  │
│                     │  Elasticsearch 8 (full-text search across docs)   │
│─────────────────────┼─────────────────────────────────────────────────  │
│   FILE STORAGE      │  MinIO (S3-compatible object storage)             │
│                     │  or AWS S3 (production deployment)                │
│─────────────────────┼─────────────────────────────────────────────────  │
│   CRYPTOGRAPHY      │  Python hashlib (SHA-256) + cryptography lib      │
│                     │  AES-256-GCM (envelope encryption)                │
│                     │  PyJWT + RS256 (asymmetric JWT signing)           │
│                     │  Custom Merkle tree implementation                │
│─────────────────────┼─────────────────────────────────────────────────  │
│   BLOCKCHAIN ANCHOR │  Polygon PoS (public chain for Merkle root)       │
│                     │  ethers.js / web3.py (minimal smart contract)     │
│─────────────────────┼─────────────────────────────────────────────────  │
│   INFRASTRUCTURE    │  Docker + Docker Compose (containerized)          │
│                     │  AWS ECS or EC2 (cloud deployment)                │
│                     │  Nginx (reverse proxy + TLS termination)          │
│                     │  GitHub Actions (CI/CD pipeline)                  │
│─────────────────────┼─────────────────────────────────────────────────  │
│   MONITORING        │  Prometheus + Grafana (metrics dashboard)         │
│                     │  Sentry (error tracking)                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## LAYER-BY-LAYER DEEP DIVE

---

### 🎨 LAYER 1: FRONTEND

#### Choice: **Next.js 14 (App Router) + TypeScript**

| Aspect | Detail |
|---|---|
| **Framework** | **Next.js 14** with App Router (React 18 Server Components) |
| **Language** | **TypeScript** (strict mode) — type safety prevents bugs at scale |
| **Styling** | **Tailwind CSS v3** — utility-first, rapid development, consistent design |
| **Component Library** | **shadcn/ui** — beautifully designed, accessible, customizable components |
| **Animations** | **Framer Motion** — smooth page transitions, micro-animations |
| **Icons** | **Lucide React** — clean, consistent icon set (MIT licensed) |
| **Charts** | **Recharts** — for the national analytics dashboard |
| **Map** | **React Leaflet** + OpenStreetMap — India heat map (no Google Maps API cost) |
| **PDF Viewer** | **PDF.js** (Mozilla) — sandboxed canvas rendering (anti-XSS) |
| **Forms** | **React Hook Form + Zod** — validated, performant forms |
| **State** | **Zustand** — lightweight global state (auth, roles, case context) |
| **PWA** | **next-pwa** — service worker for offline mode at rural stations |
| **i18n** | **next-intl** — English ↔ Hindi toggle |

#### Why Next.js over plain React (Vite)?

| Feature | Vite + React | Next.js 14 |
|---|---|---|
| Server-Side Rendering (SSR) | ❌ Client-only | ✅ SSR + ISR + Streaming |
| API Routes | ❌ Need separate backend | ✅ Built-in API routes (middleware for auth) |
| SEO & Meta Tags | ❌ Manual | ✅ Built-in Metadata API |
| Image Optimization | ❌ Manual | ✅ next/image (auto WebP, lazy load) |
| Middleware (auth guard) | ❌ Manual | ✅ Edge middleware (runs before every request) |
| File-based Routing | ❌ Manual routing | ✅ Automatic |
| Gov Credibility | Basic | ✅ Used by gov.uk, India Stack sites, NIC portals |

> [!IMPORTANT]
> **Why shadcn/ui?** Unlike Material UI or Chakra, shadcn/ui gives you the actual component source code. You OWN it. No dependency lock-in. Judges love this because a government system should never depend on a third-party component library that could be deprecated.

---

### ⚙️ LAYER 2: BACKEND

#### Choice: **Python FastAPI**

| Aspect | Detail |
|---|---|
| **Framework** | **FastAPI** (latest) — async, type-safe, auto-generates OpenAPI docs |
| **ORM** | **SQLAlchemy 2.0** — async support, relationship mapping |
| **Validation** | **Pydantic v2** — request/response validation with zero boilerplate |
| **Auth** | **PyJWT** with **RS256** (RSA asymmetric signing) |
| **Password Hashing** | **bcrypt** (12 rounds via `passlib`) |
| **Server** | **Uvicorn** (ASGI) + **Gunicorn** (process manager) |
| **Task Queue** | **Celery + Redis** — background tasks (OCR, AI redaction, hash anchoring) |
| **File Handling** | **python-multipart** — secure file upload parsing |
| **Email/SMS** | **httpx** — async HTTP client for NIC SMS Gateway / email APIs |

#### Why FastAPI over Express.js (Node)?

| Criteria | Express.js (Node) | FastAPI (Python) |
|---|---|---|
| **AI/ML Integration** | Awkward — need to call Python scripts via subprocess or microservice | ✅ **Native** — spaCy, Tesseract, HuggingFace all run directly in the same process |
| **Type Safety** | Optional (TypeScript adds overhead) | ✅ Built-in via Pydantic + type hints |
| **Auto API Docs** | Need Swagger plugin | ✅ Auto-generated Swagger + ReDoc at `/docs` |
| **Performance** | Fast (V8) | ✅ Comparable — Uvicorn ASGI is one of the fastest Python servers |
| **Cryptography Libraries** | `crypto` module (OK) | ✅ `cryptography` lib (FIPS-certified primitives) |
| **Gov/Research Credibility** | Web-focused perception | ✅ Python = scientific/security credibility (NIST, CERT tools are Python) |

> [!TIP]
> **Judge Advantage**: When a judge asks "Why Python?", you say: *"Python is the standard language for cryptographic research (NIST reference implementations), AI/ML (our NER + OCR engines), and is used by CERT-In, CDAC, and NIC for security tooling. FastAPI gives us enterprise-grade async performance with built-in validation."*

#### API Architecture

```
/api/v1/
├── /auth/
│   ├── POST   /login              → Authenticate + issue JWT
│   ├── POST   /refresh            → Refresh access token
│   ├── POST   /logout             → Blacklist token
│   ├── POST   /mfa/verify         → Verify OTP/TOTP
│   └── POST   /break-glass        → Emergency access (dual auth)
│
├── /cases/
│   ├── GET    /                   → List cases (filtered by jurisdiction)
│   ├── POST   /                   → Create new case (IO only)
│   ├── GET    /{case_id}          → Get case details
│   ├── PATCH  /{case_id}/status   → Update case status (SHO+ only)
│   ├── GET    /{case_id}/timeline → Visual case timeline
│   └── POST   /{case_id}/assign   → Assign personnel to case
│
├── /documents/
│   ├── POST   /upload             → Upload + encrypt + hash + OCR
│   ├── GET    /{doc_id}           → Get document metadata
│   ├── GET    /{doc_id}/view      → Secure viewer (watermarked, logged)
│   ├── GET    /{doc_id}/verify    → Real-time integrity verification
│   ├── POST   /{doc_id}/forward   → Transfer custody to another agency
│   ├── GET    /{doc_id}/chain     → Full chain of custody
│   └── POST   /{doc_id}/cert     → Generate Sec 65B certificate
│
├── /redaction/
│   ├── POST   /{doc_id}/analyze   → Run AI NER → return PII suggestions
│   ├── POST   /{doc_id}/approve   → Human confirms redaction selections
│   └── GET    /{doc_id}/redacted  → Get redacted copy
│
├── /merkle/
│   ├── GET    /root               → Current Merkle root hash
│   ├── GET    /{doc_id}/proof     → Merkle proof for specific document
│   ├── POST   /anchor             → Anchor root to Polygon (admin)
│   └── GET    /anchors            → List all external anchor records
│
├── /analytics/
│   ├── GET    /national           → National dashboard stats
│   ├── GET    /state/{code}       → State-level breakdown
│   ├── GET    /alerts             → Recent security anomalies
│   └── GET    /integrity-score    → System-wide integrity percentage
│
└── /admin/
    ├── GET    /users              → User management
    ├── POST   /users              → Create user (admin only)
    ├── GET    /audit-log          → Browse audit trail
    └── GET    /system-health      → Server metrics
```

---

### 🧠 LAYER 3: AI / ML ENGINE

#### Choice: **spaCy + Tesseract OCR + HuggingFace (fallback)**

| Component | Technology | Purpose |
|---|---|---|
| **PII Detection (English)** | **spaCy** `en_core_web_trf` (Transformer-based) | Detect PERSON, GPE, PHONE, ADDRESS entities |
| **PII Detection (Hindi)** | **spaCy** custom trained model OR **ai4bharat/IndicNER** (HuggingFace) | Hindi named entity recognition |
| **OCR (Multilingual)** | **Tesseract OCR 5** via `pytesseract` | Extract text from scanned FIRs (eng + hin + tam) |
| **OCR Pre-processing** | **OpenCV** (`cv2`) | Deskew, denoise, binarize scanned images for better OCR accuracy |
| **Document Classification** | **scikit-learn** or **spaCy TextCategorizer** | Auto-classify: FIR vs Statement vs Forensic Report |
| **Regex Patterns** | Custom regex engine | Detect: Aadhaar (XXXX-XXXX-XXXX), Phone (10-digit), PAN, Case Numbers |

#### AI Pipeline Architecture

```
UPLOADED DOCUMENT
       │
       ▼
[Is it a scanned image/PDF?]
       │
  ┌────┴────┐
  YES       NO (already digital text)
  │         │
  ▼         ▼
[OpenCV]   [Extract text directly]
  │
  ▼
[Tesseract OCR]
  │ Language: auto-detect (eng/hin/tam)
  │ Confidence: 0-100 per page
  │
  ▼
[EXTRACTED TEXT]
       │
       ├──► [spaCy NER Model]
       │       │
       │       ▼
       │    Entities detected:
       │    • PERSON: "Priya Sharma" (94%)
       │    • PHONE: "9876543210" (99%)
       │    • ADDRESS: "42 Lajpat Nagar" (91%)
       │    • AADHAAR: "XXXX-XXXX-1234" (97%)
       │
       ├──► [Regex Engine]
       │       │
       │       ▼
       │    Patterns matched:
       │    • Case No: "FIR 142/2026"
       │    • Sections: "BNS 64, 70(1)"
       │    • Police Station: "PS Sarojini Nagar"
       │    • Date: "15/06/2026"
       │
       ├──► [Document Classifier]
       │       │
       │       ▼
       │    Predicted type: "FIR" (92% confidence)
       │
       └──► [COMBINED RESULTS → Stored as metadata]
```

> [!WARNING]
> **Critical Design Choice**: The AI engine runs as a **Celery background task**, NOT in the main API request thread. When a user uploads a document, they get an instant response ("Document uploaded, processing..."). The AI results appear within 30-60 seconds. This prevents the upload API from timing out on large documents.

---

### 🗄️ LAYER 4: DATABASE

#### Choice: **PostgreSQL 16 + Redis 7 + Elasticsearch 8**

```
┌──────────────────────────────────────────────────────────────────────┐
│                       DATABASE ARCHITECTURE                          │
│                                                                      │
│  ┌─────────────────────┐    ┌─────────────────────┐                 │
│  │  PostgreSQL 16      │    │  Redis 7             │                 │
│  │  (Primary Database) │    │  (Cache & Sessions)  │                 │
│  │                     │    │                      │                 │
│  │  • Cases table      │    │  • JWT blacklist     │                 │
│  │  • Documents table  │    │  • Session store     │                 │
│  │  • Users table      │    │  • Rate limit        │                 │
│  │  • Audit log        │    │    counters          │                 │
│  │  • Merkle tree      │    │  • Celery broker     │                 │
│  │  • Evidence certs   │    │  • Pub/Sub for       │                 │
│  │                     │    │    real-time notifs   │                 │
│  │  ACID compliant ✓   │    │                      │                 │
│  │  JSONB support  ✓   │    │  In-memory speed ✓   │                 │
│  │  Row-level security✓│    │  TTL auto-expiry ✓   │                 │
│  └─────────────────────┘    └─────────────────────┘                 │
│                                                                      │
│  ┌─────────────────────┐    ┌─────────────────────┐                 │
│  │  Elasticsearch 8    │    │  MinIO / AWS S3      │                 │
│  │  (Search Engine)    │    │  (Object Storage)    │                 │
│  │                     │    │                      │                 │
│  │  • Full-text search │    │  • Encrypted document│                 │
│  │    across all docs  │    │    blobs (AES-256)   │                 │
│  │  • Hindi + English  │    │  • Redacted copies   │                 │
│  │    analyzers        │    │  • Generated certs   │                 │
│  │  • Fuzzy matching   │    │  • OCR output cache  │                 │
│  │  • Aggregations for │    │                      │                 │
│  │    analytics dash   │    │  S3-compatible API ✓ │                 │
│  │                     │    │  Versioning support ✓│                 │
│  └─────────────────────┘    └─────────────────────┘                 │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

#### Why PostgreSQL (not MongoDB)?

| Criteria | MongoDB | PostgreSQL 16 |
|---|---|---|
| **ACID Transactions** | Limited (multi-doc txns are slower) | ✅ Full ACID — critical for legal records |
| **Data Integrity** | Schema-less = can store anything = can corrupt | ✅ Strict schema = data is always valid |
| **Row-Level Security** | ❌ Not native | ✅ Built-in RLS (enforce ABAC at DB level) |
| **JSONB** | Native JSON | ✅ JSONB with indexing (best of both worlds) |
| **Gov Adoption** | Rare in Indian gov | ✅ Used by NIC, CDAC, Aadhaar, DigiLocker |
| **Audit Prevention** | Can UPDATE/DELETE freely | ✅ We can REVOKE UPDATE/DELETE on audit tables |
| **Legal Standing** | "NoSQL document store" sounds flimsy in court | ✅ "ACID-compliant relational database" sounds bulletproof |

> [!IMPORTANT]
> **Judge Answer**: *"We chose PostgreSQL because Indian courts require ACID-compliant data storage for evidentiary integrity. NoSQL databases allow schema-less writes that could compromise data consistency. PostgreSQL's Row-Level Security lets us enforce access control at the database layer itself — even if the application layer is compromised."*

---

### 🔐 LAYER 5: CRYPTOGRAPHY

#### Choice: **Native Python `cryptography` library + Custom Merkle Tree**

| Function | Library / Method | Details |
|---|---|---|
| **Document Hashing** | `hashlib.sha256()` | Standard library — no external dependency |
| **Envelope Encryption (DEK)** | `cryptography.hazmat` — AES-256-GCM | Per-document unique key, authenticated encryption |
| **KEK Management** | `cryptography.fernet` OR HashiCorp Vault API | Key Encryption Key wraps all DEKs |
| **JWT Signing** | `PyJWT` with RS256 | Asymmetric — private key signs, public key verifies |
| **Password Hashing** | `passlib[bcrypt]` — 12 rounds | Industry standard, slow-by-design |
| **Merkle Tree** | Custom Python implementation | SHA-256 binary tree, proof generation, root anchoring |
| **Digital Signatures** | `cryptography.x509` + optional Aadhaar eSign API | For Sec 65B certificate signing |
| **TLS** | Nginx + Let's Encrypt (dev) / NIC CA (production) | TLS 1.3 enforced |

#### Why NOT a full blockchain (Hyperledger / Ethereum mainnet)?

| Full Blockchain | Our Approach: Merkle Tree + Polygon Anchoring |
|---|---|
| ❌ Massive infrastructure overhead | ✅ Lightweight — runs inside our existing backend |
| ❌ Slow writes (consensus delay) | ✅ Instant writes — just hash computation |
| ❌ Storage explosion (every node stores everything) | ✅ Only 32-byte root hash goes to Polygon |
| ❌ Judges will ask: "Who runs the nodes?" | ✅ We anchor to a PUBLIC chain — anyone can verify |
| ❌ Gas fees for every document | ✅ One anchor per hour = negligible cost (< ₹1/day on Polygon) |
| ❌ 3-month learning curve | ✅ Your team can build the Merkle tree in 1 day |

> [!TIP]
> **Judge Answer**: *"We don't put documents ON the blockchain — that's a common misconception and a waste of resources. We compute a cryptographic Merkle root of ALL documents and anchor just that single 32-byte hash to Polygon every hour. This gives us the immutability guarantee of a public blockchain without the performance, cost, or storage penalty. Even if our entire server is compromised, the externally anchored root on Polygon proves whether the data was altered."*

---

### ☁️ LAYER 6: INFRASTRUCTURE & DEVOPS

#### Choice: **Docker + AWS (ECS / RDS / S3)**

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    AWS DEPLOYMENT ARCHITECTURE                           │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                        AWS VPC (ap-south-1 Mumbai)                  │ │
│  │                                                                     │ │
│  │  ┌─────────────┐     ┌──────────────────────────────────────────┐  │ │
│  │  │  CloudFront  │     │  Public Subnet                          │  │ │
│  │  │  (CDN)       │────▶│                                          │  │ │
│  │  └─────────────┘     │  ┌──────────┐    ┌──────────┐            │  │ │
│  │                      │  │  ALB     │    │  Nginx   │            │  │ │
│  │                      │  │  (Load   │───▶│  (TLS    │            │  │ │
│  │                      │  │  Balancer)│    │  + WAF)  │            │  │ │
│  │                      │  └──────────┘    └────┬─────┘            │  │ │
│  │                      └───────────────────────┼──────────────────┘  │ │
│  │                                              │                     │ │
│  │  ┌───────────────────────────────────────────┼──────────────────┐  │ │
│  │  │  Private Subnet                           │                  │  │ │
│  │  │                                           ▼                  │  │ │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │  │ │
│  │  │  │  ECS Service │  │  ECS Service │  │  ECS Service │       │  │ │
│  │  │  │  FRONTEND    │  │  BACKEND API │  │  AI WORKER   │       │  │ │
│  │  │  │  (Next.js)   │  │  (FastAPI)   │  │  (Celery)    │       │  │ │
│  │  │  │  Port 3000   │  │  Port 8000   │  │  Background  │       │  │ │
│  │  │  └──────────────┘  └──────┬───────┘  └──────┬───────┘       │  │ │
│  │  │                           │                  │               │  │ │
│  │  │              ┌────────────┼──────────────────┤               │  │ │
│  │  │              ▼            ▼                  ▼               │  │ │
│  │  │  ┌──────────────┐  ┌──────────┐  ┌──────────────┐           │  │ │
│  │  │  │  RDS         │  │  Redis   │  │  Elasticsearch│           │  │ │
│  │  │  │  PostgreSQL  │  │  (Cache) │  │  (Search)     │           │  │ │
│  │  │  │  16          │  │          │  │               │           │  │ │
│  │  │  └──────────────┘  └──────────┘  └──────────────┘           │  │ │
│  │  │                                                              │  │ │
│  │  │  ┌──────────────┐  ┌──────────────┐                         │  │ │
│  │  │  │  S3 Bucket   │  │  AWS KMS     │                         │  │ │
│  │  │  │  (Encrypted  │  │  (Key Vault) │                         │  │ │
│  │  │  │   Documents) │  │  KEK storage │                         │  │ │
│  │  │  └──────────────┘  └──────────────┘                         │  │ │
│  │  └──────────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Region: ap-south-1 (Mumbai) — Data stays in India (DPDPA compliant)    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

#### Docker Compose (for local development & demo)

```yaml
# docker-compose.yml (simplified view)
services:
  frontend:          # Next.js 14
    build: ./frontend
    ports: ["3000:3000"]

  backend:           # FastAPI
    build: ./backend
    ports: ["8000:8000"]
    depends_on: [postgres, redis, elasticsearch]

  ai-worker:         # Celery worker (OCR + NER)
    build: ./backend
    command: celery -A app.celery worker
    depends_on: [redis]

  postgres:          # PostgreSQL 16
    image: postgres:16-alpine
    volumes: [pgdata:/var/lib/postgresql/data]

  redis:             # Redis 7
    image: redis:7-alpine

  elasticsearch:     # Elasticsearch 8
    image: elasticsearch:8.13.0

  minio:             # S3-compatible object storage
    image: minio/minio
    command: server /data

  nginx:             # Reverse proxy + TLS
    image: nginx:alpine
    ports: ["443:443", "80:80"]
```

---

## 📦 COMPLETE DEPENDENCY LIST

### Frontend (`package.json`)

```json
{
  "dependencies": {
    "next": "^14.2",
    "react": "^18.3",
    "react-dom": "^18.3",
    "typescript": "^5.5",
    
    "tailwindcss": "^3.4",
    "@radix-ui/react-*": "latest",
    "class-variance-authority": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest",
    
    "framer-motion": "^11",
    "lucide-react": "latest",
    "recharts": "^2.12",
    "react-leaflet": "^4.2",
    
    "pdfjs-dist": "^4.3",
    "react-hook-form": "^7.51",
    "zod": "^3.23",
    "@hookform/resolvers": "latest",
    "zustand": "^4.5",
    
    "next-intl": "^3.14",
    "next-pwa": "^5.6",
    "next-themes": "latest",
    "sonner": "latest"
  }
}
```

### Backend (`requirements.txt`)

```txt
# Core Framework
fastapi==0.111.*
uvicorn[standard]==0.30.*
gunicorn==22.*
pydantic==2.7.*
python-multipart==0.0.9

# Database
sqlalchemy[asyncio]==2.0.*
asyncpg==0.29.*
alembic==1.13.*

# Cache & Queue
redis==5.0.*
celery==5.4.*

# Search
elasticsearch==8.13.*

# Authentication & Security
PyJWT==2.8.*
passlib[bcrypt]==1.7.*
cryptography==42.*
python-jose[cryptography]==3.3.*

# AI / ML / NLP
spacy==3.7.*
pytesseract==0.3.*
opencv-python-headless==4.10.*
Pillow==10.3.*
transformers==4.41.*
torch==2.3.*

# Object Storage
boto3==1.34.*
minio==7.2.*

# Blockchain Anchoring
web3==6.19.*

# Utilities
httpx==0.27.*
python-dotenv==1.0.*
pydantic-settings==2.2.*

# PDF Generation (Sec 65B Certificates)
reportlab==4.2.*
```

---

## 🔄 PROJECT FOLDER STRUCTURE

```
nyay-suraksha/
├── frontend/                          # Next.js 14 App
│   ├── src/
│   │   ├── app/                       # App Router pages
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── mfa/page.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── cases/page.tsx
│   │   │   │   ├── cases/[id]/page.tsx
│   │   │   │   ├── documents/page.tsx
│   │   │   │   ├── documents/[id]/page.tsx
│   │   │   │   ├── analytics/page.tsx
│   │   │   │   ├── redaction/[id]/page.tsx
│   │   │   │   └── admin/page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx               # Landing / login redirect
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── layout/               # Sidebar, Header, RoleSwitcher
│   │   │   ├── cases/                # CaseCard, CaseTimeline
│   │   │   ├── documents/            # DocumentViewer, UploadForm
│   │   │   ├── redaction/            # RedactionPreview, EntityHighlighter
│   │   │   ├── merkle/               # VerificationBadge, MerkleProof
│   │   │   ├── analytics/            # IndiaMap, StatsCards, Charts
│   │   │   └── security/             # Watermark, BreakGlassModal
│   │   ├── lib/
│   │   │   ├── api.ts                # API client (fetch wrapper)
│   │   │   ├── auth.ts               # JWT handling, role checks
│   │   │   └── utils.ts              # Formatting, helpers
│   │   ├── store/
│   │   │   ├── auth-store.ts         # Zustand auth state
│   │   │   └── case-store.ts         # Active case context
│   │   └── i18n/
│   │       ├── en.json               # English translations
│   │       └── hi.json               # Hindi translations
│   ├── public/
│   │   └── fonts/                    # Noto Sans (supports Devanagari)
│   ├── Dockerfile
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                           # Python FastAPI
│   ├── app/
│   │   ├── main.py                   # FastAPI app entry
│   │   ├── config.py                 # Settings (env vars via Pydantic)
│   │   ├── database.py               # SQLAlchemy async engine
│   │   ├── models/                   # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── case.py
│   │   │   ├── document.py
│   │   │   ├── audit_log.py
│   │   │   ├── merkle.py
│   │   │   └── evidence_cert.py
│   │   ├── schemas/                  # Pydantic request/response schemas
│   │   │   ├── user.py
│   │   │   ├── case.py
│   │   │   ├── document.py
│   │   │   └── auth.py
│   │   ├── routers/                  # API route handlers
│   │   │   ├── auth.py
│   │   │   ├── cases.py
│   │   │   ├── documents.py
│   │   │   ├── redaction.py
│   │   │   ├── merkle.py
│   │   │   ├── analytics.py
│   │   │   └── admin.py
│   │   ├── services/                 # Business logic layer
│   │   │   ├── auth_service.py
│   │   │   ├── document_service.py
│   │   │   ├── crypto_service.py     # Hashing, encryption, Merkle tree
│   │   │   ├── redaction_service.py  # AI NER + PII detection
│   │   │   ├── ocr_service.py       # Tesseract OCR wrapper
│   │   │   ├── cert_service.py      # Sec 65B PDF generation
│   │   │   ├── anchor_service.py    # Polygon blockchain anchoring
│   │   │   └── anomaly_service.py   # Behavioral anomaly detection
│   │   ├── middleware/
│   │   │   ├── auth_middleware.py    # JWT verification + ABAC
│   │   │   ├── rate_limiter.py      # Redis-based rate limiting
│   │   │   └── audit_middleware.py  # Auto-log every API call
│   │   ├── security/
│   │   │   ├── encryption.py        # AES-256-GCM envelope encryption
│   │   │   ├── jwt_handler.py       # RS256 JWT issue/verify
│   │   │   ├── merkle_tree.py       # Custom Merkle tree implementation
│   │   │   └── watermark.py         # Dynamic PDF watermarking
│   │   ├── tasks/                   # Celery background tasks
│   │   │   ├── ocr_task.py
│   │   │   ├── ner_task.py
│   │   │   ├── anchor_task.py
│   │   │   └── malware_scan_task.py
│   │   └── utils/
│   │       ├── file_validator.py    # Magic bytes + MIME type checks
│   │       ├── exif_stripper.py     # EXIF metadata removal
│   │       └── indian_regex.py      # Aadhaar, PAN, phone patterns
│   ├── alembic/                     # Database migrations
│   ├── tests/                       # Pytest test suite
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
│
├── docker-compose.yml                # Full stack orchestration
├── docker-compose.prod.yml           # Production overrides
├── nginx/
│   └── nginx.conf                    # TLS + reverse proxy + CSP headers
├── .github/
│   └── workflows/
│       └── ci.yml                    # GitHub Actions CI/CD
└── README.md
```

---

## ✅ WHY THIS STACK WINS

| Judge Concern | Our Answer |
|---|---|
| *"Is this production-ready?"* | Docker containerized, CI/CD pipeline, AWS ap-south-1 (Mumbai) for data sovereignty |
| *"Can the government adopt this?"* | Next.js (used by gov.uk), FastAPI (used by CDAC), PostgreSQL (used by NIC/Aadhaar), all open-source — no vendor lock-in |
| *"How is this different from competitors?"* | We don't just store files — we have a complete cryptographic integrity chain with court-admissible Sec 65B certificates, AI redaction, and Polygon-anchored Merkle proofs |
| *"Can it scale to all of India?"* | Stateless API + Redis cache + Elasticsearch + S3 object storage + CDN — proven pattern for 100M+ users |
| *"What about vendor lock-in?"* | 100% open-source stack. Every component can be replaced. MinIO swaps for S3, PostgreSQL runs anywhere, Next.js is MIT licensed |
| *"What about cost?"* | AWS free tier covers the prototype. Production estimate: ~₹30,000-50,000/month for a state-level deployment on reserved instances |

---

> [!IMPORTANT]
> **Approve this stack and we start scaffolding the project immediately — Phase 1 code in your workspace within the hour.**
