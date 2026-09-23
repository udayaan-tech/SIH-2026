/**
 * CASEVAULT — Case Details Workspace View
 * Section 8: Dedicated workspace with 7 tabs (Overview, Documents, Evidence, People, Timeline, Tasks, Audit Trail)
 */
const CaseDetailView = {
  currentTab: 'overview',
  caseData: null,

  async render(container) {
    const caseId = State.selectedCaseId || 'case-041';

    container.innerHTML = `
      <div id="case-workspace-loading" style="text-align: center; padding: 40px;">
        Loading case workspace for <strong>${caseId}</strong>...
      </div>
      <div id="case-workspace-content" style="display: none;"></div>
    `;

    try {
      const res = await API.get(`/cases/${caseId}`);
      this.caseData = res.data;
      this.renderWorkspace(document.getElementById('case-workspace-content'));
      document.getElementById('case-workspace-loading').style.display = 'none';
      document.getElementById('case-workspace-content').style.display = 'block';
    } catch (e) {
      document.getElementById('case-workspace-loading').innerHTML = `
        <div style="color: var(--status-critical); padding: 20px;">
          Failed to load case workspace: ${e.message}
        </div>
      `;
    }
  },

  renderWorkspace(container) {
    const c = this.caseData;
    const progress = c.investigation_progress || 78;

    container.innerHTML = `
      <!-- Workspace Header -->
      <div style="background-color: #FFFFFF; border: 1px solid var(--gov-border); border-radius: var(--radius-sm); padding: 18px 20px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
              <span class="font-mono" style="font-size: 16px; font-weight: 800; color: var(--gov-navy-primary);">${c.case_number}</span>
              <span class="badge badge-active">${c.status}</span>
              <span class="badge badge-confidential">${c.confidentiality_level}</span>
              <span class="badge badge-critical">${c.priority} PRIORITY</span>
            </div>
            <h1 style="font-size: 20px; font-weight: 700; color: var(--gov-navy-dark);">${c.title}</h1>
            <div style="font-size: 12px; color: var(--gov-text-muted); margin-top: 4px;">
              <strong>Lead Officer:</strong> ${c.lead_officer_name} (${c.lead_officer_code}) •
              <strong>Department:</strong> ${c.department_name} •
              <strong>Jurisdiction:</strong> ${c.jurisdiction} •
              <strong>FIR:</strong> ${c.fir_number}
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" onclick="App.navigate('cases')">
              ← Back to Cases
            </button>
            <button class="btn btn-primary btn-sm" onclick="DocumentsView.openUploadModal('${c.id}')">
              + Upload Case Document
            </button>
          </div>
        </div>

        <!-- Investigation Progress Bar -->
        <div style="margin-top: 16px; background-color: var(--gov-surface-alt); padding: 10px 14px; border: 1px solid var(--gov-border-light); border-radius: var(--radius-sm);">
          <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; margin-bottom: 6px;">
            <span>INVESTIGATION PROGRESS</span>
            <span style="color: var(--gov-green);">${progress}% COMPLETED</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${progress}%;"></div>
          </div>
        </div>
      </div>

      <!-- 7 Workspace Tabs (Section 8) -->
      <div class="gov-tabs">
        <button class="gov-tab-btn ${this.currentTab === 'overview' ? 'active' : ''}" onclick="CaseDetailView.switchTab('overview')">Overview</button>
        <button class="gov-tab-btn ${this.currentTab === 'documents' ? 'active' : ''}" onclick="CaseDetailView.switchTab('documents')">Documents (${c.documents ? c.documents.length : 0})</button>
        <button class="gov-tab-btn ${this.currentTab === 'evidence' ? 'active' : ''}" onclick="CaseDetailView.switchTab('evidence')">Evidence (${c.evidence ? c.evidence.length : 0})</button>
        <button class="gov-tab-btn ${this.currentTab === 'people' ? 'active' : ''}" onclick="CaseDetailView.switchTab('people')">People & Team</button>
        <button class="gov-tab-btn ${this.currentTab === 'timeline' ? 'active' : ''}" onclick="CaseDetailView.switchTab('timeline')">Case Timeline</button>
        <button class="gov-tab-btn ${this.currentTab === 'tasks' ? 'active' : ''}" onclick="CaseDetailView.switchTab('tasks')">Investigation Tasks</button>
        <button class="gov-tab-btn ${this.currentTab === 'audit' ? 'active' : ''}" onclick="CaseDetailView.switchTab('audit')">Audit Trail</button>
      </div>

      <!-- Tab Content Area -->
      <div id="case-tab-content">
        ${this.renderTabContent()}
      </div>
    `;
  },

  switchTab(tab) {
    this.currentTab = tab;
    const contentEl = document.getElementById('case-tab-content');
    if (contentEl) contentEl.innerHTML = this.renderTabContent();

    // Update active tab button style
    document.querySelectorAll('.gov-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.toLowerCase().includes(tab));
    });
  },

  renderTabContent() {
    const c = this.caseData;

    switch (this.currentTab) {
      case 'overview':
        return `
          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
            <div>
              <div class="gov-card">
                <div class="gov-card-header">
                  <div class="gov-card-title">Case Brief & Statutory Allegations</div>
                </div>
                <div class="gov-card-body" style="font-size: 13px; line-height: 1.6;">
                  <p><strong>Description:</strong> ${c.description}</p>
                  <div style="margin-top: 12px; background: var(--gov-surface-alt); padding: 10px; border: 1px solid var(--gov-border-light);">
                    <div><strong>Applicable Sections:</strong> <span class="font-mono">${c.acts_sections}</span></div>
                    <div><strong>Jurisdictional Bench:</strong> Special Court for Economic Offences</div>
                    <div><strong>Date Registered:</strong> ${c.date_opened}</div>
                  </div>
                </div>
              </div>

              <!-- Case Timeline Steps (Section 8) -->
              <div class="gov-card">
                <div class="gov-card-header">
                  <div class="gov-card-title">Investigation Progression Timeline</div>
                </div>
                <div class="gov-card-body">
                  <div class="timeline-list">
                    <div class="timeline-step completed">
                      <div class="timeline-marker">✓</div>
                      <div class="timeline-content">
                        <div class="timeline-title">Case Created & Formal Intake</div>
                        <div class="timeline-time">14 Feb 2026 • Registered by EIU Special Branch</div>
                      </div>
                    </div>
                    <div class="timeline-step completed">
                      <div class="timeline-marker">✓</div>
                      <div class="timeline-content">
                        <div class="timeline-title">FIR Uploaded (FIR_2026_041.pdf)</div>
                        <div class="timeline-time">14 Feb 2026 • SHA-256 Verified by Lead Officer A. Sharma</div>
                      </div>
                    </div>
                    <div class="timeline-step completed">
                      <div class="timeline-marker">✓</div>
                      <div class="timeline-content">
                        <div class="timeline-title">Witness Statement Added (Witness_Statement_07.pdf)</div>
                        <div class="timeline-time">15 Feb 2026 • Deposition of Chief Accounts Officer</div>
                      </div>
                    </div>
                    <div class="timeline-step completed">
                      <div class="timeline-marker">✓</div>
                      <div class="timeline-content">
                        <div class="timeline-title">Financial Records Added (Bank_Transaction_Report.pdf)</div>
                        <div class="timeline-time">20 Feb 2026 • Reconciled bank accounts of 34 shell entities</div>
                      </div>
                    </div>
                    <div class="timeline-step completed">
                      <div class="timeline-marker">✓</div>
                      <div class="timeline-content">
                        <div class="timeline-title">Forensic Report Verified (Forensic_Report.pdf)</div>
                        <div class="timeline-time">02 Mar 2026 • FSD Digital Bitstream Hash Match confirmed</div>
                      </div>
                    </div>
                    <div class="timeline-step current">
                      <div class="timeline-marker">⚡</div>
                      <div class="timeline-content">
                        <div class="timeline-title">Charge Sheet Under Review (ChargeSheet_v2.pdf)</div>
                        <div class="timeline-time">Current Stage • Senior Legal Prosecution review pending</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Side Stats Summary (Section 8: 42 Docs, 17 Evidence, 06 Users, 184 Audits) -->
            <div>
              <div class="gov-card">
                <div class="gov-card-header">
                  <div class="gov-card-title">Case Ledger Metrics</div>
                </div>
                <div class="gov-card-body" style="display: flex; flex-direction: column; gap: 12px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--gov-border-light); padding-bottom: 8px;">
                    <span style="font-size: 12px; color: var(--gov-text-muted);">DOCUMENTS</span>
                    <strong style="font-size: 16px; color: var(--gov-navy-dark);">42</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--gov-border-light); padding-bottom: 8px;">
                    <span style="font-size: 12px; color: var(--gov-text-muted);">EVIDENCE ITEMS</span>
                    <strong style="font-size: 16px; color: var(--gov-navy-dark);">17</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--gov-border-light); padding-bottom: 8px;">
                    <span style="font-size: 12px; color: var(--gov-text-muted);">AUTHORIZED USERS</span>
                    <strong style="font-size: 16px; color: var(--gov-navy-dark);">06</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 12px; color: var(--gov-text-muted);">AUDIT EVENTS</span>
                    <strong style="font-size: 16px; color: var(--gov-navy-dark);">184</strong>
                  </div>
                </div>
              </div>

              <div class="gov-card">
                <div class="gov-card-header">
                  <div class="gov-card-title">Quick Actions</div>
                </div>
                <div class="gov-card-body" style="display: flex; flex-direction: column; gap: 8px;">
                  <button class="btn btn-secondary btn-sm" onclick="App.openDocViewer('doc-001')">Open FIR Document</button>
                  <button class="btn btn-secondary btn-sm" onclick="App.openDocViewer('doc-002')">Open Forensic Report</button>
                  <button class="btn btn-secondary btn-sm" onclick="App.navigate('evidence')">Open Evidence Locker</button>
                </div>
              </div>
            </div>
          </div>
        `;

      case 'documents':
        const docs = c.documents || [];
        return `
          <div class="gov-card">
            <div class="gov-card-header">
              <div class="gov-card-title">Case Evidentiary Documents (${docs.length})</div>
              <button class="btn btn-primary btn-sm" onclick="DocumentsView.openUploadModal('${c.id}')">+ Upload Document</button>
            </div>
            <div class="table-responsive">
              <table class="gov-table">
                <thead>
                  <tr>
                    <th>Doc Number</th>
                    <th>Document Title</th>
                    <th>Type</th>
                    <th>Uploaded By</th>
                    <th>Version</th>
                    <th>Integrity</th>
                    <th>Signature</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${docs.map(d => `
                    <tr>
                      <td><span class="font-mono">${d.document_number}</span></td>
                      <td>
                        <strong>${d.file_name}</strong>
                        <div style="font-size: 11px; color: var(--gov-text-muted);">${d.title}</div>
                      </td>
                      <td><span class="badge badge-info">${d.document_type}</span></td>
                      <td>${d.uploader_name || 'Officer'}</td>
                      <td><span class="badge badge-secondary">${d.version}</span></td>
                      <td><span class="badge ${d.verification_status === 'VERIFIED' ? 'badge-verified' : 'badge-review'}">${d.verification_status}</span></td>
                      <td><span class="badge ${d.signature_status === 'VALID' ? 'badge-valid' : 'badge-review'}">${d.signature_status}</span></td>
                      <td>
                        <button class="btn btn-secondary btn-sm" onclick="App.openDocViewer('${d.id}')">View</button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;

      case 'evidence':
        const evs = c.evidence || [];
        return `
          <div class="gov-card">
            <div class="gov-card-header">
              <div class="gov-card-title">Seized Physical & Digital Exhibits (${evs.length})</div>
              <button class="btn btn-primary btn-sm" onclick="EvidenceView.openRegisterModal('${c.id}')">+ Register Evidence</button>
            </div>
            <div class="table-responsive">
              <table class="gov-table">
                <thead>
                  <tr>
                    <th>Evidence ID</th>
                    <th>Exhibit Title</th>
                    <th>Type</th>
                    <th>Current Custodian</th>
                    <th>Storage Location</th>
                    <th>Integrity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${evs.map(e => `
                    <tr>
                      <td><strong class="font-mono" style="color: var(--gov-navy-primary);">${e.evidence_number}</strong></td>
                      <td>
                        <strong>${e.title}</strong>
                        <div style="font-size: 11px; color: var(--gov-text-muted);">${e.description}</div>
                      </td>
                      <td><span class="badge badge-info">${e.evidence_type}</span></td>
                      <td>${e.custodian_name || 'Assigned Officer'}</td>
                      <td><span class="badge badge-secondary">${e.storage_location}</span></td>
                      <td><span class="badge badge-verified">${e.integrity_status}</span></td>
                      <td>
                        <button class="btn btn-secondary btn-sm" onclick="App.openEvidenceChain('${e.id}')">Chain of Custody</button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;

      case 'people':
        const members = c.members || [];
        return `
          <div class="gov-card">
            <div class="gov-card-header">
              <div class="gov-card-title">Assigned Investigation Team & Key Persons</div>
            </div>
            <div class="table-responsive">
              <table class="gov-table">
                <thead>
                  <tr>
                    <th>Officer / Person</th>
                    <th>Badge / Role</th>
                    <th>Department</th>
                    <th>Access Level</th>
                  </tr>
                </thead>
                <tbody>
                  ${members.map(m => `
                    <tr>
                      <td><strong>${m.full_name}</strong></td>
                      <td>${m.role_name} (${m.officer_id})</td>
                      <td>Economic Investigation Unit</td>
                      <td><span class="badge badge-info">${m.access_level}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;

      default:
        return `
          <div class="gov-card">
            <div class="gov-card-body" style="text-align: center; padding: 30px; color: var(--gov-text-muted);">
              Data loaded for <strong>${this.currentTab.toUpperCase()}</strong>.
            </div>
          </div>
        `;
    }
  }
};

window.CaseDetailView = CaseDetailView;
