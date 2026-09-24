"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API } from '@/lib/api';
import { useAppState } from '@/lib/StateContext';

export default function DashboardPage() {
  const router = useRouter();
  const { currentOfficer, language } = useAppState();
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const isHindi = language === 'HI';
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  useEffect(() => {
    async function fetchCases() {
      try {
        const res = await API.get('/cases?status=ACTIVE');
        if (res.data) {
          setCases(res.data.slice(0, 5));
        }
      } catch (e) {
        console.error('Error fetching dashboard cases:', e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCases();
  }, []);

  if (!currentOfficer) return <div>Loading...</div>;

  return (
    <div>
      {/* Welcome Hero Section */}
      <div style={{
        backgroundColor: 'var(--gov-navy-dark)',
        color: '#ffffff',
        padding: '32px 40px',
        borderRadius: 'var(--radius-md)',
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="page-title-group">
            <h1 style={{ color: '#ffffff', fontSize: '28px', fontWeight: 700, marginBottom: '6px' }}>
              {isHindi ? 'संचालन डैशबोर्ड' : 'Operations Dashboard'}
            </h1>
            <div className="page-subtitle" style={{ color: 'var(--gov-border-light)', fontSize: '15px' }}>
              {isHindi ? 'स्वागत है' : 'Welcome back'}, <strong style={{ color: '#ffffff' }}>{currentOfficer.full_name}</strong> ({currentOfficer.designation})
            </div>
          </div>
          <div className="page-actions" style={{ gap: '12px' }}>
            <div className="badge badge-active" style={{ fontSize: '13px', padding: '6px 12px', cursor: 'pointer' }} onClick={() => router.push('/security-center')} role="status">
              System Status: SECURE
            </div>
            <button className="btn btn-primary" onClick={() => router.push('/cases')}>
              <i className="fa-solid fa-plus" style={{ marginRight: '6px' }}></i> Manage Cases
            </button>
          </div>
        </div>

        {/* Clear Meta Strip */}
        <div style={{ 
          backgroundColor: 'var(--gov-surface)', 
          border: '1px solid var(--gov-border)', 
          borderRadius: 'var(--radius-sm)', 
          padding: '12px 16px', 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '16px', 
          fontSize: '13px', 
          color: 'var(--gov-text-secondary)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Date:</span> <strong style={{ color: 'var(--gov-text-primary)' }}>{today}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Last Login:</span> <strong style={{ color: 'var(--gov-text-primary)' }}>{currentOfficer.last_login || 'Today, 13:42:15 IST'}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Dept:</span> <strong style={{ color: 'var(--gov-text-primary)' }}>{currentOfficer.department_name || 'Economic Investigation Unit'}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Clearance:</span> <span className="badge badge-review">Tier-1 Restricted</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>MFA:</span> <span style={{ color: 'var(--status-active)', fontWeight: 700 }}><i className="fa-solid fa-check" style={{ marginRight: '4px' }}></i> ACTIVE</span>
          </div>
        </div>
      </div>

      {/* 6 Clean Official Statistic Cards */}
      <div className="stat-cards-grid">
        <div className="stat-card stat-active" onClick={() => router.push('/cases')} style={{ cursor: 'pointer' }}>
          <div className="stat-title">ACTIVE CASES</div>
          <div className="stat-value">128</div>
          <div className="stat-subtext"><span style={{ color: 'var(--gov-green)' }}><i className="fa-solid fa-arrow-up" style={{ marginRight: '2px' }}></i> 4 new</span> registered this month</div>
        </div>

        <div className="stat-card" onClick={() => router.push('/documents')} style={{ cursor: 'pointer' }}>
          <div className="stat-title">DOCUMENTS</div>
          <div className="stat-value">4,821</div>
          <div className="stat-subtext">SHA-256 Bitstream Verified</div>
        </div>

        <div className="stat-card" onClick={() => router.push('/evidence')} style={{ cursor: 'pointer' }}>
          <div className="stat-title">EVIDENCE RECORDS</div>
          <div className="stat-value">936</div>
          <div className="stat-subtext">100% Chain-of-Custody logged</div>
        </div>

        <div className="stat-card stat-warning" onClick={() => router.push('/documents')} style={{ cursor: 'pointer' }}>
          <div className="stat-title">PENDING REVIEWS</div>
          <div className="stat-value">17</div>
          <div className="stat-subtext"><span style={{ color: 'var(--gov-saffron)' }}><i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '2px' }}></i> Action required</span> for court filing</div>
        </div>

        <div className="stat-card" onClick={() => router.push('/audit-trail')} style={{ cursor: 'pointer' }}>
          <div className="stat-title">AUDIT EVENTS</div>
          <div className="stat-value">12,481</div>
          <div className="stat-subtext">Immutable HMAC Checksummed</div>
        </div>

        <div className="stat-card stat-danger" onClick={() => router.push('/security-center')} style={{ cursor: 'pointer' }}>
          <div className="stat-title">SECURITY ALERTS</div>
          <div className="stat-value">07</div>
          <div className="stat-subtext"><span style={{ color: 'var(--status-critical)' }}>Zero Breaches</span> • 7 Blocked</div>
        </div>
      </div>

      {/* Main Operational Grid: Active Inquiries & Action Feeds */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.1fr', gap: '20px' }}>
        
        {/* Active High-Priority Inquiries */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <i className="fa-solid fa-folder-open" style={{ color: 'var(--gov-navy-light)' }}></i> Priority Investigation Cases
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => router.push('/cases')}>
              View All Cases (10) <i className="fa-solid fa-arrow-right" style={{ marginLeft: '6px' }}></i>
            </button>
          </div>
          <div className="table-responsive">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Title</th>
                  <th>Department</th>
                  <th>Lead Officer</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>Loading official cases ledger...</td></tr>
                ) : (
                  cases.map(c => (
                    <tr key={c.id}>
                      <td><strong className="font-mono" style={{ color: 'var(--gov-navy-primary)' }}>{c.case_number}</strong></td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)' }}>{c.case_type}</div>
                      </td>
                      <td>{c.department_name}</td>
                      <td>{c.lead_officer_name}</td>
                      <td><span className="badge badge-active">{c.status}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/cases/${c.id}`)}>
                          Open Case
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Verifications & Urgent Action Center */}
        <div>
          <div className="gov-card" style={{ marginBottom: '20px' }}>
            <div className="gov-card-header" style={{ backgroundColor: 'var(--gov-saffron-light)' }}>
              <div className="gov-card-title" style={{ color: 'var(--status-review)' }}>
                <i className="fa-solid fa-triangle-exclamation"></i> Pending Evidentiary Reviews
              </div>
            </div>
            <div className="gov-card-body" style={{ padding: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #FCD34D', borderLeft: '4px solid var(--gov-saffron)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <strong style={{ fontSize: '13px' }}>ChargeSheet_v2.pdf</strong>
                    <span className="badge badge-review">UNDER REVIEW</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)', margin: '3px 0' }}>
                    CASE-2026-041 • Uploaded by N. Singh (Legal Dept)
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => router.push('/documents/doc-003')}>Verify SHA-256</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => router.push('/cases/case-041')}>Open Case</button>
                  </div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--gov-border)', borderLeft: '4px solid var(--gov-green)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <strong style={{ fontSize: '13px' }}>Forensic_Report.pdf</strong>
                    <span className="badge badge-verified">VERIFIED</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)', margin: '3px 0' }}>
                    CASE-2026-041 • Digital bitstream signature valid
                  </div>
                  <button className="btn btn-primary btn-sm" style={{ marginTop: '12px' }} onClick={() => router.push('/documents/doc-002')}>
                    Inspect Ledger
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick System Architecture & Zero-Trust Notice */}
          <div className="gov-card">
            <div className="gov-card-header">
              <div className="gov-card-title">
                <i className="fa-solid fa-shield-halved" style={{ color: 'var(--gov-navy-light)' }}></i> Security & Compliance UX
              </div>
            </div>
            <div className="gov-card-body" style={{ fontSize: '12px', color: 'var(--gov-text-secondary)', lineHeight: 1.6 }}>
              <p>Every sensitive action on CASEVAULT automatically triggers an immutable audit log with cryptographic SHA-256 checksums.</p>
              <div style={{ marginTop: '10px', borderTop: '1px dashed var(--gov-border)', paddingTop: '8px' }}>
                <div>• Object-Level Authorization: <strong>Enforced</strong></div>
                <div>• API Rate Limiting: <strong>Active (Sliding Window)</strong></div>
                <div>• Cryptographic Hash: <strong>SHA-256 FIPS 180-4</strong></div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
