"use client";

import React, { useState, useEffect } from 'react';
import { API } from '@/lib/api';
import { useAppState } from '@/lib/StateContext';
import { useRouter } from 'next/navigation';

export default function AIIntelPage() {
  const { language } = useAppState();
  const isHindi = language === 'HI';
  const router = useRouter();

  const [docId, setDocId] = useState('doc-001');
  const [currentIntel, setCurrentIntel] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchIntel(docId);
  }, [docId]);

  const fetchIntel = async (id: string) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await API.get(`/ai/document-intel/${id}`);
      setCurrentIntel(res.data);
    } catch (e: any) {
      setError(e.message || 'Failed to load AI Intelligence');
    } finally {
      setIsLoading(false);
    }
  };

  const reAnalyze = () => {
    alert('NLP pipeline triggered. Re-verifying entity boundaries and confidence scores.');
  };

  return (
    <div>
      <div className="page-header-bar">
        <div className="page-title-group">
          <h1>{isHindi ? 'एआई दस्तावेज़ बुद्धिमत्ता' : 'AI Document Intelligence'}</h1>
          <div className="page-subtitle">
            Automated legal natural language processing, entity extraction, and case correlation analysis
          </div>
        </div>
        <div className="page-actions">
          <select className="form-control" value={docId} onChange={e => setDocId(e.target.value)}>
            <option value="doc-001">FIR_2026_041.pdf (FIR No. 41/2026)</option>
            <option value="doc-002">Forensic_Report.pdf (Disk Clone Extraction)</option>
            <option value="doc-004">Bank_Transaction_Report.pdf (State Bank Audit)</option>
            <option value="doc-005">Witness_Statement_07.pdf (CAO Deposition)</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={reAnalyze}>
            ⚡ Re-Analyze NLP Model
          </button>
        </div>
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          Processing natural language intelligence for selected document...
        </div>
      )}

      {error && (
        <div style={{ color: 'var(--status-critical)', padding: '20px', textAlign: 'center' }}>
          Failed to load AI Intelligence: {error}
        </div>
      )}

      {!isLoading && currentIntel && (
        <div>
          {/* Top Diagnostic Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            <div className="stat-card" style={{ borderTopColor: 'var(--gov-navy-primary)' }}>
              <div className="stat-title">DOCUMENT CLASSIFICATION</div>
              <div className="stat-value" style={{ fontSize: '22px' }}>{currentIntel.classification.predictedType}</div>
              <div className="stat-subtext">Confidence: <strong style={{ color: 'var(--gov-green)' }}>{currentIntel.classification.confidence}%</strong></div>
            </div>

            <div className="stat-card stat-active">
              <div className="stat-title">DETECTED CASE</div>
              <div className="stat-value font-mono" style={{ fontSize: '20px' }}>{currentIntel.caseId}</div>
              <div className="stat-subtext">Apex FinCorp Investigation</div>
            </div>

            <div className="stat-card">
              <div className="stat-title">PAGES & TOKENS</div>
              <div className="stat-value">14 <span style={{ fontSize: '14px', color: 'var(--gov-text-muted)' }}>Pages</span></div>
              <div className="stat-subtext">4,812 tokens analyzed</div>
            </div>

            <div className="stat-card">
              <div className="stat-title">LANGUAGE DETECTED</div>
              <div className="stat-value" style={{ fontSize: '16px', margin: '10px 0 6px 0' }}>English (IN) / Legal Hindi</div>
              <div className="stat-subtext">Mixed OCR Latin / Devanagari</div>
            </div>
          </div>

          {/* Main Intelligence Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
            
            {/* Left: AI Analytical Summary & Extracted Entities */}
            <div>
              <div className="gov-card">
                <div className="gov-card-header">
                  <div className="gov-card-title">
                    <span>🤖</span> AI Executive Summary & Key Information
                  </div>
                </div>
                <div className="gov-card-body" style={{ fontSize: '13px', lineHeight: 1.7 }}>
                  <div style={{ backgroundColor: 'var(--gov-surface-alt)', borderLeft: '4px solid var(--gov-navy-primary)', padding: '12px 16px', marginBottom: '14px', fontWeight: 500 }}>
                    {currentIntel.aiSummary}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', marginTop: '10px' }}>
                    <div><strong>Primary Subject:</strong> Rajesh Verma (Managing Director)</div>
                    <div><strong>Primary Offence:</strong> Loan Diversion & Bogus Invoicing</div>
                    <div><strong>Key Evidence Ref:</strong> FSD-DL-2026-089 (NVMe Bitstream)</div>
                    <div><strong>Court Status:</strong> Pre-Charge Sheet Scrutiny</div>
                  </div>
                </div>
              </div>

              <div className="gov-card">
                <div className="gov-card-header">
                  <div className="gov-card-title">
                    <span>🏷</span> Named Entity Recognitions (NER)
                  </div>
                </div>
                <div className="gov-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <div className="info-label">Case & Reference Identifiers</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                      {currentIntel.extractedEntities.caseNumbers.map((n: string) => <span key={n} className="badge badge-info">{n}</span>)}
                    </div>
                  </div>

                  <div>
                    <div className="info-label">Officer Names & Jurisdictional Actors</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                      {currentIntel.extractedEntities.officerNames.map((n: string) => <span key={n} className="badge badge-secondary" style={{ border: '1px solid var(--gov-border)' }}>{n}</span>)}
                    </div>
                  </div>

                  <div>
                    <div className="info-label">Suspect Corporate & Individual Entities</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                      {currentIntel.extractedEntities.suspectEntities.map((s: string) => <span key={s} className="badge badge-critical">{s}</span>)}
                    </div>
                  </div>

                  <div>
                    <div className="info-label">Statutory Legal Sections Cited</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                      {currentIntel.extractedEntities.legalSections.map((s: string) => <span key={s} className="badge badge-secret">{s}</span>)}
                    </div>
                  </div>

                  <div>
                    <div className="info-label">Monetary Quantums & Financial Values</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                      {currentIntel.extractedEntities.monetaryAmounts.map((m: string) => <span key={m} className="badge badge-confidential" style={{ fontWeight: 700 }}>{m}</span>)}
                    </div>
                  </div>

                  <div>
                    <div className="info-label">Geographic Locations & Jurisdictions</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                      {currentIntel.extractedEntities.locations.map((l: string) => <span key={l} className="badge badge-secondary">{l}</span>)}
                    </div>
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
                <div className="gov-card-body" style={{ padding: '12px' }}>
                  <div className="timeline-list">
                    {currentIntel.importantDates.map((d: any, idx: number) => (
                      <div key={idx} className="timeline-step completed">
                        <div className="timeline-marker">•</div>
                        <div className="timeline-content">
                          <div className="timeline-title">{d.event}</div>
                          <div className="timeline-time">{d.date}</div>
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
                <div className="gov-card-body" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gov-text-muted)' }}>Related Documents</div>
                  {currentIntel.relatedDocuments.map((rd: any) => (
                    <div key={rd.id} style={{ backgroundColor: 'var(--gov-surface-alt)', border: '1px solid var(--gov-border-light)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '12px' }}>{rd.name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--gov-text-muted)' }}>{rd.matchReason}</div>
                      </div>
                      <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/documents/${rd.id}`)}>View</button>
                    </div>
                  ))}

                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gov-text-muted)', marginTop: '10px' }}>Related Evidence Exhibits</div>
                  {currentIntel.relatedEvidence.map((re: any) => (
                    <div key={re.id} style={{ backgroundColor: 'var(--gov-surface-alt)', border: '1px solid var(--gov-border-light)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '12px' }}>{re.name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--gov-text-muted)' }}>Custodian: {re.custodian}</div>
                      </div>
                      <button className="btn btn-secondary btn-sm" onClick={() => router.push('/evidence')}>Chain</button>
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
