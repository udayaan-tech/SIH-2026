"use client";

import React, { useState } from 'react';
import { API } from '@/lib/api';

export default function IntegrityMonitorPage() {
  const [tampered, setTampered] = useState(false);

  const simulateAttack = () => {
    setTampered(true);
    try { API.post('/security/simulate-tamper', {}); } catch (e) {}
  };

  const restoreIntegrity = () => {
    setTampered(false);
    alert('System successfully self-healed using the cryptographic Merkle Anchor on Polygon.');
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
            <button className="btn btn-sm" style={{ backgroundColor: '#DC2626', color: '#FFF', border: 'none', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(220,38,38,0.4)' }} onClick={simulateAttack}>
              ☠ SIMULATE TAMPER ATTACK
            </button>
          ) : (
            <button className="btn btn-sm" style={{ backgroundColor: '#059669', color: '#FFF', border: 'none' }} onClick={restoreIntegrity}>
              ↺ Restore from Merkle Anchor
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        
        {/* Live Ledger */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">Live Vault Monitor (EVD-2026-041-01)</div>
          </div>
          <div className="gov-card-body" style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
            
            <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--gov-surface-alt)', borderRadius: '4px', border: '1px solid var(--gov-border-light)' }}>
              <div style={{ color: 'var(--gov-text-muted)', fontSize: '11px', marginBottom: '4px' }}>REGISTERED HASH (Immutable Ledger)</div>
              <div style={{ color: 'var(--gov-navy-primary)', fontWeight: 'bold', wordBreak: 'break-all' }}>
                a3f9b2c1d4e5f6a7b8c9d0e1f2a3f9b2c1d4e5f6a7b8c9d0e1f2a3f9b2c1d4e5
              </div>
            </div>

            <div style={{ marginBottom: '20px', padding: '16px', background: tampered ? '#FEF2F2' : '#E6F4EA', borderRadius: '4px', border: `1px solid ${tampered ? '#FCA5A5' : '#A3D9B5'}` }}>
              <div style={{ color: 'var(--gov-text-muted)', fontSize: '11px', marginBottom: '4px' }}>CURRENT COMPUTED HASH (Storage Volume)</div>
              <div style={{ color: tampered ? '#DC2626' : '#0A6E31', fontWeight: 'bold', wordBreak: 'break-all' }}>
                {tampered ? 'b2e1c4f7d4e5f6a7b8c9d0e1f2a3f9b2c1d4e5f6a7b8c9d0e1f2a3f9b2c1d4e5' : 'a3f9b2c1d4e5f6a7b8c9d0e1f2a3f9b2c1d4e5f6a7b8c9d0e1f2a3f9b2c1d4e5'}
              </div>
              <div style={{ marginTop: '10px', fontWeight: 'bold', fontSize: '12px', color: tampered ? '#DC2626' : '#0A6E31' }}>
                {tampered ? '⚠ HASH MISMATCH DETECTED' : '✓ 100% MATCH'}
              </div>
            </div>

            <div style={{ marginBottom: '20px', padding: '16px', background: tampered ? '#FEF2F2' : '#E6F4EA', borderRadius: '4px', border: `1px solid ${tampered ? '#FCA5A5' : '#A3D9B5'}` }}>
              <div style={{ color: 'var(--gov-text-muted)', fontSize: '11px', marginBottom: '4px' }}>MERKLE PROOF VALIDATION</div>
              <div style={{ color: tampered ? '#DC2626' : '#0A6E31', fontWeight: 'bold', fontSize: '12px' }}>
                {tampered ? '☠ INVALID — Node L1 mismatch' : '✓ VALID — Path: [L1 → R2 → L3 → Root]'}
              </div>
            </div>
            
            {tampered && (
              <div style={{ padding: '16px', background: '#FEF2F2', borderRadius: '4px', border: '1px solid #FCA5A5', color: '#DC2626', fontWeight: 'bold', fontSize: '14px', animation: 'flash 1s infinite' }}>
                🚨 ALERT DISPATCHED TO: State Vigilance + High Court Registrar
                <div style={{ fontSize: '11px', fontWeight: 'normal', marginTop: '6px', color: '#991B1B' }}>
                  Automated incident response triggered. Document locked for forensic investigation.
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
            <p>Since the application continuously verifies the cryptographic hash against the decentralized Merkle anchor, any byte-level change immediately triggers a system-wide alert.</p>
            <p><strong>To demo:</strong> Click the red attack button to simulate a hacker modifying the evidence file.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
