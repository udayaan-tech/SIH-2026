"use client";

import React, { useEffect, useState } from 'react';
import { API } from '@/lib/api';
import { useAppState } from '@/lib/StateContext';

export default function EvidencePage() {
  const { language } = useAppState();
  const isHindi = language === 'HI';

  const [evidenceList, setEvidenceList] = useState([]);
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [evType, setEvType] = useState('ALL');
  const [caseId, setCaseId] = useState('ALL');

  // Modals state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [targetEvidenceForTransfer, setTargetEvidenceForTransfer] = useState<any>(null);

  // Transfer form state
  const [transferToOfficer, setTransferToOfficer] = useState('usr-patel');
  const [transferActionType, setTransferActionType] = useState('TRANSFERRED');
  const [transferLocation, setTransferLocation] = useState('FSD Digital Forensics Secure Lab Rack 4B');
  const [transferReason, setTransferReason] = useState('Requisition sent for bitstream imaging, write-blocked forensic examination, and unallocated cluster recovery.');

  // Register form state
  const [newEvTitle, setNewEvTitle] = useState('');
  const [newEvType, setNewEvType] = useState('Digital Storage Media');
  const [newEvLoc, setNewEvLoc] = useState('Apex FinCorp HQ Server Room, Gurugram');
  const [newEvStorage, setNewEvStorage] = useState('Central Vault Safe Box #04');
  const [newEvDesc, setNewEvDesc] = useState('Recovered under Section 93 CrPC warrant. Sealed in tamper-evident anti-static bag.');

  useEffect(() => {
    fetchEvidence();
  }, []);

  const fetchEvidence = async () => {
    setIsLoading(true);
    try {
      const res = await API.get(`/evidence?search=${encodeURIComponent(search)}&evidenceType=${evType}&caseId=${caseId}`);
      const data = res.data || [];
      setEvidenceList(data);
      if (data.length > 0 && !selectedEvidence) {
        loadEvidenceDetail(data[0].id);
      }
    } catch (e) {
      console.error('Error fetching evidence:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = () => {
    fetchEvidence();
  };

  const resetFilters = () => {
    setSearch('');
    setEvType('ALL');
    setCaseId('ALL');
    setTimeout(fetchEvidence, 0);
  };

  const loadEvidenceDetail = async (evId: string) => {
    try {
      const res = await API.get(`/evidence/${evId}`);
      setSelectedEvidence(res.data);
    } catch (e) {
      console.error('Error loading evidence detail:', e);
    }
  };

  const submitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEvidenceForTransfer) return;

    try {
      const res = await API.post(`/evidence/${targetEvidenceForTransfer.id}/transfer`, {
        toOfficerId: transferToOfficer,
        actionType: transferActionType,
        newStorageLocation: transferLocation,
        transferReason
      });

      setIsTransferModalOpen(false);
      alert(`✓ CUSTODY TRANSFERRED: Exhibit successfully handed over to Officer ${res.data.toOfficer}.\nDigital Signature: ${res.data.digitalSignature.substring(0, 32)}...`);
      fetchEvidence();
      loadEvidenceDetail(targetEvidenceForTransfer.id);
    } catch (err) {
      console.error('Transfer failed:', err);
    }
  };

  const submitRegisterEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await API.post('/evidence', {
        caseId: 'case-041',
        title: newEvTitle,
        evidenceType: newEvType,
        collectionLocation: newEvLoc,
        storageLocation: newEvStorage,
        description: newEvDesc
      });

      setIsRegisterModalOpen(false);
      alert(`✓ SUCCESS: Evidence registered into vault.\nExhibit Number: ${res.data.evidenceNumber}\nSHA-256 Hash: ${res.data.sha256Hash}`);
      fetchEvidence();
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  const generatedEvNum = `EVD-2026-041-${String(evidenceList.length + 1).padStart(2, '0')}`;

  return (
    <div>
      <div className="page-header-bar">
        <div className="page-title-group">
          <h1>{isHindi ? 'डिजिटल साक्ष्य तिजोरी' : 'Digital Evidence Vault'}</h1>
          <div className="page-subtitle">
            Forensic exhibit depository and immutable statutory Chain of Custody tracking
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-sm" onClick={() => setIsRegisterModalOpen(true)}>
            + Register Evidence Exhibit
          </button>
        </div>
      </div>

      {/* Evidence Filters */}
      <div className="filter-toolbar">
        <div className="filter-group" style={{ flex: 1, minWidth: '220px' }}>
          <input type="text" className="form-control" style={{ width: '100%' }}
            placeholder="Search by exhibit number, title, barcode..." value={search} onChange={e => { setSearch(e.target.value); setTimeout(fetchEvidence, 0); }} />
        </div>

        <div className="filter-group">
          <label className="filter-label">Exhibit Type:</label>
          <select className="form-control" value={evType} onChange={e => { setEvType(e.target.value); setTimeout(fetchEvidence, 0); }}>
            <option value="ALL">All Types</option>
            <option value="Digital Storage Media">Digital Storage Media</option>
            <option value="Encrypted Digital Media">Encrypted Digital Media</option>
            <option value="Network Telemetry & Memory Dump">Network Telemetry & Memory Dump</option>
            <option value="Mobile Device">Mobile Device</option>
            <option value="Physical Document & Seal">Physical Document & Seal</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Case:</label>
          <select className="form-control" value={caseId} onChange={e => { setCaseId(e.target.value); setTimeout(fetchEvidence, 0); }}>
            <option value="ALL">All Cases</option>
            <option value="case-041">CASE-2026-041 (Apex FinCorp)</option>
            <option value="case-038">CASE-2026-038 (Power Grid SCADA)</option>
            <option value="case-031">CASE-2026-031 (Auditor Disappearance)</option>
          </select>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={resetFilters}>Reset</button>
      </div>

      {/* Evidence Vault Table */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">
            <span>🔐</span> Seized Exhibits in Vault (<span id="ev-count-badge">{evidenceList.length}</span>)
          </div>
        </div>
        <div className="table-responsive">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Evidence ID</th>
                <th>Case ID</th>
                <th>Evidence Title</th>
                <th>Type</th>
                <th>Collected By</th>
                <th>Collection Date</th>
                <th>Current Custodian</th>
                <th>Integrity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '24px' }}>Loading evidence records...</td></tr>
              ) : evidenceList.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '24px' }}>No evidence exhibits found.</td></tr>
              ) : (
                evidenceList.map((ev: any) => (
                  <tr key={ev.id} style={selectedEvidence?.id === ev.id ? { backgroundColor: '#EEF4FC' } : {}}>
                    <td><strong className="font-mono" style={{ color: 'var(--gov-navy-primary)' }}>{ev.evidence_number}</strong></td>
                    <td><strong className="font-mono">{ev.case_number || ev.case_id}</strong></td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{ev.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)' }}>{ev.storage_location} • Barcode: {ev.serial_barcode || 'N/A'}</div>
                    </td>
                    <td><span className="badge badge-info">{ev.evidence_type}</span></td>
                    <td>{ev.collector_name || 'Officer A. Sharma'}</td>
                    <td style={{ fontSize: '12px' }}>{ev.collection_date}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--gov-navy-dark)' }}>{ev.custodian_name || 'Assigned Officer'}</div>
                      <div style={{ fontSize: '10px', color: 'var(--gov-text-muted)' }}>{ev.custodian_department || ''}</div>
                    </td>
                    <td><span className="badge badge-verified">{ev.integrity_status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => loadEvidenceDetail(ev.id)}>
                          Chain of Custody
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={() => { setTargetEvidenceForTransfer(ev); setIsTransferModalOpen(true); }}>
                          Transfer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evidence Detail & Chain of Custody Workspace */}
      <div style={{ marginTop: '24px' }}>
        {selectedEvidence && (
          <div className="gov-card">
            <div className="gov-card-header" style={{ backgroundColor: 'var(--gov-navy-dark)', color: '#FFFFFF' }}>
              <div className="gov-card-title" style={{ color: '#FFFFFF' }}>
                <span>⛓</span> Chain of Custody & Exhibit Ledger — {selectedEvidence.evidence_number}
              </div>
              <button className="btn btn-saffron btn-sm" onClick={() => { setTargetEvidenceForTransfer(selectedEvidence); setIsTransferModalOpen(true); }}>
                + Transfer Custody to Officer
              </button>
            </div>
            <div className="gov-card-body">
              
              {/* Exhibit Metadata Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', background: 'var(--gov-surface-alt)', padding: '14px', border: '1px solid var(--gov-border-light)', marginBottom: '20px' }}>
                <div>
                  <div className="info-label">Exhibit Title</div>
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>{selectedEvidence.title}</div>
                </div>
                <div>
                  <div className="info-label">Seizure Location</div>
                  <div style={{ fontSize: '12px' }}>{selectedEvidence.collection_location}</div>
                </div>
                <div>
                  <div className="info-label">Vault Storage Safe</div>
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>{selectedEvidence.storage_location}</div>
                </div>
                <div>
                  <div className="info-label">Current Custodian</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gov-navy-primary)' }}>{selectedEvidence.custodian_name || 'Officer'}</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div className="info-label">Cryptographic SHA-256 Bitstream Hash</div>
                  <div className="hash-display-box">{selectedEvidence.sha256_hash}</div>
                </div>
              </div>

              {/* Official CHAIN OF CUSTODY Flowchart */}
              <div style={{ margin: '20px 0' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--gov-navy-dark)', marginBottom: '8px' }}>
                  STATUTORY CHAIN OF CUSTODY (COLLECTED → TRANSFERRED → RECEIVED → EXAMINED → STORED)
                </div>

                <div className="coc-pipeline">
                  {(selectedEvidence.chainOfCustody || []).map((c: any, idx: number) => (
                    <React.Fragment key={idx}>
                      <div className={`coc-node ${idx === (selectedEvidence.chainOfCustody || []).length - 1 ? 'active' : ''}`}>
                        <div className="coc-node-action">{c.action_type}</div>
                        <div className="coc-node-officer">Officer: {c.to_officer_name || c.from_officer_name || 'A. Sharma'}</div>
                        <div style={{ fontSize: '10px', color: 'var(--gov-navy-light)', fontWeight: 600 }}>{c.to_department || 'EIU'}</div>
                        <div className="coc-node-date">{c.timestamp || '2026-02-15'}</div>
                        <div style={{ fontSize: '9px', color: 'var(--gov-text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                          SIG: {c.digital_signature ? c.digital_signature.substring(0, 16) : 'NDIS-DSIG'}...
                        </div>
                      </div>
                      {idx < (selectedEvidence.chainOfCustody || []).length - 1 && <div className="coc-arrow">➔</div>}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Detailed Custody Hop Records Table */}
              <div className="table-responsive" style={{ marginTop: '14px' }}>
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Action</th>
                      <th>Releasing Officer / Dept</th>
                      <th>Receiving Officer / Dept</th>
                      <th>Transfer Justification</th>
                      <th>Verification Hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedEvidence.chainOfCustody || []).map((c: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ fontSize: '11px' }} className="font-mono">{c.timestamp}</td>
                        <td><span className="badge badge-info">{c.action_type}</span></td>
                        <td>{c.from_officer_name || 'Seizure Site'} ({c.from_department || 'Field'})</td>
                        <td><strong>{c.to_officer_name || 'R. Patel'}</strong> ({c.to_department || 'FSD'})</td>
                        <td style={{ fontSize: '12px' }}>{c.transfer_reason}</td>
                        <td className="font-mono" style={{ fontSize: '10px', color: 'var(--gov-text-muted)' }}>{(c.sha256_verification || selectedEvidence.sha256_hash).substring(0, 16)}...</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      {isTransferModalOpen && targetEvidenceForTransfer && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div className="modal-title">🔐 Execute Statutory Custody Transfer</div>
              <button className="modal-close-btn" onClick={() => setIsTransferModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ backgroundColor: 'var(--gov-surface-alt)', border: '1px solid var(--gov-border)', padding: '10px 14px', borderRadius: '4px', marginBottom: '16px', fontSize: '12px' }}>
                <div><strong>Target Exhibit:</strong> {targetEvidenceForTransfer.evidence_number} — {targetEvidenceForTransfer.title}</div>
                <div><strong>Current Custodian:</strong> {targetEvidenceForTransfer.custodian_name || 'Officer A. Sharma'} ({targetEvidenceForTransfer.custodian_department || 'EIU'})</div>
              </div>

              <form onSubmit={submitTransfer}>
                <div style={{ marginBottom: '12px' }}>
                  <label className="filter-label">Receiving Officer (Transferee)</label>
                  <select className="form-control" style={{ width: '100%' }} required value={transferToOfficer} onChange={e => setTransferToOfficer(e.target.value)}>
                    <option value="usr-patel">R. Patel (Senior Forensic Specialist - FSD)</option>
                    <option value="usr-deshmukh">P. Deshmukh (Cyber Forensics Lead - CCD)</option>
                    <option value="usr-singh">N. Singh (Legal Affairs Department)</option>
                    <option value="usr-sharma">A. Sharma (Lead IO - EIU)</option>
                  </select>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label className="filter-label">Transfer Stage Action</label>
                  <select className="form-control" style={{ width: '100%' }} value={transferActionType} onChange={e => setTransferActionType(e.target.value)}>
                    <option value="TRANSFERRED">TRANSFERRED (Transit / Laboratory Handover)</option>
                    <option value="RECEIVED">RECEIVED (Intake Verification Complete)</option>
                    <option value="EXAMINED">EXAMINED (Forensic Bitstream Analysis Complete)</option>
                    <option value="STORED">STORED (Placed in Secured Vault Locker)</option>
                  </select>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label className="filter-label">New Storage Location / Lab Facility</label>
                  <input type="text" className="form-control" style={{ width: '100%' }} value={transferLocation} onChange={e => setTransferLocation(e.target.value)} required />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label className="filter-label">Transfer Requisition / Justification</label>
                  <textarea className="form-control" style={{ width: '100%', height: '65px' }} required value={transferReason} onChange={e => setTransferReason(e.target.value)}></textarea>
                </div>

                <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', padding: '10px', borderRadius: '4px', fontSize: '11px', color: '#92400E', marginBottom: '14px' }}>
                  <strong>GOVERNMENT PROTOCOL NOTICE:</strong> Executing this transfer attaches your cryptographic ECDSA hardware token signature and creates an immutable audit log.
                </div>

                <div className="modal-footer" style={{ padding: '12px 0 0 0', background: 'none' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsTransferModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Sign & Execute Transfer →</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Register Evidence Modal */}
      {isRegisterModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div className="modal-title">🔐 Register Digital or Physical Evidence Exhibit</div>
              <button className="modal-close-btn" onClick={() => setIsRegisterModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={submitRegisterEvidence}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label className="filter-label">Evidence Number (Auto)</label>
                    <input type="text" className="form-control font-mono" style={{ width: '100%' }} value={generatedEvNum} readOnly />
                  </div>
                  <div>
                    <label className="filter-label">Evidence Type</label>
                    <select className="form-control" style={{ width: '100%' }} value={newEvType} onChange={e => setNewEvType(e.target.value)}>
                      <option value="Digital Storage Media">Digital Storage Media (NVMe/SATA/USB)</option>
                      <option value="Encrypted Digital Media">Encrypted Digital Media</option>
                      <option value="Network Telemetry & Memory Dump">Network Telemetry & Memory Dump</option>
                      <option value="Mobile Device">Mobile Device</option>
                      <option value="Physical Document & Seal">Physical Document & Seal</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label className="filter-label">Exhibit Title</label>
                  <input type="text" className="form-control" style={{ width: '100%' }} placeholder="e.g. Seized Accounting Server NVMe SSD 2TB" required value={newEvTitle} onChange={e => setNewEvTitle(e.target.value)} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label className="filter-label">Collection Location</label>
                    <input type="text" className="form-control" style={{ width: '100%' }} required value={newEvLoc} onChange={e => setNewEvLoc(e.target.value)} />
                  </div>
                  <div>
                    <label className="filter-label">Initial Storage Location</label>
                    <input type="text" className="form-control" style={{ width: '100%' }} required value={newEvStorage} onChange={e => setNewEvStorage(e.target.value)} />
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label className="filter-label">Exhibit Description & Condition</label>
                  <textarea className="form-control" style={{ width: '100%', height: '60px' }} value={newEvDesc} onChange={e => setNewEvDesc(e.target.value)}></textarea>
                </div>

                <div className="modal-footer" style={{ padding: '12px 0 0 0', background: 'none' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsRegisterModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Register Exhibit & Hash →</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
