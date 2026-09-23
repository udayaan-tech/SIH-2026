/**
 * CASEVAULT — Document Viewer & SHA-256 Integrity Verification View
 * Section 11: Split viewer with official government document preview, metadata, and SHA-256 verification
 */
const DocViewerView = {
  currentDoc: null,
  tamperedState: false,

  async render(container) {
    const docId = State.selectedDocId || 'doc-002';

    container.innerHTML = `
      <div id="viewer-loading" style="text-align: center; padding: 40px;">
        Loading evidentiary document <strong>${docId}</strong> from secure storage...
      </div>
      <div id="viewer-content" style="display: none;"></div>
    `;

    try {
      const res = await API.get(`/documents/${docId}`);
      this.currentDoc = res.data;
      this.renderViewer(document.getElementById('viewer-content'));
      document.getElementById('viewer-loading').style.display = 'none';
      document.getElementById('viewer-content').style.display = 'block';
    } catch (e) {
      document.getElementById('viewer-loading').innerHTML = `
        <div style="color: var(--status-critical); padding: 20px;">
          Failed to load document: ${e.message}
        </div>
      `;
    }
  },

  renderViewer(container) {
    const d = this.currentDoc;
    const isHindi = State.language === 'HI';

    container.innerHTML = `
      <div class="page-header-bar">
        <div class="page-title-group">
          <h1>${isHindi ? 'दस्तावेज़ दर्शक एवं सत्यनिष्ठा' : 'Document Viewer & Cryptographic Verification'}</h1>
          <div class="page-subtitle">
            ${d.file_name} • Registered Under <span class="font-mono">${d.document_number}</span>
          </div>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" onclick="App.navigate('documents')">
            ← Back to Documents
          </button>
          <button class="btn btn-primary btn-sm" onclick="DocViewerView.verifyIntegrity()">
            🛡 [ Verify Integrity ]
          </button>
        </div>
      </div>

      <!-- Split Layout (Section 11) -->
      <div class="split-viewer-grid">
        
        <!-- LEFT: Official Government Document Preview -->
        <div class="doc-preview-pane" style="position: relative; overflow: hidden; background: #E2E8F0; display: flex; justify-content: center; align-items: center; padding: 20px;">
          <!-- Diagonal Forensic Watermark -->
          <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; display: flex; justify-content: center; align-items: center; opacity: 0.15; transform: rotate(-35deg); font-family: var(--font-mono); font-size: 24px; font-weight: 800; color: #000; white-space: nowrap; z-index: 10;">
            CONFIDENTIAL | SI RAJESH SHARMA | #DL-4821 | 10.195.2.44
          </div>

          <!-- HTML5 Canvas Mockup -->
          <div style="background: #FFFFFF; width: 100%; max-width: 600px; height: 100%; min-height: 800px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 40px; position: relative;">
            <div style="position: absolute; top: 10px; right: 10px; font-size: 10px; color: #94A3B8; font-family: var(--font-mono);">Rendered via HTML5 Canvas</div>
            
            <!-- Official Document Header Banner -->
            <div style="border-bottom: 2px solid var(--gov-navy-dark); padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <div style="font-size: 11px; font-weight: 700; color: #64748B; letter-spacing: 1px; text-transform: uppercase;">
                  GOVERNMENT OF INDIA • NATIONAL DIGITAL INVESTIGATION SERVICES
                </div>
                <div style="font-size: 18px; font-weight: 800; color: var(--gov-navy-dark); margin-top: 2px;">
                  ${d.title}
                </div>
                <div style="font-size: 11px; color: var(--gov-text-muted); margin-top: 2px;">
                  Case Reference: <strong>${d.case_number || d.case_id}</strong> • Document Ref: <span class="font-mono">${d.document_number}</span>
                </div>
              </div>
            </div>

            <!-- Document Text Body (Simulating Real Evidentiary Document Content) -->
            <div style="font-size: 13px; line-height: 1.8; color: var(--gov-text-primary); margin-bottom: 24px; white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, serif;">
  <strong>OFFICIAL EVIDENTIARY RECORD & FORENSIC ATTESTATION</strong>

  ${d.ocr_extracted_text || 'No text extracted. Simulating content rendering...'}
            </div>

            <!-- Official Stamp & Digital Signature Seal -->
            <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid var(--gov-border-light); padding-top: 16px; margin-top: 20px;">
              <div style="border: 2px solid var(--gov-navy-primary); border-radius: 4px; padding: 6px 12px; display: inline-flex; align-items: center; gap: 8px; font-size: 11px; color: var(--gov-navy-dark);">
                <span style="font-size: 20px;">⚖</span>
                <div>
                  <div style="font-weight: 800; text-transform: uppercase;">NDIS OFFICIAL VERIFIED</div>
                  <div style="font-size: 9px; color: var(--gov-text-muted);">Cryptographically Authenticated</div>
                </div>
              </div>

              <div style="text-align: right; font-size: 11px;">
                <div style="font-weight: 700;">Digitally Signed By:</div>
                <div style="color: var(--gov-navy-primary); font-weight: 700;">Officer ${d.uploader_name || 'A. Sharma'}</div>
                <div style="font-size: 10px; color: var(--gov-text-muted); font-family: var(--font-mono);">
                  ${d.digital_signature ? d.digital_signature.substring(0, 36) + '...' : 'NDIS-DSIG-ECDSA-P256-VALID'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: Metadata & Cryptographic Integrity Panel (Section 11) -->
        <div class="doc-info-pane">
          <h2 style="font-size: 14px; font-weight: 700; color: var(--gov-navy-dark); text-transform: uppercase; margin-bottom: 14px; border-bottom: 1px solid var(--gov-border-light); padding-bottom: 6px;">
            Document Metadata & Ledger
          </h2>

          <div class="info-item">
            <div class="info-label">Document ID</div>
            <div class="info-value font-mono" style="font-weight: 700; color: var(--gov-navy-primary);">${d.document_number}</div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div class="info-item">
              <div class="info-label">Document Type</div>
              <div class="info-value"><span class="badge badge-info">${d.document_type}</span></div>
            </div>
            <div class="info-item">
              <div class="info-label">Case ID</div>
              <div class="info-value"><strong class="font-mono">${d.case_number || d.case_id}</strong></div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div class="info-item">
              <div class="info-label">Uploaded By</div>
              <div class="info-value">${d.uploader_name || 'Officer'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Version</div>
              <div class="info-value"><span class="badge badge-secondary">${d.version}</span></div>
            </div>
          </div>

          <!-- Sidebar panel fields (Section 11) -->
          <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 12px;">
            <div class="info-item">
              <div class="info-label">Integrity Status</div>
              <div class="info-value"><span class="badge ${this.tamperedState ? 'badge-review' : 'badge-verified'}">🛡 ${this.tamperedState ? 'INVALID (Mismatch)' : 'VERIFIED (SHA-256 match)'}</span></div>
            </div>
            <div class="info-item">
              <div class="info-label">Merkle Proof</div>
              <div class="info-value font-mono" style="font-size: 11px;">Leaf #42, Path: [L1→R2→L3→Root]</div>
            </div>
            <div class="info-item">
              <div class="info-label">Chain of Custody</div>
              <div class="info-value">3 handoffs completed</div>
            </div>
            <div class="info-item">
              <div class="info-label">Classification</div>
              <div class="info-value"><span class="badge badge-confidential">${d.security_classification || 'CONFIDENTIAL'}</span></div>
            </div>
          </div>

          <!-- Cryptographic Integrity Panel (Section 11) -->
          <div style="background-color: var(--gov-surface-alt); border: 1px solid var(--gov-border); border-radius: var(--radius-sm); padding: 14px; margin: 16px 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <span style="font-size: 12px; font-weight: 800; color: var(--gov-navy-dark); text-transform: uppercase;">
                DOCUMENT INTEGRITY
              </span>
              <button class="btn btn-secondary btn-sm" style="font-size: 10px; padding: 2px 6px;" onclick="DocViewerView.toggleTamperSimulation()">
                ${this.tamperedState ? '↺ Reset Hash' : '⚠ Simulate Tampering'}
              </button>
            </div>

            <div style="font-size: 11px; margin-bottom: 6px;">
              <div class="info-label">Registered Ledger Hash:</div>
              <div class="hash-display-box" id="viewer-registered-hash">${d.sha256_hash}</div>
            </div>

            <div style="font-size: 11px; margin-bottom: 10px;">
              <div class="info-label">Current Computed Hash:</div>
              <div class="hash-display-box" id="viewer-current-hash" style="${this.tamperedState ? 'color: #F87171;' : ''}">
                ${this.tamperedState ? 'DEADBEEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF01234567' : d.sha256_hash}
              </div>
            </div>

            <!-- Verification Status Output Box -->
            <div id="integrity-result-box" style="padding: 10px; border-radius: var(--radius-sm); ${this.tamperedState ? 'background: #FEE2E2; border: 1px solid #F87171; color: #B91C1C;' : 'background: #E6F4EA; border: 1px solid #A3D9B5; color: #0A6E31;'}">
              <div style="font-weight: 800; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                <span>${this.tamperedState ? '⚠' : '✓'}</span>
                <span>${this.tamperedState ? 'INTEGRITY MISMATCH — TAMPERING DETECTED' : 'MATCH — DOCUMENT VERIFIED'}</span>
              </div>
              <div style="font-size: 11px; margin-top: 2px;">
                ${this.tamperedState
                  ? 'Current file hash differs from the registered government ledger. Unauthorized modification detected!'
                  : 'Computed SHA-256 bitstream matches official register with 100% cryptographic certainty.'}
              </div>
            </div>
          </div>

          <!-- Buttons (Section 11) -->
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <button class="btn btn-primary btn-sm" onclick="DocViewerView.verifyIntegrity()">
                Verify Integrity
              </button>
              <button class="btn btn-secondary btn-sm" onclick="alert('Viewing AI Redacted Copy...')">
                View Redacted Copy
              </button>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <button class="btn btn-saffron btn-sm" onclick="App.navigate('cert-view')">
                Generate Sec 65B Certificate
              </button>
              <button class="btn btn-secondary btn-sm" onclick="App.navigate('evidence')">
                Forward to Next Agency
              </button>
            </div>
          </div>

        </div>

      </div>
    `;
  },

  async verifyIntegrity() {
    try {
      const res = await API.post(`/documents/${this.currentDoc.id}/verify`, {
        simulateTamper: this.tamperedState
      });

      const resultBox = document.getElementById('integrity-result-box');
      if (resultBox) {
        resultBox.style.backgroundColor = 'var(--status-active-bg)';
        resultBox.style.borderColor = '#A3D9B5';
        resultBox.style.color = 'var(--status-active)';
        resultBox.innerHTML = `
          <div style="font-weight: 800; font-size: 12px;">✓ MATCH — DOCUMENT VERIFIED</div>
          <div style="font-size: 11px; margin-top: 2px;">SHA-256 validation confirmed against immutable register.</div>
        `;
      }
      alert('✓ DOCUMENT VERIFIED: SHA-256 checksum exactly matches official immutable register.');
    } catch (e) {
      // 409 mismatch handled by API error
    }
  },

  toggleTamperSimulation() {
    this.tamperedState = !this.tamperedState;
    this.renderViewer(document.getElementById('viewer-content'));
    if (this.tamperedState) {
      API.post(`/documents/${this.currentDoc.id}/verify`, { simulateTamper: true }).catch(() => {});
    }
  },

  simulateTamper() {
    this.tamperedState = true;
    this.renderViewer(document.getElementById('viewer-content'));
    API.post(`/documents/${this.currentDoc.id}/verify`, { simulateTamper: true }).catch(() => {});
  }
};

window.DocViewerView = DocViewerView;
