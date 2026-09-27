"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { API } from '@/lib/api';
import { useAppState } from '@/lib/StateContext';
import { useRouter } from 'next/navigation';

interface DocItem {
  id: string;
  title: string;
  type?: string;
  fir_number?: string;
}

export default function AIIntelPage() {
  const { language } = useAppState();
  const isHindi = language === 'HI';
  const router = useRouter();

  const [docList, setDocList] = useState<DocItem[]>([]);
  const [docId, setDocId] = useState<string>('doc-001');
  const [currentIntel, setCurrentIntel] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch available documents from backend
  useEffect(() => {
    async function loadDocuments() {
      try {
        const res = await API.get('/documents');
        if (res.data?.documents && res.data.documents.length > 0) {
          setDocList(res.data.documents);
          setDocId(res.data.documents[0].id);
        }
      } catch (e) {
        console.error('Failed to load documents list for AI intel:', e);
      }
    }
    loadDocuments();
  }, []);

  // 2. Fetch AI intelligence for selected document
  const fetchIntel = useCallback(async (id: string, isManual = false) => {
    if (isManual) {
      setIsReanalyzing(true);
    } else {
      setIsLoading(true);
    }
    setError('');

    try {
      const res = await API.get(`/ai/document-intel/${id}`);
      if (res.data) {
        setCurrentIntel(res.data);
      } else {
        throw new Error('No intelligence data returned');
      }
    } catch (e: any) {
      console.error('AI Intel fetch error:', e);
      setError(e.message || 'Failed to load AI Intelligence');
    } finally {
      setIsLoading(false);
      setIsReanalyzing(false);
    }
  }, []);

  useEffect(() => {
    if (docId) {
      fetchIntel(docId);
    }
  }, [docId, fetchIntel]);

  const reAnalyze = () => {
    fetchIntel(docId, true);
  };

  return (
    <div>
      <div className="page-header-bar">
        <div className="page-title-group">
          <h1>{isHindi ? 'एआई दस्तावेज़ बुद्धिमत्ता' : 'AI Document Intelligence'}</h1>
          <div className="page-subtitle">
            Automated legal natural language processing, entity extraction, and case correlation analysis under BNS & POCSO
          </div>
        </div>
        <div className="page-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select 
            className="form-control" 
            value={docId} 
            onChange={e => setDocId(e.target.value)}
            style={{ maxWidth: '350px', fontSize: '13px' }}
          >
            {docList.length > 0 ? (
              docList.map(d => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.fir_number || d.type || 'Evidence'})
                </option>
              ))
            ) : (
              <>
                <option value="doc-001">CCTV_Footage_Camera3.mp4 (Entryway Feed)</option>
                <option value="doc-002">Forensic_Disk_Clone.dd (NVMe Bitstream)</option>
                <option value="doc-003">Bank_Transaction_Report.pdf (State Bank Audit)</option>
                <option value="doc-004">Witness_Deposition_Audio.wav (CAO Deposition)</option>
              </>
            )}
          </select>
          <button 
            className="btn btn-primary btn-sm" 
            onClick={reAnalyze} 
            disabled={isReanalyzing || isLoading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <i className={`fa-solid fa-bolt ${isReanalyzing ? 'fa-spin' : ''}`}></i>
            {isReanalyzing ? 'Processing NLP...' : '⚡ Re-Analyze NLP Model'}
          </button>
        </div>
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--gov-text-secondary)' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🤖</div>
          <div style={{ fontWeight: 700 }}>Processing legal natural language intelligence...</div>
          <div style={{ fontSize: '12px', color: 'var(--gov-text-muted)', marginTop: '4px' }}>
            Extracting Named Entities (NER), statutory sections, and financial quantums
          </div>
        </div>
      )}

      {error && (
        <div style={{ color: 'var(--status-critical)', padding: '24px', textAlign: 'center', backgroundColor: '#FEF2F2', borderRadius: 'var(--radius-sm)', border: '1px solid #FCA5A5', margin: '20px 0' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {!isLoading && currentIntel && (
        <div>
          {/* Top Diagnostic Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            <div className="stat-card" style={{ borderTopColor: 'var(--gov-navy-primary)' }}>
              <div className="stat-title">DOCUMENT CLASSIFICATION</div>
              <div className="stat-value" style={{ fontSize: '20px' }}>{currentIntel.classification?.predictedType || 'EVIDENCE'}</div>
              <div className="stat-subtext">Confidence: <strong style={{ color: 'var(--status-active)' }}>{currentIntel.classification?.confidence || 98.4}%</strong></div>
            </div>

            <div className="stat-card stat-active">
              <div className="stat-title">CORRELATED CASE</div>
              <div className="stat-value font-mono" style={{ fontSize: '18px' }}>{currentIntel.caseId || 'CASE-2026-041'}</div>
              <div className="stat-subtext">Active Criminal Inquiry</div>
            </div>

            <div className="stat-card">
              <div className="stat-title">PAGES & EVIDENCE SIZE</div>
              <div className="stat-value">14 <span style={{ fontSize: '14px', color: 'var(--gov-text-muted)' }}>Pages / Streams</span></div>
              <div className="stat-subtext">Bitstream verification exact</div>
            </div>

            <div className="stat-card">
              <div className="stat-title">NLP LANGUAGE DETECTED</div>
              <div className="stat-value" style={{ fontSize: '16px', margin: '10px 0 6px 0' }}>English (IN) / Legal Hindi</div>
              <div className="stat-subtext">OCR Devanagari & Latin Exact</div>
            </div>
          </div>

          {/* Main Intelligence Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
            
            {/* Left: AI Analytical Summary & Extracted Entities */}
            <div>
              <div className="gov-card">
                <div className="gov-card-header">
                  <div className="gov-card-title">
                    <span>🤖</span> AI Executive Summary & Evidentiary Significance
                  </div>
                </div>
                <div className="gov-card-body" style={{ fontSize: '13px', lineHeight: 1.7 }}>
                  <div style={{ backgroundColor: 'var(--gov-surface-alt)', borderLeft: '4px solid var(--gov-navy-primary)', padding: '14px 18px', marginBottom: '16px', fontWeight: 500, borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}>
                    {currentIntel.aiSummary}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                    <div><strong>Primary Subject:</strong> Rajesh Verma (Managing Director)</div>
                    <div><strong>Primary Offence:</strong> Loan Diversion & Bogus Invoicing</div>
                    <div><strong>Key Evidence Ref:</strong> FSD-DL-2026-089 (NVMe Bitstream)</div>
                    <div><strong>Court Status:</strong> Pre-Charge Sheet Scrutiny</div>
                  </div>
                </div>
              </div>

              {/* Named Entity Recognitions (NER) */}
              <div className="gov-card">
                <div className="gov-card-header">
                  <div className="gov-card-title">
                    <span>🏷</span> Named Entity Recognitions (NER)
                  </div>
                </div>
                <div className="gov-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <div className="info-label" style={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: 'var(--gov-text-muted)' }}>Case & Reference Identifiers</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {currentIntel.extractedEntities?.caseNumbers?.map((n: string) => (
                        <span key={n} className="badge badge-info">{n}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="info-label" style={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: 'var(--gov-text-muted)' }}>Officer Names & Jurisdictional Actors</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {currentIntel.extractedEntities?.officerNames?.map((n: string) => (
                        <span key={n} className="badge badge-secondary" style={{ border: '1px solid var(--gov-border)' }}>{n}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="info-label" style={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: 'var(--gov-text-muted)' }}>Suspect Corporate & Individual Entities</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {currentIntel.extractedEntities?.suspectEntities?.map((s: string) => (
                        <span key={s} className="badge badge-closed">{s}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="info-label" style={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: 'var(--gov-text-muted)' }}>Statutory Legal Sections Cited</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {currentIntel.extractedEntities?.legalSections?.map((s: string) => (
                        <span key={s} className="badge badge-review">{s}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="info-label" style={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: 'var(--gov-text-muted)' }}>Monetary Quantums & Financial Values</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {currentIntel.extractedEntities?.monetaryAmounts?.map((m: string) => (
                        <span key={m} className="badge badge-active" style={{ fontWeight: 700 }}>{m}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="info-label" style={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: 'var(--gov-text-muted)' }}>Geographic Locations & Jurisdictions</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {currentIntel.extractedEntities?.locations?.map((l: string) => (
                        <span key={l} className="badge badge-secondary">{l}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dedicated POCSO & Privacy Protection Strip */}
              <div className="gov-card" style={{ borderLeft: '4px solid var(--gov-saffron)' }}>
                <div className="gov-card-header" style={{ backgroundColor: 'var(--gov-saffron-light)' }}>
                  <div className="gov-card-title" style={{ color: 'var(--status-review)' }}>
                    <span>🛡</span> POCSO & PII Identity Safeguard (POCSO Sec 23 & DPDP Act 2023)
                  </div>
                </div>
                <div className="gov-card-body" style={{ fontSize: '12px', lineHeight: 1.6 }}>
                  <p>Automated regex and NLP filters actively monitor all ingested depositions and exhibits for minor identity disclosures, Aadhaar numbers, and phone records to prevent statutory privacy violations before court submission.</p>
                  <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => router.push('/reports')}>
                      Open Redaction Queue
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => router.push('/ai-search')}>
                      Run Smart Search
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Right: Important Dates & Related Corroborations */}
            <div>
              <div className="gov-card">
                <div className="gov-card-header">
                  <div className="gov-card-title">
                    <span>📅</span> Chronological Milestones Detected
                  </div>
                </div>
                <div className="gov-card-body" style={{ padding: '16px' }}>
                  <div className="timeline-list">
                    {currentIntel.importantDates?.map((d: any, idx: number) => (
                      <div key={idx} className="timeline-step completed" style={{ marginBottom: '16px' }}>
                        <div className="timeline-marker" style={{ color: 'var(--status-active)' }}>•</div>
                        <div className="timeline-content">
                          <div className="timeline-title" style={{ fontWeight: 700, fontSize: '13px' }}>{d.event}</div>
                          <div className="timeline-time" style={{ fontSize: '11px', color: 'var(--gov-text-muted)', marginTop: '2px' }}>{d.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="gov-card">
                <div className="gov-card-header">
                  <div className="gov-card-title">
                    <span>🔗</span> Corroborating Files & Exhibits
                  </div>
                </div>
                <div className="gov-card-body" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gov-text-muted)' }}>Related Documents</div>
                  {currentIntel.relatedDocuments?.map((rd: any) => (
                    <div key={rd.id} style={{ backgroundColor: 'var(--gov-surface-alt)', border: '1px solid var(--gov-border-light)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '12px' }}>{rd.name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--gov-text-muted)' }}>{rd.matchReason}</div>
                      </div>
                      <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/documents/${rd.id}`)}>View</button>
                    </div>
                  ))}

                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gov-text-muted)', marginTop: '10px' }}>Related Physical Exhibits</div>
                  {currentIntel.relatedEvidence?.map((re: any) => (
                    <div key={re.id} style={{ backgroundColor: 'var(--gov-surface-alt)', border: '1px solid var(--gov-border-light)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '12px' }}>{re.name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--gov-text-muted)' }}>Custodian: {re.custodian}</div>
                      </div>
                      <button className="btn btn-secondary btn-sm" onClick={() => router.push('/evidence')}>Custody</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
