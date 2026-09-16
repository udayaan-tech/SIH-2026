# 📋 FEATURE & PAGE MAP — Traced to Problem Statement

## Step 1: Every Line of the Problem Statement → Feature

Here is the **exact text** from SIH26190, broken into individual requirements, with the feature and page that satisfies each one:

---

### FROM THE "BACKGROUND" SECTION

| # | Exact PS Requirement | Feature We Build | Page/Screen |
|---|---|---|---|
| B1 | *"Law enforcement agencies, courts, legal departments, and investigative organizations handle vast amounts of sensitive documents"* | Multi-agency role system with separate dashboards | Role Switcher + 5 Role Dashboards |
| B2 | *"FIRs and police reports"* | FIR upload, OCR, metadata extraction | Document Upload + FIR Template |
| B3 | *"Investigation records"* | Case diary module with daily entries | Case Diary Page |
| B4 | *"Witness statements"* | Statement upload with consent capture | Document Upload (type: Witness Statement) |
| B5 | *"Charge sheets"* | Charge sheet compilation with dual-sign | Charge Sheet Builder Page |
| B6 | *"Court filings"* | Court bundle generation with Sec 65B certs | Court Bundle Export Page |
| B7 | *"Evidence records"* | Evidence upload with chain of custody | Evidence Manager Page |
| B8 | *"Forensic reports"* | FSL report upload linked to evidence | FSL Dashboard + Report Upload |
| B9 | *"Legal notices and judgments"* | Court order/judgment upload by Judge | Judge Dashboard |
| B10 | *"Difficulty in locating documents quickly"* | AI-powered search + filters + tags | Global Search Page |
| B11 | *"Unauthorized access to confidential information"* | RBAC + ABAC + MFA | Login + Access Denied Page |
| B12 | *"Document tampering risks"* | SHA-256 hashing + Merkle tree + Polygon anchor | Integrity Verification Badge (on every doc) |
| B13 | *"Lack of version control"* | Document versioning with diff history | Document Version History Page |
| B14 | *"Inefficient collaboration between departments"* | Inter-agency document transfer workflow | Transfer/Forward Modal + Notifications |
| B15 | *"Delays in legal and investigative processes"* | Real-time notifications + status tracking | Notification Center + Case Timeline |
| B16 | *"Poor auditability and compliance tracking"* | Immutable audit trail + compliance dashboard | Audit Log Page + Compliance Dashboard |

---

### FROM THE "DESCRIPTION / OBJECTIVES" SECTION

| # | Exact PS Requirement | Feature We Build | Page/Screen |
|---|---|---|---|
| D1 | *"Digitize and centralize document storage"* | Encrypted cloud storage with metadata indexing | Document Upload + Document Library |
| D2 | *"Ensure secure access and confidentiality"* | MFA + JWT RS256 + ABAC + encryption at rest | Login Page + Access Control Settings |
| D3 | *"Prevent unauthorized modifications"* | SHA-256 hash lock — any byte change detected | Integrity Badge (🟢/🔴 on every document) |
| D4 | *"Maintain a complete audit trail of document activities"* | Append-only cryptographic audit log | Audit Log Page |
| D5 | *"Enable efficient document search and retrieval"* | Elasticsearch full-text search + filters | Search Page + Filters Sidebar |
| D6 | *"Support collaboration among authorized stakeholders"* | Inter-agency transfer + role-based views | Transfer Workflow + Shared Case View |
| D7 | *"Ensure compliance with legal and regulatory requirements"* | BSA 65B cert generator + DPDPA consent | Compliance Dashboard + Cert Generator |

---

### FROM THE "EXPECTED SOLUTION" SECTION

| # | Exact PS Requirement | Feature We Build | Page/Screen |
|---|---|---|---|
| E1 | *"Develop a system to monitor and manage... throughout their lifecycle"* | Full case lifecycle: Registration → Investigation → Charge Sheet → Trial → Judgment → Closure | Case Status Pipeline (Kanban-style) |

---

### FROM THE "THEME: BLOCKCHAIN & CYBERSECURITY"

| # | Implied Requirement | Feature We Build | Page/Screen |
|---|---|---|---|
| T1 | Blockchain for tamper-proofing | Merkle tree + Polygon anchoring | Merkle Proof Viewer + Blockchain Anchor Log |
| T2 | Cybersecurity best practices | 6-layer security architecture | Security Dashboard (admin) |

---

### FROM THE "DEPARTMENT: NCRB WOMEN SAFETY DIVISION"

| # | Implied Requirement | Feature We Build | Page/Screen |
|---|---|---|---|
| W1 | POCSO / Women safety case handling | Auto-flag POCSO/women safety cases | Case Creation (auto-detect from sections) |
| W2 | Victim identity protection | AI PII redaction engine | Redaction Preview Page |
| W3 | Dual-view (classified + public) | Master copy + Redacted copy system | Document Viewer (toggle: Full / Redacted) |

---

## Step 2: COMPLETE PAGE MAP (24 Pages)

### Page Architecture

```
NYAY SURAKSHA — PAGE MAP
═══════════════════════════════════════════════════════

PUBLIC PAGES (No Login Required)
├── /login                          → Login + MFA Page
├── /forgot-password                → Password Reset
└── /verify/{hash}                  → Public Document Verification

AUTHENTICATED PAGES (Role-Based)
├── /dashboard                      → Role-Specific Dashboard (auto-switches by role)
├── /cases
│   ├── /cases                      → Case List (filtered by jurisdiction)
│   ├── /cases/new                  → Create New Case (IO only)
│   ├── /cases/[id]                 → Case Detail View
│   ├── /cases/[id]/timeline        → Visual Case Timeline
│   ├── /cases/[id]/diary           → Case Diary (daily entries)
│   └── /cases/[id]/bundle          → Court Bundle Generator
├── /documents
│   ├── /documents                  → Document Library
│   ├── /documents/upload           → Smart Upload Page
│   ├── /documents/[id]             → Document Detail + Viewer
│   ├── /documents/[id]/verify      → Integrity Verification Page
│   ├── /documents/[id]/redact      → AI Redaction Review Page
│   ├── /documents/[id]/history     → Version History
│   └── /documents/[id]/cert        → Sec 65B Certificate View
├── /search                         → Global Search (Elasticsearch)
├── /notifications                  → Notification Center
├── /analytics                      → National/State Analytics Dashboard
├── /audit-log                      → Audit Trail Viewer (Admin)
├── /admin
│   ├── /admin/users                → User Management
│   ├── /admin/security             → Security Dashboard
│   └── /admin/compliance           → Compliance Dashboard
└── /settings                       → Profile + Language + Theme
```

---

## Step 3: PAGE-BY-PAGE DETAIL

---

### PAGE 1: Login + MFA (`/login`)

**PS Requirement**: D2 — *"Ensure secure access and confidentiality"*

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│           🏛️ न्याय सुरक्षा                            │
│           Nyay Suraksha DMS                           │
│           Ministry of Home Affairs                    │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  Badge Number / Service ID                     │  │
│  │  ┌────────────────────────────────────────┐    │  │
│  │  │ DL-4821                                │    │  │
│  │  └────────────────────────────────────────┘    │  │
│  │                                                │  │
│  │  Password                                      │  │
│  │  ┌────────────────────────────────────────┐    │  │
│  │  │ ••••••••••                             │    │  │
│  │  └────────────────────────────────────────┘    │  │
│  │                                                │  │
│  │  [🔐 Login Securely]                           │  │
│  │                                                │  │
│  │  Forgot Password?                              │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  🔒 Secured with TLS 1.3 | NIC Certified            │
│  🌐 [English] [हिन्दी]                               │
│                                                      │
└──────────────────────────────────────────────────────┘

AFTER LOGIN → MFA STEP:
┌──────────────────────────────────────────────────────┐
│                                                      │
│  📱 Enter OTP sent to +91 •••••••890                 │
│                                                      │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐                     │
│  │ 8│ │ 4│ │ 7│ │ 2│ │ 9│ │ 1│                     │
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘                     │
│                                                      │
│  [✅ Verify OTP]                                     │
│                                                      │
│  Resend OTP (available in 30s)                       │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Components**: BadgeInput, PasswordInput, MFACodeInput, LanguageToggle

---

### PAGE 2: Dashboard (`/dashboard`)

**PS Requirement**: B1 — Multi-agency role system

This page changes completely based on WHO is logged in:

```
┌──────────────────────────────────────────────────────────────────────┐
│ 🏛️ Nyay Suraksha    [🔍 Search]    [🔔 3]    [IO ▼]    [🌐 EN/हि] │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  SIDEBAR              MAIN CONTENT                                   │
│  ┌──────────┐        ┌──────────────────────────────────────────┐   │
│  │ 📊 Dash   │◄──────│  Welcome, Inspector Rajesh Kumar          │   │
│  │ 📁 Cases  │        │  P.S. Sarojini Nagar, South Delhi         │   │
│  │ 📄 Docs   │        │                                          │   │
│  │ 🔍 Search │        │  ┌────────┐ ┌────────┐ ┌────────┐       │   │
│  │ 📝 Diary  │        │  │ 12     │ │ 3      │ │ 47     │       │   │
│  │ 🔔 Notifs │        │  │Active  │ │Pending │ │Total   │       │   │
│  │ 📋 Audit  │        │  │Cases   │ │Review  │ │Docs    │       │   │
│  │ ⚙️ Settings│        │  └────────┘ └────────┘ └────────┘       │   │
│  └──────────┘        │                                          │   │
│                      │  RECENT ACTIVITY                          │   │
│  ROLE SWITCHER       │  ┌──────────────────────────────────────┐│   │
│  (Demo Only)         │  │ 🟢 FIR 142/2026 — FSL report received││   │
│  ┌──────────┐        │  │ 🟡 FIR 138/2026 — Pending redaction  ││   │
│  │ 👮 IO     │◄───    │  │ 🔴 FIR 131/2026 — Overdue: 3 days   ││   │
│  │ 👮‍♂️ SHO    │        │  └──────────────────────────────────────┘│   │
│  │ 🔬 FSL    │        │                                          │   │
│  │ ⚖️ PP     │        │  CASE PIPELINE                            │   │
│  │ 🏛️ Judge  │        │  [Registered]→[Investigation]→[Charge]→ │   │
│  │ 🔧 Admin  │        │  [Trial]→[Judgment]                      │   │
│  └──────────┘        └──────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Dashboard Content Per Role**:

| Role | What They See |
|---|---|
| **IO** | My assigned cases, pending uploads, FSL responses, deadline alerts |
| **SHO** | Station overview, pending approvals (charge sheets), officer performance |
| **FSL** | Evidence queue (assigned to me), pending analysis, completed reports |
| **Prosecutor** | Assigned cases for trial prep, case bundle status, court dates |
| **Judge** | Cases assigned for hearing, verified case bundles, document integrity status |
| **Admin** | System health, security alerts, anomaly flags, user management |

---

### PAGE 3: Case List (`/cases`)

**PS Requirement**: B1, D1, E1 — Centralized case management lifecycle

```
┌──────────────────────────────────────────────────────────────────────┐
│  📁 CASES                                          [+ New Case]      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  FILTERS:                                                            │
│  [Status ▼] [Section ▼] [Date Range] [Station ▼] [🔍 Search FIR#]  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │ 🟡 FIR 142/2026 │ PS Sarojini Nagar │ BNS 64, POCSO 4          ││
│  │   Status: Under Investigation │ IO: Insp. R. Kumar              ││
│  │   Docs: 8 │ 🔒 CONFIDENTIAL │ 🟢 Integrity: 100%              ││
│  │   Created: 15 Jun 2026 │ Last Activity: 2 hours ago             ││
│  ├──────────────────────────────────────────────────────────────────┤│
│  │ 🟢 FIR 138/2026 │ PS Sarojini Nagar │ BNS 103(1)               ││
│  │   Status: Charge Sheet Filed │ IO: SI M. Kumari                 ││
│  │   Docs: 15 │ 🟢 RESTRICTED │ 🟢 Integrity: 100%               ││
│  │   Created: 10 Jun 2026 │ Last Activity: 1 day ago               ││
│  ├──────────────────────────────────────────────────────────────────┤│
│  │ 🔴 FIR 131/2026 │ PS Sarojini Nagar │ BNS 105, 118(1)          ││
│  │   Status: Under Investigation │ IO: Insp. R. Kumar              ││
│  │   Docs: 4 │ 🟡 CONFIDENTIAL │ ⚠️ Overdue: Chargesheet due     ││
│  │   Created: 01 Jun 2026 │ Last Activity: 3 days ago              ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  Showing 1-10 of 47 cases │ [← Prev] [1] [2] [3] [4] [5] [Next →] │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

### PAGE 4: Case Detail (`/cases/[id]`)

**PS Requirement**: E1 — Full lifecycle management

```
┌──────────────────────────────────────────────────────────────────────┐
│  📁 Case: FIR 142/2026 │ PS Sarojini Nagar │ 🔒 CONFIDENTIAL       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  TABS: [Overview] [Documents (8)] [Timeline] [Diary] [Personnel]    │
│                [Custody Chain] [Court Bundle] [Audit Log]            │
│                                                                      │
│  ┌─── CASE INFO ──────────────────┐ ┌─── STATUS ─────────────────┐ │
│  │ FIR Number: 142/2026           │ │                             │ │
│  │ Station: PS Sarojini Nagar     │ │  ●━━━━━●━━━━━○━━━━━○━━━━○  │ │
│  │ District: South Delhi          │ │  Reg   Inv   CS    Trial  J │ │
│  │ State: Delhi                   │ │        ▲                    │ │
│  │ Sections: BNS 64, POCSO 4     │ │    CURRENT                  │ │
│  │ Category: Cognizable           │ │                             │ │
│  │ Classification: CONFIDENTIAL   │ │ Status: Under Investigation │ │
│  │ POCSO Case: ✅ Yes             │ │ Days elapsed: 86            │ │
│  │ Women Safety: ✅ Yes           │ │ Chargesheet due in: 4 days  │ │
│  └────────────────────────────────┘ └─────────────────────────────┘ │
│                                                                      │
│  ┌─── ASSIGNED PERSONNEL ─────────────────────────────────────────┐ │
│  │ 👮 IO: Insp. Rajesh Kumar (DL-4821)                            │ │
│  │ 👮‍♂️ SHO: SI Priya Mehta (DL-SN-SHO)                             │ │
│  │ 🔬 FSL: Dr. A. Sharma (CFSL-DEL-0042)                         │ │
│  │ ⚖️ PP: Adv. Arun Singh (DL-PP-291)                             │ │
│  │ 🏛️ Judge: Not yet assigned                                     │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌─── DOCUMENTS (8) ─────────────────────────────────── [+ Upload]─┐│
│  │ 📄 FIR_142_2026.pdf          │ FIR       │ 🟢 Verified │ 15 Jun││
│  │ 📄 Witness_Stmt_01.pdf       │ Statement │ 🟢 Verified │ 16 Jun││
│  │ 📷 Scene_Photo_01.jpg        │ Evidence  │ 🟢 Verified │ 15 Jun││
│  │ 📷 Scene_Photo_02.jpg        │ Evidence  │ 🟢 Verified │ 15 Jun││
│  │ 📄 Seizure_Memo.pdf          │ Memo      │ 🟢 Verified │ 17 Jun││
│  │ 📄 CDR_Record.xlsx           │ Digital   │ 🟢 Verified │ 20 Jun││
│  │ 📄 FSL_Report_BIO_0847.pdf   │ Forensic  │ 🟢 Verified │ 01 Sep││
│  │ 📄 Witness_Stmt_02.pdf       │ Statement │ 🟡 Processing│ Today││
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

### PAGE 5: Document Upload (`/documents/upload`)

**PS Requirement**: D1 — *"Digitize and centralize"*, B2-B9 — All document types

```
┌──────────────────────────────────────────────────────────────────────┐
│  📤 UPLOAD DOCUMENT                                                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Case: FIR 142/2026 — PS Sarojini Nagar                             │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │         📁 Drag & drop files here or click to browse           │  │
│  │                                                                │  │
│  │         Supported: PDF, JPEG, PNG, TIFF, MP4, MP3, DOCX       │  │
│  │         Max size: 50 MB per file                               │  │
│  │                                                                │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Document Type:    [FIR ▼]                                           │
│  ┌────────────────────────────────┐                                  │
│  │ ○ FIR                         │                                  │
│  │ ○ Case Diary Entry            │                                  │
│  │ ○ Witness Statement           │                                  │
│  │ ○ Seizure Memo                │                                  │
│  │ ○ Charge Sheet                │                                  │
│  │ ○ Evidence (Photo/Video)      │                                  │
│  │ ○ Digital Evidence (CDR/Dump) │                                  │
│  │ ○ Forensic Report             │                                  │
│  │ ○ Court Order / Judgment      │                                  │
│  │ ○ Legal Notice                │                                  │
│  │ ○ Other                       │                                  │
│  └────────────────────────────────┘                                  │
│                                                                      │
│  Title:            [FIR No. 142/2026 — Original Copy            ]   │
│  Description:      [Scanned copy of handwritten FIR...           ]  │
│  Classification:   [🟡 CONFIDENTIAL ▼]                              │
│  Language:         [🔤 Auto-detect ▼] (Hindi / English / Other)     │
│                                                                      │
│  ☐ This document contains witness consent (DPDPA 2023)              │
│  ☐ This is a POCSO case document — auto-flag for redaction          │
│                                                                      │
│  [📤 Upload & Secure]                                                │
│                                                                      │
│  UPLOAD PROGRESS:                                                    │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ ✅ File validated (magic bytes + size)                         │  │
│  │ ✅ Malware scan passed                                         │  │
│  │ ✅ Metadata stripped (EXIF removed)                             │  │
│  │ ✅ SHA-256 hash computed: a3f8c244e9b2...                      │  │
│  │ ✅ Encrypted (AES-256-GCM) and stored                          │  │
│  │ ✅ Merkle tree updated (leaf #847)                              │  │
│  │ ⏳ OCR processing... (estimated: 30 seconds)                   │  │
│  │ ⏳ AI entity detection...                                      │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

### PAGE 6: Secure Document Viewer (`/documents/[id]`)

**PS Requirement**: D2, D3 — *"Secure access"* + *"Prevent unauthorized modifications"*

```
┌──────────────────────────────────────────────────────────────────────┐
│  📄 FIR_142_2026.pdf │ 🟢 VERIFIED │ 🔒 CONFIDENTIAL               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  TOOLBAR:                                                            │
│  [🔍 Verify Hash] [📄 Sec 65B Cert] [📤 Forward] [✏️ Redact]       │
│  [📋 Custody Chain] [📜 Version History] [📊 Audit Log]             │
│                                                                      │
│  VIEW MODE: [◉ Full (Authorized)] [○ Redacted (Public)]             │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  ╔════════════════════════════════════════════════════════════╗│  │
│  │  ║                                                            ║│  │
│  │  ║  F.I.R. No. 142/2026                                      ║│  │
│  │  ║  P.S. Sarojini Nagar, South Delhi                         ║│  │
│  │  ║                                                            ║│  │
│  │  ║  ╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱  ║│  │
│  │  ║ ╱ VIEWED BY: INSP. R. KUMAR | DL-4821 | 10.42.1.88    ╱  ║│  │
│  │  ║╱ 2026-09-10 01:15:30 IST                              ╱   ║│  │
│  │  ║ ╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱  ║│  │
│  │  ║                                                            ║│  │
│  │  ║  Date: 15/06/2026                                          ║│  │
│  │  ║  Complainant: Priya Sharma                                 ║│  │
│  │  ║  Address: 42, Lajpat Nagar, New Delhi                     ║│  │
│  │  ║                                                            ║│  │
│  │  ╚════════════════════════════════════════════════════════════╝│  │
│  │  Page 1 of 3   [◀ Prev] [Next ▶]                              │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─── DOCUMENT INFO ──────────────────────────────────────────────┐  │
│  │ Hash (SHA-256): a3f8c244e9b2f1d3c8a7e6b5d4c3f2a1b0e9d8...    │  │
│  │ Integrity:      🟢 VERIFIED (Merkle proof valid)               │  │
│  │ Blockchain:     ⛓️ Anchored on Polygon (Tx: 0x7a2b...)         │  │
│  │ Uploaded by:    Insp. Rajesh Kumar (DL-4821) on 15 Jun 2026   │  │
│  │ Current Custodian: Insp. Rajesh Kumar (DL-4821)               │  │
│  │ Classification: 🟡 CONFIDENTIAL                                │  │
│  │ OCR Language:   Hindi + English (confidence: 94.2%)            │  │
│  │ AI Tags:        POCSO, Sexual Offense, Minor Victim            │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

### PAGE 7: Integrity Verification (`/documents/[id]/verify`)

**PS Requirement**: D3 — *"Prevent unauthorized modifications"*, T1 — Blockchain

```
┌──────────────────────────────────────────────────────────────────────┐
│  🔍 DOCUMENT INTEGRITY VERIFICATION                                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Document: FIR_142_2026.pdf                                          │
│                                                                      │
│  ┌─── STEP 1: FILE HASH ──────────────────────── ✅ PASSED ──────┐  │
│  │ Stored Hash:    a3f8c244e9b2f1d3c8a7e6b5d4c3f2a1b0e9d8c7...  │  │
│  │ Computed Hash:  a3f8c244e9b2f1d3c8a7e6b5d4c3f2a1b0e9d8c7...  │  │
│  │ Result:         🟢 MATCH — File has NOT been modified          │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─── STEP 2: MERKLE TREE ─────────────────────── ✅ PASSED ─────┐  │
│  │ Leaf Hash:      7b2e91f3a84d5c6b...                            │  │
│  │ Tree Path:      Leaf → H(AB) → H(ABCD) → Root                 │  │
│  │ Computed Root:  d4c1a0e8f7b2c3d5...                            │  │
│  │ Stored Root:    d4c1a0e8f7b2c3d5...                            │  │
│  │ Result:         🟢 MATCH — Merkle tree is consistent           │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─── STEP 3: BLOCKCHAIN ANCHOR ───────────────── ✅ PASSED ─────┐  │
│  │ Merkle Root:    d4c1a0e8f7b2c3d5...                            │  │
│  │ Polygon Tx:     0x7a2b3c4d5e6f...                              │  │
│  │ Block Number:   #52,847,293                                    │  │
│  │ Anchored At:    10 Sep 2026, 00:00:00 IST                     │  │
│  │ Result:         🟢 CONFIRMED — Root matches on-chain anchor    │  │
│  │                 [🔗 View on PolygonScan]                       │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ╔════════════════════════════════════════════════════════════════╗  │
│  ║  FINAL VERDICT: 🟢 FULLY VERIFIED & AUTHENTIC                 ║  │
│  ║                                                                ║  │
│  ║  This document has passed all 3 verification checks.           ║  │
│  ║  It has not been modified since upload and is admissible       ║  │
│  ║  as electronic evidence under BSA 2023 (Sec 65B).             ║  │
│  ║                                                                ║  │
│  ║  [📄 Generate Sec 65B Certificate]                             ║  │
│  ╚════════════════════════════════════════════════════════════════╝  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

### PAGE 8: AI Redaction Review (`/documents/[id]/redact`)

**PS Requirement**: W2, W3 — Victim identity protection (NCRB Women Safety Division)

*(Wireframe in previous documents — Human-in-the-loop redaction preview)*

---

### PAGE 9: Global Search (`/search`)

**PS Requirement**: B10, D5 — *"Difficulty locating documents"* / *"Efficient search and retrieval"*

```
┌──────────────────────────────────────────────────────────────────────┐
│  🔍 SEARCH ACROSS ALL CASES & DOCUMENTS                             │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────── [Search]──┐ │
│  │ 🔍  knife attack lajpat nagar june 2026                        │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  FILTERS:                                                            │
│  Doc Type: [All ▼]  Section: [BNS 103 ▼]  Station: [All ▼]        │
│  Date: [Jun 2026 — Sep 2026]  Status: [Active ▼]                    │
│  Language: [All ▼]                                                   │
│                                                                      │
│  RESULTS (3 found in 0.12s):                                         │
│                                                                      │
│  📄 FIR 142/2026 — PS Sarojini Nagar                                │
│     "...accused used a **knife** to **attack** the victim near       │
│      **Lajpat Nagar** market on 15/**June** **2026**..."             │
│     Relevance: 98% │ Type: FIR │ 🟢 Verified                        │
│                                                                      │
│  📄 Witness Statement — Case 142/2026                                │
│     "...I saw the man holding a **knife** running towards             │
│      **Lajpat Nagar** metro station..."                              │
│     Relevance: 87% │ Type: Statement │ 🟢 Verified                  │
│                                                                      │
│  📄 FSL Report BIO/0847 — Case 142/2026                              │
│     "...**knife** recovered from scene, blood sample matched..."     │
│     Relevance: 72% │ Type: Forensic │ 🟢 Verified                   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

### PAGE 10: Case Timeline (`/cases/[id]/timeline`)

**PS Requirement**: B15 — *"Delays in legal and investigative processes"*

```
┌──────────────────────────────────────────────────────────────────────┐
│  📅 CASE TIMELINE — FIR 142/2026                                     │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  15 Jun ──●── FIR Registered by IO Rajesh Kumar                      │
│           │   📄 FIR_142_2026.pdf uploaded                           │
│           │                                                          │
│  15 Jun ──●── Crime scene photos uploaded (2 files)                  │
│           │   📷 Scene_Photo_01.jpg, Scene_Photo_02.jpg              │
│           │                                                          │
│  16 Jun ──●── Witness statement recorded                             │
│           │   📄 Witness_Stmt_01.pdf (consent captured ✅)           │
│           │                                                          │
│  17 Jun ──●── Seizure memo created                                   │
│           │   📄 Seizure_Memo.pdf — Knife recovered                  │
│           │                                                          │
│  18 Jun ──●── Evidence forwarded to CFSL Delhi                       │
│           │   🔬 Custody: IO R. Kumar → Dr. A. Sharma (FSL)         │
│           │                                                          │
│  20 Jun ──●── CDR records obtained from telecom                      │
│           │   📄 CDR_Record.xlsx uploaded                            │
│           │                                                          │
│  01 Sep ──●── Forensic report received                               │
│           │   📄 FSL_Report_BIO_0847.pdf — DNA match confirmed       │
│           │   🔬 Custody: Dr. A. Sharma → IO R. Kumar               │
│           │                                                          │
│  Today ───●── Witness statement #2 uploaded (processing...)          │
│           │   📄 Witness_Stmt_02.pdf                                 │
│           │                                                          │
│  ⏳ ──────●── UPCOMING: Charge sheet due in 4 days                   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

### PAGE 11: Analytics Dashboard (`/analytics`)

**PS Requirement**: B16 — *"Poor auditability"* + National oversight

*(India map + charts — detailed in system design document)*

---

### PAGE 12: Audit Log (`/audit-log`)

**PS Requirement**: D4 — *"Maintain a complete audit trail"*

```
┌──────────────────────────────────────────────────────────────────────┐
│  📋 AUDIT TRAIL                                     [Export CSV]     │
├──────────────────────────────────────────────────────────────────────┤
│  Filters: [Action ▼] [User ▼] [Case ▼] [Date Range]               │
│                                                                      │
│  TIMESTAMP          │ USER              │ ACTION           │ DETAIL │
│  ────────────────────┼───────────────────┼──────────────────┼────── │
│  10 Sep 01:15:30    │ Insp. R. Kumar    │ DOCUMENT_VIEWED  │ FIR.. │
│  10 Sep 01:14:22    │ Insp. R. Kumar    │ LOGIN            │ MFA ✅│
│  10 Sep 00:30:00    │ SYSTEM            │ MERKLE_ANCHORED  │ Poly..│
│  09 Sep 23:45:11    │ Dr. A. Sharma     │ DOC_UPLOADED     │ FSL..│
│  09 Sep 23:44:08    │ Dr. A. Sharma     │ CUSTODY_RECEIVED │ Evid.│
│  09 Sep 22:10:33    │ SI P. Mehta       │ CASE_UPDATED     │ Stat.│
│  09 Sep 21:00:00    │ SYSTEM            │ ANOMALY_FLAGGED  │ ⚠️ ..│
│                                                                      │
│  Each row is cryptographically chained (hash of previous entry).     │
│  Any tampering breaks the chain. [🔍 Verify Chain Integrity]        │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

### REMAINING PAGES (Summary)

| # | Page | PS Requirement | Key Feature |
|---|---|---|---|
| 13 | `/cases/[id]/diary` | B3 — Investigation records | Daily case diary entries as mandated by BNSS |
| 14 | `/cases/[id]/bundle` | B6 — Court filings | Compile all docs + generate Sec 65B certs + export PDF bundle |
| 15 | `/documents/[id]/cert` | D7, T1 — Compliance + Blockchain | View/download generated Sec 65B certificate |
| 16 | `/documents/[id]/history` | B13 — Version control | Side-by-side diff of document versions |
| 17 | `/notifications` | B14, B15 — Collaboration + delays | Real-time alerts: FSL reports, deadlines, transfers |
| 18 | `/admin/users` | D2 — Secure access | Create/edit/deactivate officer accounts |
| 19 | `/admin/security` | T2 — Cybersecurity | Anomaly alerts, break-glass logs, failed logins |
| 20 | `/admin/compliance` | D7 — Regulatory compliance | DPDPA consent status, CERT-In log retention, data review |
| 21 | `/settings` | General | Profile, password change, language, theme (dark/light) |
| 22 | `/verify/{hash}` | D3 — Prevent tampering | PUBLIC page: anyone with a hash can verify a document |
| 23 | `/cases/new` | E1 — Lifecycle | Create new case with FIR details, sections, classification |
| 24 | `/documents/[id]/transfer` | D6 — Collaboration | Transfer custody to FSL/Prosecutor with reason + log |

---

## Step 4: FEATURE PRIORITY FOR HACKATHON

### 🔴 MUST HAVE (Demo will fail without these — build first)

| # | Feature | Pages Involved |
|---|---|---|
| 1 | Login + MFA + Role Switching | `/login`, Dashboard |
| 2 | Case CRUD (Create, List, View) | `/cases`, `/cases/new`, `/cases/[id]` |
| 3 | Document Upload with Hash + Encrypt | `/documents/upload` |
| 4 | Secure Document Viewer with Watermark | `/documents/[id]` |
| 5 | SHA-256 + Merkle Tree + Tamper Detection | `/documents/[id]/verify` |
| 6 | AI PII Redaction (Human-in-the-loop) | `/documents/[id]/redact` |
| 7 | Audit Trail (Immutable log) | `/audit-log` |
| 8 | Inter-Agency Transfer (IO → FSL → PP) | Transfer workflow |
| 9 | Sec 65B Certificate Generation | `/documents/[id]/cert` |
| 10 | Role-Based Dashboards (5 roles) | `/dashboard` |

### 🟡 SHOULD HAVE (Judges will ask — build if time permits)

| # | Feature | Pages Involved |
|---|---|---|
| 11 | Global Search (Elasticsearch) | `/search` |
| 12 | Case Timeline | `/cases/[id]/timeline` |
| 13 | Analytics Dashboard with India Map | `/analytics` |
| 14 | Notification Center | `/notifications` |
| 15 | Bilingual UI (English + Hindi) | All pages |

### 🟢 NICE TO HAVE (Wow factor — build last)

| # | Feature | Pages Involved |
|---|---|---|
| 16 | Offline PWA Mode | Service Worker |
| 17 | Document Version History | `/documents/[id]/history` |
| 18 | Polygon Blockchain Anchoring (live demo) | `/documents/[id]/verify` |
| 19 | Public Verification Page | `/verify/{hash}` |
| 20 | Admin Security Dashboard | `/admin/security` |

---

## Step 5: DEMO SCRIPT (2-Minute Judge Walkthrough)

```
MINUTE 0:00 — LOGIN
"This is Nyay Suraksha, a secure DMS for the Ministry of Home Affairs."
→ Login as IO Rajesh Kumar → Show MFA → Enter Dashboard

MINUTE 0:20 — UPLOAD
"An IO at the crime scene uploads an FIR scan."
→ Upload FIR PDF → Show: validation, malware scan, hash, encryption, Merkle insertion

MINUTE 0:40 — AI REDACTION
"This is a POCSO case. The system auto-detects victim PII."
→ Click Redact → Show AI highlights → Human approves → Dual copy generated

MINUTE 1:00 — TAMPER DETECTION (THE WOW MOMENT)
"Now let me show what happens if someone tries to tamper."
→ Manually corrupt 1 byte in the database
→ Refresh verification page → 🔴 TAMPERED — INTEGRITY VIOLATION
→ "The system detected tampering at the byte level."

MINUTE 1:20 — INTER-AGENCY TRANSFER
"IO forwards evidence to FSL Delhi."
→ Switch role to FSL → Show FSL receives it → FSL uploads forensic report
→ Switch to Prosecutor → Show complete case bundle ready

MINUTE 1:40 — COURT BUNDLE + SEC 65B
"The prosecutor generates a court-ready bundle."
→ Click Generate → Show indexed PDF + Sec 65B certificate with hash + Merkle proof

MINUTE 2:00 — CLOSE
"Every action is logged in a tamper-proof audit trail anchored to Polygon."
→ Show audit log → Show Polygon transaction → End
```

---

> [!IMPORTANT]
> Every single page and feature above traces directly back to a specific line in the SIH26190 problem statement. No feature exists "just because" — every one has a legal, functional, or security justification. Approve this and we start building Phase 1 code.
