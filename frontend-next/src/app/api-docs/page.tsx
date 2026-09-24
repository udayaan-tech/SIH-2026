"use client";

import React, { useEffect, useState } from 'react';
import { API } from '@/lib/api';

export default function ApiDocsPage() {
  const [specData, setSpecData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDocs() {
      try {
        const res = await API.get('/docs');
        setSpecData(res.data);
      } catch (e) {
        console.error('Error fetching API spec:', e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDocs();
  }, []);

  return (
    <div>
      <div className="page-header-bar">
        <div className="page-title-group">
          <h1>CASEVAULT REST API v1 Specification & Security Baseline</h1>
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
                    <th>CASEVAULT Defense-in-Depth Implementation</th>
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
                <span>🌐</span> CASEVAULT API v1 Protected Endpoints
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
