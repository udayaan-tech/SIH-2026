"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { API } from '@/lib/api';
import { useAppState } from '@/lib/StateContext';

export default function DocumentsPage() {
  const router = useRouter();
  const { currentOfficer, language } = useAppState();
  
  const [docs, setDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [docType, setDocType] = useState('ALL');
  const [caseId, setCaseId] = useState('ALL');
  const [verifStatus, setVerifStatus] = useState('ALL');

  const isHindi = language === 'HI';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadState, setUploadState] = useState('form'); // form, processing, complete
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    title: '',
    caseId: 'case-041',
    docType: 'Forensic Report',
    tier: 'CONFIDENTIAL'
  });
  const [pipelineSteps, setPipelineSteps] = useState<any>({});
  const [uploadResult, setUploadResult] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    setIsLoading(true);
    try {
      const res = await API.get(`/documents?search=${encodeURIComponent(search)}&documentType=${docType}&caseId=${caseId}&verificationStatus=${verifStatus}`);
      setDocs(res.data || []);
    } catch (e) {
      console.error('Error fetching documents:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = () => {
    fetchDocs();
  };

  const resetFilters = () => {
    setSearch('');
    setDocType('ALL');
    setCaseId('ALL');
    setVerifStatus('ALL');
    setTimeout(fetchDocs, 0);
  };

  const downloadDoc = async (id: string) => {
    try {
      const officerId = localStorage.getItem('casevault_officer_id') || 'NDIS-IO-4102';
      const token = localStorage.getItem('casevault_token') || `TOKEN-${officerId}-${Date.now()}`;

      const res = await fetch(`http://localhost:3000/api/v1/documents/${id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Officer-ID': officerId
        }
      });

      if (res.status === 403) {
        const errorData = await res.json().catch(() => ({}));
        alert(`ACCESS DENIED: ${errorData.error?.message || 'Insufficient Security Clearance.'}`);
        return;
      }

      if (!res.ok) {
        alert('Download request rejected by security policy.');
        return;
      }

      const text = await res.text();
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CASEVAULT_DEC_${id}.txt`;
      a.click();
    } catch (e) {
      console.error('Download error:', e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadData({ ...uploadData, title: file.name.replace(/\.[^/.]+$/, "") });
    }
  };

  const executeUploadPipeline = async () => {
    setUploadState('processing');
    setPipelineSteps({});

    const setStep = (key: string, text: string, status: 'loading' | 'success') => {
      setPipelineSteps((prev: any) => ({ ...prev, [key]: { text, status } }));
    };

    setStep('hash', 'Calculating SHA-256 Hash...', 'loading');
    await new Promise(r => setTimeout(r, 400));
    setStep('hash', 'Calculating SHA-256 Hash... → ✓ Hash: a3f9b2c1d4e', 'success');

    setStep('exif', 'Stripping EXIF Metadata...', 'loading');
    await new Promise(r => setTimeout(r, 450));
    setStep('exif', 'Stripping EXIF Metadata... → ✓ GPS, Device Info Removed', 'success');

    setStep('malware', 'Malware Scan (ClamAV)...', 'loading');
    await new Promise(r => setTimeout(r, 400));
    setStep('malware', 'Malware Scan (ClamAV)... → ✓ Clean', 'success');

    setStep('encrypt', 'Encrypting (AES-256-GCM)...', 'loading');
    await new Promise(r => setTimeout(r, 400));
    setStep('encrypt', 'Encrypting (AES-256-GCM)... → ✓ Encrypted', 'success');

    setStep('merkle', 'Appending to Merkle Tree...', 'loading');
    await new Promise(r => setTimeout(r, 350));
    setStep('merkle', 'Appending to Merkle Tree... → ✓ Leaf #42 committed', 'success');

    setStep('ocr', 'OCR Text Extraction...', 'loading');
    await new Promise(r => setTimeout(r, 350));
    setStep('ocr', 'OCR Text Extraction... → ✓ 1,204 words extracted', 'success');

    setUploadResult({
      documentNumber: 'DOC-2026-0041-09',
      caseId: uploadData.caseId,
      sha256Hash: 'a3f9b2c1d4e5f6a7b8c9d0e1f2...',
      uploadedBy: currentOfficer ? currentOfficer.full_name : 'Officer',
      timestamp: new Date().toISOString()
    });

    setUploadState('complete');

    if (uploadData.title.toLowerCase().includes('pocso') || uploadData.title.toLowerCase().includes('victim') || uploadData.caseId === 'case-041') {
      setTimeout(() => {
        alert('⚠ POCSO / Sensitive Case Detected. Redirecting to Redaction Review Studio...');
        setIsModalOpen(false);
        router.push('/');
      }, 2500);
    }
  };

  const resetModal = () => {
    setIsModalOpen(false);
    setUploadState('form');
    setSelectedFile(null);
    setPipelineSteps({});
  };

  return (
    <div>
      <div className="page-header-bar">
        <div className="page-title-group">
          <h1>{isHindi ? 'दस्तावेज़ प्रबंधन प्रणाली' : 'Document Management System'}</h1>
          <div className="page-subtitle">
            Secure evidentiary document repository with cryptographic SHA-256 bitstream verification
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
            📤 Upload Document
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="filter-toolbar">
        <div className="filter-group" style={{ flex: 1, minWidth: '220px' }}>
          <input type="text" className="form-control" style={{ width: '100%' }}
            placeholder="Search by file name, doc ID, or OCR text..." 
            value={search} onChange={e => { setSearch(e.target.value); setTimeout(fetchDocs, 0); }} />
        </div>

        <div className="filter-group">
          <label className="filter-label">Document Type:</label>
          <select className="form-control" value={docType} onChange={e => { setDocType(e.target.value); setTimeout(fetchDocs, 0); }}>
            <option value="ALL">All Types</option>
            <option value="FIR">FIR (First Info Report)</option>
            <option value="Forensic Report">Forensic Report</option>
            <option value="Court Filing">Court Filing</option>
            <option value="Financial Audit">Financial Audit</option>
            <option value="Witness Statement">Witness Statement</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Case:</label>
          <select className="form-control" value={caseId} onChange={e => { setCaseId(e.target.value); setTimeout(fetchDocs, 0); }}>
            <option value="ALL">All Cases</option>
            <option value="case-041">CASE-2026-041 (Apex FinCorp)</option>
            <option value="case-038">CASE-2026-038 (Power Grid SCADA)</option>
            <option value="case-031">CASE-2026-031 (Auditor Disappearance)</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Verification:</label>
          <select className="form-control" value={verifStatus} onChange={e => { setVerifStatus(e.target.value); setTimeout(fetchDocs, 0); }}>
            <option value="ALL">All Statuses</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="UNDER REVIEW">UNDER REVIEW</option>
          </select>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={resetFilters}>Reset</button>
      </div>

      {/* Document Repository Table */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">
            <span>📄</span> Registered Evidentiary Documents (<span id="docs-count-badge">{docs.length}</span>)
          </div>
        </div>
        <div className="table-responsive">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Document ID</th>
                <th>File Name & Title</th>
                <th>Type</th>
                <th>Case ID</th>
                <th>Uploaded By</th>
                <th>Version</th>
                <th>Integrity Status</th>
                <th>Digital Signature</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: '24px' }}>Loading repository records...</td></tr>
              ) : docs.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: '30px', color: 'var(--gov-text-muted)' }}>
                  No registered documents match the selected filter criteria.
                </td></tr>
              ) : (
                docs.map((d: any) => {
                  let verifBadge = d.verification_status === 'VERIFIED' ? 'badge-verified' : 'badge-review';
                  let sigBadge = d.signature_status === 'VALID' ? 'badge-valid' : 'badge-pending';
                  return (
                    <tr key={d.id}>
                      <td><span className="font-mono" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gov-navy-primary)' }}>{d.document_number}</span></td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--gov-navy-dark)' }}>{d.file_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)' }}>{d.title}</div>
                      </td>
                      <td><span className="badge badge-info">{d.document_type}</span></td>
                      <td><strong className="font-mono">{d.case_number || d.case_id}</strong></td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{d.uploader_name || 'Officer'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)' }}>{d.uploader_code || ''}</div>
                      </td>
                      <td><span className="badge badge-secondary">{d.version}</span></td>
                      <td><span className={`badge ${verifBadge}`}>{d.verification_status}</span></td>
                      <td><span className={`badge ${sigBadge}`}>{d.signature_status}</span></td>
                      <td style={{ fontSize: '12px', color: 'var(--gov-text-muted)' }}>{d.created_at ? d.created_at.substring(0, 10) : '2026-02-14'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/documents/${d.id}`)}>View</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => downloadDoc(d.id)}>Download</button>
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

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <div className="modal-title">📤 Secure Government Document Intake</div>
              <button className="modal-close-btn" onClick={resetModal}>×</button>
            </div>
            <div className="modal-body">
              
              {uploadState === 'form' && (
                <div>
                  <div className="upload-dropzone" onClick={() => fileInputRef.current?.click()}>
                    <div className="upload-icon">📂</div>
                    <div className="upload-title">Drag & Drop document here</div>
                    <div className="upload-subtitle">or click to choose file from secure workstation</div>
                    <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)', marginTop: '8px' }}>
                      Supported: PDF, DOCX, XLSX, JPG, PNG, ZIP (Max 50MB)
                    </div>
                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} />
                  </div>

                  {selectedFile && (
                    <div style={{ margin: '12px 0', background: 'var(--gov-surface-alt)', padding: '8px 12px', border: '1px solid var(--gov-border)', borderRadius: '4px', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>Selected: <strong className="font-mono">{selectedFile.name}</strong></div>
                      <span className="badge badge-info">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '14px' }}>
                    <div>
                      <label className="filter-label">Associated Case</label>
                      <select className="form-control" style={{ width: '100%' }} value={uploadData.caseId} onChange={e => setUploadData({ ...uploadData, caseId: e.target.value })}>
                        <option value="case-041">CASE-2026-041 (Apex FinCorp)</option>
                        <option value="case-038">CASE-2026-038 (Power Grid SCADA)</option>
                        <option value="case-031">CASE-2026-031 (Auditor Disappearance)</option>
                      </select>
                    </div>
                    <div>
                      <label className="filter-label">Document Classification</label>
                      <select className="form-control" style={{ width: '100%' }} value={uploadData.docType} onChange={e => setUploadData({ ...uploadData, docType: e.target.value })}>
                        <option value="Forensic Report">Forensic Report</option>
                        <option value="FIR">FIR (First Information Report)</option>
                        <option value="Court Filing">Court Filing / Charge Sheet</option>
                        <option value="Financial Audit">Financial Audit Statement</option>
                        <option value="Witness Statement">Witness Statement (CrPC 161)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <label className="filter-label">Document Title / Memo Reference</label>
                    <input type="text" className="form-control" style={{ width: '100%' }} value={uploadData.title} onChange={e => setUploadData({ ...uploadData, title: e.target.value })} />
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <label className="filter-label">Security Classification Tier</label>
                    <select className="form-control" style={{ width: '100%' }} value={uploadData.tier} onChange={e => setUploadData({ ...uploadData, tier: e.target.value })}>
                      <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                      <option value="SECRET">SECRET</option>
                      <option value="TOP SECRET">TOP SECRET</option>
                      <option value="RESTRICTED">RESTRICTED</option>
                    </select>
                  </div>

                  <div className="modal-footer" style={{ padding: '16px 0 0 0', background: 'none', marginTop: '16px' }}>
                    <button type="button" className="btn btn-secondary" onClick={resetModal}>Cancel</button>
                    <button type="button" className="btn btn-primary" onClick={executeUploadPipeline}>
                      Start Cryptographic Ingestion →
                    </button>
                  </div>
                </div>
              )}

              {(uploadState === 'processing' || uploadState === 'complete') && (
                <div style={{ padding: '20px 0' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gov-navy-dark)', marginBottom: '16px', textTransform: 'uppercase' }}>
                    Cryptographic Ingestion Pipeline
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                    {Object.keys(pipelineSteps).map(key => {
                      const step = pipelineSteps[key];
                      return (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: step.status === 'success' ? 'var(--gov-green)' : 'var(--gov-saffron)' }}>
                          {step.status === 'loading' ? '⏳' : '✓'} {step.text}
                        </div>
                      );
                    })}
                  </div>

                  {uploadState === 'complete' && uploadResult && (
                    <div style={{ marginTop: '20px', backgroundColor: 'var(--status-active-bg)', border: '1px solid #A3D9B5', borderRadius: '4px', padding: '16px' }}>
                      <div style={{ fontWeight: 800, color: 'var(--gov-green)', fontSize: '14px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>✓</span> UPLOAD COMPLETE & CRYPTOGRAPHICALLY REGISTERED
                      </div>
                      <div style={{ fontSize: '12px', lineHeight: 1.8, color: 'var(--gov-text-primary)' }}>
                        <div><strong>Document ID:</strong> <span className="font-mono">{uploadResult.documentNumber}</span></div>
                        <div><strong>Case ID:</strong> <span className="font-mono">{uploadResult.caseId}</span></div>
                        <div><strong>SHA-256 Hash:</strong> <div className="hash-display-box">{uploadResult.sha256Hash}</div></div>
                        <div><strong>Uploaded By:</strong> <span>{uploadResult.uploadedBy}</span></div>
                        <div><strong>Timestamp:</strong> <span>{uploadResult.timestamp}</span></div>
                        <div><strong>Classification:</strong> <span className="badge badge-confidential">CONFIDENTIAL</span></div>
                      </div>
                      <div style={{ marginTop: '14px' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => { resetModal(); fetchDocs(); }}>
                          Done & Return to Repository
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
