/**
 * CASEVAULT — 15-Step Interactive Hackathon Demo Script Guide (Section 31)
 * Enables presenters and judges to step through the complete demonstration sequence seamlessly.
 */
const DemoGuide = {
  currentStep: 1,
  steps: [
    {
      num: 1,
      title: 'Login as Lead Investigation Officer',
      desc: 'Officer A. Sharma logs in to Economic Investigation Unit with MFA credentials.',
      action: async () => {
        await App.switchToOfficer('NDIS-IO-4102');
        App.navigate('dashboard');
      }
    },
    {
      num: 2,
      title: 'Open CASE-2026-041',
      desc: 'Navigate to Financial Fraud Investigation (Apex FinCorp Multi-Jurisdiction Shell Diversion).',
      action: () => {
        State.selectedCaseId = 'case-041';
        App.navigate('case-detail');
      }
    },
    {
      num: 3,
      title: 'Initiate Document Upload Flow',
      desc: 'Open the government secure upload modal with 6-stage verification pipeline.',
      action: () => {
        App.navigate('documents');
        setTimeout(() => DocumentsView.openUploadModal('case-041'), 200);
      }
    },
    {
      num: 4,
      title: 'Show AI Classification & Extraction',
      desc: 'Inspect AI Document Intelligence with 96% confidence and extracted legal entities.',
      action: () => {
        App.navigate('ai-intel');
      }
    },
    {
      num: 5,
      title: 'Cryptographic SHA-256 Hash Verification',
      desc: 'Open split-screen Document Viewer and verify SHA-256 bitstream hash.',
      action: () => {
        State.selectedDocId = 'doc-002';
        App.navigate('doc-viewer');
      }
    },
    {
      num: 6,
      title: 'Simulate Integrity Tamper Detection',
      desc: 'Demonstrate immediate detection of corrupted or altered documents in the ledger.',
      action: () => {
        App.navigate('doc-viewer');
        setTimeout(() => DocViewerView.simulateTamper(), 300);
      }
    },
    {
      num: 7,
      title: 'Register Seized Digital Evidence',
      desc: 'Open Evidence Vault and register newly seized digital storage media exhibit.',
      action: () => {
        App.navigate('evidence');
        setTimeout(() => EvidenceView.openRegisterModal(), 200);
      }
    },
    {
      num: 8,
      title: 'Transfer Custody to Forensic Officer',
      desc: 'Hand over Exhibit EVD-2026-041-01 to R. Patel (Forensic Science Division).',
      action: () => {
        App.navigate('evidence');
        setTimeout(() => EvidenceView.openTransferModal('ev-001'), 200);
      }
    },
    {
      num: 9,
      title: 'Show Immutable Chain of Custody',
      desc: 'Examine 5-stage Chain of Custody (Collected -> Transferred -> Received -> Examined -> Stored).',
      action: () => {
        State.selectedEvidenceId = 'ev-001';
        App.navigate('evidence');
      }
    },
    {
      num: 10,
      title: 'Search via AI Smart Search',
      desc: 'Execute natural language query: "Find financial evidence related to Case 041".',
      action: () => {
        App.navigate('ai-search');
        setTimeout(() => AISearchView.performQuickSearch('Find financial evidence related to Case 041'), 200);
      }
    },
    {
      num: 11,
      title: 'Switch Role to Auditor (Read-Only)',
      desc: 'Switch officer to K. Iyer (Auditor - Read Only) to demonstrate RBAC enforcement.',
      action: async () => {
        await App.switchToOfficer('NDIS-AUD-9904');
        App.navigate('access-control');
      }
    },
    {
      num: 12,
      title: 'Attempt Unauthorized Access (403 Demo)',
      desc: 'Attempt to download restricted encrypted file without clearance. Triggers 403 Forbidden.',
      action: () => {
        AccessControlView.simulateUnauthorizedAccess();
      }
    },
    {
      num: 13,
      title: 'Open Immutable Audit Trail',
      desc: 'Inspect vigilance audit ledger. Verify that the denied attempt was recorded with checksum.',
      action: async () => {
        await App.switchToOfficer('NDIS-ADM-0001'); // Switch to Admin to view audit
        App.navigate('audit-trail');
      }
    },
    {
      num: 14,
      title: 'Export Statutory Compliance Report',
      desc: 'Demonstrate CSV / printable tamper-evident audit report generation.',
      action: () => {
        App.navigate('audit-trail');
        setTimeout(() => AuditTrailView.exportCsv(), 200);
      }
    },
    {
      num: 15,
      title: 'Security Center Threat Intelligence',
      desc: 'Inspect live MFA, AES-256 encryption status, brute force monitor, and integrity scan.',
      action: () => {
        App.navigate('security-center');
      }
    }
  ],

  init() {
    this.renderBar();
  },

  renderBar() {
    let bar = document.getElementById('hackathon-demo-guide-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'hackathon-demo-guide-bar';
      bar.className = 'demo-guide-bar';
      document.body.appendChild(bar);
    }

    const step = this.steps[this.currentStep - 1];

    bar.innerHTML = `
      <div class="demo-guide-inner">
        <div class="demo-guide-info">
          <span class="demo-step-badge">Demo Script Step ${step.num} of 15</span>
          <div>
            <strong style="color: #FFFFFF;">${step.title}:</strong>
            <span class="demo-step-text"> ${step.desc}</span>
          </div>
        </div>
        <div class="demo-guide-controls">
          <button class="btn btn-secondary btn-sm" onclick="DemoGuide.prevStep()" ${this.currentStep === 1 ? 'disabled style="opacity: 0.5"' : ''}>
            ◀ Previous
          </button>
          <button class="btn btn-saffron btn-sm" onclick="DemoGuide.executeCurrentStep()">
            ⚡ Run Step ${this.currentStep}
          </button>
          <button class="btn btn-primary btn-sm" onclick="DemoGuide.nextStep()" ${this.currentStep === 15 ? 'disabled style="opacity: 0.5"' : ''}>
            Next Step ▶
          </button>
          <button class="btn btn-secondary btn-sm" style="background: none; border-color: rgba(255,255,255,0.3); color: #FFF;" onclick="DemoGuide.toggleMinimize()">
            _
          </button>
        </div>
      </div>
    `;
  },

  async executeCurrentStep() {
    const step = this.steps[this.currentStep - 1];
    if (step && step.action) {
      await step.action();
    }
  },

  async nextStep() {
    if (this.currentStep < this.steps.length) {
      this.currentStep++;
      this.renderBar();
      await this.executeCurrentStep();
    }
  },

  async prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.renderBar();
      await this.executeCurrentStep();
    }
  },

  toggleMinimize() {
    const bar = document.getElementById('hackathon-demo-guide-bar');
    if (bar) {
      bar.classList.toggle('minimized');
      if (bar.classList.contains('minimized')) {
        bar.style.transform = 'translateY(calc(100% - 32px))';
      } else {
        bar.style.transform = 'none';
      }
    }
  }
};

window.DemoGuide = DemoGuide;
