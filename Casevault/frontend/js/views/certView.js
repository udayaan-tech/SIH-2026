/**
 * CASEVAULT — BSA 2023 Sec 65B Certificate View
 * Generates a court-admissible electronic evidence certificate.
 */
const CertView = {
  render(container) {
    const docId = State.selectedDocId || 'doc-002';

    container.innerHTML = `
      <div class="page-header-bar">
        <div class="page-title-group">
          <h1>BSA 2023 Sec 65B Certificate</h1>
          <div class="page-subtitle">
            Court-Admissible Electronic Evidence Certification
          </div>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" onclick="App.navigate('doc-viewer')">← Back to Viewer</button>
          <button class="btn btn-primary btn-sm" onclick="window.print()">🖨 Print for Court</button>
          <button class="btn btn-secondary btn-sm" onclick="alert('Downloading PDF...')">Download PDF</button>
          <button class="btn btn-saffron btn-sm" onclick="alert('Shared with Prosecutor securely via NDIS.')">Share with Prosecutor</button>
        </div>
      </div>

      <div style="display: flex; justify-content: center; padding: 20px;">
        <div style="background: white; border: 1px solid #ccc; width: 100%; max-width: 800px; padding: 60px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); font-family: 'Times New Roman', serif;">
          
          <div style="text-align: center; margin-bottom: 40px;">
            <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">≡ ASHOKA EMBLEM ≡</div>
            <div style="font-size: 20px; font-weight: bold;">GOVERNMENT OF INDIA</div>
            <div style="font-size: 16px;">MINISTRY OF HOME AFFAIRS</div>
            <div style="font-size: 14px; margin-top: 5px;">NATIONAL DIGITAL INVESTIGATION SERVICES (NDIS)</div>
          </div>

          <div style="text-align: center; margin-bottom: 40px;">
            <div style="font-size: 18px; font-weight: bold; text-decoration: underline;">CERTIFICATE UNDER SECTION 65B</div>
            <div style="font-size: 16px; font-weight: bold;">BHARATIYA SAKSHYA ADHINIYAM, 2023</div>
          </div>

          <div style="font-size: 14px; line-height: 1.8; margin-bottom: 30px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="width: 30%; font-weight: bold; padding: 5px 0;">Case No:</td><td>FIR-DEL-2026-0421</td></tr>
              <tr><td style="font-weight: bold; padding: 5px 0;">Document:</td><td>CCTV_Footage_Camera3.mp4</td></tr>
              <tr><td style="font-weight: bold; padding: 5px 0;">Document ID:</td><td>${docId}</td></tr>
              <tr><td style="font-weight: bold; padding: 5px 0;">SHA-256 Hash:</td><td class="font-mono" style="font-size: 12px; word-break: break-all;">a3f9b2c1d4e5f6a7b8c9d0e1f2...</td></tr>
              <tr><td style="font-weight: bold; padding: 5px 0;">Merkle Root:</td><td class="font-mono" style="font-size: 12px; word-break: break-all;">7f8a9b0c1d2e3f4a5b6c7d...</td></tr>
              <tr><td style="font-weight: bold; padding: 5px 0;">Blockchain Anchor:</td><td class="font-mono" style="font-size: 12px;">Polygon Tx #0x4a8f...</td></tr>
            </table>
          </div>

          <div style="font-size: 14px; line-height: 1.8; margin-bottom: 40px; text-align: justify;">
            <p>I hereby certify that:</p>
            <ol style="padding-left: 20px; list-style-type: lower-alpha;">
              <li>The electronic record was produced by a computer in regular use.</li>
              <li>The information was fed in the regular course of activities.</li>
              <li>The computer was operating properly during the relevant period.</li>
              <li>The contents of this digital record are a true and accurate reproduction of the original data.</li>
            </ol>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 60px;">
            <div>
              <div style="border: 2px solid #000; padding: 40px; display: inline-block; text-align: center; font-weight: bold;">
                [QR CODE]<br><span style="font-size: 10px; font-weight: normal;">Scan to verify on public portal</span>
              </div>
            </div>
            
            <div style="text-align: right; font-size: 14px;">
              <div style="font-style: italic; margin-bottom: 10px;">Digital Seal: RS256 Signature</div>
              <div style="font-weight: bold;">Certifying Officer:</div>
              <div>SI Rajesh Sharma (#DL-4821)</div>
              <div>Date: 23 September 2026</div>
              <div>Place: New Delhi</div>
            </div>
          </div>

        </div>
      </div>
    `;
  }
};

window.CertView = CertView;
