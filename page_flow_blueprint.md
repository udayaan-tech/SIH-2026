# 🏛️ SAKSHYA KAVACH — Complete Page Flow & Navigation Blueprint

## How Every Page Connects (End-to-End)

---

## THE MASTER FLOW (How a Real Criminal Case Moves Through Our App)

```
  👮 IO at Police Station                🔬 FSL Expert               ⚖️ Prosecutor              🧑‍⚖️ Judge
  ═══════════════════                ════════════════            ════════════════           ═══════════
         │                                  │                         │                        │
    [1. LOGIN + MFA]                   [1. LOGIN + MFA]          [1. LOGIN + MFA]         [1. LOGIN + MFA]
         │                                  │                         │                        │
    [2. DASHBOARD]                     [2. DASHBOARD]            [2. DASHBOARD]           [2. DASHBOARD]
    (sees: My Cases,                   (sees: Pending            (sees: Cases for         (sees: Cases
     Pending Uploads,                   Samples,                  Scrutiny,                for Trial,
     Alerts)                            Lab Queue)                Evidence Status)          Pending Orders)
         │                                  │                         │                        │
    [3. CREATE NEW CASE]                    │                         │                        │
    (FIR No, Sections,                      │                         │                        │
     Accused, Victim)                       │                         │                        │
         │                                  │                         │                        │
    [4. UPLOAD EVIDENCE]                    │                         │                        │
    (Drag file → SHA-256                    │                         │                        │
     hash → Merkle leaf                     │                         │                        │
     → Encrypted storage)                   │                         │                        │
         │                                  │                         │                        │
    [5. AI REDACTION]                       │                         │                        │
    (If POCSO/Women case:                   │                         │                        │
     Auto-detect victim PII                 │                         │                        │
     → Human approves                       │                         │                        │
     → Dual-vault sealed)                   │                         │                        │
         │                                  │                         │                        │
    [6. TRANSFER TO FSL] ──────────────→ [7. FSL RECEIVES]           │                        │
    (Dual-officer handshake:             (Views evidence,            │                        │
     IO signs + FSL signs)                runs tests,                │                        │
                                          uploads report)            │                        │
                                              │                      │                        │
                                         [8. FSL UPLOADS REPORT]     │                        │
                                         (Forensic report →          │                        │
                                          hashed + sealed)           │                        │
                                              │                      │                        │
                                         [9. TRANSFER TO PP] ───→ [10. PP REVIEWS]           │
                                         (Dual handshake)         (Scrutinizes all           │
                                                                   evidence + reports,       │
                                                                   checks integrity)         │
                                                                       │                     │
                                                                  [11. GENERATE              │
                                                                   COURT BUNDLE]             │
                                                                  (Compile all docs          │
                                                                   + Sec 65B certs           │
                                                                   + Merkle proofs)          │
                                                                       │                     │
                                                                  [12. SUBMIT TO COURT] ──→ [13. JUDGE REVIEWS]
                                                                                            (Opens sealed vault,
                                                                                             verifies integrity,
                                                                                             views unredacted
                                                                                             master in-camera)
                                                                                                  │
                                                                                            [14. ISSUE ORDER]
                                                                                            (Judgment uploaded,
                                                                                             case status: CLOSED)
```

---

## PAGE-BY-PAGE DETAILED SPECIFICATION

---

### PAGE 1: `/` — Login + MFA Authentication

**Purpose:** The entry gate. Every user starts here.

**What's on screen:**
- Government header with Ashoka emblem + "Ministry of Home Affairs / NCRB"
- Badge Number / Service ID input field
- Password field
- "Continue" button → triggers MFA step
- 6-digit OTP input (sent via NIC SMS Gateway)
- "Verify & Enter" button

**Connections:**
```
[Login] ──(success)──→ [/dashboard]
[Login] ──(wrong OTP)──→ [Stay on login, show error]
[Login] ──(3 failed attempts)──→ [Account locked, alert to Admin]
```

**Data needed from backend:** `POST /api/v1/auth/login` → returns JWT token + user role

---

### PAGE 2: `/dashboard` — Role-Adaptive Command Dashboard

**Purpose:** The home screen. Changes completely based on WHO is logged in.

**What's on screen (common):**
- Top bar: Role badge, officer name, station, Hindi/English toggle
- 4 KPI metric cards
- Recent activity feed
- Quick action buttons

**Role-specific content:**

| Role | KPI Cards | Quick Actions | Activity Feed Shows |
|---|---|---|---|
| **IO** | My Cases (12), Evidence Uploaded (48), Pending Redactions (3), Tamper Alerts (0) | "Register New FIR", "Upload Evidence", "Transfer to FSL" | Your recent uploads, custody transfers, redaction requests |
| **FSL** | Pending Samples (5), Reports Filed (23), Integrity Score (100%), Avg Turnaround (48h) | "View Pending Queue", "Upload Report" | Incoming evidence from police stations, report submissions |
| **Prosecutor** | Cases for Scrutiny (8), Court Dates This Week (3), Bundles Generated (15), Evidence Verified (100%) | "Review Case", "Generate Court Bundle", "Verify Evidence" | New evidence forwarded by FSL, upcoming court deadlines |
| **Judge** | Active Trials (6), Pending Orders (2), Evidence Bundles Received (4), Sealed Vault Items (12) | "Open In-Camera Vault", "Verify Evidence", "Issue Order" | Court bundle submissions, integrity verification results |
| **Admin** | Total Users (342), Active Sessions (89), Tamper Alerts (0), System Health (99.9%) | "Manage Users", "View Audit Trail", "Security Dashboard" | Login attempts, permission changes, anomaly detections |

**Connections:**
```
[Dashboard] ──(click "Register New FIR")──→ [/cases/new]
[Dashboard] ──(click "Upload Evidence")──→ [/documents/upload]
[Dashboard] ──(click a case in feed)──→ [/cases/[id]]
[Dashboard] ──(click "Transfer to FSL")──→ [/custody-chain]
[Dashboard] ──(sidebar nav)──→ [Any other page]
```

---

### PAGE 3: `/cases/new` — Register New FIR / Case 🔴 TO BUILD

**Purpose:** IO registers a brand new criminal case in the system.

**What's on screen:**
- Form fields:
  - FIR Number (auto-generated: `FIR-DEL-2026-XXXX`)
  - Police Station (dropdown)
  - Date & Time of Incident
  - Legal Sections Applied (BNS sections, e.g., "BNS 303, 376")
  - Case Category (auto-detect: if 376/POCSO → flags Women Safety)
  - Accused Details (Name, Father's Name, Address)
  - Victim Details (Name — will be auto-redacted later if POCSO)
  - Investigating Officer Badge ID (auto-filled from login)
  - Brief Description / Gist
- "Register Case" button

**Connections:**
```
[/cases/new] ──(submit)──→ [/cases/[id]] (newly created case detail)
[/cases/new] ──(if POCSO detected)──→ Shows warning: "⚠️ POCSO Case — AI Redaction will be mandatory"
```

---

### PAGE 4: `/case-registry` — Case List / Registry ✅ BUILT

**Purpose:** Browse and search all cases the logged-in user has access to.

**What's on screen:**
- Search bar + filters (by status, date range, section, priority)
- Table with columns: FIR No, Date, Sections, Status (Active/Charge Sheet/Trial/Closed), Assigned IO, Priority badge
- Click any row → opens that case

**Connections:**
```
[/case-registry] ──(click row)──→ [/cases/[id]]
[/case-registry] ──(click "New Case")──→ [/cases/new]
```

---

### PAGE 5: `/cases/[id]` — Case Detail View 🔴 TO BUILD

**Purpose:** Single case overview showing everything about one FIR.

**What's on screen:**
- Case header: FIR No, Status badge, Assigned IO, Legal Sections
- **Tab 1: Documents** — List of all evidence/documents attached to this case (click any → `/documents/[id]`)
- **Tab 2: Timeline** — Visual custody chain (embedded from `/cases/[id]/timeline`)
- **Tab 3: Officers** — All personnel assigned to this case
- **Tab 4: Diary** — Daily investigation diary entries
- Action buttons:
  - "Upload New Evidence" → `/documents/upload?case=FIR-DEL-2026-0421`
  - "Transfer to FSL" → `/custody-chain` with pre-filled case
  - "Generate Court Bundle" (PP/Judge only) → `/cases/[id]/bundle`

**Connections:**
```
[/cases/[id]] ──(click document)──→ [/documents/[id]]
[/cases/[id]] ──(click "Upload")──→ [/documents/upload]
[/cases/[id]] ──(click "Transfer")──→ [/custody-chain]
[/cases/[id]] ──(click "Timeline" tab)──→ [/cases/[id]/timeline]
[/cases/[id]] ──(click "Court Bundle")──→ [/cases/[id]/bundle]
```

---

### PAGE 6: `/cases/[id]/timeline` — Visual Case Timeline 🔴 TO BUILD

**Purpose:** Shows every custody handoff as a visual pipeline.

**What's on screen:**
```
●━━━━━━━━━●━━━━━━━━━●━━━━━━━━━●━━━━━━━━━●
Seized      Malkhana    FSL Lab     Prosecutor    Court
by IO       Vault       Testing     Scrutiny      Admitted
10:00 AM    04:30 PM    Sep 3       Sep 7          Sep 10
SI Rajesh   HC Meena    Dr. Verma   PP Sharma     Judge Roy
```

- Click any node → expands to show:
  - Who handed over (Badge, Name, Signature)
  - Who received (Badge, Name, Signature)
  - Timestamp (NTP-synced)
  - Integrity hash at that moment

**Connections:**
```
[/cases/[id]/timeline] ──(click a document at any node)──→ [/documents/[id]]
[/cases/[id]/timeline] ──(back)──→ [/cases/[id]]
```

---

### PAGE 7: `/documents/upload` — Smart Evidence Upload 🔴 TO BUILD

**Purpose:** The core ingestion screen where evidence enters the system.

**What's on screen:**
- Large drag-and-drop zone (accepts PDF, JPG, PNG, MP4, ZIP)
- Metadata form: Case Number (dropdown), Document Type (FIR/Statement/CCTV/Forensic), Source Device Description
- **Live Processing Pipeline Animation** (this is the WOW factor):
  ```
  ✅ File Selected (2.3 MB)
  ⏳ Calculating SHA-256 Hash... → ✅ Hash: a3f9b2c1d4e5...
  ⏳ Stripping EXIF Metadata... → ✅ GPS, Device Info Removed
  ⏳ Malware Scan (ClamAV)... → ✅ Clean
  ⏳ Encrypting (AES-256-GCM)... → ✅ Encrypted
  ⏳ Appending to Merkle Tree... → ✅ Leaf #42 committed
  ⏳ OCR Text Extraction... → ✅ 1,204 words extracted
  ✅ EVIDENCE SEALED SUCCESSFULLY
  ```
- If case is POCSO: automatic redirect to redaction review

**Connections:**
```
[/documents/upload] ──(success)──→ [/documents/[id]] (newly created document)
[/documents/upload] ──(if POCSO case)──→ [/redaction-review] (mandatory PII check)
```

---

### PAGE 8: `/document-vault` — Document & Evidence Library ✅ BUILT

**Purpose:** Central repository of all evidence the user has access to.

**What's on screen:**
- Grid/table of all documents with: Thumbnail, Title, Case No., Type, Upload Date, Integrity Status (🟢/🔴), Classification Level
- Filter sidebar: By case, by type, by date, by integrity status
- Click any document → opens viewer

**Connections:**
```
[/document-vault] ──(click document)──→ [/documents/[id]]
[/document-vault] ──(click "Upload New")──→ [/documents/upload]
```

---

### PAGE 9: `/documents/[id]` — Anti-Leak Forensic Document Viewer 🔴 TO BUILD

**Purpose:** View a document securely without ability to leak it.

**What's on screen:**
- Document rendered on **HTML5 Canvas** (NOT a raw PDF download)
- Diagonal forensic watermark across every page:
  ```
  CONFIDENTIAL | SI RAJESH SHARMA | #DL-4821 | 10.195.21.153 | 2026-09-23 14:30 IST
  ```
- Sidebar panel:
  - Integrity Status: 🟢 VERIFIED (SHA-256 match)
  - Merkle Proof: Leaf #42, Path: [L1→R2→L3→Root]
  - Chain of Custody: 3 handoffs completed
  - Classification: CONFIDENTIAL / RESTRICTED / PUBLIC
- Action buttons:
  - "Verify Integrity" → `/documents/[id]/verify`
  - "View Redacted Copy" (toggle)
  - "Generate Sec 65B Certificate" → `/documents/[id]/cert`
  - "Forward to Next Agency" → `/custody-chain`

**Connections:**
```
[/documents/[id]] ──(click "Verify")──→ [/integrity-monitor] (focused on this doc)
[/documents/[id]] ──(click "Certificate")──→ [/documents/[id]/cert]
[/documents/[id]] ──(click "Forward")──→ [/custody-chain]
[/documents/[id]] ──(click "Version History")──→ [/documents/[id]/history]
```

---

### PAGE 10: `/documents/[id]/cert` — BSA 2023 Sec 65B Certificate 🔴 TO BUILD

**Purpose:** Generate and display a court-admissible electronic evidence certificate.

**What's on screen:**
- Formal certificate styled like an official Government of India document:
  ```
  ┌─────────────────────────────────────────────────────┐
  │            ≡ ASHOKA EMBLEM ≡                        │
  │     GOVERNMENT OF INDIA                             │
  │     MINISTRY OF HOME AFFAIRS                        │
  │                                                     │
  │  CERTIFICATE UNDER SECTION 65B                      │
  │  BHARATIYA SAKSHYA ADHINIYAM, 2023                  │
  │                                                     │
  │  Case No: FIR-DEL-2026-0421                         │
  │  Document: CCTV_Footage_Camera3.mp4                 │
  │  SHA-256: a3f9b2c1d4e5f6a7b8c9d0e1f2...             │
  │  Merkle Root: 7f8a9b0c1d2e3f4a5b6c7d...             │
  │  Blockchain Anchor: Polygon Tx #0x4a8f...           │
  │                                                     │
  │  I hereby certify that:                             │
  │  (a) The electronic record was produced by a        │
  │      computer in regular use                        │
  │  (b) The information was fed in the regular course  │
  │  (c) The computer was operating properly            │
  │  (d) The contents are a true reproduction           │
  │                                                     │
  │  Certifying Officer: SI Rajesh Sharma (#DL-4821)    │
  │  Date: 23 September 2026                            │
  │                                                     │
  │  [QR CODE]  ← Scan to verify on public portal      │
  │                                                     │
  │  Digital Seal: RS256 Signature                      │
  └─────────────────────────────────────────────────────┘
  ```
- Buttons: "Print for Court", "Download PDF", "Share with Prosecutor"

**Connections:**
```
[/documents/[id]/cert] ──(QR scan by anyone)──→ [/verify/[hash]] (public verification)
[/documents/[id]/cert] ──(back)──→ [/documents/[id]]
```

---

### PAGE 11: `/integrity-monitor` — Tamper Detection & Red Team Demo ✅ BUILT (needs upgrade)

**Purpose:** The core USP demo screen. Shows hash verification + live attack simulation.

**What needs to be ADDED:**
- **Red "SIMULATE TAMPER ATTACK" button** at the top
- When clicked:
  - Screen flashes red with alarm animation
  - Shows: `Original Hash: a3f9b2... ≠ Current Hash: b2e1c4...`
  - Shows: `Merkle Proof: INVALID — Node L1 mismatch`
  - Shows: `🚨 ALERT DISPATCHED TO: State Vigilance + High Court Registrar`
- **"Restore from Merkle Anchor" button** to self-heal

**Connections:**
```
[/integrity-monitor] ──(click document ID)──→ [/documents/[id]]
[/integrity-monitor] ──(click "View Certificate")──→ [/documents/[id]/cert]
```

---

### PAGE 12: `/redaction-review` — AI POCSO Redaction Studio ✅ BUILT

**Purpose:** Human-in-the-loop review of AI-detected PII for victim protection.

Already functional. Queue shows pending documents, detail panel shows detected entities with Approve/Reject buttons.

**Connections:**
```
[/redaction-review] ──(after approval)──→ [/documents/[id]] (now shows redacted copy)
[/redaction-review] ──(click document ID)──→ [/documents/[id]]
```

---

### PAGE 13: `/custody-chain` — Chain of Custody & Dual-Handshake ✅ BUILT

**Purpose:** Execute and view evidence custody transfers between agencies.

**Connections:**
```
[/custody-chain] ──(initiate transfer)──→ Notification sent to receiving officer
[/custody-chain] ──(click evidence item)──→ [/documents/[id]]
```

---

### PAGE 14: `/audit-trail` — Immutable WORM Audit Log ✅ BUILT

**Purpose:** Every action in the system is logged forever and cannot be deleted.

**Connections:**
```
[/audit-trail] ──(click any log entry)──→ [/documents/[id]] or [/cases/[id]]
```

---

### PAGE 15–16: `/national-analytics` + `/command-center` ✅ BUILT

**Purpose:** India-wide statistics and situational command overview.

---

### PAGE 17: `/global-search` ✅ BUILT

**Purpose:** Fast search across all cases, documents, officers, and tags.

**Connections:**
```
[/global-search] ──(click result)──→ [/cases/[id]] or [/documents/[id]]
```

---

### PAGE 18: `/claude-copilot` — AI Investigation Assistant ✅ BUILT

**Purpose:** AI chatbot that helps IO with legal cross-referencing, case similarity analysis.

---

### PAGE 19: `/notifications` ✅ BUILT

**Purpose:** Real-time alerts for custody transfers, integrity checks, redaction requests.

**Connections:**
```
[/notifications] ──(click alert)──→ [/cases/[id]] or [/custody-chain] or [/redaction-review]
```

---

### PAGE 20: `/verify/[hash]` — Public QR Verification Portal 🔴 TO BUILD

**Purpose:** A public page (NO LOGIN required) where a defense lawyer or judge scans a QR code from a Sec 65B certificate and instantly verifies the evidence integrity.

**What's on screen:**
- Input field: "Enter document hash or scan QR code"
- Result display:
  - 🟢 `VERIFIED: This document has not been modified since 12-Sep-2026 10:42 AM`
  - Shows: SHA-256 hash, Merkle root, Blockchain anchor transaction ID
  - Does NOT reveal any document content (Zero-Knowledge verification)

**Connections:**
```
[/verify/[hash]] ──(standalone, no login needed)──→ Shows verification result only
```

---

### PAGE 21: `/admin/users` — User & Badge Management 🔴 TO BUILD

**Purpose:** System admin creates officer accounts and assigns roles.

**What's on screen:**
- User table: Badge ID, Name, Role, Station, Status (Active/Locked), Last Login
- "Create New User" form: Badge ID, Name, Role dropdown, Station, Email, Phone
- Actions: Activate, Deactivate, Reset MFA, View Audit Trail for User

---

### PAGES 22–24: `/role-switcher`, `/settings`, `/demo` ✅ BUILT (demo needs rebuild)

---

## 🗺️ COMPLETE NAVIGATION MAP

```
                                    ┌──────────────┐
                                    │   / (LOGIN)   │
                                    └──────┬───────┘
                                           │
                                    ┌──────▼───────┐
                                    │  /dashboard   │
                                    └──────┬───────┘
                                           │
                 ┌─────────────────────────┼─────────────────────────┐
                 │                         │                         │
          ┌──────▼───────┐          ┌──────▼───────┐          ┌──────▼───────┐
          │ /case-registry│          │/document-vault│          │   /search    │
          └──────┬───────┘          └──────┬───────┘          └──────────────┘
                 │                         │
          ┌──────▼───────┐          ┌──────▼───────┐
          │  /cases/new   │          │ /docs/upload  │
          └──────┬───────┘          └──────┬───────┘
                 │                         │
          ┌──────▼───────┐          ┌──────▼───────┐
          │  /cases/[id]  │◄────────│ /documents/[id]│
          └──────┬───────┘          └──────┬───────┘
                 │                    ┌────┼────┐
          ┌──────▼───────┐           │    │    │
          │ /cases/[id]/ │    ┌──────▼┐ ┌▼────▼──────┐
          │  timeline    │    │/redact│ │  /cert      │
          └──────────────┘    └──────┘  └──────┬──────┘
                                               │
                                        ┌──────▼───────┐
                                        │/verify/[hash]│ (PUBLIC)
                                        └──────────────┘

     CROSS-CUTTING PAGES (accessible from sidebar on every screen):
     ┌──────────────┬──────────────┬──────────────┬──────────────┐
     │/custody-chain│/integrity-   │/audit-trail  │/notifications│
     │              │ monitor      │              │              │
     └──────────────┴──────────────┴──────────────┴──────────────┘
     ┌──────────────┬──────────────┬──────────────┬──────────────┐
     │/national-    │/command-     │/claude-      │/role-switcher│
     │ analytics    │ center       │ copilot      │              │
     └──────────────┴──────────────┴──────────────┴──────────────┘
     ┌──────────────┬──────────────┐
     │/admin/users  │/settings     │
     └──────────────┴──────────────┘
```

---

## 🎬 THE JUDGE DEMO FLOW (2-Minute Script Using These Pages)

```
0:00  [/]              → Login as IO Rajesh Sharma → MFA OTP → Enter
0:15  [/dashboard]     → "This is the IO's command center. 12 active cases."
0:25  [/cases/new]     → Register a POCSO case → System auto-flags Women Safety ⚠️
0:40  [/docs/upload]   → Upload CCTV footage → Watch SHA-256 hash animate → Merkle sealed
0:55  [/redaction-review] → AI detected victim name "Priya S." → Approve redaction → Dual vault sealed
1:10  [/integrity-monitor] → ⚡ CLICK "SIMULATE TAMPER ATTACK"
      → 🚨 RED FLASH: "HASH MISMATCH! ALERT TO HIGH COURT REGISTRAR!"
      → "Our system detected tampering at the byte level."
1:30  [/custody-chain] → Transfer evidence: IO → FSL (dual handshake)
      → Switch role to FSL → FSL uploads forensic report
1:45  [/documents/[id]/cert] → Generate BSA 2023 Sec 65B Certificate
      → Show QR code: "Any judge can scan this to verify."
2:00  [/verify/[hash]] → Scan QR → Public portal confirms: "✅ VERIFIED"
      → "Every action logged in tamper-proof audit trail. Thank you."
```
