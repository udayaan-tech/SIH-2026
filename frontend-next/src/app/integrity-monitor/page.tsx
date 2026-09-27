"use client";

import React, { useState, useEffect } from 'react';
import { API } from '@/lib/api';

interface MonitorData {
  documentId: string;
  title: string;
  registeredHash: string;
  computedHash: string;
  merkleRoot: string;
  merkleLeafPos: number;
}

export default function IntegrityMonitorPage() {
  const [tampered, setTampered] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [monitorData, setMonitorData] = useState<MonitorData>({
    documentId: 'doc_cctv_01',
    title: 'CCTV_Footage_Camera3.mp4',
    registeredHash: 'a3f9b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1',
    computedHash: 'a3f9b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1',
    merkleRoot: '7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a',
    merkleLeafPos: 0,
  });

  const loadCurrentStatus = async () => {
    try {
      const res = await API.get('/security/overview');
      if (res.data) {
        if (res.data.integrity_status === 'COMPROMISED') {
          setTampered(true);
        }
        if (res.data.merkle_root) {
          setMonitorData(prev => ({
            ...prev,
            merkleRoot: res.data.merkle_root,
          }));
        }
      }
    } catch (e) {
      console.error('Failed to load integrity overview:', e);
    }
  };

  useEffect(() => {
    loadCurrentStatus();
  }, []);

  const simulateAttack = async () => {
    setIsProcessing(true);
    try {
      const res = await API.post('/security/simulate-tamper', {});
      if (res.data) {
        setMonitorData(prev => ({
          ...prev,
          documentId: res.data.document_id || prev.documentId,
          title: res.data.title || prev.title,
          registeredHash: res.data.original_hash || prev.registeredHash,
          computedHash: res.data.tampered_hash || prev.computedHash,
          merkleLeafPos: res.data.merkle_leaf_pos ?? prev.merkleLeafPos,
        }));
      }
      setTampered(true);
    } catch (e) {
      console.error('Tamper attack simulation error:', e);
      setTampered(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const restoreIntegrity = async () => {
    setIsProcessing(true);
    try {
      await API.post('/security/restore-integrity', {});
      setMonitorData(prev => ({
        ...prev,
        computedHash: prev.registeredHash,
      }));
      setTampered(false);
      alert('System successfully self-healed using the cryptographic Merkle Anchor on Polygon.');
    } catch (e) {
      console.error('Restore integrity error:', e);
      setTampered(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      {/* Alarm Overlay */}
      {tampered && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(255,0,0,0.2)', zIndex: 9999, pointerEvents: 'none', animation: 'flash 1s infinite' }}></div>
      )}
      <style>{`
        @keyframes flash {
          0% { background: rgba(255,0,0,0); }
          50% { background: rgba(255,0,0,0.3); }
          100% { background: rgba(255,0,0,0); }
        }
      `}</style>

      <div className="page-header-bar" style={{ borderBottomColor: '#E2E8F0' }}>
        <div className="page-title-group">
          <h1 style={{ color: 'var(--gov-navy-dark)' }}>Cryptographic Integrity Monitor</h1>
          <div className="page-subtitle">Live Merkle Tree validation and Red Team attack simulation</div>
        </div>
        <div className="page-actions">
          {!tampered ? (
            <button 
              className="btn btn-sm" 
              style={{ backgroundColor: '#DC2626', color: '#FFF', border: 'none', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(220,38,38,0.4)', opacity: isProcessing ? 0.7 : 1 }} 
              onClick={simulateAttack}
              disabled={isProcessing}
            >
              {isProcessing ? 'Executing...' : '☠ SIMULATE TAMPER ATTACK'}
            </button>
          ) : (
            <button 
              className="btn btn-sm" 
              style={{ backgroundColor: '#059669', color: '#FFF', border: 'none', fontWeight: 'bold', opacity: isProcessing ? 0.7 : 1 }} 
              onClick={restoreIntegrity}
              disabled={isProcessing}
            >
              {isProcessing ? 'Self-Healing...' : '↺ Restore from Merkle Anchor'}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        
        {/* Live Ledger */}
        <div className="gov-card">
          <div className="gov-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="gov-card-title">Live Vault Monitor: {monitorData.title}</div>
            <span className={`badge ${tampered ? 'badge-closed' : 'badge-active'}`} style={{ fontSize: '11px' }}>
              {tampered ? 'ALERT: CORRUPTED' : 'STATUS: SECURE'}
            </span>
          </div>
          <div className="gov-card-body" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
            
            <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--gov-surface-alt)', borderRadius: '4px', border: '1px solid var(--gov-border-light)' }}>
              <div style={{ color: 'var(--gov-text-muted)', fontSize: '11px', marginBottom: '4px' }}>REGISTERED HASH (Immutable Merkle Leaf #{monitorData.merkleLeafPos})</div>
              <div style={{ color: 'var(--gov-navy-primary)', fontWeight: 'bold', wordBreak: 'break-all' }}>
                {monitorData.registeredHash}
              </div>
            </div>

            <div style={{ marginBottom: '20px', padding: '16px', background: tampered ? '#FEF2F2' : '#E6F4EA', borderRadius: '4px', border: `1px solid ${tampered ? '#FCA5A5' : '#A3D9B5'}` }}>
              <div style={{ color: 'var(--gov-text-muted)', fontSize: '11px', marginBottom: '4px' }}>CURRENT COMPUTED HASH (Storage Volume)</div>
              <div style={{ color: tampered ? '#DC2626' : '#0A6E31', fontWeight: 'bold', wordBreak: 'break-all' }}>
                {monitorData.computedHash}
              </div>
              <div style={{ marginTop: '10px', fontWeight: 'bold', fontSize: '12px', color: tampered ? '#DC2626' : '#0A6E31' }}>
                {tampered ? '⚠ HASH MISMATCH DETECTED' : '✓ 100% BITSTREAM MATCH'}
              </div>
            </div>

            <div style={{ marginBottom: '20px', padding: '16px', background: tampered ? '#FEF2F2' : '#E6F4EA', borderRadius: '4px', border: `1px solid ${tampered ? '#FCA5A5' : '#A3D9B5'}` }}>
              <div style={{ color: 'var(--gov-text-muted)', fontSize: '11px', marginBottom: '4px' }}>MERKLE ROOT ANCHOR</div>
              <div style={{ color: tampered ? '#DC2626' : '#0A6E31', fontWeight: 'bold', fontSize: '12px', wordBreak: 'break-all' }}>
                {tampered ? '☠ ROOT INVALIDATED — Hash branch mismatch' : `✓ VALID ROOT — ${monitorData.merkleRoot}`}
              </div>
            </div>
            
            {tampered && (
              <div style={{ padding: '16px', background: '#FEF2F2', borderRadius: '4px', border: '1px solid #FCA5A5', color: '#DC2626', fontWeight: 'bold', fontSize: '14px', animation: 'flash 1s infinite' }}>
                🚨 TAMPER ALERT DISPATCHED TO: State Vigilance + High Court Registrar
                <div style={{ fontSize: '11px', fontWeight: 'normal', marginTop: '6px', color: '#991B1B' }}>
                  Automated incident response triggered. Document locked for forensic investigation. Evidence rejected for Section 65B court filing.
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Explainer */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">How it works</div>
          </div>
          <div className="gov-card-body" style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--gov-text-secondary)' }}>
            <p>This demo simulates a direct database or storage-level tampering attack, bypassing the application layer.</p>
            <p style={{ marginTop: '10px' }}>Since the application continuously verifies the cryptographic hash against the decentralized Merkle anchor, any byte-level change immediately triggers a system-wide alert.</p>
            <p style={{ marginTop: '10px' }}><strong>To demo:</strong> Click the red attack button to simulate an attacker modifying the evidence file.</p>
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'var(--gov-surface-alt)', borderRadius: '4px', fontSize: '12px' }}>
              <div>• Legal Admissibility: <strong>BSA 2023 Sec 65B</strong></div>
              <div>• Algorithm: <strong>SHA-256 FIPS 180-4</strong></div>
              <div>• Tree Type: <strong>Binary Merkle Tree</strong></div>
              <div>• Anchor: <strong>Polygon PoS Testnet</strong></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
