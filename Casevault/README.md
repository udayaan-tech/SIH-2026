# CASEVAULT — Secure Digital Case & Document Management System

> **"Secure Every Document. Trace Every Action. Protect Every Case."**  
> Prototype Platform Developed for **National Digital Investigation Services (NDIS)**  
> Ministry of Home & Legal Affairs Division, Government of India (Prototype Demo)

---

## 🏛 Executive Overview

**CASEVAULT** is an institutional-grade, zero-trust digital case and document management infrastructure purpose-built for law enforcement departments, forensic laboratories, legal prosecution branches, and courts.

The platform provides a unified chain-of-trust:
$$\text{Case Intake} \longrightarrow \text{Document Cryptographic Sealing} \longrightarrow \text{Digital Evidence Vault} \longrightarrow \text{Chain of Custody} \longrightarrow \text{Zero-Trust RBAC} \longrightarrow \text{Immutable Audit Trail}$$

---

## 🌟 Key Capabilities

1. **Government Design System**:
   - Institutional aesthetic: Deep Navy (`#0B2545`), Subtle Saffron (`#E86A17`), and Ashoka Green (`#0A6E31`).
   - Clean tables, status badges, and restrained UI without neon or startup distractions.
   - Screen Reader Access, High-Contrast Mode, Font Sizing (`A-`, `A`, `A+`), and Hindi/English language toggle.
2. **Cryptographic SHA-256 Document Verification**:
   - Real-time bitstream hash calculation using NIST FIPS 180-4 standard.
   - Immediate detection of tampered or altered files (`⚠ INTEGRITY MISMATCH`).
   - Digital signature seals (ECDSA-P256) complying with Section 65B of the Indian Evidence Act.
3. **Statutory Chain of Custody Flowchart**:
   - 5-stage formal pipeline: `Collected → Transferred → Received → Examined → Stored`.
   - Dual-officer handoff with cryptographic signing and immutable audit records.
4. **Zero-Trust Role-Based Access Control (RBAC)**:
   - 6 Governed Roles: Administrator, Department Head, Investigation Officer, Forensic Officer, Legal Officer, and Auditor (Read-Only).
   - Server-side object-level verification preventing BOLA/IDOR vulnerabilities.
   - Built-in simulation of unauthorized access triggering `403 FORBIDDEN - ACCESS DENIED`.
5. **AI Document Intelligence & Smart Search**:
   - Natural language classification (e.g. FIR 96% confidence).
   - Automated named entity recognition (NER): Officers, Suspects, Legal Sections (IPC/PMLA), Monetary Quantums, Locations.
   - Natural language search with relevance scoring (96%, 93%, 89%).
6. **Immutable Vigilance Audit Ledger**:
   - Tamper-evident audit logs with cryptographic HMAC checksums for every sensitive action.
   - Comprehensive filtering and one-click CSV statutory compliance export.
7. **Security & Threat Center**:
   - Live hardware MFA (FIDO2 ready), AES-256 encryption at rest, TLS 1.3 in transit.
   - Sliding-window API rate limiting (429 Too Many Requests) and brute-force protection.
   - System-wide automated cryptographic integrity scanner.
8. **15-Step Interactive Hackathon Demo Script Guide**:
   - Floating guide bar at the bottom enabling judges and presenters to walk through the exact 15-step demo scenario requested in Section 31!

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v18+ (Node.js v22 recommended)
- NPM v9+

### Installation & Run
```bash
# 1. Install dependencies
npm install

# 2. Launch the CASEVAULT platform
npm start
```

Open your browser at:
```
http://localhost:3000
```

---

## ⚡ Hackathon 15-Step Demonstration Scenario (Section 31)

CASEVAULT features an interactive **Demo Script Guide bar** docked at the bottom of the screen. You can either use the `⚡ Run Step` button or perform each step manually:

1. **Login as Investigation Officer**: Enter credentials for Lead IO A. Sharma (`NDIS-IO-4102`). Experience the 3-stage authentication flow: *"Authenticating Officer..."* $\to$ *"Verifying credentials..."* $\to$ *"Access granted"*.
2. **Open CASE-2026-041**: Navigate to the Apex FinCorp Multi-Jurisdiction Shell Diversion investigation workspace.
3. **Upload Forensic_Report.pdf**: Open the Document Intake modal and run the multi-stage cryptographic pipeline: Scanning $\to$ Metadata extraction $\to$ SHA-256 hash generation $\to$ Audit entry.
4. **Show AI Classification**: Open AI Document Intelligence to inspect classification (FIR 96% confidence), extracted legal entities, and case summaries.
5. **Generate SHA-256 Hash**: Open split-screen Document Viewer to review the calculated bitstream checksum and digital signature seal.
6. **Show Document Verification**: Click `[ Verify Integrity ]` to observe `✓ MATCH: DOCUMENT VERIFIED`. Toggle `[ Simulate Tampering ]` to trigger `⚠ INTEGRITY MISMATCH`.
7. **Register Evidence**: Open Evidence Vault and register a seized hardware exhibit.
8. **Transfer Evidence to Forensic Officer**: Initiate custody handover of Exhibit `EVD-2026-041-01` to Officer R. Patel (FSD).
9. **Show Chain of Custody**: View the 5-stage visual custody flowchart: `Collected → Transferred → Received → Examined → Stored`.
10. **Search via AI Smart Search**: Run semantic natural language query: *"Find financial evidence related to Case 041"*. Inspect relevance scores (96%, 93%, 89%).
11. **Switch Role to Auditor (Read-Only)**: Use the top persona switcher to switch to Auditor K. Iyer (`NDIS-AUD-9904`).
12. **Attempt Unauthorized Access**: Click `[ Test Unauthorized Action ]` or attempt to download a classified document. Observe the authentic government **`403 FORBIDDEN - ACCESS DENIED`** modal.
13. **Open Audit Trail**: Inspect the immutable vigilance ledger to confirm the unauthorized attempt was recorded with IP and correlation ID.
14. **Export Statutory Report**: Click `[ Export Audit Report ]` to download the compliance CSV.
15. **Open Security Center**: Inspect active hardware MFA status, AES-256 encryption, rate-limiting policies, and run a system-wide integrity scan.

---

## 🛡 API Security Architecture (Section 34 & 35)

```text
Request
   ↓
Authentication (Bearer Token / Officer Verification)
   ↓
Authorization (Role + Case Clearance Check - Anti-BOLA)
   ↓
Input Validation & File Signature Check
   ↓
Business Rules & Cryptographic Engine (SHA-256 / HMAC)
   ↓
Database (PostgreSQL / SQLite Dual-Engine)
   ↓
Immutable Audit Logging (Tamper-evident checksum)
   ↓
Response (With X-Request-ID Header)
```

Interactive developer documentation and OWASP compliance matrix is accessible directly in the platform under the **API Docs** navigation tab or via `GET /api/v1/docs`.
