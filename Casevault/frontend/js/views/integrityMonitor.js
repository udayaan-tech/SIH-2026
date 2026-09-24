/**
 * CASEVAULT — Tamper Detection & Red Team Demo View
 * Section 11: Real-time cryptographic integrity monitoring and attack simulation.
 */
const IntegrityMonitorView = {
  tampered: false,

  render(container) {
    container.innerHTML = `
      <div id="alarm-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(255,0,0,0.2); z-index: 9999; pointer-events: none; animation: flash 1s infinite;"></div>
      <style>
        @keyframes flash {
          0% { background: rgba(255,0,0,0); }
          50% { background: rgba(255,0,0,0.3); }
          100% { background: rgba(255,0,0,0); }
        }
      </style>

      <div class="page-header-bar" style="border-bottom-color: #E2E8F0;">
        <div class="page-title-group">
          <h1 style="color: var(--gov-navy-dark);">Cryptographic Integrity Monitor</h1>
          <div class="page-subtitle">Live Merkle Tree validation and Red Team attack simulation</div>
        </div>
        <div class="page-actions">
          <button id="btn-tamper" class="btn btn-sm" style="background-color: #DC2626; color: #FFF; border: none; font-weight: bold; box-shadow: 0 2px 4px rgba(220,38,38,0.4);" onclick="IntegrityMonitorView.simulateAttack()">
            ☠ SIMULATE TAMPER ATTACK
          </button>
          <button id="btn-restore" class="btn btn-sm" style="background-color: #059669; color: #FFF; border: none; display: none;" onclick="IntegrityMonitorView.restoreIntegrity()">
            ↺ Restore from Merkle Anchor
          </button>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
        
        <!-- Live Ledger -->
        <div class="gov-card">
          <div class="gov-card-header">
            <div class="gov-card-title">Live Vault Monitor (EVD-2026-041-01)</div>
          </div>
          <div class="gov-card-body" style="font-family: var(--font-mono); font-size: 13px;">
            
            <div style="margin-bottom: 20px; padding: 16px; background: var(--gov-surface-alt); border-radius: 4px; border: 1px solid var(--gov-border-light);">
              <div style="color: var(--gov-text-muted); font-size: 11px; margin-bottom: 4px;">REGISTERED HASH (Immutable Ledger)</div>
              <div style="color: var(--gov-navy-primary); font-weight: bold; word-break: break-all;">
                a3f9b2c1d4e5f6a7b8c9d0e1f2a3f9b2c1d4e5f6a7b8c9d0e1f2a3f9b2c1d4e5
              </div>
            </div>

            <div id="current-hash-box" style="margin-bottom: 20px; padding: 16px; background: #E6F4EA; border-radius: 4px; border: 1px solid #A3D9B5;">
              <div style="color: var(--gov-text-muted); font-size: 11px; margin-bottom: 4px;">CURRENT COMPUTED HASH (Storage Volume)</div>
              <div id="current-hash-val" style="color: #0A6E31; font-weight: bold; word-break: break-all;">
                a3f9b2c1d4e5f6a7b8c9d0e1f2a3f9b2c1d4e5f6a7b8c9d0e1f2a3f9b2c1d4e5
              </div>
              <div id="hash-status-msg" style="margin-top: 10px; font-weight: bold; font-size: 12px; color: #0A6E31;">
                ✓ 100% MATCH
              </div>
            </div>

            <div id="merkle-box" style="margin-bottom: 20px; padding: 16px; background: #E6F4EA; border-radius: 4px; border: 1px solid #A3D9B5;">
              <div style="color: var(--gov-text-muted); font-size: 11px; margin-bottom: 4px;">MERKLE PROOF VALIDATION</div>
              <div id="merkle-status-msg" style="color: #0A6E31; font-weight: bold; font-size: 12px;">
                ✓ VALID — Path: [L1 → R2 → L3 → Root]
              </div>
            </div>
            
            <div id="alert-box" style="display: none; padding: 16px; background: #FEF2F2; border-radius: 4px; border: 1px solid #FCA5A5; color: #DC2626; font-weight: bold; font-size: 14px; animation: flash 1s infinite;">
              🚨 ALERT DISPATCHED TO: State Vigilance + High Court Registrar
              <div style="font-size: 11px; font-weight: normal; margin-top: 6px; color: #991B1B;">
                Automated incident response triggered. Document locked for forensic investigation.
              </div>
            </div>

          </div>
        </div>

        <!-- Explainer -->
        <div class="gov-card">
          <div class="gov-card-header">
            <div class="gov-card-title">How it works</div>
          </div>
          <div class="gov-card-body" style="font-size: 13px; line-height: 1.6; color: var(--gov-text-secondary);">
            <p>This demo simulates a direct database or storage-level tampering attack, bypassing the application layer.</p>
            <p>Since the application continuously verifies the cryptographic hash against the decentralized Merkle anchor, any byte-level change immediately triggers a system-wide alert.</p>
            <p><strong>To demo:</strong> Click the red attack button to simulate a hacker modifying the evidence file.</p>
          </div>
        </div>

      </div>
    `;
    this.tampered = false;
  },

  simulateAttack() {
    this.tampered = true;
    
    // UI Updates
    document.getElementById('alarm-overlay').style.display = 'block';
    document.getElementById('btn-tamper').style.display = 'none';
    document.getElementById('btn-restore').style.display = 'inline-block';
    
    // Hash Box
    const hashBox = document.getElementById('current-hash-box');
    hashBox.style.background = '#FEF2F2';
    hashBox.style.borderColor = '#FCA5A5';
    document.getElementById('current-hash-val').textContent = 'b2e1c4f7d4e5f6a7b8c9d0e1f2a3f9b2c1d4e5f6a7b8c9d0e1f2a3f9b2c1d4e5';
    document.getElementById('current-hash-val').style.color = '#DC2626';
    
    const hashMsg = document.getElementById('hash-status-msg');
    hashMsg.style.color = '#DC2626';
    hashMsg.innerHTML = '⚠ HASH MISMATCH DETECTED';
    
    // Merkle Box
    const merkleBox = document.getElementById('merkle-box');
    merkleBox.style.background = '#FEF2F2';
    merkleBox.style.borderColor = '#FCA5A5';
    
    const merkleMsg = document.getElementById('merkle-status-msg');
    merkleMsg.style.color = '#DC2626';
    merkleMsg.innerHTML = '☠ INVALID — Node L1 mismatch';
    
    // Alert Box
    document.getElementById('alert-box').style.display = 'block';
    
    // API log (simulated)
    try { API.post('/security/simulate-tamper', {}); } catch (e) {}
  },

  restoreIntegrity() {
    this.tampered = false;
    
    // UI Updates
    document.getElementById('alarm-overlay').style.display = 'none';
    document.getElementById('btn-tamper').style.display = 'inline-block';
    document.getElementById('btn-restore').style.display = 'none';
    
    // Hash Box
    const hashBox = document.getElementById('current-hash-box');
    hashBox.style.background = '#E6F4EA';
    hashBox.style.borderColor = '#A3D9B5';
    document.getElementById('current-hash-val').textContent = 'a3f9b2c1d4e5f6a7b8c9d0e1f2a3f9b2c1d4e5f6a7b8c9d0e1f2a3f9b2c1d4e5';
    document.getElementById('current-hash-val').style.color = '#0A6E31';
    
    const hashMsg = document.getElementById('hash-status-msg');
    hashMsg.style.color = '#0A6E31';
    hashMsg.innerHTML = '✓ 100% MATCH';
    
    // Merkle Box
    const merkleBox = document.getElementById('merkle-box');
    merkleBox.style.background = '#E6F4EA';
    merkleBox.style.borderColor = '#A3D9B5';
    
    const merkleMsg = document.getElementById('merkle-status-msg');
    merkleMsg.style.color = '#0A6E31';
    merkleMsg.innerHTML = '✓ VALID — Path: [L1 → R2 → L3 → Root]';
    
    // Alert Box
    document.getElementById('alert-box').style.display = 'none';
    
    alert('System successfully self-healed using the cryptographic Merkle Anchor on Polygon.');
  }
};

window.IntegrityMonitorView = IntegrityMonitorView;
