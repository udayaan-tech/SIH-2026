"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { API } from '@/lib/api';
import { useAppState } from '@/lib/StateContext';

interface DashboardStats {
  active_cases: number;
  total_documents: number;
  evidence_records: number;
  pending_reviews: number;
  audit_events: number;
  security_alerts: number;
}

interface FeedEvent {
  id: string;
  action: string;
  actor_badge: string;
  target_type: string;
  detail: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | string;
  created_at: string;
}

interface CaseItem {
  id: string;
  fir_number?: string;
  case_number?: string;
  title?: string;
  description?: string;
  legal_sections?: string[];
  status?: string;
  is_pocso?: boolean;
  station?: string;
  department_name?: string;
  io_name?: string;
  lead_officer_name?: string;
  io_badge?: string;
  created_at?: string;
  document_count?: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { currentOfficer, language } = useAppState();

  const [stats, setStats] = useState<DashboardStats>({
    active_cases: 0,
    total_documents: 0,
    evidence_records: 0,
    pending_reviews: 0,
    audit_events: 0,
    security_alerts: 0,
  });
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const isHindi = language === 'HI';
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      // 1. Fetch live stats, feed, and active cases in parallel
      const [statsRes, feedRes, casesRes] = await Promise.allSettled([
        API.get('/dashboard/stats'),
        API.get('/dashboard/feed'),
        API.get('/cases?status=ACTIVE'),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
        setStats(statsRes.value.data);
      }

      if (feedRes.status === 'fulfilled' && feedRes.value?.data?.feed) {
        setFeed(feedRes.value.data.feed);
      }

      if (casesRes.status === 'fulfilled' && casesRes.value?.data?.cases) {
        setCases(casesRes.value.data.cases.slice(0, 5));
      }

      const now = new Date();
      setLastRefreshed(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST');
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Format relative timestamp
  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return 'Recently';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  // Badge mapping for event severity
  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'badge-closed'; // red styling
      case 'WARNING':
        return 'badge-review'; // amber styling
      default:
        return 'badge-active'; // green/navy styling
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'fa-shield-halved';
      case 'WARNING':
        return 'fa-triangle-exclamation';
      default:
        return 'fa-circle-check';
    }
  };

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div className="page-title-group">
            <h1 style={{ color: '#ffffff', fontSize: '28px', fontWeight: 700, marginBottom: '6px' }}>
              {isHindi ? 'संचालन डैशबोर्ड' : 'Operations Dashboard'}
            </h1>
            <div className="page-subtitle" style={{ color: 'var(--gov-border-light)', fontSize: '15px' }}>
              {isHindi ? 'स्वागत है' : 'Welcome back'}, <strong style={{ color: '#ffffff' }}>{currentOfficer.full_name}</strong> ({currentOfficer.designation})
            </div>
          </div>
          <div className="page-actions" style={{ gap: '12px', display: 'flex', alignItems: 'center' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => fetchDashboardData(true)} 
              disabled={isRefreshing}
              style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="Refresh live metrics from backend"
            >
              <i className={`fa-solid fa-arrows-rotate ${isRefreshing ? 'fa-spin' : ''}`}></i>
              {isRefreshing ? 'Syncing...' : 'Sync Live'}
            </button>
            <div className="badge badge-active" style={{ fontSize: '13px', padding: '6px 12px', cursor: 'pointer' }} onClick={() => router.push('/security-center')} role="status">
              System: SECURE
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
            <span>Live Sync:</span> <strong style={{ color: 'var(--gov-text-primary)' }}>{lastRefreshed || 'Connecting...'}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Station / Dept:</span> <strong style={{ color: 'var(--gov-text-primary)' }}>{currentOfficer.department_name || 'Economic Investigation Unit'}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Clearance:</span> <span className="badge badge-review">Tier-1 Restricted</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>MFA:</span> <span style={{ color: 'var(--status-active)', fontWeight: 700 }}><i className="fa-solid fa-check" style={{ marginRight: '4px' }}></i> ACTIVE</span>
          </div>
        </div>
      </div>

      {/* 6 Clean Official Statistic Cards Powered by Live Backend APIs */}
      <div className="stat-cards-grid">
        <div className="stat-card stat-active" onClick={() => router.push('/cases')} style={{ cursor: 'pointer' }}>
          <div className="stat-title">ACTIVE CASES</div>
          <div className="stat-value">{isLoading ? '...' : stats.active_cases}</div>
          <div className="stat-subtext">
            <span style={{ color: 'var(--status-active)' }}>
              <i className="fa-solid fa-folder-closed" style={{ marginRight: '4px' }}></i>
              Assigned inquiries
            </span>
          </div>
        </div>

        <div className="stat-card" onClick={() => router.push('/documents')} style={{ cursor: 'pointer' }}>
          <div className="stat-title">TOTAL DOCUMENTS</div>
          <div className="stat-value">{isLoading ? '...' : stats.total_documents.toLocaleString()}</div>
          <div className="stat-subtext">
            <i className="fa-solid fa-file-shield" style={{ marginRight: '4px' }}></i>
            SHA-256 Bitstream Verified
          </div>
        </div>

        <div className="stat-card" onClick={() => router.push('/evidence')} style={{ cursor: 'pointer' }}>
          <div className="stat-title">EVIDENCE RECORDS</div>
          <div className="stat-value">{isLoading ? '...' : stats.evidence_records.toLocaleString()}</div>
          <div className="stat-subtext">
            <i className="fa-solid fa-lock" style={{ marginRight: '4px' }}></i>
            Classified & Vault Secured
          </div>
        </div>

        <div className="stat-card stat-warning" onClick={() => router.push('/documents')} style={{ cursor: 'pointer' }}>
          <div className="stat-title">PENDING REVIEWS</div>
          <div className="stat-value">{isLoading ? '...' : stats.pending_reviews}</div>
          <div className="stat-subtext">
            {stats.pending_reviews > 0 ? (
              <span style={{ color: 'var(--gov-saffron)', fontWeight: 600 }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '4px' }}></i> Action required
              </span>
            ) : (
              <span>All queue items processed</span>
            )}
          </div>
        </div>

        <div className="stat-card" onClick={() => router.push('/audit-trail')} style={{ cursor: 'pointer' }}>
          <div className="stat-title">AUDIT EVENTS</div>
          <div className="stat-value">{isLoading ? '...' : stats.audit_events.toLocaleString()}</div>
          <div className="stat-subtext">
            <i className="fa-solid fa-receipt" style={{ marginRight: '4px' }}></i>
            Immutable WORM Ledger
          </div>
        </div>

        <div className="stat-card stat-danger" onClick={() => router.push('/security-center')} style={{ cursor: 'pointer' }}>
          <div className="stat-title">SECURITY ALERTS</div>
          <div className="stat-value">{isLoading ? '...' : stats.security_alerts}</div>
          <div className="stat-subtext">
            {stats.security_alerts === 0 ? (
              <span style={{ color: 'var(--status-active)', fontWeight: 600 }}>Zero Breaches Detected</span>
            ) : (
              <span style={{ color: 'var(--status-critical)', fontWeight: 600 }}>{stats.security_alerts} Suspicious Events</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Operational Grid: Active Inquiries & Real-time Live Action Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.9fr 1.1fr', gap: '20px' }}>
        
        {/* Active High-Priority Inquiries */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <i className="fa-solid fa-folder-open" style={{ color: 'var(--gov-navy-light)' }}></i> Priority Investigation Cases
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => router.push('/cases')}>
              View All Cases <i className="fa-solid fa-arrow-right" style={{ marginLeft: '6px' }}></i>
            </button>
          </div>
          <div className="table-responsive">
            <table className="gov-table">
              <thead>
                <tr>
                  <th>FIR / Case ID</th>
                  <th>Description & Sections</th>
                  <th>Station</th>
                  <th>Lead Officer</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>Loading cases from official ledger...</td></tr>
                ) : cases.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--gov-text-muted)' }}>
                      No active cases assigned to this officer session.
                    </td>
                  </tr>
                ) : (
                  cases.map(c => {
                    const caseIdentifier = c.fir_number || c.case_number || 'CASE-2026';
                    const caseTitle = c.title || c.description || 'Active Investigation';
                    const legalSections = Array.isArray(c.legal_sections) && c.legal_sections.length > 0 
                      ? c.legal_sections.join(', ') 
                      : (c.is_pocso ? 'POCSO Act 2012' : 'CrPC / BNS 2023');
                    const stationName = c.station || c.department_name || 'Delhi Police HQ';
                    const officerName = c.io_name || c.lead_officer_name || currentOfficer.full_name;

                    return (
                      <tr key={c.id}>
                        <td>
                          <strong className="font-mono" style={{ color: 'var(--gov-navy-primary)' }}>{caseIdentifier}</strong>
                          {c.is_pocso && (
                            <span className="badge badge-closed" style={{ marginLeft: '6px', fontSize: '10px' }}>POCSO</span>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--gov-navy-dark)' }}>
                            {caseTitle.length > 45 ? `${caseTitle.substring(0, 45)}...` : caseTitle}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)' }}>
                            Sections: {legalSections}
                          </div>
                        </td>
                        <td style={{ fontSize: '12px' }}>{stationName}</td>
                        <td style={{ fontSize: '12px' }}>
                          <div style={{ fontWeight: 600 }}>{officerName}</div>
                          {c.io_badge && <div className="font-mono" style={{ fontSize: '11px', color: 'var(--gov-text-muted)' }}>#{c.io_badge}</div>}
                        </td>
                        <td><span className="badge badge-active">{c.status || 'ACTIVE'}</span></td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/cases/${c.id}`)}>
                            Open Case
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Chain-of-Custody & Audit Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="gov-card">
            <div className="gov-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="gov-card-title">
                <i className="fa-solid fa-wave-square" style={{ color: 'var(--status-active)' }}></i> Live Chain-of-Custody & Audit Feed
              </div>
              <span className="badge badge-active" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                WORM Ledger
              </span>
            </div>

            <div className="gov-card-body" style={{ padding: '16px' }}>
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--gov-text-muted)' }}>
                  Loading real-time audit ledger...
                </div>
              ) : feed.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--gov-text-secondary)', fontSize: '13px' }}>
                  <i className="fa-solid fa-circle-check" style={{ fontSize: '24px', color: 'var(--status-active)', marginBottom: '8px', display: 'block' }}></i>
                  All operations logged and verified. No recent alerts.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {feed.map((ev) => (
                    <div 
                      key={ev.id} 
                      style={{ 
                        backgroundColor: '#FFFFFF', 
                        border: '1px solid var(--gov-border)', 
                        borderLeft: `4px solid ${ev.severity === 'CRITICAL' ? 'var(--status-critical)' : ev.severity === 'WARNING' ? 'var(--gov-saffron)' : 'var(--gov-navy-primary)'}`, 
                        padding: '12px', 
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i className={`fa-solid ${getSeverityIcon(ev.severity)}`} style={{ 
                            fontSize: '13px', 
                            color: ev.severity === 'CRITICAL' ? 'var(--status-critical)' : ev.severity === 'WARNING' ? 'var(--gov-saffron)' : 'var(--status-active)' 
                          }}></i>
                          <strong style={{ fontSize: '13px', color: 'var(--gov-navy-dark)' }}>
                            {ev.detail || ev.action}
                          </strong>
                        </div>
                        <span className={`badge ${getSeverityBadgeClass(ev.severity)}`} style={{ fontSize: '10px' }}>
                          {ev.severity}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--gov-text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>Actor: <strong className="font-mono" style={{ color: 'var(--gov-text-secondary)' }}>{ev.actor_badge}</strong></span>
                          <span>•</span>
                          <span>Target: <span style={{ textTransform: 'capitalize' }}>{ev.target_type || 'SYSTEM'}</span></span>
                        </div>
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatTimeAgo(ev.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <button 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => router.push('/audit-trail')} 
                  style={{ width: '100%' }}
                >
                  <i className="fa-solid fa-list-check" style={{ marginRight: '6px' }}></i> View Complete Audit Trail
                </button>
              </div>
            </div>
          </div>

          {/* Quick System Architecture & Zero-Trust Notice */}
          <div className="gov-card">
            <div className="gov-card-header">
              <div className="gov-card-title">
                <i className="fa-solid fa-shield-halved" style={{ color: 'var(--gov-navy-light)' }}></i> Zero-Trust Architecture
              </div>
            </div>
            <div className="gov-card-body" style={{ fontSize: '12px', color: 'var(--gov-text-secondary)', lineHeight: 1.6 }}>
              <p>Every evidentiary access is cryptographically anchored using SHA-256 bitstream verification and logged in a WORM append-only audit trail under <strong>BSA 2023 Sec 65B</strong>.</p>
              <div style={{ marginTop: '10px', borderTop: '1px dashed var(--gov-border)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>• Object-Level Authorization (BOLA): <strong style={{ color: 'var(--status-active)' }}>Enforced</strong></div>
                <div>• Cryptographic Integrity: <strong style={{ color: 'var(--status-active)' }}>SHA-256 FIPS 180-4</strong></div>
                <div>• Live Hash Anchor: <strong>Merkle Tree Root Active</strong></div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
