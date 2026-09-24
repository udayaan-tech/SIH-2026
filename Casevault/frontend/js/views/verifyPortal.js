/**
 * CASEVAULT — Public QR Verification Portal
 * Standalone logic for the zero-knowledge verification page.
 */
const VerifyPortal = {
  init(containerId) {
    this.container = document.getElementById(containerId);
    this.renderSearch();
  },

  renderSearch() {
    this.container.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: var(--gov-navy-dark); font-weight: 800; margin-bottom: 10px;">Verify Electronic Evidence</h2>
        <p style="color: var(--gov-text-secondary); font-size: 14px;">Enter the SHA-256 Hash or Document ID found on the Sec 65B Certificate.</p>
      </div>

      <div style="margin-bottom: 20px;">
        <input type="text" id="verify-input" class="form-control" style="font-family: var(--font-mono); padding: 16px; font-size: 14px;" placeholder="e.g., a3f9b2c1d4e5f6a7b8c9d0e1f2..." />
      </div>

      <button class="btn btn-primary" style="width: 100%; padding: 14px; font-size: 16px; font-weight: bold;" onclick="VerifyPortal.simulateVerification()">
        Cryptographically Verify
      </button>
      
      <div style="text-align: center; margin-top: 20px; font-size: 12px; color: var(--gov-text-muted);">
        Or scan the QR code using your mobile device.
      </div>
    `;
  },

  simulateVerification() {
    const input = document.getElementById('verify-input').value;
    if (!input) return alert('Please enter a hash or document ID.');

    this.container.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <div style="font-size: 40px; margin-bottom: 20px; animation: spin 2s linear infinite;">⏳</div>
        <div style="font-weight: bold; color: var(--gov-navy-primary);">Querying Blockchain Anchor...</div>
        <div style="font-size: 13px; color: var(--gov-text-muted); margin-top: 10px;">Recomputing Merkle Path</div>
      </div>
      <style>
        @keyframes spin { 100% { transform: rotate(360deg); } }
      </style>
    `;

    setTimeout(() => {
      this.renderResult(input);
    }, 2000);
  },

  renderResult(hashInput) {
    this.container.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="font-size: 48px; color: #0A6E31; margin-bottom: 10px;">✓</div>
        <h2 style="color: #0A6E31; font-weight: 800; margin-bottom: 10px;">VERIFIED & AUTHENTIC</h2>
        <p style="color: var(--gov-text-secondary); font-size: 14px;">The cryptographic hash perfectly matches the immutable ledger record.</p>
      </div>

      <div style="background: #F8FAFC; border: 1px solid var(--gov-border); border-radius: 6px; padding: 20px; margin-bottom: 24px; text-align: left; font-size: 13px;">
        <div style="margin-bottom: 12px;">
          <div style="font-weight: bold; color: var(--gov-text-muted); font-size: 11px;">MATCHING HASH</div>
          <div class="font-mono" style="word-break: break-all; color: var(--gov-navy-dark); font-weight: bold;">
            ${hashInput.length > 20 ? hashInput : 'a3f9b2c1d4e5f6a7b8c9d0e1f2a3f9b2c1d4e5f6a7b8c9d0e1f2a3f9b2c1d4e5'}
          </div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <div style="font-weight: bold; color: var(--gov-text-muted); font-size: 11px;">DOCUMENT TITLE</div>
          <div style="font-weight: bold;">CCTV_Footage_Camera3.mp4</div>
        </div>

        <div style="margin-bottom: 12px;">
          <div style="font-weight: bold; color: var(--gov-text-muted); font-size: 11px;">AUTHORING OFFICER</div>
          <div>SI Rajesh Sharma (NDIS-IO-4102)</div>
        </div>

        <div>
          <div style="font-weight: bold; color: var(--gov-text-muted); font-size: 11px;">TIMESTAMP (NTP)</div>
          <div>2026-09-10 10:00:14 IST</div>
        </div>
      </div>

      <button class="btn btn-secondary" style="width: 100%; padding: 12px;" onclick="VerifyPortal.renderSearch()">
        Verify Another Document
      </button>
    `;
  }
};

window.VerifyPortal = VerifyPortal;
