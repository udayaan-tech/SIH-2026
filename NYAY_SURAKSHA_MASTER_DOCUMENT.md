# 🏛️ न्याय सुरक्षा (NYAY SURAKSHA) — MASTER PROJECT DOCUMENT

## Smart India Hackathon 2026 | Problem Statement: SIH26190
## Secure Digital Document Management System for Legal and Investigation Documents

---

> **Document Version**: 1.0
> **Last Updated**: 10 September 2026
> **Prepared For**: Team Internal Use — Share with ALL team members
> **Status**: Planning Complete → Ready to Build

---

# TABLE OF CONTENTS

1. [Problem Statement (Official)](#1-problem-statement-official)
2. [Ground Reality — Why This Problem Exists](#2-ground-reality)
3. [Legal Framework We Must Know](#3-legal-framework)
4. [Our Solution — Nyay Suraksha](#4-our-solution)
5. [System Architecture](#5-system-architecture)
6. [Tech Stack (Final)](#6-tech-stack)
7. [Database Design](#7-database-design)
8. [API Design](#8-api-design)
9. [All Features and Pages (24 Pages)](#9-features-and-pages)
10. [Security Architecture](#10-security-architecture)
11. [India-Scale Design](#11-india-scale)
12. [Red Team Audit — Threats and Defenses](#12-red-team-audit)
13. [Government Integration Map](#13-government-integrations)
14. [Demo Script (2 Minutes)](#14-demo-script)
15. [Execution Roadmap (7 Days)](#15-execution-roadmap)
16. [Team Task Assignment](#16-team-tasks)
17. [Judge Q and A Preparation](#17-judge-qa)
18. [References and Sources](#18-references)

---

# 1. PROBLEM STATEMENT (OFFICIAL)

## Quick Reference Card

| Field | Value |
|---|---|
| **PS Number** | **SIH26190** |
| **Serial No.** | **190** |
| **Title** | Secure Digital Document Management System for Legal and Investigation Documents |
| **Organization** | Ministry of Home Affairs (MHA) |
| **Department** | National Crime Records Bureau (NCRB) — Women Safety Division |
| **Category** | Software |
| **Theme** | Blockchain and Cybersecurity / Miscellaneous |
| **Submission Deadline** | September 2026 |

## Full Official Description

### Background
Law enforcement agencies, courts, legal departments, and investigative organizations handle vast amounts of sensitive documents throughout the lifecycle of a case. These documents may include:
- FIRs and police reports
- Investigation records
- Witness statements
- Charge sheets
- Court filings
- Evidence records
- Forensic reports
- Legal notices and judgments

Many organizations still rely on paper-based systems or fragmented digital storage solutions. This often leads to challenges such as:
- Difficulty in locating documents quickly
- Unauthorized access to confidential information
- Document tampering risks
- Lack of version control
- Inefficient collaboration between departments
- Delays in legal and investigative processes
- Poor auditability and compliance tracking

Modern technologies such as Cloud Computing, Artificial Intelligence (AI), Blockchain, Digital Signatures, and Secure Access Control can significantly improve the management and security of legal and investigative documents.

### Objective
Develop a Secure Digital Document Management System (DMS) that enables law enforcement agencies, legal institutions, and investigative departments to securely store, organize, manage, retrieve, and share sensitive legal and investigation documents.

The system should:
1. Digitize and centralize document storage
2. Ensure secure access and confidentiality
3. Prevent unauthorized modifications
4. Maintain a complete audit trail of document activities
5. Enable efficient document search and retrieval
6. Support collaboration among authorized stakeholders
7. Ensure compliance with legal and regulatory requirements

### Expected Solution
Develop a system to monitor and manage police assets throughout their lifecycle.

---

# 2. GROUND REALITY — WHY THIS PROBLEM EXISTS

## How an Indian Investigation Actually Works Today

```
[Incident] --> [Police Station] --> [Forensic Lab] --> [Prosecutor] --> [Court]
               FIR Registered       Evidence Tested    Charge Sheet     Trial
               IO investigates      DNA, Ballistics    Legal Briefing   Verdict
               Statements taken     Signed Report      Scrutiny
```

## Real Pain Points on the Ground

### Pain Point 1: The Paper Case Diary
- Investigating Officers maintain handwritten day-by-day diaries
- These get torn, spilled on, delayed, or conveniently misplaced
- A corrupt officer can simply remove pages

### Pain Point 2: The Malkhana (Evidence Room) Crisis
- Digital evidence (CCTV on pen drives, phone dumps) stored in physical envelopes
- By trial time (2+ years later), defense claims: "Police swapped the file"
- No way to prove the digital file was not altered

### Pain Point 3: Victim Identity Leaks (Women Safety)
- Under Indian law, revealing a sexual assault victim identity is a criminal offense
- Currently, clerks redact names with black markers — frequently leaked
- No automated, reliable redaction system exists

### Pain Point 4: Inter-Agency Silos
- Police sends evidence to FSL — takes months
- Prosecutor does not know what IO has gathered until last minute
- No unified platform connecting Police, FSL, Prosecutor, and Court

## Why "Just Use Google Drive" Gets Rejected

| Google Drive / AWS S3 | Why It FAILS in Criminal Law | Our Solution |
|---|---|---|
| Admin can edit/delete files | Defense lawyer: "Admin edited the PDF." Case dismissed! | Cryptographic hashing — any byte change detected |
| No legal chain of custody | Logs just show "file accessed" — no custody proof | Forensic chain of custody with cryptographic handshakes |
| Not admissible in court | Courts reject printouts without certification | Auto-generated Sec 65B certificates |
| No PII masking | Stores raw documents as-is | AI redaction engine with human review |
| Screenshots can leak | Anyone can photograph their screen | Dynamic forensic watermarking (viewer identity on screen) |

---

# 3. LEGAL FRAMEWORK WE MUST KNOW

**Every team member must understand these 3 laws. Judges WILL ask about them.**

## Law 1: Bharatiya Nagarik Suraksha Sanhita (BNSS 2023)
- **Replaced**: Old CrPC (Code of Criminal Procedure)
- **Key Mandate**: Promotes digitization of investigation records, electronic summons, audio-video recording of search and seizure
- **Our Relevance**: Our system IS the implementation of this mandate

## Law 2: Bharatiya Sakshya Adhiniyam (BSA 2023) — Section 65B
- **Replaced**: Old Indian Evidence Act 1872
- **Key Mandate**: Electronic evidence is only admissible if accompanied by a certificate stating:
  - Source device details
  - Cryptographic hash (SHA-256)
  - Proof that the file was not altered while in custody
- **Our Relevance**: We auto-generate Sec 65B certificates

## Law 3: POCSO Act + BNS Section 72
- **Mandate**: Revealing the name/address/face of a sexual assault or POCSO victim is a non-bailable criminal offense
- **Our Relevance**: AI redaction engine automatically detects and masks victim PII

## Additional Compliance

| Standard | Requirement | Our Implementation |
|---|---|---|
| **DPDPA 2023** | Consent, data minimization, breach notification | Consent capture, retention engine, CERT-In auto-report |
| **CERT-In Directives** | 180-day log retention, NTP sync, 6-hr breach reporting | Append-only audit logs, ntp.nic.in sync |
| **GIGW Guidelines** | Bilingual UI, WCAG 2.1 AA accessibility | Hindi/English toggle, ARIA labels, keyboard navigation |
| **IT Act Sec 43A** | Reasonable security for sensitive data | Six-layer security architecture |
| **RTI Act 2005** | Certain info may be requested via RTI | Redacted export mode |

---

# 4. OUR SOLUTION — NYAY SURAKSHA

## System Name: न्याय सुरक्षा (Nyay Suraksha)
*Translation: "Justice Protection"*

## What It Is
A secure, centralized, AI-powered Digital Document Management System that enables law enforcement agencies, forensic labs, prosecutors, and courts to securely store, organize, verify, and share legal documents with cryptographic tamper-proofing and court-admissible integrity certificates.

## 10 Core Modules

| # | Module | What It Does |
|---|---|---|
| **M1** | Auth and Identity Gateway | MFA login, JWT RS256, RBAC + ABAC, role switcher |
| **M2** | Case and Document Manager | Case lifecycle, document CRUD, metadata, classification |
| **M3** | Smart Ingestion Engine | File validation, malware scan, EXIF stripping, OCR, auto-tagging |
| **M4** | Cryptographic Integrity Engine | SHA-256 hashing, Merkle tree, Polygon anchoring, tamper detection |
| **M5** | AI PII Redaction Engine | spaCy NER, regex patterns, human-in-the-loop review, dual-copy |
| **M6** | Multi-Agency Workflow | IO to FSL to Prosecutor to Court transfer with custody chain |
| **M7** | BSA 65B Certificate Generator | Court-admissible evidence certificates with hash + Merkle proof |
| **M8** | Anti-Leak Document Viewer | Dynamic watermark, copy/print block, canvas rendering |
| **M9** | National Analytics Dashboard | India map, stats, security alerts, anomaly detection |
| **M10** | Government Integration Layer | CCTNS, ICJS, e-Courts, Aadhaar eSign, NIC SMS |

## Our Key Differentiators (What Makes Us Win)

| Differentiator | Why It Is Unique |
|---|---|
| **3-Step Tamper Detection** | File hash then Merkle tree then Polygon blockchain anchor (3 independent verification layers) |
| **AI Redaction for Women Safety** | Automatically detects and masks POCSO victim PII with human-in-the-loop review |
| **Court-Ready Certificates** | One-click BSA 2023 / Sec 65B electronic evidence certificates |
| **Multi-Agency Role Workflow** | Complete FIR to FSL to Prosecutor to Court lifecycle in one system |
| **Forensic Watermarking** | Viewer badge, IP, and timestamp baked into every document view |
| **Federated Architecture** | Each state owns its data — only metadata at national level |

---

# 5. SYSTEM ARCHITECTURE

## High-Level Architecture

```
                         CLIENTS
  [Web App PWA]    [Mobile Browser]    [Offline Mode]
                          |
                     EDGE LAYER
  [CDN / CloudFront]  ->  [WAF]  ->  [Nginx (TLS 1.3)]
                          |
                    CORE SERVICES
  [Next.js 14]    [FastAPI]    [Go Crypto Service]
  (Frontend)      (Main API)   (Merkle + Hashing)
                      |
                [Celery Workers]
                (OCR + NER)
                      |
                    DATA LAYER
  [PostgreSQL 16]  [Redis 7]  [Elasticsearch 8]  [MinIO/S3]
  (ACID DB)        (Cache)    (Search)            (Encrypted Blobs)
                      |
               EXTERNAL SERVICES
  [Polygon PoS]  [AWS KMS]  [CCTNS]  [e-Courts]  [Aadhaar eSign]
```

## Why 3 Backend Services?

| Service | Language | Why Separate |
|---|---|---|
| **FastAPI** | Python | 95% of logic — auth, cases, docs, redaction, analytics. AI/ML runs natively. |
| **Go Crypto** | Go | Merkle tree + SHA-256 + Polygon anchoring. Memory-safe for crypto operations. |
| **Celery Workers** | Python | Background AI tasks (OCR, NER, malware scan). Does not block main API. |

## On-Chain vs Off-Chain

```
DOCUMENT (15 MB PDF)
    |
    |-- FILE CONTENT --> AES-256 encrypted --> MinIO/S3 (OFF-CHAIN)
    |
    |-- SHA-256 HASH (32 bytes) --> Merkle tree leaf (OFF-CHAIN DB)
                                        |
                                  Merkle Root (32 bytes)
                                        |
                                  Polygon Smart Contract (ON-CHAIN)
                                  (Just the 32-byte root hash)
```

**WHY**: Storing 15MB on blockchain = absurd, slow, expensive. Storing 32 bytes = cheap, fast, verifiable.

---

# 6. TECH STACK (FINAL)

```
FRONTEND:    Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui + Framer Motion
BACKEND:     Python FastAPI + Pydantic v2 + SQLAlchemy 2.0 + Celery
CRYPTO:      Go (Merkle tree + SHA-256 + Polygon anchoring)
DATABASE:    PostgreSQL 16 + Redis 7 + Elasticsearch 8
STORAGE:     MinIO / AWS S3 (AES-256 encrypted)
AI/ML:       spaCy (NER) + Tesseract OCR + ai4bharat IndicNER
AUTH:        JWT RS256 + bcrypt + MFA (OTP)
BLOCKCHAIN:  Polygon PoS (Merkle root anchoring only)
INFRA:       Docker + Docker Compose + Nginx + AWS (ap-south-1 Mumbai)
CI/CD:       GitHub Actions
MONITORING:  Prometheus + Grafana + Sentry
```

### Why Each Choice

| Choice | Reason (What to Tell Judges) |
|---|---|
| **Next.js** over React Vite | SSR, built-in middleware for auth guards, PWA support, used by gov.uk |
| **FastAPI** over Express | AI/ML runs natively in Python, auto API docs, CDAC/NIC use Python |
| **Go** for crypto | Memory-safe, FIPS-certified crypto stdlib, shows architectural maturity |
| **PostgreSQL** over MongoDB | ACID compliance mandatory for legal records, Row-Level Security |
| **Merkle + Polygon** over Hyperledger | Lightweight, no infrastructure overhead, publicly verifiable |
| **spaCy** for NER | Production-grade, supports Indian languages via ai4bharat |

### Project Folder Structure

```
nyay-suraksha/
|-- frontend/                    (Next.js 14 App)
|   |-- src/
|   |   |-- app/                 (App Router pages)
|   |   |-- components/          (UI components)
|   |   |-- lib/                 (Utilities)
|   |   |-- store/               (Zustand state)
|   |   |-- i18n/                (English + Hindi)
|   |-- Dockerfile
|   |-- package.json
|
|-- backend/                     (Python FastAPI)
|   |-- app/
|   |   |-- main.py
|   |   |-- models/              (SQLAlchemy ORM)
|   |   |-- schemas/             (Pydantic validation)
|   |   |-- routers/             (API route handlers)
|   |   |-- services/            (Business logic)
|   |   |-- security/            (Encryption, JWT, Merkle)
|   |   |-- tasks/               (Celery background tasks)
|   |-- Dockerfile
|   |-- requirements.txt
|
|-- crypto-service/              (Go Merkle Engine)
|   |-- main.go
|   |-- merkle/
|   |-- handlers/
|   |-- Dockerfile
|
|-- docker-compose.yml
|-- nginx/nginx.conf
|-- .github/workflows/ci.yml
|-- README.md
```

---

# 7. DATABASE DESIGN

## Tables (9 Total)

| Table | Purpose | Key Fields |
|---|---|---|
| `users` | Officer accounts | user_id, badge_number, role, rank, station_code, jurisdiction |
| `cases` | FIR/case records | case_id, fir_number, station_code, sections, status, is_pocso |
| `documents` | Uploaded documents | document_id, case_id, doc_type, sha256_hash, encrypted_blob_path, custody_chain |
| `audit_log` | Immutable activity log | log_id, action, user_id, ip, previous_log_hash, current_log_hash (APPEND-ONLY) |
| `merkle_leaves` | Merkle tree leaves | leaf_id, document_hash, leaf_hash, merkle_root |
| `merkle_anchors` | Blockchain anchor records | anchor_id, merkle_root, anchor_target, anchor_proof |
| `evidence_certificates` | Sec 65B certificates | cert_id, document_id, hash, custodian, digital_signature |
| `custody_transfers` | Chain of custody | transfer_id, doc_id, from_user, to_user, reason, transfer_hash |
| `redacted_copies` | Redacted versions | redacted_id, original_doc_id, redacted_entities, approved_by |

### Critical Security Rule
```
-- Audit log is APPEND-ONLY (no updates, no deletes EVER)
REVOKE UPDATE, DELETE ON audit_log FROM PUBLIC;

-- Each entry is cryptographically chained to the previous
-- current_log_hash = SHA-256(current_entry + previous_log_hash)
```

---

# 8. API DESIGN (25+ Endpoints)

```
/api/v1/auth/
  POST /login          -> Badge + password
  POST /mfa/verify     -> OTP verification
  POST /refresh        -> Refresh access token
  POST /logout         -> Blacklist token

/api/v1/cases/
  GET  /               -> List cases (filtered by jurisdiction)
  POST /               -> Create new case (IO only)
  GET  /{id}           -> Case details
  PATCH /{id}/status   -> Update status (dual auth for charge sheet)
  GET  /{id}/timeline  -> Visual timeline

/api/v1/documents/
  POST /upload         -> Upload + validate + hash + encrypt + OCR
  GET  /{id}           -> Metadata
  GET  /{id}/view      -> Watermarked viewer (logged)
  GET  /{id}/verify    -> 3-step integrity verification
  POST /{id}/forward   -> Transfer custody
  GET  /{id}/chain     -> Full custody chain
  POST /{id}/cert      -> Generate Sec 65B certificate

/api/v1/redaction/
  POST /{id}/analyze   -> AI NER -> return PII suggestions
  POST /{id}/approve   -> Human confirms -> dual copy generated

/api/v1/merkle/
  GET  /root           -> Current Merkle root
  GET  /{id}/proof     -> Merkle proof for document
  POST /anchor         -> Anchor to Polygon

/api/v1/analytics/
  GET  /national       -> National dashboard stats
  GET  /alerts         -> Security anomalies

/api/v1/admin/
  GET  /users          -> User management
  GET  /audit-log      -> Browse audit trail
```

---

# 9. FEATURES AND PAGES (24 PAGES)

## Requirement Traceability

| PS Text | Feature | Page |
|---|---|---|
| "FIRs and police reports" | FIR upload + OCR | Document Upload |
| "Witness statements" | Statement upload + consent | Document Upload |
| "Charge sheets" | Charge sheet builder + dual-sign | Case Detail |
| "Evidence records" | Evidence with chain of custody | Document Manager |
| "Forensic reports" | FSL report linked to evidence | FSL Dashboard |
| "Difficulty locating documents" | AI search + filters | Global Search |
| "Unauthorized access" | MFA + RBAC + ABAC | Login |
| "Document tampering risks" | SHA-256 + Merkle + Polygon | Verify Page |
| "Lack of version control" | Version history with diffs | Version History |
| "Inefficient collaboration" | Inter-agency transfer | Transfer Workflow |
| "Poor auditability" | Immutable crypto audit log | Audit Log |
| "Digitize and centralize" | Encrypted cloud storage | Document Library |
| "Prevent modifications" | Hash lock on every document | Integrity Badge |
| "Complete audit trail" | Append-only chained logs | Audit Log |
| "Efficient search" | Elasticsearch full-text | Search Page |
| "Collaboration" | Role-based transfer | Shared Case View |
| "Compliance" | Sec 65B certificates | Certificate Page |
| NCRB Women Safety Division | AI PII redaction | Redaction Review |

## All 24 Pages

| # | Page | URL | Role Access |
|---|---|---|---|
| 1 | Login + MFA | /login | Public |
| 2 | Dashboard | /dashboard | All (role-specific) |
| 3 | Case List | /cases | All |
| 4 | Create Case | /cases/new | IO |
| 5 | Case Detail | /cases/[id] | Assigned personnel |
| 6 | Case Timeline | /cases/[id]/timeline | Assigned personnel |
| 7 | Case Diary | /cases/[id]/diary | IO, SHO |
| 8 | Court Bundle | /cases/[id]/bundle | PP, Judge |
| 9 | Document Library | /documents | All |
| 10 | Document Upload | /documents/upload | IO, SI, FSL |
| 11 | Document Viewer | /documents/[id] | Assigned + watermarked |
| 12 | Integrity Verify | /documents/[id]/verify | All |
| 13 | Redaction Review | /documents/[id]/redact | IO, Redaction Officer |
| 14 | Version History | /documents/[id]/history | All |
| 15 | Sec 65B Certificate | /documents/[id]/cert | PP, Judge |
| 16 | Global Search | /search | All |
| 17 | Notifications | /notifications | All |
| 18 | Analytics Dashboard | /analytics | SHO+, Admin |
| 19 | Audit Log | /audit-log | Admin |
| 20 | User Management | /admin/users | Admin |
| 21 | Security Dashboard | /admin/security | Admin |
| 22 | Compliance Dashboard | /admin/compliance | Admin |
| 23 | Settings | /settings | All |
| 24 | Public Verify | /verify/{hash} | Public |

## Feature Priority

### MUST HAVE (Days 1-5)
1. Login + MFA + Role Switching
2. Case CRUD (Create, List, View)
3. Document Upload with Hash + Encrypt
4. Secure Document Viewer with Watermark
5. SHA-256 + Merkle Tree + Tamper Detection
6. AI PII Redaction (Human-in-the-loop)
7. Immutable Audit Trail
8. Inter-Agency Transfer (IO to FSL to PP)
9. Sec 65B Certificate Generation
10. Role-Based Dashboards (5 roles)

### SHOULD HAVE (Days 5-6)
11. Global Search (Elasticsearch)
12. Case Timeline
13. Analytics Dashboard with India Map
14. Notification Center
15. Bilingual UI (English + Hindi)

### NICE TO HAVE (Day 7)
16. Offline PWA Mode
17. Document Version History
18. Live Polygon Blockchain Anchoring
19. Public Verification Page
20. Admin Security Dashboard

---

# 10. SECURITY ARCHITECTURE

## Six-Layer Defense-in-Depth

```
Layer 1: NETWORK      -> WAF, DDoS protection, IP whitelisting
Layer 2: TRANSPORT    -> TLS 1.3 enforced, certificate pinning, mTLS
Layer 3: APPLICATION  -> OWASP Top 10, CSP headers, parameterized queries
Layer 4: DATA         -> AES-256-GCM envelope encryption, SHA-256, Merkle tree
Layer 5: IDENTITY     -> RBAC + ABAC, JWT RS256, MFA, break-glass, anomaly detection
Layer 6: AUDIT        -> Append-only crypto log, 180-day retention, NTP sync
```

## Encryption Architecture

```
DOCUMENT -> Generate unique DEK (AES-256-GCM)
                |
                |-- Encrypt document WITH DEK -> Store encrypted blob in S3
                |
                |-- Encrypt DEK WITH KEK -> Store encrypted DEK in PostgreSQL
                        |
                        |-- KEK stored in AWS KMS / HashiCorp Vault
                             (separate from database, multi-party auth required)
```

## Access Control (ABAC Policy Engine)

```
ALLOW access IF AND ONLY IF:
  user.role is in allowed_roles
  AND user.jurisdiction COVERS document.stationCode
  AND user.userId is in case.assignedPersonnel
  AND case.status is not SEALED
  AND request.ip is in user.allowedIPRanges
  AND request.time is in user.dutyHours (OR break-glass active)
  AND user.anomalyScore < threshold
  OTHERWISE: DENY + log
```

## Government Security Classification (MHA Standard)

| Level | Examples | Key Controls |
|---|---|---|
| TOP SECRET | Terrorism, espionage | Double encryption, isolated terminal, no downloads |
| SECRET | Organized crime | SP+ access, watermarked, no download without approval |
| CONFIDENTIAL | Most criminal cases, POCSO | IO + SHO + assigned personnel, standard controls |
| RESTRICTED | Minor offenses, traffic | Station-level access |
| UNCLASSIFIED | Public court judgments | RTI-cleared documents |

---

# 11. INDIA-SCALE DESIGN

## Real Numbers

| Metric | Value |
|---|---|
| Police Stations | 17,535 |
| FIRs per year | 66 lakh (6.6 million) |
| Documents uploaded per day | 1 to 1.5 lakh |
| Daily storage growth | 200-300 GB/day |
| Annual storage | 75-100 TB/year |
| Peak concurrent users | 57,500 |

## Federated Architecture

```
                NATIONAL HUB (NIC Delhi)
                (Metadata ONLY — no document content)
                         |
         +---------------+---------------+
         |               |               |
   STATE NODE #1   STATE NODE #2    STATE NODE #36
   (Delhi)         (Maharashtra)    (Arunachal)
   Own DB + S3     Own DB + S3      Own DB + S3
```

**Rule**: Documents NEVER leave the state. Only metadata goes to national hub.

## Network Tiers

| Tier | Stations | Bandwidth | Strategy |
|---|---|---|---|
| Tier 1 (Metros) | 20% | 50-100 Mbps | Full online mode |
| Tier 2 (Districts) | 30% | 10-50 Mbps | Online + local cache |
| Tier 3 (Talukas) | 35% | 1-10 Mbps | Offline-first PWA |
| Tier 4 (Remote) | 15% | Under 1 Mbps | Full offline, periodic sync |

## Cost Estimates

| Deployment | Monthly Cost |
|---|---|
| Hackathon Demo (AWS free tier) | Rs 2,500 |
| State-Level Production | Rs 2.35 lakh (Rs 28 lakh/year) |
| National Deployment (MeghRaj GI Cloud) | Rs 5-6 crore/year |

---

# 12. RED TEAM AUDIT — THREATS AND DEFENSES

## 5 Critical Vulnerabilities Fixed

| Threat | Defense |
|---|---|
| Key Management — rogue admin decrypts all | Envelope encryption (DEK + KEK) with KMS/Vault |
| Insider Threat — corrupt officer | ABAC + anomaly detection + break-glass audit + dual-auth |
| Merkle Tree Rebuild — admin fakes chain | External anchoring to Polygon |
| AI Redaction Failure — misses victim name | Human-in-the-loop review + confidence scores |
| MITM on Police Network | TLS 1.3 + certificate pinning |

## 6 Attack Vectors Defended

| Attack | Defense |
|---|---|
| SQL Injection | Parameterized queries via SQLAlchemy ORM |
| XSS via uploads | Magic byte validation, sandboxed PDF.js, CSP headers |
| EXIF Metadata Leak | Auto-strip all EXIF on upload |
| DoS via large files | 50MB limit, rate limiting, ClamAV malware scan |
| JWT Forgery | RS256 asymmetric signing, 15-min expiry, device binding |
| NPM Supply Chain | Lockfile integrity, npm audit in CI |

---

# 13. GOVERNMENT INTEGRATIONS

| System | What It Is | Our Integration |
|---|---|---|
| **CCTNS** | Crime and Criminal Tracking | Pull FIR data, case status |
| **ICJS** | Inter-operable Criminal Justice | Sync case records across agencies |
| **NAFIS** | National Fingerprint ID | Fingerprint match requests |
| **e-Courts** | NIC Court Management | Push verified case bundles |
| **e-Prisons** | NIC Prison Management | Under-trial status |
| **Aadhaar eSign** | UIDAI Digital Signatures | OTP-based digital signing |
| **DigiLocker** | MeitY Document Wallet | Certificate storage |
| **NIC SMS Gateway** | Government SMS Service | OTP delivery |
| **NATGRID** | National Intelligence Grid | Intelligence feeds (TOP SECRET) |
| **NCRB Database** | National Crime Statistics | Aggregated data |

---

# 14. DEMO SCRIPT (2 MINUTES FOR JUDGES)

```
0:00 — LOGIN
"This is Nyay Suraksha, built for the Ministry of Home Affairs."
-> Login as IO Rajesh Kumar -> MFA OTP -> Dashboard

0:20 — UPLOAD
"An IO uploads a scanned FIR from a POCSO case."
-> Upload PDF -> validation -> malware scan -> hash -> encrypted -> stored

0:40 — AI REDACTION (Women Safety Feature)
"The system auto-detects victim PII for POCSO protection."
-> Click Redact -> AI highlights name, address, phone
-> Human approves -> Dual copy generated

1:00 — TAMPER DETECTION (THE WOW MOMENT)
"What if someone tries to tamper with evidence?"
-> Manually corrupt 1 byte in database
-> Refresh -> RED: TAMPERED — INTEGRITY VIOLATION
-> "Our system detected tampering at the byte level."

1:20 — INTER-AGENCY TRANSFER
"IO forwards evidence to FSL."
-> Switch to FSL role -> FSL uploads forensic report
-> Switch to Prosecutor -> Complete case bundle ready

1:40 — COURT BUNDLE + SEC 65B CERTIFICATE
"Prosecutor generates a court-ready bundle."
-> Click Generate -> indexed PDF + Sec 65B certificate

2:00 — CLOSE
"Every action logged in tamper-proof audit trail anchored to Polygon."
-> Show audit log -> Show Polygon transaction -> End
```

---

# 15. EXECUTION ROADMAP (7 DAYS)

| Day | What We Build |
|---|---|
| **Day 1** | Project scaffold (Next.js + FastAPI + Go + Docker), design system |
| **Day 2** | Auth (JWT + MFA + RBAC), database setup, UI shell (sidebar, header) |
| **Day 3** | Case CRUD, document upload pipeline, document library UI |
| **Day 4** | Go Merkle tree, tamper detection, spaCy NER + OCR setup |
| **Day 5** | Redaction review UI, secure viewer, Sec 65B cert generator |
| **Day 6** | Analytics dashboard, search, notifications, Polygon anchoring, Hindi UI |
| **Day 7** | Test data, demo rehearsal, presentation slides, bug fixes |

---

# 16. TEAM TASK ASSIGNMENT

**Fill in your team member names and assign roles:**

| Role | Responsibilities | Assigned To |
|---|---|---|
| **Frontend Lead** | Next.js pages, components, responsive design, animations | ___________ |
| **Backend Lead** | FastAPI APIs, models, auth system, Celery tasks | ___________ |
| **Crypto / Go Dev** | Go Merkle tree, SHA-256, Polygon anchoring | ___________ |
| **AI/ML Dev** | spaCy NER, Tesseract OCR, PII detection pipeline | ___________ |
| **DevOps / Infra** | Docker, Nginx, AWS deployment, CI/CD | ___________ |
| **Presenter / Docs** | PPT slides, demo script, judge Q and A, test data | ___________ |

---

# 17. JUDGE Q AND A PREPARATION

## Top 15 Questions and Our Answers

| # | Judge Question | Our Answer |
|---|---|---|
| 1 | Why not just use Google Drive? | No cryptographic integrity, no chain of custody, no court certificates, no PII redaction. Our system detects tampering at the byte level. |
| 2 | Why not put docs on blockchain? | Storing 15MB on-chain is absurd. We store only the 32-byte Merkle root hash — blockchain immutability at near-zero cost. |
| 3 | What if your admin goes rogue? | Envelope encryption. Admin sees encrypted blobs only. KEK in separate vault with multi-party auth. |
| 4 | What if AI misses a victim name? | AI is a suggestion only. Human Redaction Officer must confirm. Below 85% confidence = mandatory manual review. |
| 5 | How do you prove police did not tamper? | Merkle root anchored to Polygon — a public chain police do not control. |
| 6 | Can visually impaired officers use this? | Yes. GIGW + WCAG 2.1 AA: ARIA labels, keyboard nav, high contrast, screen reader support. |
| 7 | What about rural stations with no internet? | PWA works fully offline using Service Workers and IndexedDB. Auto-sync on reconnect. |
| 8 | Can your OCR handle Tamil? | Yes. Tesseract supports all major Indian scripts. NER via ai4bharat IndicNER (11 languages). |
| 9 | How does this connect to CCTNS? | REST API gateway integrates with CCTNS, ICJS, e-Courts. Prototype uses simulated realistic data. |
| 10 | Can this scale to 17,000+ stations? | Federated architecture — each state has its own node. Same stack as Aadhaar and DigiLocker. |
| 11 | Why Python, not Java/Go? | Python = standard for crypto research (NIST), AI/ML (OCR, NER), used by CERT-In. Go used specifically for crypto engine. |
| 12 | Where would this be deployed? | Prototype on AWS Mumbai. Production on MeghRaj GI Cloud at NIC Data Centers. |
| 13 | Cost? | Demo: Rs 2,500/month. State: Rs 28 lakh/year. National: Rs 5-6 crore/year. Compare: CCTNS cost Rs 2,000 crore. |
| 14 | What if server room catches fire? | 3-2-1 backup. NIC Delhi (primary) + NIC Hyderabad (DR). RPO: 1 hour. RTO: 4 hours. |
| 15 | How is this different from other teams? | (1) 3-step tamper detection with blockchain anchoring, (2) AI redaction for POCSO with human-in-the-loop, (3) automated court-admissible Sec 65B certificates. |

---

# 18. REFERENCES AND SOURCES

## Legal References
- Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023
- Bharatiya Sakshya Adhiniyam (BSA) 2023, Section 65B
- Digital Personal Data Protection Act (DPDPA) 2023
- CERT-In Cybersecurity Directives (April 2022)
- GIGW Guidelines for Indian Government Websites
- POCSO Act 2012
- Information Technology Act 2000, Section 43A

## Technical References
- NCRB Annual Report (Crime in India) — ncrb.gov.in
- CCTNS Project — ncrb.gov.in
- ICJS — icjs.gov.in
- MeghRaj GI Cloud — cloud.gov.in
- NIC Services — nic.in

## Problem Statement Source
- SIH 2026 Official — sih.gov.in
- GitHub: NoBugNinja/Smart-India-Hackathon-SIH-2026-Problem-Statements

---

**END OF MASTER DOCUMENT**

**Next Step**: All team members read this document -> Discuss -> Start coding Phase 1

**Project Repository**: This file is located in the project workspace for easy sharing.
