/**
 * CASEVAULT — Interactive Demo Guide
 * Provides an overlay walkthrough for the 2-Minute Judge Demo.
 */
const DemoGuide = {
  steps: [
    {
      title: '1. Secure Authentication',
      desc: 'Start by logging in using the smart card/badge credentials. Notice the NDIS ecosystem.',
      action: () => App.navigate('login'),
      target: null
    },
    {
      title: '2. Officer Dashboard',
      desc: 'The main dashboard provides an overview of open cases, integrity alerts, and blockchain network status.',
      action: () => App.navigate('dashboard'),
      target: null
    },
    {
      title: '3. Register a New FIR (POCSO)',
      desc: 'Let us register a new case. If the legal sections include POCSO or Section 64/65, the system automatically flags it for privacy.',
      action: () => App.navigate('new-case'),
      target: null
    },
    {
      title: '4. Secure Evidence Upload',
      desc: 'Now, upload CCTV evidence. Watch the 6-stage cryptographic pipeline: SHA-256 hash, Malware scan, AES-256 encryption, and Merkle tree append.',
      action: () => {
        App.navigate('documents');
        setTimeout(() => DocumentsView.openUploadModal(), 500);
      },
      target: null
    },
    {
      title: '5. Anti-Leak Document Viewer',
      desc: 'Evidence is rendered on an HTML5 canvas to prevent DOM-scraping. Notice the diagonal forensic watermark and the live Merkle Proof in the sidebar.',
      action: () => App.navigate('doc-viewer'),
      target: null
    },
    {
      title: '6. Visual Custody Chain',
      desc: 'Every time evidence changes hands (e.g., IO to Malkhana, or Malkhana to FSL), the handoff is cryptographically signed. Click on the timeline to see it.',
      action: () => {
        App.navigate('case-detail');
        setTimeout(() => CaseDetailView.switchTab('timeline'), 300);
      },
      target: null
    },
    {
      title: '7. Red Team Tamper Attack',
      desc: 'What if a hacker tries to modify the evidence directly in the database? Let us simulate a tamper attack.',
      action: () => App.navigate('integrity-monitor'),
      target: null
    },
    {
      title: '8. Generate Sec 65B Certificate',
      desc: 'Once ready for court, generate the court-admissible BSA 2023 Sec 65B Certificate. It contains the hash, Merkle root, and a verification QR code.',
      action: () => App.navigate('cert-view'),
      target: null
    },
    {
      title: '9. Public QR Verification',
      desc: 'A judge or lawyer can scan the QR code to verify the evidence without logging in. The zero-knowledge portal recomputes the Merkle path.',
      action: () => {
        window.open('publicVerify.html', '_blank');
      },
      target: null
    }
  ],
  currentStep: 0,

  init() {
    this.renderOverlay();
  },

  renderOverlay() {
    let overlay = document.getElementById('demo-guide-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'demo-guide-overlay';
      overlay.style.position = 'fixed';
      overlay.style.bottom = '20px';
      overlay.style.right = '20px';
      overlay.style.width = '300px';
      overlay.style.backgroundColor = '#1E293B';
      overlay.style.color = '#F8FAFC';
      overlay.style.padding = '20px';
      overlay.style.borderRadius = '8px';
      overlay.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
      overlay.style.zIndex = '9999';
      overlay.style.fontFamily = 'Inter, sans-serif';
      document.body.appendChild(overlay);
    }
    this.updateContent();
  },

  updateContent() {
    const step = this.steps[this.currentStep];
    const overlay = document.getElementById('demo-guide-overlay');
    
    if (this.currentStep >= this.steps.length) {
      overlay.style.display = 'none';
      return;
    }

    overlay.style.display = 'block';
    overlay.innerHTML = \`
      <div style="font-size: 11px; color: #94A3B8; text-transform: uppercase; font-weight: 700; margin-bottom: 8px;">
        Demo Step \${this.currentStep + 1} of \${this.steps.length}
      </div>
      <div style="font-size: 14px; font-weight: 700; color: #FFF; margin-bottom: 8px;">
        \${step.title}
      </div>
      <div style="font-size: 12px; color: #CBD5E1; margin-bottom: 16px; line-height: 1.5;">
        \${step.desc}
      </div>
      <div style="display: flex; justify-content: space-between;">
        <button style="background: none; border: 1px solid #475569; color: #F8FAFC; padding: 6px 12px; border-radius: 4px; font-size: 11px; cursor: pointer;" onclick="DemoGuide.close()">Close</button>
        \${this.currentStep < this.steps.length - 1 
          ? \`<button style="background: #3B82F6; border: none; color: white; padding: 6px 12px; border-radius: 4px; font-size: 11px; font-weight: bold; cursor: pointer;" onclick="DemoGuide.next()">Next ➔</button>\` 
          : \`<button style="background: #10B981; border: none; color: white; padding: 6px 12px; border-radius: 4px; font-size: 11px; font-weight: bold; cursor: pointer;" onclick="DemoGuide.close()">Finish Demo ✓</button>\`
        }
      </div>
    \`;

    // Execute the action for this step
    if (step.action) {
      step.action();
    }
  },

  next() {
    this.currentStep++;
    this.updateContent();
  },

  prev() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.updateContent();
    }
  },

  close() {
    document.getElementById('demo-guide-overlay').style.display = 'none';
  }
};

window.DemoGuide = DemoGuide;
