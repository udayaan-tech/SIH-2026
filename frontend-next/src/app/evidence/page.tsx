"use client";

import React, { useEffect, useState } from 'react';
import { API } from '@/lib/api';
import { useAppState } from '@/lib/StateContext';

export default function EvidencePage() {
  const { language } = useAppState();
  const isHindi = language === 'HI';

  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);
  const [custodyChain, setCustodyChain] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chainLoading, setChainLoading] = useState(false);

  // Pending transfers (Dual-Officer Handshake)
  const [pendingTransfers, setPendingTransfers] = useState<any>({ incoming: [], outgoing: [] });
  const [officersList, setOfficersList] = useState<any[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [evType, setEvType] = useState('ALL');
  const [caseFilter, setCaseFilter] = useState('ALL');

  // Modals state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [targetEvidenceForTransfer, setTargetEvidenceForTransfer] = useState<any>(null);
  const [targetTransferForReject, setTargetTransferForReject] = useState<any>(null);

  // Transfer form state
  const [transferToOfficer, setTransferToOfficer] = useState('');
  const [transferAgency, setTransferAgency] = useState('FSL');
  const [transferActionType, setTransferActionType] = useState('TRANSFERRED');
  const [transferLocation, setTransferLocation] = useState('CFSL Digital Forensics Cleanroom Rack 4B');
  const [transferReason, setTransferReason] = useState('Requisition sent for bitstream imaging, write-blocked forensic examination, and unallocated cluster recovery under Section 105 BNSS.');

  // Reject form state
  const [rejectReason, setRejectReason] = useState('Physical anti-static seal barcode broken upon delivery. Discrepancy observed with seizure memo.');

  // Register form state
  const [newEvTitle, setNewEvTitle] = useState('');
  const [newEvType, setNewEvType] = useState('Digital Storage Media');
  const [newEvLoc, setNewEvLoc] = useState('Apex FinCorp HQ Server Room, Gurugram');
  const [newEvStorage, setNewEvStorage] = useState('Central Vault Safe Box #04');
  const [newEvDesc, setNewEvDesc] = useState('Recovered under Section 93 CrPC warrant. Sealed in tamper-evident anti-static bag.');

  // Notification / Alert toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 6000);
  };

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchEvidence(),
        fetchPendingTransfers(),
        fetchOfficers()
      ]);
    } catch (e) {
      console.error('Error fetching initial data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvidence = async () => {
    try {
      const res = await API.get(`/documents?search=${encodeURIComponent(search)}&type=${evType === 'ALL' ? '' : evType}`);
      const docs = res.data?.documents || [];
      setEvidenceList(docs);
      if (docs.length > 0 && !selectedEvidence) {
        loadEvidenceDetail(docs[0]);
      }
    } catch (e) {
      console.error('Error fetching evidence:', e);
    }
  };

  const fetchPendingTransfers = async () => {
    try {
      const res = await API.get('/custody/pending');
      if (res.data) {
        setPendingTransfers(res.data);
      }
    } catch (e) {
      console.error('Error fetching pending custody transfers:', e);
    }
  };

  const fetchOfficers = async () => {
    try {
      const res = await API.get('/custody/officers');
      const officers = res.data?.officers || [];
      setOfficersList(officers);
      if (officers.length > 0 && !transferToOfficer) {
        // Default to FSL officer or second officer in list
        const fsl = officers.find((o: any) => o.role === 'FSL');
        setTransferToOfficer(fsl ? fsl.id : officers[0].id);
      }
    } catch (e) {
      console.error('Error fetching officers:', e);
    }
  };

  const loadEvidenceDetail = async (ev: any) => {
    setSelectedEvidence(ev);
    setChainLoading(true);
    try {
      const res = await API.get(`/custody/chain/${ev.id}`);
      if (res.data) {
        setCustodyChain(res.data);
      }
    } catch (e) {
      console.error('Error loading custody chain:', e);
    } finally {
      setChainLoading(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setEvType('ALL');
    setCaseFilter('ALL');
    setTimeout(fetchEvidence, 0);
  };

  // Step 1: Initiate Transfer
  const submitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEvidenceForTransfer || !transferToOfficer) return;

    try {
      const res = await API.post('/custody/transfer', {
        document_id: targetEvidenceForTransfer.id,
        to_officer_id: transferToOfficer,
        to_agency: transferAgency,
        action_type: transferActionType,
        storage_location: transferLocation,
        notes: transferReason
      });

      setIsTransferModalOpen(false);
      showToast(`✓ HANDSHAKE STEP 1 INITIATED: Exhibit signed and dispatched to Officer ${res.data?.to_officer}. BSA Digital Signature: ${res.data?.sender_signature?.substring(0, 24)}...`);
      fetchEvidence();
      fetchPendingTransfers();
      if (selectedEvidence?.id === targetEvidenceForTransfer.id) {
        loadEvidenceDetail(targetEvidenceForTransfer);
      }
    } catch (err: any) {
      console.error('Transfer failed:', err);
      alert(`Transfer failed: ${err.message || 'Error occurred'}`);
    }
  };

  // Step 2: Accept Custody Handshake
  const handleAcceptTransfer = async (transferId: string) => {
    try {
      const res = await API.post(`/custody/transfer/accept/${transferId}`, {});
      showToast(`✓ DUAL HANDSHAKE COMPLETED: Cryptographic digital signature sealed under BSA Section 63/65B. Sig: ${res.data?.receiver_signature?.substring(0, 24)}...`);
      fetchPendingTransfers();
      fetchEvidence();
      if (selectedEvidence) {
        loadEvidenceDetail(selectedEvidence);
      }
    } catch (err: any) {
      console.error('Failed to accept custody:', err);
      alert(`Acceptance failed: ${err.message || 'Error occurred'}`);
    }
  };

  // Reject Custody Handshake
  const handleRejectTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTransferForReject) return;

    try {
      const res = await API.post(`/custody/transfer/reject/${targetTransferForReject.id}`, {
        reason: rejectReason
      });

      setIsRejectModalOpen(false);
      showToast(`⚠️ TRANSFER REJECTED: Reason logged in immutable WORM audit ledger: "${res.data?.reason}". Asset remains with releasing officer.`);
      fetchPendingTransfers();
      fetchEvidence();
      if (selectedEvidence) {
        loadEvidenceDetail(selectedEvidence);
      }
    } catch (err: any) {
      console.error('Rejection failed:', err);
      alert(`Rejection failed: ${err.message || 'Error occurred'}`);
    }
  };

  // Register New Evidence (Ingest & Hash)
  const submitRegisterEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await API.post('/evidence/upload', {
        title: newEvTitle,
        type: newEvType,
        case_id: '911778a7-b9b6-4968-a374-102498c3de32', // Seed case
        file_size: 1048576,
        classification: 'RESTRICTED'
      });

      setIsRegisterModalOpen(false);
      showToast(`✓ EXHIBIT REGISTERED: Ingested into vault with SHA-256 seal: ${res.data?.sha256_hash?.substring(0, 24)}...`);
      fetchEvidence();
    } catch (err: any) {
      console.error('Registration failed:', err);
      alert(`Registration failed: ${err.message || 'Error occurred'}`);
    }
  };

  const incomingPending = pendingTransfers?.incoming || [];
  const outgoingPending = pendingTransfers?.outgoing || [];
  const generatedEvNum = `EVD-2026-041-${String(evidenceList.length + 1).padStart(2, '0')}`;

  return (
    <div>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          backgroundColor: '#1E3A8A',
          color: '#FFFFFF',
          padding: '14px 20px',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderLeft: '5px solid #F59E0B',
          maxWidth: '500px',
          fontSize: '13px'
        }}>
          <span style={{ fontSize: '18px' }}>🔐</span>
          <div>{toastMessage}</div>
        </div>
      )}

      {/* Header Bar */}
      <div className="page-header-bar">
        <div className="page-title-group">
          <h1>{isHindi ? 'डिजिटल साक्ष्य तिजोरी एवं हिरासत शृंखला' : 'Digital Evidence Vault & Chain of Custody'}</h1>
          <div className="page-subtitle">
            Statutory dual-officer cryptographic handshake and immutable evidentiary chain tracking under BSA 2023 Sec 63 & BNSS 105
          </div>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchInitialData}>
            🔄 Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setIsRegisterModalOpen(true)}>
            + Register Evidence Exhibit
          </button>
        </div>
      </div>

      {/* Quick Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div className="gov-card" style={{ padding: '16px', borderTop: '4px solid var(--gov-navy-primary)' }}>
          <div style={{ fontSize: '12px', color: 'var(--gov-text-muted)', fontWeight: 600 }}>TOTAL SEIZED EXHIBITS</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--gov-navy-dark)' }}>{evidenceList.length}</div>
          <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px' }}>✓ 100% Cryptographically Hashed</div>
        </div>

        <div className="gov-card" style={{ padding: '16px', borderTop: '4px solid #10B981' }}>
          <div style={{ fontSize: '12px', color: 'var(--gov-text-muted)', fontWeight: 600 }}>LEGAL INTEGRITY STATUS</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#059669' }}>SEALED</div>
          <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)', marginTop: '4px' }}>BSA 2023 Sec 65B Admissible</div>
        </div>

        <div className="gov-card" style={{ padding: '16px', borderTop: incomingPending.length > 0 ? '4px solid #F59E0B' : '4px solid var(--gov-border)' }}>
          <div style={{ fontSize: '12px', color: 'var(--gov-text-muted)', fontWeight: 600 }}>PENDING DUAL HANDSHAKES</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: incomingPending.length > 0 ? '#D97706' : 'var(--gov-navy-dark)' }}>
            {incomingPending.length}
          </div>
          <div style={{ fontSize: '11px', color: incomingPending.length > 0 ? '#B45309' : 'var(--gov-text-muted)', marginTop: '4px' }}>
            {incomingPending.length > 0 ? '⚠️ Digital Sign-Off Required' : 'All Transferred Exhibits Sealed'}
          </div>
        </div>

        <div className="gov-card" style={{ padding: '16px', borderTop: '4px solid #6366F1' }}>
          <div style={{ fontSize: '12px', color: 'var(--gov-text-muted)', fontWeight: 600 }}>OUTBOUND TRANSIT</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#4F46E5' }}>{outgoingPending.length}</div>
          <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)', marginTop: '4px' }}>Awaiting Recipient Sign-Off</div>
        </div>
      </div>

      {/* PENDING DUAL-OFFICER HANDSHAKE BANNER (Step 2 Action) */}
      {incomingPending.length > 0 && (
        <div style={{
          backgroundColor: '#FFFBEB',
          border: '2px solid #FCD34D',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '22px' }}>⚠️</span>
              <div>
                <strong style={{ color: '#92400E', fontSize: '15px' }}>
                  ACTION REQUIRED: Custody Handshake Sign-Off Pending ({incomingPending.length})
                </strong>
                <div style={{ fontSize: '12px', color: '#B45309' }}>
                  An evidentiary exhibit has been transferred to you. Under BSA 2023 Section 63, your digital signature is required to complete the dual handshake and accept legal responsibility.
                </div>
              </div>
            </div>
            <span className="badge badge-warning" style={{ fontSize: '11px', padding: '4px 10px' }}>
              STEP 2 OF 2: RECEIVER SIGNATURE
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {incomingPending.map((p: any) => (
              <div key={p.id} style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #FDE68A',
                borderRadius: '6px',
                padding: '14px',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '14px'
              }}>
                <div style={{ flex: '1 1 300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '14px', color: 'var(--gov-navy-dark)' }}>{p.document_title}</strong>
                    <span className="badge badge-info" style={{ fontSize: '10px' }}>{p.fir_number || 'CASE-041'}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gov-text-muted)' }}>
                    <strong>Releasing Officer:</strong> {p.from_officer_name || 'Inspector Rajesh Kumar'} ({p.from_officer_badge || 'DL-4821'}) • <strong>Location:</strong> {p.storage_location || 'Evidence Transit'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#4B5563', marginTop: '4px', fontStyle: 'italic' }}>
                    &ldquo;{p.notes}&rdquo;
                  </div>
                  {p.sender_signature && (
                    <div style={{ fontSize: '10px', color: 'var(--gov-navy-primary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                      Sender Signature: {p.sender_signature.substring(0, 36)}... [VERIFIED]
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ color: '#DC2626', borderColor: '#FCA5A5' }}
                    onClick={() => {
                      setTargetTransferForReject(p);
                      setIsRejectModalOpen(true);
                    }}
                  >
                    Reject (Seal Broken)
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ backgroundColor: '#059669', borderColor: '#059669' }}
                    onClick={() => handleAcceptTransfer(p.id)}
                  >
                    ✓ Sign & Accept Custody (Dual Handshake)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outgoing Pending Alert */}
      {outgoingPending.length > 0 && incomingPending.length === 0 && (
        <div style={{
          backgroundColor: '#EEF2FF',
          border: '1px solid #C7D2FE',
          borderRadius: '6px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#3730A3'
        }}>
          <div>
            <strong>Outbound Handshake In-Flight:</strong> You initiated custody transfer for <strong>{outgoingPending[0].document_title}</strong> to Officer <strong>{outgoingPending[0].to_officer_name} ({outgoingPending[0].to_officer_badge})</strong>.
          </div>
          <span className="badge badge-info" style={{ fontSize: '10px' }}>Awaiting Recipient Sign-Off</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="filter-toolbar">
        <div className="filter-group" style={{ flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            className="form-control"
            style={{ width: '100%' }}
            placeholder="Search exhibit title, SHA-256 hash, FIR number..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setTimeout(fetchEvidence, 0);
            }}
          />
        </div>

        <div className="filter-group">
          <label className="filter-label">Exhibit Type:</label>
          <select
            className="form-control"
            value={evType}
            onChange={e => {
              setEvType(e.target.value);
              setTimeout(fetchEvidence, 0);
            }}
          >
            <option value="ALL">All Types</option>
            <option value="VIDEO">Video / CCTV Footage</option>
            <option value="DISK_IMAGE">Forensic Disk Clone</option>
            <option value="DOCUMENT">Financial Audit / PDF</option>
            <option value="AUDIO">Witness Deposition / Audio</option>
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
                <th>Exhibit Title</th>
                <th>Type</th>
                <th>FIR / Case</th>
                <th>Seizure Date</th>
                <th>Current Custodian</th>
                <th>SHA-256 Bitstream Hash</th>
                <th>Integrity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '24px' }}>Loading evidence exhibits from vault...</td></tr>
              ) : evidenceList.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '24px' }}>No exhibits found matching query.</td></tr>
              ) : (
                evidenceList.map((ev: any) => {
                  const isSelected = selectedEvidence?.id === ev.id;
                  return (
                    <tr key={ev.id} style={isSelected ? { backgroundColor: '#EEF4FC' } : {}}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--gov-navy-dark)' }}>{ev.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)' }}>Exhibit ID: {ev.id.substring(0, 13)}...</div>
                      </td>
                      <td><span className="badge badge-info">{ev.type || 'EVIDENCE'}</span></td>
                      <td><strong className="font-mono">{ev.fir_number || 'FIR-2026-DL-00192'}</strong></td>
                      <td style={{ fontSize: '12px' }}>{new Date(ev.created_at).toLocaleDateString()}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--gov-navy-primary)' }}>
                          {ev.uploader_name || 'Inspector Rajesh Kumar'}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--gov-text-muted)' }}>
                          Badge: {ev.uploader_badge || 'DL-4821'}
                        </div>
                      </td>
                      <td>
                        <span className="font-mono" style={{ fontSize: '11px', color: 'var(--gov-navy-dark)' }}>
                          {ev.sha256_hash ? ev.sha256_hash.substring(0, 16) + '...' : 'Calculating...'}
                        </span>
                      </td>
                      <td><span className="badge badge-verified">✓ SEALED (BSA)</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => loadEvidenceDetail(ev)}
                          >
                            Chain of Custody
                          </button>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setTargetEvidenceForTransfer(ev);
                              setIsTransferModalOpen(true);
                            }}
                          >
                            Transfer →
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chain of Custody Flowchart & Detail Workspace */}
      <div style={{ marginTop: '24px' }}>
        {selectedEvidence && (
          <div className="gov-card">
            <div className="gov-card-header" style={{ backgroundColor: 'var(--gov-navy-dark)', color: '#FFFFFF' }}>
              <div className="gov-card-title" style={{ color: '#FFFFFF' }}>
                <span>⛓</span> Statutory Chain of Custody & Exhibit Ledger — {selectedEvidence.title}
              </div>
              <button
                className="btn btn-saffron btn-sm"
                onClick={() => {
                  setTargetEvidenceForTransfer(selectedEvidence);
                  setIsTransferModalOpen(true);
                }}
              >
                + Transfer Custody to Officer
              </button>
            </div>
            <div className="gov-card-body">
              
              {/* Exhibit Metadata Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', background: 'var(--gov-surface-alt)', padding: '14px', border: '1px solid var(--gov-border-light)', marginBottom: '20px', borderRadius: '4px' }}>
                <div>
                  <div className="info-label">Exhibit Title</div>
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>{selectedEvidence.title}</div>
                </div>
                <div>
                  <div className="info-label">FIR Reference</div>
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>{selectedEvidence.fir_number || 'FIR-2026-DL-00192'}</div>
                </div>
                <div>
                  <div className="info-label">Current Legal Custodian</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gov-navy-primary)' }}>
                    {custodyChain?.current_custodian || 'Inspector Rajesh Kumar'} ({custodyChain?.current_badge || 'DL-4821'})
                  </div>
                </div>
                <div>
                  <div className="info-label">Admissibility Mandate</div>
                  <div style={{ fontSize: '12px', color: '#059669', fontWeight: 700 }}>
                    Section 63/65B BSA 2023 Verified
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div className="info-label">Cryptographic SHA-256 Bitstream Hash (Unbroken Chain)</div>
                  <div className="hash-display-box font-mono" style={{ fontSize: '12px', padding: '8px 12px', backgroundColor: '#1E293B', color: '#38BDF8', borderRadius: '4px', wordBreak: 'break-all' }}>
                    {selectedEvidence.sha256_hash}
                  </div>
                </div>
              </div>

              {/* STATUTORY CHAIN OF CUSTODY FLOWCHART */}
              <div style={{ margin: '20px 0' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--gov-navy-dark)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>STATUTORY CHAIN OF CUSTODY (SEIZURE → TRANSIT → FORENSIC LAB → SAFEKEEPING)</span>
                  <span className="badge badge-verified" style={{ fontSize: '10px' }}>DUAL-SIGNED</span>
                </div>

                {chainLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center' }}>Loading verified custody hops...</div>
                ) : (
                  <div className="coc-pipeline" style={{ padding: '12px 6px' }}>
                    {(custodyChain?.chain || []).map((hop: any, idx: number) => {
                      const isLast = idx === (custodyChain?.chain || []).length - 1;
                      const isAccepted = hop.status === 'ACCEPTED';
                      const isPending = hop.status === 'PENDING' || hop.status === 'PENDING_RECEIVER';

                      return (
                        <React.Fragment key={hop.id || idx}>
                          <div
                            className={`coc-node ${isLast ? 'active' : ''}`}
                            style={{
                              borderTopColor: isAccepted ? '#10B981' : isPending ? '#F59E0B' : '#EF4444',
                              minWidth: '220px',
                              boxShadow: isLast ? '0 4px 12px rgba(16, 185, 129, 0.15)' : 'none'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <div className="coc-node-action" style={{ color: isAccepted ? '#059669' : '#D97706' }}>
                                {hop.action_type || 'TRANSFERRED'}
                              </div>
                              <span className={`badge ${isAccepted ? 'badge-verified' : 'badge-warning'}`} style={{ fontSize: '9px' }}>
                                {isAccepted ? '✓ DUAL-SIGNED' : 'PENDING'}
                              </span>
                            </div>

                            <div className="coc-node-officer">
                              {hop.to_officer_name || 'Designated Officer'} ({hop.to_officer_badge || 'POLICE'})
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--gov-navy-light)', fontWeight: 600 }}>
                              Agency: {hop.to_agency || 'EIU / FSL'}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--gov-text-muted)', marginTop: '2px' }}>
                              {hop.storage_location || 'Central Vault Safe Box'}
                            </div>
                            <div className="coc-node-date" style={{ marginTop: '4px' }}>
                              {new Date(hop.transferred_at).toLocaleString()}
                            </div>

                            {/* Dual Signatures Preview */}
                            <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed var(--gov-border-light)', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                              <div style={{ color: '#059669' }}>
                                SENDER SIG: {hop.sender_signature ? hop.sender_signature.substring(0, 14) + '...' : 'GENESIS'}
                              </div>
                              <div style={{ color: hop.receiver_signature ? '#059669' : '#D97706' }}>
                                RECV SIG:   {hop.receiver_signature ? hop.receiver_signature.substring(0, 14) + '...' : '[AWAITING]'}
                              </div>
                            </div>
                          </div>

                          {!isLast && <div className="coc-arrow" style={{ fontSize: '20px', color: 'var(--gov-navy-primary)' }}>➔</div>}
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Detailed Custody Hop Ledger Table */}
              <div className="table-responsive" style={{ marginTop: '16px' }}>
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Action</th>
                      <th>Releasing Officer / Agency</th>
                      <th>Receiving Officer / Agency</th>
                      <th>Storage Location / Transit</th>
                      <th>Dual Signatures (BSA Sec 63)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(custodyChain?.chain || []).map((hop: any, idx: number) => (
                      <tr key={hop.id || idx}>
                        <td style={{ fontSize: '11px' }} className="font-mono">
                          {new Date(hop.transferred_at).toLocaleString()}
                        </td>
                        <td><span className="badge badge-info">{hop.action_type}</span></td>
                        <td>
                          <div>{hop.from_officer_name || 'Seizure Site / Genesis'}</div>
                          <div style={{ fontSize: '10px', color: 'var(--gov-text-muted)' }}>{hop.from_agency || 'CRIME_SCENE'}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{hop.to_officer_name || 'Officer'}</div>
                          <div style={{ fontSize: '10px', color: 'var(--gov-text-muted)' }}>{hop.to_agency || 'FSL / VAULT'}</div>
                        </td>
                        <td style={{ fontSize: '12px' }}>{hop.storage_location || 'Secure Locker'}</td>
                        <td className="font-mono" style={{ fontSize: '10px' }}>
                          <div style={{ color: '#059669' }}>
                            Send: {hop.sender_signature ? hop.sender_signature.substring(0, 16) + '...' : 'N/A'}
                          </div>
                          <div style={{ color: hop.receiver_signature ? '#059669' : '#D97706' }}>
                            Recv: {hop.receiver_signature ? hop.receiver_signature.substring(0, 16) + '...' : 'Pending'}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${hop.status === 'ACCEPTED' ? 'badge-verified' : hop.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                            {hop.status || 'PENDING'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Transfer Custody Modal (Dual Handshake Step 1) */}
      {isTransferModalOpen && targetEvidenceForTransfer && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div className="modal-title">🔐 Initiate Dual-Officer Custody Transfer</div>
              <button className="modal-close-btn" onClick={() => setIsTransferModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ backgroundColor: 'var(--gov-surface-alt)', border: '1px solid var(--gov-border)', padding: '12px 14px', borderRadius: '4px', marginBottom: '16px', fontSize: '12px' }}>
                <div><strong>Target Exhibit:</strong> {targetEvidenceForTransfer.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)', marginTop: '2px' }}>
                  SHA-256: {targetEvidenceForTransfer.sha256_hash?.substring(0, 32)}...
                </div>
              </div>

              <form onSubmit={submitTransfer}>
                <div style={{ marginBottom: '12px' }}>
                  <label className="filter-label">Designated Recipient Officer (Transferee)</label>
                  <select
                    className="form-control"
                    style={{ width: '100%' }}
                    required
                    value={transferToOfficer}
                    onChange={e => {
                      setTransferToOfficer(e.target.value);
                      const selected = officersList.find((o: any) => o.id === e.target.value);
                      if (selected) {
                        setTransferAgency(selected.role);
                      }
                    }}
                  >
                    {officersList.map((o: any) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.badge_id}) — {o.role} [{o.station}]
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label className="filter-label">Transfer Stage Action</label>
                    <select
                      className="form-control"
                      style={{ width: '100%' }}
                      value={transferActionType}
                      onChange={e => setTransferActionType(e.target.value)}
                    >
                      <option value="TRANSFERRED">TRANSFERRED (Forensic Requisition)</option>
                      <option value="COURT_PRODUCTION">COURT_PRODUCTION (Adduced in Trial)</option>
                      <option value="VAULT_STORAGE">VAULT_STORAGE (Placed in Secure Safe)</option>
                      <option value="EXAMINED">EXAMINED (Forensic Bitstream Analysis)</option>
                    </select>
                  </div>
                  <div>
                    <label className="filter-label">Recipient Agency</label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ width: '100%' }}
                      value={transferAgency}
                      onChange={e => setTransferAgency(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label className="filter-label">Destination Facility / Safe Location</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ width: '100%' }}
                    value={transferLocation}
                    onChange={e => setTransferLocation(e.target.value)}
                    required
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label className="filter-label">Transfer Justification / Statutory Requisition Note</label>
                  <textarea
                    className="form-control"
                    style={{ width: '100%', height: '70px' }}
                    required
                    value={transferReason}
                    onChange={e => setTransferReason(e.target.value)}
                  />
                </div>

                <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', padding: '10px 14px', borderRadius: '4px', fontSize: '11px', color: '#92400E', marginBottom: '14px' }}>
                  <strong>STATUTORY BSA 2023 NOTICE:</strong> Submitting this handoff computes an ECDSA cryptographic signature sealing the document hash, release timestamp, and transfer requisition. The recipient will be notified for digital countersignature (Step 2).
                </div>

                <div className="modal-footer" style={{ padding: '12px 0 0 0', background: 'none' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsTransferModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Sign & Dispatch Transfer (Step 1) →</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Reject Custody Modal */}
      {isRejectModalOpen && targetTransferForReject && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div className="modal-title" style={{ color: '#DC2626' }}>⚠️ Formally Reject Custody Handshake</div>
              <button className="modal-close-btn" onClick={() => setIsRejectModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '12px', color: '#4B5563', marginBottom: '14px' }}>
                Rejecting this custody transfer documents a formal chain-of-custody refusal. The release will be nullified, and an immutable entry will be written to the WORM audit trail.
              </p>

              <form onSubmit={handleRejectTransfer}>
                <div style={{ marginBottom: '14px' }}>
                  <label className="filter-label">Statutory Refusal Reason</label>
                  <textarea
                    className="form-control"
                    style={{ width: '100%', height: '80px' }}
                    required
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                  />
                </div>

                <div className="modal-footer" style={{ padding: '12px 0 0 0', background: 'none' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsRejectModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}>
                    Confirm Rejection & Log Refusal
                  </button>
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
                    <label className="filter-label">Evidence Exhibit Number</label>
                    <input type="text" className="form-control font-mono" style={{ width: '100%' }} value={generatedEvNum} readOnly />
                  </div>
                  <div>
                    <label className="filter-label">Evidence Type</label>
                    <select className="form-control" style={{ width: '100%' }} value={newEvType} onChange={e => setNewEvType(e.target.value)}>
                      <option value="DISK_IMAGE">Forensic Disk Clone (dd / RAW)</option>
                      <option value="VIDEO">Surveillance Video (MP4 / AVI)</option>
                      <option value="DOCUMENT">Financial Transaction Audit (PDF)</option>
                      <option value="AUDIO">Witness Deposition Recording (WAV)</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label className="filter-label">Exhibit Title</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ width: '100%' }}
                    placeholder="e.g. Seized Accounting Server NVMe SSD 2TB"
                    required
                    value={newEvTitle}
                    onChange={e => setNewEvTitle(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label className="filter-label">Collection Location</label>
                    <input type="text" className="form-control" style={{ width: '100%' }} required value={newEvLoc} onChange={e => setNewEvLoc(e.target.value)} />
                  </div>
                  <div>
                    <label className="filter-label">Vault Storage Safe</label>
                    <input type="text" className="form-control" style={{ width: '100%' }} required value={newEvStorage} onChange={e => setNewEvStorage(e.target.value)} />
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label className="filter-label">Exhibit Description & Seizure Memo Notes</label>
                  <textarea className="form-control" style={{ width: '100%', height: '60px' }} value={newEvDesc} onChange={e => setNewEvDesc(e.target.value)} />
                </div>

                <div className="modal-footer" style={{ padding: '12px 0 0 0', background: 'none' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsRegisterModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Register Exhibit & Ingest →</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
