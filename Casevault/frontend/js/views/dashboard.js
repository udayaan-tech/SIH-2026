/**
 * CASEVAULT — Operations Dashboard View
 * Section 5: Official Statistics, Operational Overview, Urgent Actions, Recent Activity
 */
const DashboardView = {
  async render(container) {
    const officer = State.currentOfficer;
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const isHindi = State.language === 'HI';

    container.innerHTML = `
      <!-- Welcome Header Bar -->
      <div class="page-header-bar">
        <div class="page-title-group">
          <h1>${isHindi ? 'संचालन डैशबोर्ड' : 'Operations Dashboard'}</h1>
          <div class="page-subtitle">
            ${isHindi ? 'स्वागत है' : 'Welcome back'}, <strong>${officer.full_name}</strong> (${officer.designation})
          </div>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" onclick="App.navigate('security-center')">
            <span style="color: var(--gov-green); font-size: 14px;">●</span> System Status: SECURE
          </button>
          <button class="btn btn-primary btn-sm" onclick="App.navigate('cases')">
            + Manage Cases
          </button>
        </div>
      </div>

      <!-- Government Meta Strip -->
      <div style="background-color: #FFFFFF; border: 1px solid var(--gov-border); border-radius: var(--radius-sm); padding: 10px 16px; margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 20px; font-size: 12px; color: var(--gov-text-secondary);">
        <div><strong>Current Date:</strong> ${today}</div>
        <div><strong>Last Login:</strong> ${officer.last_login || 'Today, 13:42:15 IST'}</div>
        <div><strong>Department:</strong> ${officer.department_name || 'Economic Investigation Unit'}</div>
        <div><strong>Security Clearance:</strong> <span class="badge badge-confidential">TIER-1 RESTRICTED</span></div>
        <div><strong>Hardware MFA:</strong> <span style="color: var(--gov-green); font-weight: 700;">✓ ACTIVE</span></div>
      </div>

      <!-- 6 Clean Official Statistic Cards (Section 5) -->
      <div class="stat-cards-grid">
        <div class="stat-card stat-active" onclick="App.navigate('cases')" style="cursor: pointer;">
          <div class="stat-title">ACTIVE CASES</div>
          <div class="stat-value">128</div>
          <div class="stat-subtext"><span style="color: var(--gov-green);">↑ 4 new</span> registered this month</div>
        </div>

        <div class="stat-card" onclick="App.navigate('documents')" style="cursor: pointer;">
          <div class="stat-title">DOCUMENTS</div>
          <div class="stat-value">4,821</div>
          <div class="stat-subtext">SHA-256 Bitstream Verified</div>
        </div>

        <div class="stat-card" onclick="App.navigate('evidence')" style="cursor: pointer;">
          <div class="stat-title">EVIDENCE RECORDS</div>
          <div class="stat-value">936</div>
          <div class="stat-subtext">100% Chain-of-Custody logged</div>
        </div>

        <div class="stat-card stat-warning" onclick="App.navigate('documents')" style="cursor: pointer;">
          <div class="stat-title">PENDING REVIEWS</div>
          <div class="stat-value">17</div>
          <div class="stat-subtext"><span style="color: var(--gov-saffron);">⚠ Action required</span> for court filing</div>
        </div>

        <div class="stat-card" onclick="App.navigate('audit-trail')" style="cursor: pointer;">
          <div class="stat-title">AUDIT EVENTS</div>
          <div class="stat-value">12,481</div>
          <div class="stat-subtext">Immutable HMAC Checksummed</div>
        </div>

        <div class="stat-card stat-danger" onclick="App.navigate('security-center')" style="cursor: pointer;">
          <div class="stat-title">SECURITY ALERTS</div>
          <div class="stat-value">07</div>
          <div class="stat-subtext"><span style="color: var(--status-critical);">● Zero Breaches</span> • 7 Blocked</div>
        </div>
      </div>

      <!-- Main Operational Grid: Active Inquiries & Action Feeds -->
      <div style="display: grid; grid-template-columns: 2fr 1.1fr; gap: 20px;">
        
        <!-- Active High-Priority Inquiries -->
        <div class="gov-card">
          <div class="gov-card-header">
            <div class="gov-card-title">
              <span>📁</span> Priority Investigation Cases
            </div>
            <button class="btn btn-secondary btn-sm" onclick="App.navigate('cases')">
              View All Cases (10)
            </button>
          </div>
          <div class="table-responsive">
            <table class="gov-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Title</th>
                  <th>Department</th>
                  <th>Lead Officer</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="dashboard-cases-tbody">
                <tr><td colspan="6" style="text-align: center; padding: 20px;">Loading official cases ledger...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Pending Verifications & Urgent Action Center -->
        <div>
          <div class="gov-card" style="margin-bottom: 20px;">
            <div class="gov-card-header" style="background-color: var(--gov-saffron-light);">
              <div class="gov-card-title" style="color: #92400E;">
                <span>⚠</span> Pending Evidentiary Reviews
              </div>
            </div>
            <div class="gov-card-body" style="padding: 12px;">
              <div style="display: flex; flex-direction: column; gap: 10px;">
                <div style="background-color: #FFFFFF; border: 1px solid #FCD34D; border-left: 4px solid var(--gov-saffron); padding: 10px; border-radius: var(--radius-sm);">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <strong style="font-size: 13px;">ChargeSheet_v2.pdf</strong>
                    <span class="badge badge-review">UNDER REVIEW</span>
                  </div>
                  <div style="font-size: 11px; color: var(--gov-text-muted); margin: 3px 0;">
                    CASE-2026-041 • Uploaded by N. Singh (Legal Dept)
                  </div>
                  <div style="display: flex; gap: 6px; margin-top: 6px;">
                    <button class="btn btn-primary btn-sm" onclick="App.openDocViewer('doc-003')">Verify SHA-256</button>
                    <button class="btn btn-secondary btn-sm" onclick="App.openCase('case-041')">Open Case</button>
                  </div>
                </div>

                <div style="background-color: #FFFFFF; border: 1px solid var(--gov-border); border-left: 4px solid var(--gov-green); padding: 10px; border-radius: var(--radius-sm);">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <strong style="font-size: 13px;">Forensic_Report.pdf</strong>
                    <span class="badge badge-verified">VERIFIED</span>
                  </div>
                  <div style="font-size: 11px; color: var(--gov-text-muted); margin: 3px 0;">
                    CASE-2026-041 • Digital bitstream signature valid
                  </div>
                  <button class="btn btn-secondary btn-sm" style="margin-top: 6px;" onclick="App.openDocViewer('doc-002')">
                    Inspect Ledger
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick System Architecture & Zero-Trust Notice -->
          <div class="gov-card">
            <div class="gov-card-header">
              <div class="gov-card-title">
                <span>🛡</span> Security & Compliance UX
              </div>
            </div>
            <div class="gov-card-body" style="font-size: 12px; color: var(--gov-text-secondary); line-height: 1.6;">
              <p>Every sensitive action on CASEVAULT automatically triggers an immutable audit log with cryptographic SHA-256 checksums.</p>
              <div style="margin-top: 10px; border-top: 1px dashed var(--gov-border); padding-top: 8px;">
                <div>• Object-Level Authorization: <strong>Enforced</strong></div>
                <div>• API Rate Limiting: <strong>Active (Sliding Window)</strong></div>
                <div>• Cryptographic Hash: <strong>SHA-256 FIPS 180-4</strong></div>
              </div>
            </div>
          </div>

        </div>

      </div>
    `;

    // Fetch live cases from backend
    try {
      const res = await API.get('/cases', { status: 'ACTIVE' });
      const tbody = document.getElementById('dashboard-cases-tbody');
      if (tbody && res.data) {
        tbody.innerHTML = res.data.slice(0, 5).map(c => `
          <tr>
            <td><strong class="font-mono" style="color: var(--gov-navy-primary);">${c.case_number}</strong></td>
            <td>
              <div style="font-weight: 600;">${c.title}</div>
              <div style="font-size: 11px; color: var(--gov-text-muted);">${c.case_type}</div>
            </td>
            <td>${c.department_name}</td>
            <td>${c.lead_officer_name}</td>
            <td><span class="badge badge-active">${c.status}</span></td>
            <td>
              <button class="btn btn-secondary btn-sm" onclick="App.openCase('${c.id}')">
                Open Workspace →
              </button>
            </td>
          </tr>
        `).join('');
      }
    } catch (e) {
      console.error('Error fetching dashboard cases:', e);
    }
  }
};

window.DashboardView = DashboardView;
