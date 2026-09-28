"use client";

import React, { useEffect, useState } from 'react';
import { API } from '@/lib/api';

const DEFAULT_DOCS = {
  owaspMatrix: [
    { risk: "API1:2023 - Broken Object Level Authorization (BOLA)", mitigation: "Multi-tenant tenant/officer ID checks on every /cases/:id and /documents/:id endpoint. Database queries enforce officer badge scoping." },
    { risk: "API2:2023 - Broken Authentication", mitigation: "Mandatory TOTP Multi-Factor Authentication (MFA), HMAC-SHA256 JWT tokens with 15-minute rotation, and rate-limited auth endpoints." },
    { risk: "API3:2023 - Broken Object Property Level Authorization", mitigation: "Strict request payload DTO whitelisting. Read-only fields such as merkle_root and document_hash cannot be overwritten by client payloads." },
    { risk: "API4:2023 - Unrestricted Resource Consumption", mitigation: "Sliding-window per-IP rate limiter (120 req/min), 512MB multipart upload caps, and streaming chunked SHA-256 hashing to prevent memory exhaustion." },
    { risk: "API5:2023 - Broken Function Level Authorization", mitigation: "Role-Based Access Control (RBAC) middleware verifying roles (Lead IO, Forensic Tech, Malkhana Officer, Public Prosecutor, Vigilance Auditor)." },
    { risk: "API6:2023 - Server-Side Request Forgery (SSRF)", mitigation: "Storage drivers bind strictly to configured MinIO internal endpoints. No dynamic external URL fetches are permitted." },
    { risk: "API7:2023 - Security Misconfiguration", mitigation: "Hardened response headers: CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, and strict CORS blocking wildcards in production." },
    { risk: "API8:2023 - Lack of Protection from Automated Threats", mitigation: "Automated brute-force lockout after 5 failed password/OTP attempts, CAPTCHA challenge requirements, and audit trail logging." },
    { risk: "API9:2023 - Improper Inventory Management", mitigation: "Strict API path versioning (/api/v1/...) with synchronized documentation and deprecated route sunset policies." },
    { risk: "API10:2023 - Unsafe Consumption of APIs", mitigation: "Cryptographic payload validation, ZKP commitment checks, and immutable Merkle root pinning for all upstream/downstream exchanges." }
  ],
  endpoints: [
    { method: "POST", path: "/api/v1/auth/login", auth: "Public (Pre-auth)", permission: "Any valid Badge ID", description: "Validates officer credentials and issues temporary session token for MFA step.", request: "{ badge_id, password, department }", response: "{ mfa_required: true, session_token: '...' }" },
    { method: "POST", path: "/api/v1/auth/mfa/verify", auth: "Session Token", permission: "Pending 2FA", description: "Verifies 6-digit TOTP code and issues signed JWT bearer token.", request: "{ session_token, badge_id, otp }", response: "{ token: 'eyJhbGciOi...', officer: { ... } }" },
    { method: "GET", path: "/api/v1/cases", auth: "JWT Bearer", permission: "Authenticated Officers", description: "Lists cases accessible to the authenticated officer's jurisdiction.", request: "Query: ?status=ACTIVE&limit=20", response: "{ cases: [ ... ], total: 42 }" },
    { method: "POST", path: "/api/v1/cases", auth: "JWT Bearer", permission: "Lead IO / Station House Officer", description: "Registers a new FIR with statutory Indian law sections (BNS/POCSO/IT Act).", request: "{ fir_number, title, legal_sections, incident_date }", response: "{ case_id: 'case-...', status: 'ACTIVE' }" },
    { method: "POST", path: "/api/v1/evidence/upload", auth: "JWT Bearer", permission: "Investigating Officers / Forensic Techs", description: "Processes evidence through the 6-stage cryptographic pipeline and Merkle pinning.", request: "Multipart: file, case_id, title, category", response: "{ document_id, sha256_hash, merkle_root }" },
    { method: "GET", path: "/api/v1/evidence/:id/certificate", auth: "JWT Bearer", permission: "Court-authorized Officers / Prosecutors", description: "Generates court-admissible BSA Section 63/65B Certificate with embedded verification QR matrix.", request: "Path: :id", response: "{ certificate_number, hash, qr_code_url, verification_endpoint }" },
    { method: "GET", path: "/api/v1/public/verify/:hash", auth: "None (Public Courtroom)", permission: "Unrestricted Judicial Verification", description: "Zero-Knowledge courtroom evidence verification against cryptographic Merkle root.", request: "Path: :hash", response: "{ verified: true, match: true, merkle_root, timestamp }" },
    { method: "POST", path: "/api/v1/custody/handshake/sign", auth: "JWT Bearer", permission: "Designated Recipient Officer", description: "Dual-officer digital signature completing statutory chain-of-custody transfer.", request: "{ transfer_id, recipient_signature, status: 'ACCEPTED' }", response: "{ status: 'COMPLETED', seal_state: 'INTACT' }" },
    { method: "GET", path: "/api/v1/security/overview", auth: "JWT Bearer", permission: "Security Admin / IT Vigilance", description: "Returns real-time threat telemetry, Merkle tree health, and self-healing engine status.", request: "None", response: "{ total_documents, tamper_count, blocked_attacks, recent_events }" },
    { method: "POST", path: "/api/v1/security/restore-integrity", auth: "JWT Bearer", permission: "Security Admin", description: "Cryptographically heals tampered evidence records back to their pinned Merkle hash.", request: "{ document_id }", response: "{ success: true, restored_hash, message }" }
  ]
};

export default function ApiDocsPage() {
  const [specData, setSpecData] = useState<any>(DEFAULT_DOCS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchDocs() {
      try {
        const res = await API.get('/docs');
        if (res?.data) {
          setSpecData(res.data);
        }
      } catch (e) {
        // Fallback already in state
      }
    }
    fetchDocs();
  }, []);

  return (
    <div>
      <div className="page-header-bar">
        <div className="page-title-group">
          <h1>Sakshya Setu (साक्ष्य सेतु) REST API v1 Specification & Security Baseline</h1>
          <div className="page-subtitle">
            Zero-Trust, defense-in-depth government integration interfaces and OWASP API security mitigations
          </div>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          Loading API specification...
        </div>
      ) : specData ? (
        <div>
          {/* Security Architecture Banner */}
          <div className="gov-card" style={{ borderLeft: '4px solid var(--gov-saffron)', padding: '18px', marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--gov-navy-dark)', textTransform: 'uppercase', marginBottom: '6px' }}>
              SECTION 35 SECURITY PRINCIPLE: THE FRONTEND IS NEVER TRUSTED
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gov-text-secondary)', lineHeight: 1.6 }}>
              <code>Request → Authentication (Token) → Authorization (RBAC) → Input Validation → Business Rules → Database / Storage → Immutable Audit Logging → Response</code>
              <div style={{ marginTop: '6px', color: 'var(--gov-navy-dark)', fontWeight: 600 }}>
                "Deny by default. Grant only required access. Record every sensitive action."
              </div>
            </div>
          </div>

          {/* OWASP Top 10 API Security Baseline */}
          <div className="gov-card">
            <div className="gov-card-header">
              <div className="gov-card-title">
                <span>🛡</span> OWASP API Security Baseline Implementation Matrix
              </div>
            </div>
            <div className="table-responsive">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th style={{ width: '35%' }}>OWASP Risk Category</th>
                    <th>Sakshya Setu Defense-in-Depth Implementation</th>
                  </tr>
                </thead>
                <tbody>
                  {specData.owaspMatrix?.map((m: any, idx: number) => (
                    <tr key={idx}>
                      <td><strong>{m.risk}</strong></td>
                      <td style={{ fontSize: '12px', color: 'var(--gov-text-secondary)' }}>{m.mitigation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Versioned Endpoints */}
          <div className="gov-card" style={{ marginTop: '24px' }}>
            <div className="gov-card-header">
              <div className="gov-card-title">
                <span>🌐</span> Sakshya Setu API v1 Protected Endpoints
              </div>
              <span className="badge badge-info">BASE PATH: /api/v1</span>
            </div>
            <div className="table-responsive">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Endpoint Path</th>
                    <th>Authentication & Role</th>
                    <th>Description</th>
                    <th>Request & Response Schemas</th>
                  </tr>
                </thead>
                <tbody>
                  {specData.endpoints?.map((ep: any, idx: number) => {
                    let mBadge = 'badge-info';
                    if (ep.method === 'POST') mBadge = 'badge-verified';
                    if (ep.method === 'PATCH') mBadge = 'badge-review';
                    if (ep.method === 'DELETE') mBadge = 'badge-critical';

                    return (
                      <tr key={idx}>
                        <td><span className={`badge ${mBadge}`} style={{ fontWeight: 800 }}>{ep.method}</span></td>
                        <td className="font-mono" style={{ fontWeight: 700, color: 'var(--gov-navy-primary)' }}>{ep.path}</td>
                        <td>
                          <div style={{ fontSize: '11px', fontWeight: 600 }}>{ep.auth}</div>
                          <span className="badge badge-secondary" style={{ fontSize: '10px' }}>{ep.permission}</span>
                        </td>
                        <td style={{ fontSize: '12px', maxWidth: '250px' }}>{ep.description}</td>
                        <td style={{ fontSize: '11px' }}>
                          <div><strong>Req:</strong> <code className="font-mono" style={{ color: 'var(--gov-text-muted)' }}>{ep.request}</code></div>
                          <div style={{ marginTop: '4px' }}><strong>Res:</strong> <code className="font-mono" style={{ color: 'var(--gov-green)' }}>{ep.response}</code></div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
