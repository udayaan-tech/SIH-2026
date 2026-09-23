const express = require('express');
const router = express.Router();

const API_SPEC = {
  version: '1.0.0',
  basePath: '/api/v1',
  securityScheme: {
    type: 'Zero-Trust Token / HMAC Signature',
    header: 'Authorization: Bearer TOKEN-[OFFICER_ID]-[TS] or X-Officer-ID: [OFFICER_ID]',
    correlationHeader: 'X-Request-ID: req_[hex12]'
  },
  endpoints: [
    {
      group: 'Authentication & Session',
      method: 'POST',
      path: '/api/v1/auth/login',
      auth: 'None (Public with IP Rate Limiter)',
      permission: 'PUBLIC',
      description: 'Authenticates officer credentials, evaluates captcha, logs audit trail, returns scoped session token.',
      request: '{ officerId: string, password: string, department: string, captcha: string }',
      response: '200 OK: { token: string, officer: UserProfile } | 401 UNAUTHORIZED | 429 RATE_LIMITED'
    },
    {
      group: 'Cases Management',
      method: 'GET',
      path: '/api/v1/cases',
      auth: 'Required',
      permission: 'VIEW',
      description: 'Lists registered cases with multi-facet filters (Status, Department, Officer, Priority, Case Type).',
      request: 'Query: ?status=&department=&officer=&priority=&search=',
      response: '200 OK: { data: Case[], count: number }'
    },
    {
      group: 'Cases Management',
      method: 'POST',
      path: '/api/v1/cases',
      auth: 'Required',
      permission: 'CREATE_CASE',
      description: 'Registers a new formal investigation case with auto-generated Case ID and audit record.',
      request: '{ title: string, caseType: string, departmentId: string, leadOfficerId: string, priority: string, confidentialityLevel: string, description: string }',
      response: '201 CREATED: { id: string, caseNumber: string, title: string } | 403 FORBIDDEN'
    },
    {
      group: 'Cases Management',
      method: 'GET',
      path: '/api/v1/cases/:id',
      auth: 'Required',
      permission: 'VIEW (Object-Level Authorization Enforced)',
      description: 'Retrieves complete case workspace including 7 tabs (documents, evidence, members, timeline, tasks, audit).',
      request: 'Path param: :id (Case ID or Case Number)',
      response: '200 OK: { ...caseDetails, documents: Doc[], evidence: Ev[], members: Member[] } | 403 FORBIDDEN'
    },
    {
      group: 'Document Repository',
      method: 'POST',
      path: '/api/v1/documents/upload',
      auth: 'Required',
      permission: 'UPLOAD',
      description: 'Accepts encrypted multipart file, verifies magic bytes, generates SHA-256 hash, creates audit entry.',
      request: 'Multipart: file (PDF, DOCX, XLSX, JPG, PNG, ZIP), caseId, title, documentType, securityClassification',
      response: '201 CREATED: { id, documentNumber, sha256Hash, digitalSignature, timestamp } | 400 BAD_REQUEST'
    },
    {
      group: 'Document Repository',
      method: 'POST',
      path: '/api/v1/documents/:id/verify',
      auth: 'Required',
      permission: 'VERIFY',
      description: 'Cryptographically verifies document SHA-256 hash against immutable registered ledger.',
      request: 'Path: :id. Optional body: { simulateTamper: boolean }',
      response: '200 VERIFIED: { verified: true, algorithm: "SHA-256", registeredHash, currentHash } | 409 INTEGRITY_MISMATCH'
    },
    {
      group: 'Document Repository',
      method: 'GET',
      path: '/api/v1/documents/:id/download',
      auth: 'Required',
      permission: 'DOWNLOAD',
      description: 'Enforces object-level clearance and downloads encrypted case record. Unauthorized attempts generate 403 and alert.',
      request: 'Path: :id',
      response: '200 OK (Stream / Text) | 403 FORBIDDEN (Logged to Security Center)'
    },
    {
      group: 'Digital Evidence Vault',
      method: 'POST',
      path: '/api/v1/evidence/:id/transfer',
      auth: 'Required',
      permission: 'TRANSFER',
      description: 'Executes formal evidence chain of custody handover with dual officer verification and ECDSA signature.',
      request: '{ toOfficerId: string, transferReason: string, newStorageLocation: string, actionType: string }',
      response: '200 OK: { evidenceId, fromOfficer, toOfficer, digitalSignature, sha256Verification }'
    },
    {
      group: 'AI Document Intelligence & Search',
      method: 'GET',
      path: '/api/v1/ai/search',
      auth: 'Required',
      permission: 'VIEW',
      description: 'Natural language search across cases, documents, evidence, and entity extractions with % relevance scoring.',
      request: 'Query: ?q=find+financial+evidence+case+041',
      response: '200 OK: { data: ScoredDocument[], count: number, query: string }'
    },
    {
      group: 'Audit & Compliance',
      method: 'GET',
      path: '/api/v1/audit',
      auth: 'Required',
      permission: 'AUDIT',
      description: 'Queries immutable tamper-evident audit ledger with cryptographically verifiable checksums.',
      request: 'Query: ?action=&result=&user=&department=&date=',
      response: '200 OK: { data: AuditLog[], count: number }'
    }
  ],
  owaspMatrix: [
    { risk: 'API1:2023 Broken Object Level Authorization (BOLA/IDOR)', mitigation: 'Object-level ownership verification middleware (RBAC.authorizeCaseAccess) ensures users only access cases in their jurisdiction or assigned team.' },
    { risk: 'API2:2023 Broken Authentication', mitigation: 'Cryptographic session tokens, progressive delays, rate-limiting on login, and server-side token validation without trusting client role claims.' },
    { risk: 'API3:2023 Broken Object Property Level Authorization', mitigation: 'Strict parameter whitelisting and sanitization prevents mass-assignment or unauthorized role escalation.' },
    { risk: 'API4:2023 Unrestricted Resource Consumption', mitigation: 'Sliding-window IP and token rate limiting (15/min login, 60/min search, 50/hr upload) with 429 Too Many Requests response.' },
    { risk: 'API5:2023 Broken Function Level Authorization', mitigation: 'Fine-grained RBAC permissions matrix (`VIEW`, `UPLOAD`, `DOWNLOAD`, `VERIFY`, `AUDIT`, `TRANSFER`) verified on every API route.' },
    { risk: 'API7:2023 Server-Side Request Forgery (SSRF)', mitigation: 'Zero external outbound URL fetches permitted; internal microservices communicate strictly via secure local loops.' },
    { risk: 'API8:2023 Security Misconfiguration', mitigation: 'Helmet-grade security headers (CSP, X-Content-Type-Options, Referrer-Policy, HSTS) enabled by default.' },
    { risk: 'API10:2023 Unsafe Consumption of APIs', mitigation: 'Cryptographic SHA-256 verification and tamper-evident HMAC checksums on all evidentiary records.' }
  ]
};

router.get('/', (req, res) => {
  res.json({ success: true, data: API_SPEC });
});

module.exports = router;
