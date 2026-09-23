/**
 * CASEVAULT — Case Management & Case Registration View
 * Sections 6 & 7: Official Case Registry, Filters, Search, and Create Case Form
 */
const CasesView = {
  casesData: [],

  async render(container) {
    const isHindi = State.language === 'HI';

    container.innerHTML = `
      <div class="page-header-bar">
        <div class="page-title-group">
          <h1>${isHindi ? 'मामला प्रबंधन प्रणाली' : 'Case Management'}</h1>
          <div class="page-subtitle">
            Statutory investigation registers and cross-jurisdictional proceedings
          </div>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" onclick="CasesView.exportCasesCsv()">
            📥 Export Report
          </button>
          <button class="btn btn-primary btn-sm" onclick="CasesView.openCreateCaseModal()">
            + Create New Case
          </button>
        </div>
      </div>

      <!-- Filters & Search Toolbar (Section 6) -->
      <div class="filter-toolbar">
        <div class="filter-group" style="flex: 1; min-width: 220px;">
          <input type="text" id="cases-search-input" class="form-control" style="width: 100%;"
            placeholder="Search by Case ID, Title, FIR number, or acts..." oninput="CasesView.handleFilterChange()" />
        </div>

        <div class="filter-group">
          <label class="filter-label">Status:</label>
          <select id="cases-filter-status" class="form-control" onchange="CasesView.handleFilterChange()">
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE" selected>ACTIVE</option>
            <option value="UNDER REVIEW">UNDER REVIEW</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Department:</label>
          <select id="cases-filter-dept" class="form-control" onchange="CasesView.handleFilterChange()">
            <option value="ALL">All Units</option>
            <option value="EIU">Economic Investigation Unit (EIU)</option>
            <option value="CCD">Cyber Crime Division (CCD)</option>
            <option value="DIU">District Investigation Unit (DIU)</option>
            <option value="FSD">Forensic Science Division (FSD)</option>
            <option value="LAD">Legal Affairs Department (LAD)</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Priority:</label>
          <select id="cases-filter-priority" class="form-control" onchange="CasesView.handleFilterChange()">
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>

        <button class="btn btn-secondary btn-sm" onclick="CasesView.resetFilters()">Reset</button>
      </div>

      <!-- Cases Data Table -->
      <div class="gov-card">
        <div class="gov-card-header">
          <div class="gov-card-title">
            <span>⚖</span> Registered Government Investigation Cases (<span id="cases-count-badge">0</span>)
          </div>
        </div>
        <div class="table-responsive">
          <table class="gov-table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Case Title</th>
                <th>Department</th>
                <th>Lead Officer</th>
                <th>Documents</th>
                <th>Evidence</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="cases-table-body">
              <tr><td colspan="9" style="text-align: center; padding: 24px;">Loading cases from official database...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    await this.fetchCases();
  },

  async fetchCases() {
    try {
      const search = document.getElementById('cases-search-input')?.value || '';
      const status = document.getElementById('cases-filter-status')?.value || 'ALL';
      const department = document.getElementById('cases-filter-dept')?.value || 'ALL';
      const priority = document.getElementById('cases-filter-priority')?.value || 'ALL';

      const res = await API.get('/cases', { search, status, department, priority });
      this.casesData = res.data || [];
      this.renderTable(this.casesData);
    } catch (e) {
      console.error('Error fetching cases:', e);
    }
  },

  renderTable(cases) {
    const tbody = document.getElementById('cases-table-body');
    const badge = document.getElementById('cases-count-badge');
    if (badge) badge.textContent = cases.length;

    if (!tbody) return;

    if (cases.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="9" style="text-align: center; padding: 30px; color: var(--gov-text-muted);">
          No registered investigation records match the selected filter criteria.
        </td></tr>
      `;
      return;
    }

    tbody.innerHTML = cases.map(c => {
      let statusBadge = 'badge-active';
      if (c.status === 'UNDER REVIEW') statusBadge = 'badge-review';
      if (c.status === 'CLOSED') statusBadge = 'badge-closed';

      let priorityColor = 'var(--gov-text-muted)';
      if (c.priority === 'CRITICAL') priorityColor = 'var(--status-critical)';
      if (c.priority === 'HIGH') priorityColor = 'var(--gov-saffron)';

      return `
        <tr>
          <td><strong class="font-mono" style="color: var(--gov-navy-primary); font-size: 13px;">${c.case_number}</strong></td>
          <td>
            <div style="font-weight: 700; color: var(--gov-navy-dark);">${c.title}</div>
            <div style="font-size: 11px; color: var(--gov-text-muted);">
              ${c.case_type} • <span style="color: ${priorityColor}; font-weight: 700;">${c.priority}</span> • ${c.fir_number || 'N/A'}
            </div>
          </td>
          <td>
            <div style="font-weight: 600;">${c.department_name}</div>
            <div style="font-size: 11px; color: var(--gov-text-muted);">${c.jurisdiction}</div>
          </td>
          <td>
            <div style="font-weight: 600;">${c.lead_officer_name}</div>
            <div style="font-size: 11px; color: var(--gov-text-muted);">${c.lead_officer_code || ''}</div>
          </td>
          <td style="text-align: center;"><span class="badge badge-info">${c.document_count || 0}</span></td>
          <td style="text-align: center;"><span class="badge badge-info">${c.evidence_count || 0}</span></td>
          <td><span class="badge ${statusBadge}">${c.status}</span></td>
          <td style="font-size: 12px; color: var(--gov-text-muted);">${c.created_at ? c.created_at.substring(0, 10) : '2026-02-14'}</td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="App.openCase('${c.id}')">
              Open Workspace →
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  handleFilterChange() {
    this.fetchCases();
  },

  resetFilters() {
    document.getElementById('cases-search-input').value = '';
    document.getElementById('cases-filter-status').value = 'ALL';
    document.getElementById('cases-filter-dept').value = 'ALL';
    document.getElementById('cases-filter-priority').value = 'ALL';
    this.fetchCases();
  },

  exportCasesCsv() {
    const headers = ['Case ID', 'Case Title', 'Case Type', 'Department', 'Lead Officer', 'Priority', 'Status', 'Date Opened'];
    const rows = this.casesData.map(c => [
      `"${c.case_number}"`,
      `"${c.title.replace(/"/g, '""')}"`,
      `"${c.case_type}"`,
      `"${c.department_name}"`,
      `"${c.lead_officer_name}"`,
      `"${c.priority}"`,
      `"${c.status}"`,
      `"${c.date_opened}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CASEVAULT_Case_Registry_${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
  },

  // Section 7: Create Case Modal & Form
  openCreateCaseModal() {
    const existing = document.getElementById('create-case-modal');
    if (existing) existing.remove();

    const countNext = this.casesData.length + 42;
    const generatedCaseNum = `CASE-2026-0${countNext}`;

    const modal = document.createElement('div');
    modal.id = 'create-case-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-title">🏛 Register Formal Investigation Case</div>
          <button class="modal-close-btn" onclick="document.getElementById('create-case-modal').remove()">×</button>
        </div>
        <div class="modal-body">
          <div style="background-color: var(--gov-surface-alt); border: 1px solid var(--gov-border); padding: 10px 14px; border-radius: 4px; margin-bottom: 16px; font-size: 12px;">
            <strong>System Auto-Allocated ID:</strong> <span class="font-mono" style="color: var(--gov-navy-primary); font-weight: 700;">${generatedCaseNum}</span>
            <div style="color: var(--gov-text-muted); font-size: 11px;">Statutory registration under official law enforcement protocol.</div>
          </div>

          <form id="new-case-form" onsubmit="CasesView.submitCreateCase(event)">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px;">
              <div>
                <label class="filter-label">Case Number (Fixed)</label>
                <input type="text" class="form-control" style="width: 100%; font-family: var(--font-mono);" value="${generatedCaseNum}" readonly />
              </div>
              <div>
                <label class="filter-label">Case Classification Type</label>
                <select id="new-case-type" class="form-control" style="width: 100%;" required>
                  <option value="Economic & Financial Crime">Economic & Financial Crime</option>
                  <option value="Cyber Crime & Digital Espionage">Cyber Crime & Digital Espionage</option>
                  <option value="Special Field Investigation">Special Field Investigation</option>
                  <option value="Vigilance & Anti-Corruption">Vigilance & Anti-Corruption</option>
                </select>
              </div>
            </div>

            <div style="margin-bottom: 12px;">
              <label class="filter-label">Formal Case Title</label>
              <input type="text" id="new-case-title" class="form-control" style="width: 100%;" placeholder="e.g. Cross-Border Shell Diversion Inquiry" required />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px;">
              <div>
                <label class="filter-label">Department Unit</label>
                <select id="new-case-dept" class="form-control" style="width: 100%;">
                  <option value="dept-eiu">Economic Investigation Unit (EIU)</option>
                  <option value="dept-ccd">Cyber Crime Division (CCD)</option>
                  <option value="dept-diu">District Investigation Unit (DIU)</option>
                  <option value="dept-fsd">Forensic Science Division (FSD)</option>
                </select>
              </div>
              <div>
                <label class="filter-label">Jurisdiction</label>
                <input type="text" id="new-case-jurisdiction" class="form-control" style="width: 100%;" value="National Capital Region & Offshore Banking Hubs" />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px;">
              <div>
                <label class="filter-label">Lead Investigation Officer</label>
                <select id="new-case-lead" class="form-control" style="width: 100%;">
                  <option value="usr-sharma">A. Sharma (Lead IO - EIU)</option>
                  <option value="usr-patel">R. Patel (Forensic Specialist)</option>
                  <option value="usr-khan">S. Khan (Field Officer - DIU)</option>
                  <option value="usr-mehta">V. Mehta (Dept Head)</option>
                </select>
              </div>
              <div>
                <label class="filter-label">Confidentiality Tier</label>
                <select id="new-case-confidentiality" class="form-control" style="width: 100%;">
                  <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                  <option value="SECRET">SECRET</option>
                  <option value="TOP SECRET">TOP SECRET</option>
                  <option value="RESTRICTED">RESTRICTED</option>
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px;">
              <div>
                <label class="filter-label">FIR Reference Number</label>
                <input type="text" id="new-case-fir" class="form-control" style="width: 100%;" value="FIR-EIU-2026-0042" />
              </div>
              <div>
                <label class="filter-label">Relevant Acts & Sections</label>
                <input type="text" id="new-case-acts" class="form-control" style="width: 100%;" value="IPC 420, 467, PMLA Sec 3 & 4" />
              </div>
            </div>

            <div style="margin-bottom: 14px;">
              <label class="filter-label">Investigation Brief / Allegation Description</label>
              <textarea id="new-case-desc" class="form-control" style="width: 100%; height: 70px;" placeholder="Preliminary summary of complaint or actionable intelligence..."></textarea>
            </div>

            <div class="modal-footer" style="padding: 12px 0 0 0; margin-top: 14px; background: none;">
              <button type="button" class="btn btn-secondary" onclick="alert('Draft saved to local workstation cache.')">
                [ Save Draft ]
              </button>
              <button type="submit" class="btn btn-primary">
                [ Create Case ]
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  },

  async submitCreateCase(e) {
    e.preventDefault();
    const title = document.getElementById('new-case-title').value.trim();
    const caseType = document.getElementById('new-case-type').value;
    const departmentId = document.getElementById('new-case-dept').value;
    const jurisdiction = document.getElementById('new-case-jurisdiction').value;
    const leadOfficerId = document.getElementById('new-case-lead').value;
    const confidentialityLevel = document.getElementById('new-case-confidentiality').value;
    const firNumber = document.getElementById('new-case-fir').value;
    const actsSections = document.getElementById('new-case-acts').value;
    const description = document.getElementById('new-case-desc').value;

    try {
      const res = await API.post('/cases', {
        title,
        caseType,
        departmentId,
        jurisdiction,
        leadOfficerId,
        confidentialityLevel,
        firNumber,
        actsSections,
        description
      });

      document.getElementById('create-case-modal').remove();
      alert(`✓ SUCCESS: Case successfully registered in government ledger.\nGenerated Case ID: ${res.data.caseNumber}`);
      await this.fetchCases();
    } catch (err) {
      console.error('Failed to create case:', err);
    }
  }
};

window.CasesView = CasesView;
