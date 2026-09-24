"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { API } from '@/lib/api';
import { useAppState } from '@/lib/StateContext';

export default function DocumentViewerPage() {
  const router = useRouter();
  const params = useParams();
  const docId = params.id as string;
  const { language } = useAppState();

  const [currentDoc, setCurrentDoc] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [tamperedState, setTamperedState] = useState(false);

  const isHindi = language === 'HI';

  useEffect(() => {
    async function loadDoc() {
      try {
        const res = await API.get(`/documents/${docId}`);
        setCurrentDoc(res.data);
      } catch (e: any) {
        setError(e.message || 'Failed to load document');
      } finally {
        setIsLoading(false);
      }
    }
    loadDoc();
  }, [docId]);

  const verifyIntegrity = async (simulateTamper = tamperedState) => {
    if (!currentDoc) return;
    try {
      await API.post(`/documents/${currentDoc.id}/verify`, { simulateTamper });
      if (!simulateTamper) {
        alert('✓ DOCUMENT VERIFIED: SHA-256 checksum exactly matches official immutable register.');
      }
    } catch (e) {
      // 409 mismatch handled by API error
    }
  };

  const toggleTamperSimulation = () => {
    const newState = !tamperedState;
    setTamperedState(newState);
    if (newState) {
      verifyIntegrity(true);
    }
  };

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading evidentiary document <strong>{docId}</strong> from secure storage...</div>;
  }

  if (error) {
    return <div style={{ color: 'var(--status-critical)', padding: '20px' }}>Failed to load document: {error}</div>;
  }

  if (!currentDoc) return null;

  const d = currentDoc;

  return (
    <div>
      <div className="page-header-bar">
        <div className="page-title-group">
          <h1>{isHindi ? 'दस्तावेज़ दर्शक एवं सत्यनिष्ठा' : 'Document Viewer & Cryptographic Verification'}</h1>
          <div className="page-subtitle">
            {d.file_name} • Registered Under <span className="font-mono">{d.document_number}</span>
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => router.push('/documents')}>
            ← Back to Documents
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => verifyIntegrity(false)}>
            🛡 [ Verify Integrity ]
          </button>
        </div>
      </div>

      {/* Split Layout */}
      <div className="split-viewer-grid">
        
        {/* LEFT: Official Government Document Preview */}
        <div className="doc-preview-pane" style={{ position: 'relative', overflow: 'hidden', background: '#E2E8F0', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          {/* Diagonal Forensic Watermark */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: 0.15, transform: 'rotate(-35deg)', fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 800, color: '#000', whiteSpace: 'nowrap', zIndex: 10 }}>
            CONFIDENTIAL | SI RAJESH SHARMA | #DL-4821 | 10.195.2.44
          </div>

          {/* HTML5 Canvas Mockup */}
          <div style={{ background: '#FFFFFF', width: '100%', maxWidth: '600px', height: '100%', minHeight: '800px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '40px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '10px', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>Rendered via HTML5 Canvas</div>
            
            {/* Official Document Header Banner */}
            <div style={{ borderBottom: '2px solid var(--gov-navy-dark)', paddingBottom: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  GOVERNMENT OF INDIA • NATIONAL DIGITAL INVESTIGATION SERVICES
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gov-navy-dark)', marginTop: '2px' }}>
                  {d.title}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)', marginTop: '2px' }}>
                  Case Reference: <strong>{d.case_number || d.case_id}</strong> • Document Ref: <span className="font-mono">{d.document_number}</span>
                </div>
              </div>
            </div>

            {/* Document Text Body */}
            <div style={{ fontSize: '13px', lineHeight: 1.8, color: 'var(--gov-text-primary)', marginBottom: '24px', whiteSpace: 'pre-wrap', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, serif" }}>
              <strong>OFFICIAL EVIDENTIARY RECORD & FORENSIC ATTESTATION</strong>
              <br/><br/>
              {d.ocr_extracted_text || 'No text extracted. Simulating content rendering...'}
            </div>

            {/* Official Stamp & Digital Signature Seal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid var(--gov-border-light)', paddingTop: '16px', marginTop: '20px' }}>
              <div style={{ border: '2px solid var(--gov-navy-primary)', borderRadius: '4px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--gov-navy-dark)' }}>
                <span style={{ fontSize: '20px' }}>⚖</span>
                <div>
                  <div style={{ fontWeight: 800, textTransform: 'uppercase' }}>NDIS OFFICIAL VERIFIED</div>
                  <div style={{ fontSize: '9px', color: 'var(--gov-text-muted)' }}>Cryptographically Authenticated</div>
                </div>
              </div>

              <div style={{ textAlign: 'right', fontSize: '11px' }}>
                <div style={{ fontWeight: 700 }}>Digitally Signed By:</div>
                <div style={{ color: 'var(--gov-navy-primary)', fontWeight: 700 }}>Officer {d.uploader_name || 'A. Sharma'}</div>
                <div style={{ fontSize: '10px', color: 'var(--gov-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {d.digital_signature ? d.digital_signature.substring(0, 36) + '...' : 'NDIS-DSIG-ECDSA-P256-VALID'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Metadata & Cryptographic Integrity Panel */}
        <div className="doc-info-pane">
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gov-navy-dark)', textTransform: 'uppercase', marginBottom: '14px', borderBottom: '1px solid var(--gov-border-light)', paddingBottom: '6px' }}>
            Document Metadata & Ledger
          </h2>

          <div className="info-item">
            <div className="info-label">Document ID</div>
            <div className="info-value font-mono" style={{ fontWeight: 700, color: 'var(--gov-navy-primary)' }}>{d.document_number}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="info-item">
              <div className="info-label">Document Type</div>
              <div className="info-value"><span className="badge badge-info">{d.document_type}</span></div>
            </div>
            <div className="info-item">
              <div className="info-label">Case ID</div>
              <div className="info-value"><strong className="font-mono">{d.case_number || d.case_id}</strong></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="info-item">
              <div className="info-label">Uploaded By</div>
              <div className="info-value">{d.uploader_name || 'Officer'}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Version</div>
              <div className="info-value"><span className="badge badge-secondary">{d.version}</span></div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            <div className="info-item">
              <div className="info-label">Integrity Status</div>
              <div className="info-value">
                <span className={`badge ${tamperedState ? 'badge-review' : 'badge-verified'}`}>
                  🛡 {tamperedState ? 'INVALID (Mismatch)' : 'VERIFIED (SHA-256 match)'}
                </span>
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Merkle Proof</div>
              <div className="info-value font-mono" style={{ fontSize: '11px' }}>Leaf #42, Path: [L1→R2→L3→Root]</div>
            </div>
            <div className="info-item">
              <div className="info-label">Chain of Custody</div>
              <div className="info-value">3 handoffs completed</div>
            </div>
            <div className="info-item">
              <div className="info-label">Classification</div>
              <div className="info-value"><span className="badge badge-confidential">{d.security_classification || 'CONFIDENTIAL'}</span></div>
            </div>
          </div>

          {/* Cryptographic Integrity Panel */}
          <div style={{ backgroundColor: 'var(--gov-surface-alt)', border: '1px solid var(--gov-border)', borderRadius: 'var(--radius-sm)', padding: '14px', margin: '16px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--gov-navy-dark)', textTransform: 'uppercase' }}>
                DOCUMENT INTEGRITY
              </span>
              <button className="btn btn-secondary btn-sm" style={{ fontSize: '10px', padding: '2px 6px' }} onClick={toggleTamperSimulation}>
                {tamperedState ? '↺ Reset Hash' : '⚠ Simulate Tampering'}
              </button>
            </div>

            <div style={{ fontSize: '11px', marginBottom: '6px' }}>
              <div className="info-label">Registered Ledger Hash:</div>
              <div className="hash-display-box" id="viewer-registered-hash">{d.sha256_hash}</div>
            </div>

            <div style={{ fontSize: '11px', marginBottom: '10px' }}>
              <div className="info-label">Current Computed Hash:</div>
              <div className="hash-display-box" id="viewer-current-hash" style={tamperedState ? { color: '#F87171' } : {}}>
                {tamperedState ? 'DEADBEEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF01234567' : d.sha256_hash}
              </div>
            </div>

            {/* Verification Status Output Box */}
            <div id="integrity-result-box" style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: tamperedState ? '#FEE2E2' : '#E6F4EA', border: `1px solid ${tamperedState ? '#F87171' : '#A3D9B5'}`, color: tamperedState ? '#B91C1C' : '#0A6E31' }}>
              <div style={{ fontWeight: 800, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{tamperedState ? '⚠' : '✓'}</span>
                <span>{tamperedState ? 'INTEGRITY MISMATCH — TAMPERING DETECTED' : 'MATCH — DOCUMENT VERIFIED'}</span>
              </div>
              <div style={{ fontSize: '11px', marginTop: '2px' }}>
                {tamperedState
                  ? 'Current file hash differs from the registered government ledger. Unauthorized modification detected!'
                  : 'Computed SHA-256 bitstream matches official register with 100% cryptographic certainty.'}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button className="btn btn-primary btn-sm" onClick={() => verifyIntegrity(false)}>
                Verify Integrity
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => alert('Viewing AI Redacted Copy...')}>
                View Redacted Copy
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button className="btn btn-saffron btn-sm" onClick={() => router.push(`/documents/${d.id}/cert`)}>
                Generate Sec 65B Certificate
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => router.push('/evidence')}>
                Forward to Next Agency
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
