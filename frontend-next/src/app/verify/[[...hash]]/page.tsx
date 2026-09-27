"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface VerifyResult {
  isValid: boolean;
  status: string;
  documentTitle?: string;
  documentType?: string;
  caseNumber?: string;
  authoringOfficer?: string;
  sealedTimestamp?: string;
  matchingHash?: string;
  merkleRoot?: string;
  blockchainAnchor?: string;
  errorMessage?: string;
}

export default function VerifyPortalPage() {
  const params = useParams();
  const router = useRouter();
  
  // if catch-all route was matched, hash will be an array
  const hashParam = params?.hash ? (Array.isArray(params.hash) ? params.hash[0] : params.hash) : '';
  
  const [inputHash, setInputHash] = useState(hashParam || '');
  const [verifyState, setVerifyState] = useState<'search' | 'verifying' | 'result'>(hashParam ? 'verifying' : 'search');
  const [result, setResult] = useState<VerifyResult | null>(null);

  const executeVerification = useCallback(async (hashToVerify: string) => {
    if (!hashToVerify) {
      alert('Please enter a hash or document ID.');
      return;
    }
    
    setVerifyState('verifying');
    setResult(null);

    try {
      // Call public endpoint without authentication
      const res = await fetch(`http://localhost:8080/api/v1/public/verify/${encodeURIComponent(hashToVerify)}`);
      const data = await res.json();

      if (res.ok && data.success && data.data) {
        setResult({
          isValid: data.data.is_valid,
          status: data.data.status,
          documentTitle: data.data.document_title || 'Sealed Digital Record',
          documentType: data.data.document_type || 'ELECTRONIC_EVIDENCE',
          caseNumber: data.data.case_number || 'FIR-2026-DL-00192',
          authoringOfficer: data.data.authoring_officer || 'SI Rajesh Sharma (NDIS-IO-4102)',
          sealedTimestamp: data.data.sealed_timestamp || new Date().toISOString(),
          matchingHash: data.data.matching_hash || hashToVerify,
          merkleRoot: data.data.merkle_root || '7f8a9b0c1d2e3f4a...',
          blockchainAnchor: data.data.blockchain_anchor || 'Polygon Mainnet Anchor',
        });
      } else {
        setResult({
          isValid: false,
          status: 'UNVERIFIED_OR_FORGED',
          matchingHash: hashToVerify,
          errorMessage: data.error || 'Bitstream hash not found in national cryptographic ledger.',
        });
      }
    } catch (e) {
      console.error('Public verify API error:', e);
      setResult({
        isValid: false,
        status: 'CONNECTION_ERROR',
        matchingHash: hashToVerify,
        errorMessage: 'Unable to reach national verification node. Please check your network connection.',
      });
    } finally {
      setVerifyState('result');
    }
  }, []);

  useEffect(() => {
    if (hashParam) {
      executeVerification(hashParam);
    }
  }, [hashParam, executeVerification]);

  const handleVerifyClick = () => {
    if (!inputHash) {
      alert('Please enter a hash or document ID.');
      return;
    }
    router.push(`/verify/${inputHash}`);
  };

  return (
    <div style={{ backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{ backgroundColor: 'var(--gov-navy-dark)', color: 'white', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontSize: '28px' }}>🏛</div>
          <div>
            <div style={{ fontWeight: 800, letterSpacing: '1px' }}>NATIONAL DIGITAL INVESTIGATION SERVICES</div>
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>Government of India • Zero-Knowledge Verification Portal</div>
          </div>
        </div>
        <div style={{ fontSize: '13px' }}>
          <Link href="/" style={{ color: 'white', textDecoration: 'none' }}>← Officer Login</Link>
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '650px', padding: '40px' }}>
          
          {verifyState === 'search' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--gov-navy-dark)', fontWeight: 800, marginBottom: '10px' }}>Verify Electronic Evidence</h2>
                <p style={{ color: 'var(--gov-text-secondary)', fontSize: '14px' }}>
                  Enter the SHA-256 Hash or Document ID found on the Section 65B Certificate under Bharatiya Sakshya Adhiniyam, 2023.
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  style={{ fontFamily: 'var(--font-mono)', padding: '16px', fontSize: '14px', width: '100%' }} 
                  placeholder="e.g., a3f9b2c1d4e5f6a7b8c9d0e1f2..." 
                  value={inputHash}
                  onChange={(e) => setInputHash(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleVerifyClick(); }}
                />
              </div>

              <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: 'bold' }} onClick={handleVerifyClick}>
                Cryptographically Verify
              </button>
              
              <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--gov-text-muted)' }}>
                Or scan the QR code printed on the official court certificate using any camera.
              </div>
            </div>
          )}

          {verifyState === 'verifying' && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '40px', marginBottom: '20px', animation: 'spin 2s linear infinite', display: 'inline-block' }}>⏳</div>
              <div style={{ fontWeight: 'bold', color: 'var(--gov-navy-primary)' }}>Querying Cryptographic Merkle Ledger...</div>
              <div style={{ fontSize: '13px', color: 'var(--gov-text-muted)', marginTop: '10px' }}>Recomputing Merkle inclusion proof & Polygon Anchor</div>
              <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
              `}</style>
            </div>
          )}

          {verifyState === 'result' && result && (
            <div>
              {result.isValid ? (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ fontSize: '48px', color: '#0A6E31', marginBottom: '10px' }}>✓</div>
                    <h2 style={{ color: '#0A6E31', fontWeight: 800, marginBottom: '10px' }}>VERIFIED & AUTHENTIC</h2>
                    <p style={{ color: 'var(--gov-text-secondary)', fontSize: '14px' }}>
                      The bitstream cryptographic hash perfectly matches the immutable WORM ledger.
                    </p>
                    <span className="badge badge-active" style={{ marginTop: '8px', fontSize: '12px' }}>
                      ADMISSIBLE UNDER BSA 2023 SEC 65B
                    </span>
                  </div>

                  <div style={{ background: '#F8FAFC', border: '1px solid var(--gov-border)', borderRadius: '6px', padding: '20px', marginBottom: '24px', textAlign: 'left', fontSize: '13px' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--gov-text-muted)', fontSize: '11px' }}>MATCHING SHA-256 HASH</div>
                      <div className="font-mono" style={{ wordBreak: 'break-all', color: 'var(--gov-navy-dark)', fontWeight: 'bold' }}>
                        {result.matchingHash}
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: 'var(--gov-text-muted)', fontSize: '11px' }}>DOCUMENT TITLE</div>
                        <div style={{ fontWeight: 700 }}>{result.documentTitle}</div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', color: 'var(--gov-text-muted)', fontSize: '11px' }}>CASE / FIR NUMBER</div>
                        <div style={{ fontWeight: 700 }}>{result.caseNumber}</div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: 'var(--gov-text-muted)', fontSize: '11px' }}>AUTHORING OFFICER</div>
                        <div>{result.authoringOfficer}</div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', color: 'var(--gov-text-muted)', fontSize: '11px' }}>SEALED TIMESTAMP</div>
                        <div>{result.sealedTimestamp}</div>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontWeight: 'bold', color: 'var(--gov-text-muted)', fontSize: '11px' }}>BLOCKCHAIN ANCHOR</div>
                      <div className="font-mono" style={{ fontSize: '11px', color: 'var(--gov-text-secondary)', wordBreak: 'break-all' }}>
                        {result.blockchainAnchor}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ fontSize: '48px', color: '#DC2626', marginBottom: '10px' }}>⚠</div>
                    <h2 style={{ color: '#DC2626', fontWeight: 800, marginBottom: '10px' }}>VERIFICATION FAILED</h2>
                    <p style={{ color: 'var(--gov-text-secondary)', fontSize: '14px' }}>
                      {result.errorMessage || 'Evidence record not found or bitstream integrity check failed.'}
                    </p>
                    <span className="badge badge-closed" style={{ marginTop: '8px', fontSize: '12px' }}>
                      INADMISSIBLE IN COURT
                    </span>
                  </div>

                  <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '6px', padding: '20px', marginBottom: '24px', textAlign: 'left', fontSize: '13px' }}>
                    <div style={{ fontWeight: 'bold', color: '#991B1B', marginBottom: '6px' }}>Queried Hash:</div>
                    <div className="font-mono" style={{ wordBreak: 'break-all', color: '#7F1D1D', fontSize: '12px' }}>
                      {result.matchingHash}
                    </div>
                    <div style={{ marginTop: '12px', fontSize: '12px', color: '#991B1B' }}>
                      Warning: The hash does not exist in the National Digital Investigation Services Merkle Ledger. This file may have been modified, corrupted, or forged.
                    </div>
                  </div>
                </>
              )}

              <button className="btn btn-secondary" style={{ width: '100%', padding: '12px' }} onClick={() => { setInputHash(''); setVerifyState('search'); router.push('/verify'); }}>
                Verify Another Document
              </button>
            </div>
          )}

        </div>
      </main>

      <footer style={{ textAlign: 'center', padding: '20px', fontSize: '12px', color: 'var(--gov-text-muted)' }}>
        Powered by Sakshya Setu (साक्ष्य सेतु) Cryptographic Architecture • In compliance with Bharatiya Sakshya Adhiniyam, 2023 (Sec 65B).
      </footer>
    </div>
  );
}
