"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { API } from '@/lib/api';

export default function CaseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const caseId = params.id as string;

  const [currentTab, setCurrentTab] = useState('overview');
  const [caseData, setCaseData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeNode, setActiveNode] = useState<number | null>(null);

  useEffect(() => {
    async function loadCase() {
      try {
        const res = await API.get(`/cases/${caseId}`);
        setCaseData(res.data);
      } catch (e: any) {
        setError(e.message || 'Failed to load case');
      } finally {
        setIsLoading(false);
      }
    }
    loadCase();
  }, [caseId]);

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading case workspace for <strong>{caseId}</strong>...</div>;
  }

  if (error) {
    return <div style={{ color: 'var(--status-critical)', padding: '20px' }}>Failed to load case workspace: {error}</div>;
  }

  if (!caseData) return null;

  const c = caseData;
  const progress = c.investigation_progress || 78;

  const renderTabContent = () => {
    switch (currentTab) {
      case 'overview':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            <div>
              <div className="gov-card">
                <div className="gov-card-header">
                  <div className="gov-card-title">Case Brief & Statutory Allegations</div>
                </div>
                <div className="gov-card-body" style={{ fontSize: '13px', lineHeight: 1.6 }}>
                  <p><strong>Description:</strong> {c.description}</p>
                  <div style={{ marginTop: '12px', background: 'var(--gov-surface-alt)', padding: '10px', border: '1px solid var(--gov-border-light)' }}>
                    <div><strong>Applicable Sections:</strong> <span className="font-mono">{c.acts_sections}</span></div>
                    <div><strong>Jurisdictional Bench:</strong> Special Court for Economic Offences</div>
                    <div><strong>Date Registered:</strong> {c.date_opened}</div>
                  </div>
                </div>
              </div>

              {/* Case Timeline Steps */}
              <div className="gov-card">
                <div className="gov-card-header">
                  <div className="gov-card-title">Investigation Progression Timeline</div>
                </div>
                <div className="gov-card-body">
                  <div className="timeline-list">
                    <div className="timeline-step completed">
                      <div className="timeline-marker">✓</div>
                      <div className="timeline-content">
                        <div className="timeline-title">Case Created & Formal Intake</div>
                        <div className="timeline-time">14 Feb 2026 • Registered by EIU Special Branch</div>
                      </div>
                    </div>
                    <div className="timeline-step completed">
                      <div className="timeline-marker">✓</div>
                      <div className="timeline-content">
                        <div className="timeline-title">FIR Uploaded (FIR_2026_041.pdf)</div>
                        <div className="timeline-time">14 Feb 2026 • SHA-256 Verified by Lead Officer A. Sharma</div>
                      </div>
                    </div>
                    <div className="timeline-step completed">
                      <div className="timeline-marker">✓</div>
                      <div className="timeline-content">
                        <div className="timeline-title">Witness Statement Added (Witness_Statement_07.pdf)</div>
                        <div className="timeline-time">15 Feb 2026 • Deposition of Chief Accounts Officer</div>
                      </div>
                    </div>
                    <div className="timeline-step completed">
                      <div className="timeline-marker">✓</div>
                      <div className="timeline-content">
                        <div className="timeline-title">Financial Records Added (Bank_Transaction_Report.pdf)</div>
                        <div className="timeline-time">20 Feb 2026 • Reconciled bank accounts of 34 shell entities</div>
                      </div>
                    </div>
                    <div className="timeline-step completed">
                      <div className="timeline-marker">✓</div>
                      <div className="timeline-content">
                        <div className="timeline-title">Forensic Report Verified (Forensic_Report.pdf)</div>
                        <div className="timeline-time">02 Mar 2026 • FSD Digital Bitstream Hash Match confirmed</div>
                      </div>
                    </div>
                    <div className="timeline-step current">
                      <div className="timeline-marker">⚡</div>
                      <div className="timeline-content">
                        <div className="timeline-title">Charge Sheet Under Review (ChargeSheet_v2.pdf)</div>
                        <div className="timeline-time">Current Stage • Senior Legal Prosecution review pending</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Side Stats Summary */}
            <div>
              <div className="gov-card">
                <div className="gov-card-header">
                  <div className="gov-card-title">Case Ledger Metrics</div>
                </div>
                <div className="gov-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--gov-border-light)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--gov-text-muted)' }}>DOCUMENTS</span>
                    <strong style={{ fontSize: '16px', color: 'var(--gov-navy-dark)' }}>42</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--gov-border-light)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--gov-text-muted)' }}>EVIDENCE ITEMS</span>
                    <strong style={{ fontSize: '16px', color: 'var(--gov-navy-dark)' }}>17</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--gov-border-light)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--gov-text-muted)' }}>AUTHORIZED USERS</span>
                    <strong style={{ fontSize: '16px', color: 'var(--gov-navy-dark)' }}>06</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--gov-text-muted)' }}>AUDIT EVENTS</span>
                    <strong style={{ fontSize: '16px', color: 'var(--gov-navy-dark)' }}>184</strong>
                  </div>
                </div>
              </div>

              <div className="gov-card">
                <div className="gov-card-header">
                  <div className="gov-card-title">Quick Actions</div>
                </div>
                <div className="gov-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => router.push('/documents/doc-001')}>Open FIR Document</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => router.push('/documents/doc-002')}>Open Forensic Report</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => router.push('/evidence')}>Open Evidence Locker</button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'documents':
        const docs = c.documents || [];
        return (
          <div className="gov-card">
            <div className="gov-card-header">
              <div className="gov-card-title">Case Evidentiary Documents ({docs.length})</div>
              <button className="btn btn-primary btn-sm">+ Upload Document</button>
            </div>
            <div className="table-responsive">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Doc Number</th>
                    <th>Document Title</th>
                    <th>Type</th>
                    <th>Uploaded By</th>
                    <th>Version</th>
                    <th>Integrity</th>
                    <th>Signature</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((d: any) => (
                    <tr key={d.id}>
                      <td><span className="font-mono">{d.document_number}</span></td>
                      <td>
                        <strong>{d.file_name}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)' }}>{d.title}</div>
                      </td>
                      <td><span className="badge badge-info">{d.document_type}</span></td>
                      <td>{d.uploader_name || 'Officer'}</td>
                      <td><span className="badge badge-secondary">{d.version}</span></td>
                      <td><span className={`badge ${d.verification_status === 'VERIFIED' ? 'badge-verified' : 'badge-review'}`}>{d.verification_status}</span></td>
                      <td><span className={`badge ${d.signature_status === 'VALID' ? 'badge-valid' : 'badge-review'}`}>{d.signature_status}</span></td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/documents/${d.id}`)}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'evidence':
        const evs = c.evidence || [];
        return (
          <div className="gov-card">
            <div className="gov-card-header">
              <div className="gov-card-title">Seized Physical & Digital Exhibits ({evs.length})</div>
              <button className="btn btn-primary btn-sm">+ Register Evidence</button>
            </div>
            <div className="table-responsive">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Evidence ID</th>
                    <th>Exhibit Title</th>
                    <th>Type</th>
                    <th>Current Custodian</th>
                    <th>Storage Location</th>
                    <th>Integrity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {evs.map((e: any) => (
                    <tr key={e.id}>
                      <td><strong className="font-mono" style={{ color: 'var(--gov-navy-primary)' }}>{e.evidence_number}</strong></td>
                      <td>
                        <strong>{e.title}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)' }}>{e.description}</div>
                      </td>
                      <td><span className="badge badge-info">{e.evidence_type}</span></td>
                      <td>{e.custodian_name || 'Assigned Officer'}</td>
                      <td><span className="badge badge-secondary">{e.storage_location}</span></td>
                      <td><span className="badge badge-verified">{e.integrity_status}</span></td>
                      <td>
                        <button className="btn btn-secondary btn-sm">Chain of Custody</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'people':
        const members = c.members || [];
        return (
          <div className="gov-card">
            <div className="gov-card-header">
              <div className="gov-card-title">Assigned Investigation Team & Key Persons</div>
            </div>
            <div className="table-responsive">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Officer / Person</th>
                    <th>Badge / Role</th>
                    <th>Department</th>
                    <th>Access Level</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m: any) => (
                    <tr key={m.officer_id}>
                      <td><strong>{m.full_name}</strong></td>
                      <td>{m.role_name} ({m.officer_id})</td>
                      <td>Economic Investigation Unit</td>
                      <td><span className="badge badge-info">{m.access_level}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'timeline':
        return (
          <div className="gov-card">
            <div className="gov-card-header">
              <div className="gov-card-title">Visual Evidence Custody Pipeline</div>
              <button className="btn btn-secondary btn-sm" onClick={() => router.push('/evidence')}>View Evidence Ledger</button>
            </div>
            <div className="gov-card-body" style={{ padding: '40px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: '30px' }}>
                {/* Connecting Line */}
                <div style={{ position: 'absolute', top: '12px', left: '40px', right: '40px', height: '4px', backgroundColor: 'var(--gov-border-light)', zIndex: 1 }}></div>
                <div style={{ position: 'absolute', top: '12px', left: '40px', width: '50%', height: '4px', backgroundColor: 'var(--gov-navy-primary)', zIndex: 2 }}></div>

                {/* Node 1 */}
                <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', width: '120px', cursor: 'pointer' }} onClick={() => setActiveNode(activeNode === 1 ? null : 1)}>
                  <div style={{ width: '28px', height: '28px', backgroundColor: 'var(--gov-navy-primary)', borderRadius: '50%', border: '4px solid #fff', margin: '0 auto 10px' }}></div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--gov-navy-dark)' }}>Seized by IO</div>
                  <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)' }}>10:00 AM</div>
                  <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)' }}>SI Rajesh</div>
                  
                  {activeNode === 1 && (
                    <div style={{ position: 'absolute', top: '80px', left: '50%', transform: 'translateX(-50%)', width: '220px', background: '#fff', border: '1px solid var(--gov-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '12px', textAlign: 'left', borderRadius: '4px', zIndex: 10 }}>
                      <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--gov-navy-primary)', marginBottom: '4px' }}>HANDOFF DETAILS</div>
                      <div style={{ fontSize: '11px', marginBottom: '4px' }}><strong>Collected By:</strong> SI Rajesh (NDIS-IO-4102)</div>
                      <div style={{ fontSize: '11px', marginBottom: '4px' }}><strong>Time (NTP):</strong> 2026-09-10 10:00:14 IST</div>
                      <div style={{ fontSize: '11px' }}><strong>Hash:</strong> <span className="font-mono" style={{ color: 'var(--gov-green)' }}>a3f9b2c...</span></div>
                    </div>
                  )}
                </div>

                {/* Node 2 */}
                <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', width: '120px', cursor: 'pointer' }} onClick={() => setActiveNode(activeNode === 2 ? null : 2)}>
                  <div style={{ width: '28px', height: '28px', backgroundColor: 'var(--gov-navy-primary)', borderRadius: '50%', border: '4px solid #fff', margin: '0 auto 10px' }}></div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--gov-navy-dark)' }}>Malkhana Vault</div>
                  <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)' }}>04:30 PM</div>
                  <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)' }}>HC Meena</div>
                  
                  {activeNode === 2 && (
                    <div style={{ position: 'absolute', top: '80px', left: '50%', transform: 'translateX(-50%)', width: '220px', background: '#fff', border: '1px solid var(--gov-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '12px', textAlign: 'left', borderRadius: '4px', zIndex: 10 }}>
                      <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--gov-navy-primary)', marginBottom: '4px' }}>HANDOFF DETAILS</div>
                      <div style={{ fontSize: '11px', marginBottom: '4px' }}><strong>Handed By:</strong> SI Rajesh (NDIS-IO-4102)</div>
                      <div style={{ fontSize: '11px', marginBottom: '4px' }}><strong>Received By:</strong> HC Meena (NDIS-MK-112)</div>
                      <div style={{ fontSize: '11px', marginBottom: '4px' }}><strong>Time (NTP):</strong> 2026-09-10 16:30:05 IST</div>
                      <div style={{ fontSize: '11px' }}><strong>Hash:</strong> <span className="font-mono" style={{ color: 'var(--gov-green)' }}>b7c8d9e...</span></div>
                    </div>
                  )}
                </div>

                {/* Node 3 */}
                <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', width: '120px', cursor: 'pointer' }} onClick={() => setActiveNode(activeNode === 3 ? null : 3)}>
                  <div style={{ width: '28px', height: '28px', backgroundColor: 'var(--gov-navy-primary)', borderRadius: '50%', border: '4px solid #fff', margin: '0 auto 10px' }}></div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--gov-navy-dark)' }}>FSL Lab Testing</div>
                  <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)' }}>Sep 3</div>
                  <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)' }}>Dr. Verma</div>
                  
                  {activeNode === 3 && (
                    <div style={{ position: 'absolute', top: '80px', left: '50%', transform: 'translateX(-50%)', width: '220px', background: '#fff', border: '1px solid var(--gov-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '12px', textAlign: 'left', borderRadius: '4px', zIndex: 10 }}>
                      <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--gov-navy-primary)', marginBottom: '4px' }}>HANDOFF DETAILS</div>
                      <div style={{ fontSize: '11px', marginBottom: '4px' }}><strong>Handed By:</strong> HC Meena (NDIS-MK-112)</div>
                      <div style={{ fontSize: '11px', marginBottom: '4px' }}><strong>Received By:</strong> Dr. Verma (NDIS-FSL-88)</div>
                      <div style={{ fontSize: '11px', marginBottom: '4px' }}><strong>Time (NTP):</strong> 2026-09-13 11:20:00 IST</div>
                      <div style={{ fontSize: '11px' }}><strong>Hash:</strong> <span className="font-mono" style={{ color: 'var(--gov-green)' }}>f1a2b3c...</span></div>
                    </div>
                  )}
                </div>

                {/* Node 4 */}
                <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', width: '120px', cursor: 'pointer' }}>
                  <div style={{ width: '28px', height: '28px', backgroundColor: 'var(--gov-border)', borderRadius: '50%', border: '4px solid #fff', margin: '0 auto 10px' }}></div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--gov-text-secondary)' }}>Prosecutor Scrutiny</div>
                  <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)' }}>Sep 7</div>
                  <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)' }}>PP Sharma</div>
                </div>

                {/* Node 5 */}
                <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', width: '120px', cursor: 'pointer' }}>
                  <div style={{ width: '28px', height: '28px', backgroundColor: 'var(--gov-border)', borderRadius: '50%', border: '4px solid #fff', margin: '0 auto 10px' }}></div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--gov-text-secondary)' }}>Court Admitted</div>
                  <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)' }}>Sep 10</div>
                  <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)' }}>Judge Reddy</div>
                </div>

              </div>
              <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--gov-text-muted)', marginTop: '50px' }}>
                Click any completed node to view immutable cryptographic handoff details.
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="gov-card">
            <div className="gov-card-body" style={{ textAlign: 'center', padding: '30px', color: 'var(--gov-text-muted)' }}>
              Data loaded for <strong>{currentTab.toUpperCase()}</strong>.
            </div>
          </div>
        );
    }
  };

  return (
    <div>
      {/* Workspace Header */}
      <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--gov-border)', borderRadius: 'var(--radius-sm)', padding: '18px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span className="font-mono" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gov-navy-primary)' }}>{c.case_number}</span>
              <span className="badge badge-active">{c.status}</span>
              <span className="badge badge-confidential">{c.confidentiality_level}</span>
              <span className="badge badge-critical">{c.priority} PRIORITY</span>
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--gov-navy-dark)' }}>{c.title}</h1>
            <div style={{ fontSize: '12px', color: 'var(--gov-text-muted)', marginTop: '4px' }}>
              <strong>Lead Officer:</strong> {c.lead_officer_name} ({c.lead_officer_code}) •
              <strong>Department:</strong> {c.department_name} •
              <strong>Jurisdiction:</strong> {c.jurisdiction} •
              <strong>FIR:</strong> {c.fir_number}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => router.push('/cases')}>
              ← Back to Cases
            </button>
            <button className="btn btn-primary btn-sm">
              + Upload Case Document
            </button>
          </div>
        </div>

        {/* Investigation Progress Bar */}
        <div style={{ marginTop: '16px', backgroundColor: 'var(--gov-surface-alt)', padding: '10px 14px', border: '1px solid var(--gov-border-light)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
            <span>INVESTIGATION PROGRESS</span>
            <span style={{ color: 'var(--gov-green)' }}>{progress}% COMPLETED</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      {/* 7 Workspace Tabs */}
      <div className="gov-tabs">
        <button className={`gov-tab-btn ${currentTab === 'overview' ? 'active' : ''}`} onClick={() => setCurrentTab('overview')}>Overview</button>
        <button className={`gov-tab-btn ${currentTab === 'documents' ? 'active' : ''}`} onClick={() => setCurrentTab('documents')}>Documents ({c.documents ? c.documents.length : 0})</button>
        <button className={`gov-tab-btn ${currentTab === 'evidence' ? 'active' : ''}`} onClick={() => setCurrentTab('evidence')}>Evidence ({c.evidence ? c.evidence.length : 0})</button>
        <button className={`gov-tab-btn ${currentTab === 'people' ? 'active' : ''}`} onClick={() => setCurrentTab('people')}>People & Team</button>
        <button className={`gov-tab-btn ${currentTab === 'timeline' ? 'active' : ''}`} onClick={() => setCurrentTab('timeline')}>Case Timeline</button>
        <button className={`gov-tab-btn ${currentTab === 'tasks' ? 'active' : ''}`} onClick={() => setCurrentTab('tasks')}>Investigation Tasks</button>
        <button className={`gov-tab-btn ${currentTab === 'audit' ? 'active' : ''}`} onClick={() => setCurrentTab('audit')}>Audit Trail</button>
      </div>

      {/* Tab Content Area */}
      <div id="case-tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
}
