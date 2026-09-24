"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/lib/StateContext';

export default function NewCasePage() {
  const router = useRouter();
  const { currentOfficer, language, setSelectedCaseId } = useAppState();

  const [sections, setSections] = useState('');
  const [isPocso, setIsPocso] = useState(false);

  const isHindi = language === 'HI';
  const autoFir = 'FIR-DEL-2026-' + Math.floor(Math.random() * 9000 + 1000);
  const officerId = currentOfficer ? currentOfficer.officer_id : 'NDIS-IO-4102';

  const checkPocso = (val: string) => {
    setSections(val);
    const s = val.toLowerCase();
    if (s.includes('376') || s.includes('pocso') || s.includes('64') || s.includes('65')) {
      setIsPocso(true);
    } else {
      setIsPocso(false);
    }
  };

  const submitCase = () => {
    setTimeout(() => {
      alert("✅ CASE REGISTERED SUCCESSFULLY\nImmutable Vault Created.\n" + (isPocso ? "POCSO Redaction protocols activated." : ""));
      setSelectedCaseId('case-042');
      router.push('/cases/case-042');
    }, 600);
  };

  return (
    <div>
      <div className="page-header-bar">
        <div className="page-title-group">
          <h1>{isHindi ? 'नई एफआईआर दर्ज करें' : 'Register New FIR / Case'}</h1>
          <div className="page-subtitle">
            Secure digital ingestion of formal criminal complaints and case metadata
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => router.push('/cases')}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={submitCase}>
            📋 Register Case
          </button>
        </div>
      </div>

      <div className="gov-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="gov-card-header">
          <div className="gov-card-title">Initial Information Report (IIR) Form</div>
        </div>
        <div className="gov-card-body">
          
          {isPocso && (
            <div style={{ backgroundColor: '#FFF5F5', border: '1px solid #FED7D7', padding: '12px', borderRadius: '4px', marginBottom: '16px', color: '#9B2C2C', fontSize: '13px' }}>
              <strong>⚠ POCSO / WOMEN SAFETY FLAGGED:</strong> Victim details will be auto-redacted in public records. Special confidentiality protocols have been activated for this case.
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label className="filter-label">FIR Number (Auto-Generated)</label>
              <input type="text" className="form-control" readOnly value={autoFir} style={{ backgroundColor: 'var(--gov-surface-alt)', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--gov-navy-primary)', width: '100%' }} />
            </div>
            <div>
              <label className="filter-label">Police Station / Jurisdiction</label>
              <select className="form-control" style={{ width: '100%' }}>
                <option value="Central EOW">Central Economic Offences Wing</option>
                <option value="Cyber Cell">Cyber Cell Division</option>
                <option value="Special Cell">Special Cell (Anti-Terror)</option>
                <option value="Women Cell">Women Security Cell</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label className="filter-label">Date & Time of Incident</label>
              <input type="datetime-local" className="form-control" defaultValue="2026-09-23T10:00" style={{ width: '100%' }} />
            </div>
            <div>
              <label className="filter-label">Investigating Officer Badge ID</label>
              <input type="text" className="form-control" readOnly value={officerId} style={{ backgroundColor: 'var(--gov-surface-alt)', width: '100%' }} />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="filter-label">Legal Sections Applied (e.g., BNS 303, BNS 376)</label>
            <input type="text" className="form-control" placeholder="Enter BNS sections..." style={{ width: '100%' }} value={sections} onChange={e => checkPocso(e.target.value)} />
            <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)', marginTop: '4px' }}>Separate multiple sections with commas.</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label className="filter-label">Accused Details (Name, Father's Name)</label>
              <textarea className="form-control" rows={3} placeholder="Enter known accused details..." style={{ width: '100%' }}></textarea>
            </div>
            <div>
              <label className="filter-label">Victim / Complainant Details</label>
              <textarea className="form-control" rows={3} placeholder="Enter victim details..." style={{ width: '100%' }}></textarea>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label className="filter-label">Brief Description / Gist of Incident</label>
            <textarea className="form-control" rows={4} placeholder="Provide a summary of the incident..." style={{ width: '100%' }}></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--gov-border-light)' }}>
            <button className="btn btn-secondary" onClick={() => router.push('/cases')}>Cancel</button>
            <button className="btn btn-primary" onClick={submitCase}>Register Case & Generate Vault</button>
          </div>

        </div>
      </div>
    </div>
  );
}
