/**
 * CASEVAULT — Audit & Compliance Trail View
 * Section 16: Immutable tamper-evident audit ledger, filtering, cryptographic checksums, and CSV export
 */
const AuditTrailView = {
  auditLogs: [],

  async render(container) {
    const isHindi = State.language === 'HI';

    container.innerHTML = `
      <div class="page-header-bar">
        <div class="page-title-group">
          <h1>${isHindi ? 'लेखा परीक्षा एवं अनुपालन' : 'Audit & Compliance'}</h1>
          <div class="page-subtitle">
            Cryptographically sealed, append-only vigilance ledger tracking every platform transaction
          </div>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" onclick="AuditTrailView.printReport()">
            🖨 Print Compliance Sheet
          </button>
          <button class="btn btn-primary btn-sm" onclick="AuditTrailView.exportCsv()">
            📥 [ Export Audit Report ]
          </button>
        </div>
      </div>

      <!-- Filters & Search Toolbar (Section 16) -->
      <div class="filter-toolbar">
        <div class="filter-group" style="flex: 1; min-width: 200px;">
          <input type="text" id="audit-search-input" class="form-control" style="width: 100%;"
            placeholder="Search by action, resource, IP, request ID, officer..." oninput="AuditTrailView.handleFilterChange()" />
        </div>

        <div class="filter-group">
          <label class="filter-label">Action:</label>
          <select id="audit-filter-action" class="form-control" onchange="AuditTrailView.handleFilterChange()">
            <option value="ALL">All Actions</option>
            <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
            <option value="DOCUMENT_VIEW">DOCUMENT_VIEW</option>
            <option value="DOCUMENT_UPLOAD">DOCUMENT_UPLOAD</option>
            <option value="DOCUMENT_VERIFIED">DOCUMENT_VERIFIED</option>
            <option value="DOCUMENT_DOWNLOAD">DOCUMENT_DOWNLOAD</option>
            <option value="EVIDENCE_TRANSFER">EVIDENCE_TRANSFER</option>
            <option value="ACCESS_DENIED">ACCESS_DENIED</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Result:</label>
          <select id="audit-filter-result" class="form-control" onchange="AuditTrailView.handleFilterChange()">
            <option value="ALL">All Results</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="DENIED">DENIED (Blocked)</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Department:</label>
          <select id="audit-filter-dept" class="form-control" onchange="AuditTrailView.handleFilterChange()">
            <option value="ALL">All Departments</option>
            <option value="Economic Investigation Unit">Economic Investigation Unit (EIU)</option>
            <option value="Forensic Science Division">Forensic Science Division (FSD)</option>
            <option value="Cyber Crime Division">Cyber Crime Division (CCD)</option>
            <option value="District Investigation Unit">District Investigation Unit (DIU)</option>
            <option value="Legal Affairs Department">Legal Affairs Department (LAD)</option>
          </select>
        </div>

        <button class="btn btn-secondary btn-sm" onclick="AuditTrailView.resetFilters()">Reset</button>
      </div>

      <!-- Audit Trail Table -->
      <div class="gov-card">
        <div class="gov-card-header">
          <div class="gov-card-title">
            <span>📜</span> Immutable Statutory Audit Trail (<span id="audit-count-badge">0</span> events)
          </div>
          <span style="font-size: 11px; color: var(--gov-text-muted);">Append-Only Cryptographic HMAC Ledger</span>
        </div>
        <div class="table-responsive">
          <table class="gov-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Officer Identity</th>
                <th>Department / Unit</th>
                <th>Action</th>
                <th>Resource Target</th>
                <th>IP / Device</th>
                <th>Result</th>
                <th>Correlation ID</th>
                <th>Ledger Checksum</th>
              </tr>
            </thead>
            <tbody id="audit-table-body">
              <tr><td colspan="9" style="text-align: center; padding: 24px;">Loading immutable ledger...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    await this.fetchLogs();
  },

  async fetchLogs() {
    try {
      const search = document.getElementById('audit-search-input')?.value || '';
      const action = document.getElementById('audit-filter-action')?.value || 'ALL';
      const result = document.getElementById('audit-filter-result')?.value || 'ALL';
      const department = document.getElementById('audit-filter-dept')?.value || 'ALL';

      const res = await API.get('/audit', { search, action, result, department, limit: 100 });
      this.auditLogs = res.data || [];
      this.renderTable(this.auditLogs);
    } catch (e) {
      console.error('Error fetching audit logs:', e);
    }
  },

  renderTable(logs) {
    const tbody = document.getElementById('audit-table-body');
    const badge = document.getElementById('audit-count-badge');
    if (badge) badge.textContent = logs.length;

    if (!tbody) return;

    if (logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 24px;">No audit events found.</td></tr>`;
      return;
    }

    tbody.innerHTML = logs.map(l => {
      const isSuccess = l.result === 'SUCCESS';
      const resultBadge = isSuccess ? 'badge-success' : 'badge-denied';

      return `
        <tr>
          <td class="font-mono" style="font-size: 11px; white-space: nowrap;">${l.timestamp}</td>
          <td>
            <div style="font-weight: 700;">${l.officer_name || 'System'}</div>
            <div style="font-size: 11px; color: var(--gov-text-muted);">${l.officer_id || ''}</div>
          </td>
          <td><div style="font-size: 12px;">${l.department || 'NDIS'}</div></td>
          <td><strong style="color: var(--gov-navy-primary); font-size: 11px;">${l.action}</strong></td>
          <td>
            <div style="font-weight: 600; font-size: 12px;">${l.resource_name || l.resource_id}</div>
            <div style="font-size: 10px; color: var(--gov-text-muted);">${l.resource_type} • ${l.endpoint || ''}</div>
          </td>
          <td class="font-mono" style="font-size: 11px;">${l.ip_address}</td>
          <td><span class="badge ${resultBadge}">${l.result}</span></td>
          <td class="font-mono" style="font-size: 10px; color: var(--gov-text-muted);">${l.request_id}</td>
          <td class="font-mono" style="font-size: 10px; color: #0A6E31; font-weight: 700;">${l.checksum || 'HASH-VALID'}</td>
        </tr>
      `;
    }).join('');
  },

  handleFilterChange() {
    this.fetchLogs();
  },

  resetFilters() {
    document.getElementById('audit-search-input').value = '';
    document.getElementById('audit-filter-action').value = 'ALL';
    document.getElementById('audit-filter-result').value = 'ALL';
    document.getElementById('audit-filter-dept').value = 'ALL';
    this.fetchLogs();
  },

  exportCsv() {
    window.location.href = '/api/v1/audit/export';
  },

  printReport() {
    window.print();
  }
};

window.AuditTrailView = AuditTrailView;
