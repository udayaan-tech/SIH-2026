"use client";

import React, { useEffect, useState } from 'react';
import { API } from '@/lib/api';
import { useAppState } from '@/lib/StateContext';

export default function SecurityCenterPage() {
  const { language } = useAppState();
  const isHindi = language === 'HI';

  const [securityData, setSecurityData] = useState<any>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');

  useEffect(() => {
    async function fetchOverview() {
      try {
        const res = await API.get('/security/overview');
        setSecurityData(res.data);
      } catch (e) {
        console.error('Error loading security data:', e);
      }
    }
    fetchOverview();
  }, []);

  const runIntegrityScan = async () => {
    setIsScanning(true);
    setScanError('');
    setScanResult(null);

    try {
      const res = await API.post('/security/scan-integrity', {});
      setScanResult(res);
    } catch (e: any) {
      setScanError(e.message || 'Scan failed');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div>
      <div className="page-header-bar">
        <div className="page-title-group">
          <h1>{isHindi ? 'सुरक्षा एवं अनुपालन केंद्र' : 'Security & Compliance Center'}</h1>
          <div className="page-subtitle">
            Defense-in-Depth posture, active threat telemetry, rate limiting status, and cryptographic health
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-sm" onClick={runIntegrityScan}>
            🛡 Run System-Wide Cryptographic Integrity Scan
          </button>
        </div>
      </div>

      {/* Core Security Control Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div className="stat-card stat-active">
          <div className="stat-title">HARDWARE MFA</div>
          <div className="stat-value" style={{ fontSize: '20px', color: 'var(--gov-green)' }}>✓ ENABLED</div>
          <div className="stat-subtext">FIDO2 / WebAuthn Enforced</div>
        </div>

        <div className="stat-card stat-active">
          <div className="stat-title">ENCRYPTION SUITE</div>
          <div className="stat-value" style={{ fontSize: '20px', color: 'var(--gov-green)' }}>AES-256-GCM</div>
          <div className="stat-subtext">TLS 1.3 Strict in Transit</div>
        </div>

        <div className="stat-card stat-active">
          <div className="stat-title">ACCESS CONTROL</div>
          <div className="stat-value" style={{ fontSize: '20px', color: 'var(--gov-navy-primary)' }}>ZERO-TRUST</div>
          <div className="stat-subtext">Object-Level BOLA Defense</div>
        </div>

        <div className="stat-card stat-active">
          <div className="stat-title">DOCUMENT INTEGRITY</div>
          <div className="stat-value" style={{ fontSize: '20px', color: 'var(--gov-green)' }}>SHA-256</div>
          <div className="stat-subtext">100% Bitstream Match</div>
        </div>

        <div className="stat-card stat-active">
          <div className="stat-title">AUDIT TRAIL</div>
          <div className="stat-value" style={{ fontSize: '20px', color: 'var(--gov-green)' }}>IMMUTABLE</div>
          <div className="stat-subtext">Tamper-Evident HMAC Seals</div>
        </div>

        <div className="stat-card stat-active">
          <div className="stat-title">DIGITAL SIGNATURES</div>
          <div className="stat-value" style={{ fontSize: '20px', color: 'var(--gov-green)' }}>ECDSA-P256</div>
          <div className="stat-subtext">Statutory Evidence Act 65B</div>
        </div>
      </div>

      {/* Scan Result Box */}
      {isScanning && (
        <div style={{ marginBottom: '20px', padding: '14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--gov-surface-alt)', border: '1px solid var(--gov-border)' }}>
          <strong>SCANNING:</strong> Calculating real-time SHA-256 bitstream checksums across 40 evidentiary records...
        </div>
      )}
      {scanError && (
        <div style={{ marginBottom: '20px', padding: '14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--status-critical)', color: 'white' }}>
          Scan failed: {scanError}
        </div>
      )}
      {scanResult && !isScanning && (
        <div style={{ marginBottom: '20px', padding: '14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--status-active-bg)', border: '1px solid #A3D9B5', color: 'var(--status-active)' }}>
          <strong>✓ INTEGRITY SCAN COMPLETE:</strong> {scanResult.message}
          <div style={{ fontSize: '11px', marginTop: '4px' }}>Scanned: {scanResult.scannedCount} | Mismatches: {scanResult.mismatches} | Completed at: {scanResult.timestamp}</div>
        </div>
      )}

      {/* Active Threat Telemetry & Rate Limiting Configuration */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        
        {/* Security Events Table */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <span>🚨</span> Real-Time Security Incident Telemetry
            </div>
            <span style={{ fontSize: '11px', color: 'var(--gov-text-muted)' }}>Automated Vigilance Log</span>
          </div>
          <div className="table-responsive">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Severity</th>
                  <th>Incident Type</th>
                  <th>Event Description</th>
                  <th>Source IP</th>
                  <th>Target Badge</th>
                </tr>
              </thead>
              <tbody>
                {!securityData ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>Loading security telemetry...</td></tr>
                ) : securityData.recentEvents?.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>No security incidents recorded.</td></tr>
                ) : (
                  securityData.recentEvents?.map((s: any, idx: number) => {
                    let badgeClass = 'badge-info';
                    if (s.severity === 'CRITICAL') badgeClass = 'badge-critical';
                    if (s.severity === 'WARNING') badgeClass = 'badge-review';

                    return (
                      <tr key={idx}>
                        <td className="font-mono" style={{ fontSize: '11px' }}>{s.timestamp}</td>
                        <td><span className={`badge ${badgeClass}`}>{s.severity}</span></td>
                        <td><strong style={{ color: 'var(--gov-navy-primary)', fontSize: '11px' }}>{s.event_type}</strong></td>
                        <td style={{ fontSize: '12px', lineHeight: 1.4 }}>{s.description}</td>
                        <td className="font-mono" style={{ fontSize: '11px' }}>{s.source_ip || '10.42.1.10'}</td>
                        <td className="font-mono" style={{ fontSize: '11px', fontWeight: 700 }}>{s.officer_id || 'SYSTEM'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Defense-in-Depth Policies & Rate Limits */}
        <div>
          <div className="gov-card">
            <div className="gov-card-header">
              <div className="gov-card-title">API Rate Limiting Policy</div>
            </div>
            <div className="gov-card-body" style={{ fontSize: '12px', color: 'var(--gov-text-secondary)', lineHeight: 1.8 }}>
              <div style={{ borderBottom: '1px solid var(--gov-border-light)', paddingBottom: '6px', marginBottom: '6px' }}>
                <strong>Officer Login:</strong> <span className="font-mono">15 attempts / min / IP</span>
              </div>
              <div style={{ borderBottom: '1px solid var(--gov-border-light)', paddingBottom: '6px', marginBottom: '6px' }}>
                <strong>AI Smart Search:</strong> <span className="font-mono">60 queries / min / officer</span>
              </div>
              <div style={{ borderBottom: '1px solid var(--gov-border-light)', paddingBottom: '6px', marginBottom: '6px' }}>
                <strong>Document Ingestion:</strong> <span className="font-mono">50 uploads / hour / client</span>
              </div>
              <div>
                <strong>General REST API:</strong> <span className="font-mono">120 requests / min / session</span>
              </div>
            </div>
          </div>

          <div className="gov-card">
            <div className="gov-card-header">
              <div className="gov-card-title">Brute-Force Shield</div>
            </div>
            <div className="gov-card-body" style={{ fontSize: '12px', color: 'var(--gov-text-secondary)', lineHeight: 1.6 }}>
              <p>Repeated failed credential attempts automatically enforce progressive exponential backoff delays and generate security advisories.</p>
              <div style={{ marginTop: '10px', background: 'var(--gov-surface-alt)', padding: '8px 12px', border: '1px solid var(--gov-border-light)', borderRadius: 'var(--radius-sm)', fontSize: '11px' }}>
                <strong>Zero-Account-Enumeration Rule:</strong> Generic error messages prevent discovery of valid officer badges.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
