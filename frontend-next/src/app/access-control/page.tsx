"use client";

import React from 'react';
import { API } from '@/lib/api';
import { useAppState } from '@/lib/StateContext';

export default function AccessControlPage() {
  const { language, currentOfficer, switchToOfficer } = useAppState();
  const isHindi = language === 'HI';
  const officer = currentOfficer;

  const simulateUnauthorizedAccess = async () => {
    try {
      const officerId = 'NDIS-AUD-9904'; // Auditor (Read-Only)
      const token = `TOKEN-${officerId}-${Date.now()}`;

      // Call protected download endpoint with Auditor token
      // Using direct fetch so we can catch the 403, or let API utility handle it
      const res = await API.get('/documents/doc-001/download', {}, {
        'Authorization': `Bearer ${token}`,
        'X-Officer-ID': officerId
      });
      // The API utility will automatically show the modal on 403
    } catch (e) {
      console.error('Unauthorized access test complete', e);
    }
  };

  if (!officer) return null;

  return (
    <div>
      <div className="page-header-bar">
        <div className="page-title-group">
          <h1>{isHindi ? 'भूमिका-आधारित पहुंच नियंत्रण (RBAC)' : 'Role-Based Access Control (RBAC)'}</h1>
          <div className="page-subtitle">
            Zero-Trust statutory permissions matrix, jurisdictional boundaries, and separation of duties
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-danger btn-sm" onClick={simulateUnauthorizedAccess}>
            🛡 Test Unauthorized Action (403 Demo)
          </button>
        </div>
      </div>

      {/* Active Officer Clearance & Live Persona Switcher */}
      <div className="gov-card" style={{ backgroundColor: '#FFFFFF', borderLeft: '4px solid var(--gov-navy-primary)' }}>
        <div className="gov-card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gov-text-muted)' }}>
              Current Active Session Credentials
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gov-navy-dark)', marginTop: '2px' }}>
              {officer.full_name} ({officer.officer_id})
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gov-text-secondary)' }}>
              <strong>Role:</strong> {officer.role_name} • <strong>Designation:</strong> {officer.designation} • <strong>Jurisdiction:</strong> {officer.department_name}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label className="filter-label" style={{ marginBottom: 0 }}>Switch Demo Persona:</label>
            <select className="form-control" value={officer.officer_id} onChange={e => switchToOfficer(e.target.value)}>
              <option value="NDIS-IO-4102">A. Sharma (Lead Investigation Officer)</option>
              <option value="NDIS-FO-8819">R. Patel (Senior Forensic Specialist)</option>
              <option value="NDIS-LO-3301">N. Singh (Legal & Prosecution Officer)</option>
              <option value="NDIS-AUD-9904">K. Iyer (Auditor - READ ONLY)</option>
              <option value="NDIS-DH-1002">V. Mehta (Joint Director / Dept Head)</option>
              <option value="NDIS-ADM-0001">S. Rajan (Systems Administrator)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statutory Role Definitions & Access Policies */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="gov-card" style={{ marginBottom: 0 }}>
          <div className="gov-card-header">
            <div className="gov-card-title">Investigation Officer</div>
            <span className="badge badge-active">FULL CASE ACCESS</span>
          </div>
          <div className="gov-card-body" style={{ fontSize: '12px', color: 'var(--gov-text-secondary)', lineHeight: 1.6 }}>
            <strong>Example:</strong> A. Sharma (EIU)<br />
            Authorized to register cases, upload primary evidence, record depositions, and request cross-department transfers.
          </div>
        </div>

        <div className="gov-card" style={{ marginBottom: 0 }}>
          <div className="gov-card-header">
            <div className="gov-card-title">Forensic Officer</div>
            <span className="badge badge-info">EVIDENCE + FORENSIC</span>
          </div>
          <div className="gov-card-body" style={{ fontSize: '12px', color: 'var(--gov-text-secondary)', lineHeight: 1.6 }}>
            <strong>Example:</strong> R. Patel (FSD)<br />
            Authorized to inspect bitstream images, calculate SHA-256 hashes, certify digital evidence, and custody locker operations.
          </div>
        </div>

        <div className="gov-card" style={{ marginBottom: 0 }}>
          <div className="gov-card-header">
            <div className="gov-card-title">Legal Officer</div>
            <span className="badge badge-secret">LEGAL DOCUMENTS</span>
          </div>
          <div className="gov-card-body" style={{ fontSize: '12px', color: 'var(--gov-text-secondary)', lineHeight: 1.6 }}>
            <strong>Example:</strong> N. Singh (LAD)<br />
            Authorized to prepare court complaints, review charge sheets, examine statutory adherence, and judicial submissions.
          </div>
        </div>

        <div className="gov-card" style={{ marginBottom: 0 }}>
          <div className="gov-card-header">
            <div className="gov-card-title">Statutory Auditor</div>
            <span className="badge badge-review">READ ONLY</span>
          </div>
          <div className="gov-card-body" style={{ fontSize: '12px', color: 'var(--gov-text-secondary)', lineHeight: 1.6 }}>
            <strong>Example:</strong> K. Iyer (Vigilance)<br />
            Restricted to read-only oversight and audit inspection. All upload, edit, download, and delete operations are rejected.
          </div>
        </div>
      </div>

      {/* Complete Statutory Permissions Matrix Table */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">
            <span>🛡</span> Institutional Statutory Permissions Matrix
          </div>
        </div>
        <div className="table-responsive">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Statutory Role</th>
                <th style={{ textAlign: 'center' }}>VIEW</th>
                <th style={{ textAlign: 'center' }}>UPLOAD</th>
                <th style={{ textAlign: 'center' }}>DOWNLOAD</th>
                <th style={{ textAlign: 'center' }}>EDIT</th>
                <th style={{ textAlign: 'center' }}>SHARE</th>
                <th style={{ textAlign: 'center' }}>VERIFY</th>
                <th style={{ textAlign: 'center' }}>AUDIT</th>
                <th style={{ textAlign: 'center' }}>TRANSFER</th>
                <th style={{ textAlign: 'center' }}>CREATE CASE</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Administrator</strong></td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
              </tr>
              <tr>
                <td><strong>Department Head</strong></td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
              </tr>
              <tr>
                <td><strong>Investigation Officer</strong></td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: '#CBD5E1' }}>—</td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
              </tr>
              <tr>
                <td><strong>Forensic Officer</strong></td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: '#CBD5E1' }}>—</td>
                <td style={{ textAlign: 'center', color: '#CBD5E1' }}>—</td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: '#CBD5E1' }}>—</td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: '#CBD5E1' }}>—</td>
              </tr>
              <tr>
                <td><strong>Legal Officer</strong></td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: '#CBD5E1' }}>—</td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: '#CBD5E1' }}>—</td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: '#CBD5E1' }}>—</td>
                <td style={{ textAlign: 'center', color: '#CBD5E1' }}>—</td>
                <td style={{ textAlign: 'center', color: '#CBD5E1' }}>—</td>
              </tr>
              <tr style={{ backgroundColor: '#FFFDF0' }}>
                <td><strong>Auditor (Read-Only)</strong></td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: 'var(--status-critical)', fontWeight: 700 }}>✗</td>
                <td style={{ textAlign: 'center', color: 'var(--status-critical)', fontWeight: 700 }}>✗</td>
                <td style={{ textAlign: 'center', color: 'var(--status-critical)', fontWeight: 700 }}>✗</td>
                <td style={{ textAlign: 'center', color: 'var(--status-critical)', fontWeight: 700 }}>✗</td>
                <td style={{ textAlign: 'center', color: 'var(--status-critical)', fontWeight: 700 }}>✗</td>
                <td style={{ textAlign: 'center', color: 'var(--gov-green)' }}>✓</td>
                <td style={{ textAlign: 'center', color: 'var(--status-critical)', fontWeight: 700 }}>✗</td>
                <td style={{ textAlign: 'center', color: 'var(--status-critical)', fontWeight: 700 }}>✗</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
