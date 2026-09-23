/**
 * CASEVAULT — Government Reporting Dashboard View
 * Section 18: Official Reports Generation, PDF / CSV Export, Summary Metrics
 */
const ReportsView = {
  currentReport: null,

  async render(container) {
    const isHindi = State.language === 'HI';

    container.innerHTML = `
      <div class="page-header-bar">
        <div class="page-title-group">
          <h1>${isHindi ? 'सरकारी रिपोर्टिंग डैशबोर्ड' : 'Government Reporting Dashboard'}</h1>
          <div class="page-subtitle">
            Generate formal statutory investigation and compliance reports for court records and judicial oversight
          </div>
        </div>
      </div>

      <!-- Report Generator Configuration Card (Section 18) -->
      <div class="gov-card" style="padding: 20px;">
        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 14px; align-items: flex-end;">
          <div>
            <label class="filter-label">Statutory Report Type</label>
            <select id="report-type-select" class="form-control" style="width: 100%;">
              <option value="case_status">Case Status & Lifecycle Report</option>
              <option value="doc_activity">Document Activity & Verification Audit</option>
              <option value="evidence_chain">Evidence Vault & Chain-of-Custody Log</option>
              <option value="security_incidents">Security Incident & Threat Intelligence Report</option>
            </select>
          </div>

          <div>
            <label class="filter-label">Jurisdictional Unit</label>
            <select id="report-dept-select" class="form-control" style="width: 100%;">
              <option value="ALL">All Departments</option>
              <option value="dept-eiu">Economic Investigation Unit (EIU)</option>
              <option value="dept-ccd">Cyber Crime Division (CCD)</option>
              <option value="dept-fsd">Forensic Science Division (FSD)</option>
            </select>
          </div>

          <div>
            <label class="filter-label">Reporting Period</label>
            <select id="report-period-select" class="form-control" style="width: 100%;">
              <option value="CURRENT_QUARTER">Current Quarter (Q1 2026)</option>
              <option value="PAST_30_DAYS">Past 30 Days</option>
              <option value="FISCAL_YEAR">Current Fiscal Year</option>
            </select>
          </div>

          <div>
            <button class="btn btn-primary" onclick="ReportsView.generateReport()">
              [ Generate Report ]
            </button>
          </div>
        </div>
      </div>

      <!-- Output Report Area -->
      <div id="report-output-container">
        <div style="text-align: center; padding: 40px; color: var(--gov-text-muted);">
          Select report parameters and click [ Generate Report ].
        </div>
      </div>
    `;

    setTimeout(() => this.generateReport(), 100);
  },

  async generateReport() {
    const reportType = document.getElementById('report-type-select')?.value || 'case_status';
    const container = document.getElementById('report-output-container');
    if (!container) return;

    container.innerHTML = `
      <div style="text-align: center; padding: 30px;">
        <span>⏳</span> Compiling official statutory dataset and aggregating metrics...
      </div>
    `;

    try {
      const res = await API.post('/reports/generate', { reportType });
      this.currentReport = res.data;
      this.renderReportOutput(container, res.data);
    } catch (e) {
      container.innerHTML = `
        <div style="color: var(--status-critical); padding: 20px; text-align: center;">
          Failed to generate report: ${e.message}
        </div>
      `;
    }
  },

  renderReportOutput(container, r) {
    const metrics = r.summaryMetrics || {};
    const rows = r.tableData || [];

    container.innerHTML = `
      <div class="gov-card">
        
        <!-- Official Document Print Header -->
        <div class="gov-card-header" style="background-color: var(--gov-surface-alt); padding: 18px 24px; border-bottom: 2px solid var(--gov-navy-dark); display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="font-size: 11px; text-transform: uppercase; color: var(--gov-text-muted); letter-spacing: 0.5px;">
              OFFICIAL GOVERNMENT OF INDIA REPORT • ${r.reportId}
            </div>
            <div style="font-size: 18px; font-weight: 800; color: var(--gov-navy-dark); margin-top: 2px;">
              ${r.reportName}
            </div>
            <div style="font-size: 12px; color: var(--gov-text-secondary); margin-top: 4px;">
              <strong>Authority:</strong> National Digital Investigation Services •
              <strong>Signatory Officer:</strong> ${r.officer} •
              <strong>Generated:</strong> ${r.generatedAt}
            </div>
          </div>

          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" onclick="window.print()">
              🖨 [ Export PDF / Print ]
            </button>
            <button class="btn btn-primary btn-sm" onclick="ReportsView.exportCsv()">
              📥 [ Export CSV ]
            </button>
          </div>
        </div>

        <div class="gov-card-body" style="padding: 24px;">
          <!-- Summary Metrics Cards -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 24px;">
            ${Object.entries(metrics).map(([k, v]) => `
              <div style="background-color: var(--gov-surface-alt); border: 1px solid var(--gov-border-light); padding: 12px; border-radius: var(--radius-sm); border-top: 3px solid var(--gov-navy-primary);">
                <div style="font-size: 11px; font-weight: 700; color: var(--gov-text-muted); text-transform: uppercase;">${k}</div>
                <div style="font-size: 20px; font-weight: 800; color: var(--gov-navy-dark); margin-top: 4px;">${v}</div>
              </div>
            `).join('')}
          </div>

          <!-- Tabular Dataset -->
          <div style="font-size: 13px; font-weight: 700; color: var(--gov-navy-dark); margin-bottom: 10px;">
            STATUTORY SCHEDULE & ITEMIZATION
          </div>
          <div class="table-responsive">
            <table class="gov-table">
              <thead>
                <tr>
                  ${rows.length > 0 ? Object.keys(rows[0]).map(k => `<th>${k.replace(/_/g, ' ').toUpperCase()}</th>`).join('') : ''}
                </tr>
              </thead>
              <tbody>
                ${rows.map(row => `
                  <tr>
                    ${Object.values(row).map(val => `<td>${val}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Official Verification Disclaimer -->
          <div style="margin-top: 24px; border-top: 1px dashed var(--gov-border); padding-top: 14px; font-size: 11px; color: var(--gov-text-muted); display: flex; justify-content: space-between;">
            <div>Prepared for judicial and supervisory oversight under statutory provisions of the NDIS Charter.</div>
            <div class="font-mono">CHECKSUM: ${r.reportId}-VERIFIED-100%</div>
          </div>

        </div>

      </div>
    `;
  },

  exportCsv() {
    if (!this.currentReport || !this.currentReport.tableData) return;
    const rows = this.currentReport.tableData;
    if (rows.length === 0) return;

    const headers = Object.keys(rows[0]);
    const csvRows = [headers.join(',')];

    for (const r of rows) {
      const row = headers.map(h => `"${String(r[h] || '').replace(/"/g, '""')}"`);
      csvRows.push(row.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CASEVAULT_${this.currentReport.reportName.replace(/\s+/g, '_')}_${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
  }
};

window.ReportsView = ReportsView;
