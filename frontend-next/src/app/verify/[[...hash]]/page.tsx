"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VerifyPortalPage() {
  const params = useParams();
  const router = useRouter();
  
  // if catch-all route was matched, hash will be an array
  const hashParam = params.hash ? (Array.isArray(params.hash) ? params.hash[0] : params.hash) : '';
  
  const [inputHash, setInputHash] = useState(hashParam || '');
  const [verifyState, setVerifyState] = useState<'search' | 'verifying' | 'result'>(hashParam ? 'verifying' : 'search');

  useEffect(() => {
    if (hashParam && verifyState === 'verifying') {
      simulateVerification(hashParam);
    }
  }, [hashParam, verifyState]);

  const simulateVerification = (hashToVerify: string) => {
    if (!hashToVerify) {
      alert('Please enter a hash or document ID.');
      return;
    }
    
    setVerifyState('verifying');
    
    setTimeout(() => {
      setVerifyState('result');
    }, 2000);
  };

  const handleVerifyClick = () => {
    if (!inputHash) {
      alert('Please enter a hash or document ID.');
      return;
    }
    // Update URL or just do it inline
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
        <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '600px', padding: '40px' }}>
          
          {verifyState === 'search' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--gov-navy-dark)', fontWeight: 800, marginBottom: '10px' }}>Verify Electronic Evidence</h2>
                <p style={{ color: 'var(--gov-text-secondary)', fontSize: '14px' }}>Enter the SHA-256 Hash or Document ID found on the Sec 65B Certificate.</p>
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
                Or scan the QR code using your mobile device.
              </div>
            </div>
          )}

          {verifyState === 'verifying' && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '40px', marginBottom: '20px', animation: 'spin 2s linear infinite', display: 'inline-block' }}>⏳</div>
              <div style={{ fontWeight: 'bold', color: 'var(--gov-navy-primary)' }}>Querying Blockchain Anchor...</div>
              <div style={{ fontSize: '13px', color: 'var(--gov-text-muted)', marginTop: '10px' }}>Recomputing Merkle Path</div>
              <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
              `}</style>
            </div>
          )}

          {verifyState === 'result' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <div style={{ fontSize: '48px', color: '#0A6E31', marginBottom: '10px' }}>✓</div>
                <h2 style={{ color: '#0A6E31', fontWeight: 800, marginBottom: '10px' }}>VERIFIED & AUTHENTIC</h2>
                <p style={{ color: 'var(--gov-text-secondary)', fontSize: '14px' }}>The cryptographic hash perfectly matches the immutable ledger record.</p>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid var(--gov-border)', borderRadius: '6px', padding: '20px', marginBottom: '24px', textAlign: 'left', fontSize: '13px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--gov-text-muted)', fontSize: '11px' }}>MATCHING HASH</div>
                  <div className="font-mono" style={{ wordBreak: 'break-all', color: 'var(--gov-navy-dark)', fontWeight: 'bold' }}>
                    {inputHash.length > 20 ? inputHash : 'a3f9b2c1d4e5f6a7b8c9d0e1f2a3f9b2c1d4e5f6a7b8c9d0e1f2a3f9b2c1d4e5'}
                  </div>
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--gov-text-muted)', fontSize: '11px' }}>DOCUMENT TITLE</div>
                  <div style={{ fontWeight: 'bold' }}>CCTV_Footage_Camera3.mp4</div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--gov-text-muted)', fontSize: '11px' }}>AUTHORING OFFICER</div>
                  <div>SI Rajesh Sharma (NDIS-IO-4102)</div>
                </div>

                <div>
                  <div style={{ fontWeight: 'bold', color: 'var(--gov-text-muted)', fontSize: '11px' }}>TIMESTAMP (NTP)</div>
                  <div>2026-09-10 10:00:14 IST</div>
                </div>
              </div>

              <button className="btn btn-secondary" style={{ width: '100%', padding: '12px' }} onClick={() => router.push('/verify')}>
                Verify Another Document
              </button>
            </div>
          )}

        </div>
      </main>

      <footer style={{ textAlign: 'center', padding: '20px', fontSize: '12px', color: 'var(--gov-text-muted)' }}>
        Powered by NDIS Blockchain Architecture. In compliance with Bharatiya Sakshya Adhiniyam, 2023 (Sec 65B).
      </footer>
    </div>
  );
}
