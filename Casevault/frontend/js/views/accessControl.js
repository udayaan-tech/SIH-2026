/**
 * CASEVAULT — Role-Based Access Control (RBAC) View
 * Section 15 & 34.2: Government-Grade RBAC Permissions Matrix, Role Delegation, and 403 Demonstration
 */
const AccessControlView = {
  render(container) {
    const isHindi = State.language === 'HI';
    const officer = State.currentOfficer;

    container.innerHTML = `
      <div class="page-header-bar">
        <div class="page-title-group">
          <h1>${isHindi ? 'भूमिका-आधारित पहुंच नियंत्रण (RBAC)' : 'Role-Based Access Control (RBAC)'}</h1>
          <div class="page-subtitle">
            Zero-Trust statutory permissions matrix, jurisdictional boundaries, and separation of duties
          </div>
        </div>
        <div class="page-actions">
          <button class="btn btn-danger btn-sm" onclick="AccessControlView.simulateUnauthorizedAccess()">
            🛡 Test Unauthorized Action (403 Demo)
          </button>
        </div>
      </div>

      <!-- Active Officer Clearance & Live Persona Switcher -->
      <div class="gov-card" style="background-color: #FFFFFF; border-left: 4px solid var(--gov-navy-primary);">
        <div class="gov-card-body" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
          <div>
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--gov-text-muted);">
              Current Active Session Credentials
            </div>
            <div style="font-size: 16px; font-weight: 800; color: var(--gov-navy-dark); margin-top: 2px;">
              ${officer.full_name} (${officer.officer_id})
            </div>
            <div style="font-size: 12px; color: var(--gov-text-secondary);">
              <strong>Role:</strong> ${officer.role_name} • <strong>Designation:</strong> ${officer.designation} • <strong>Jurisdiction:</strong> ${officer.department_name}
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 10px;">
            <label class="filter-label" style="margin-bottom: 0;">Switch Demo Persona:</label>
            <select id="rbac-officer-switcher" class="form-control" onchange="App.switchToOfficer(this.value)">
              <option value="NDIS-IO-4102" ${officer.officer_id === 'NDIS-IO-4102' ? 'selected' : ''}>A. Sharma (Lead Investigation Officer)</option>
              <option value="NDIS-FO-8819" ${officer.officer_id === 'NDIS-FO-8819' ? 'selected' : ''}>R. Patel (Senior Forensic Specialist)</option>
              <option value="NDIS-LO-3301" ${officer.officer_id === 'NDIS-LO-3301' ? 'selected' : ''}>N. Singh (Legal & Prosecution Officer)</option>
              <option value="NDIS-AUD-9904" ${officer.officer_id === 'NDIS-AUD-9904' ? 'selected' : ''}>K. Iyer (Auditor - READ ONLY)</option>
              <option value="NDIS-DH-1002" ${officer.officer_id === 'NDIS-DH-1002' ? 'selected' : ''}>V. Mehta (Joint Director / Dept Head)</option>
              <option value="NDIS-ADM-0001" ${officer.officer_id === 'NDIS-ADM-0001' ? 'selected' : ''}>S. Rajan (Systems Administrator)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Statutory Role Definitions & Access Policies (Section 15) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px;">
        
        <div class="gov-card" style="margin-bottom: 0;">
          <div class="gov-card-header">
            <div class="gov-card-title">Investigation Officer</div>
            <span class="badge badge-active">FULL CASE ACCESS</span>
          </div>
          <div class="gov-card-body" style="font-size: 12px; color: var(--gov-text-secondary); line-height: 1.6;">
            <strong>Example:</strong> A. Sharma (EIU)<br />
            Authorized to register cases, upload primary evidence, record depositions, and request cross-department transfers.
          </div>
        </div>

        <div class="gov-card" style="margin-bottom: 0;">
          <div class="gov-card-header">
            <div class="gov-card-title">Forensic Officer</div>
            <span class="badge badge-info">EVIDENCE + FORENSIC</span>
          </div>
          <div class="gov-card-body" style="font-size: 12px; color: var(--gov-text-secondary); line-height: 1.6;">
            <strong>Example:</strong> R. Patel (FSD)<br />
            Authorized to inspect bitstream images, calculate SHA-256 hashes, certify digital evidence, and custody locker operations.
          </div>
        </div>

        <div class="gov-card" style="margin-bottom: 0;">
          <div class="gov-card-header">
            <div class="gov-card-title">Legal Officer</div>
            <span class="badge badge-secret">LEGAL DOCUMENTS</span>
          </div>
          <div class="gov-card-body" style="font-size: 12px; color: var(--gov-text-secondary); line-height: 1.6;">
            <strong>Example:</strong> N. Singh (LAD)<br />
            Authorized to prepare court complaints, review charge sheets, examine statutory adherence, and judicial submissions.
          </div>
        </div>

        <div class="gov-card" style="margin-bottom: 0;">
          <div class="gov-card-header">
            <div class="gov-card-title">Statutory Auditor</div>
            <span class="badge badge-review">READ ONLY</span>
          </div>
          <div class="gov-card-body" style="font-size: 12px; color: var(--gov-text-secondary); line-height: 1.6;">
            <strong>Example:</strong> K. Iyer (Vigilance)<br />
            Restricted to read-only oversight and audit inspection. All upload, edit, download, and delete operations are rejected.
          </div>
        </div>

      </div>

      <!-- Complete Statutory Permissions Matrix Table -->
      <div class="gov-card">
        <div class="gov-card-header">
          <div class="gov-card-title">
            <span>🛡</span> Institutional Statutory Permissions Matrix
          </div>
        </div>
        <div class="table-responsive">
          <table class="gov-table">
            <thead>
              <tr>
                <th>Statutory Role</th>
                <th style="text-align: center;">VIEW</th>
                <th style="text-align: center;">UPLOAD</th>
                <th style="text-align: center;">DOWNLOAD</th>
                <th style="text-align: center;">EDIT</th>
                <th style="text-align: center;">SHARE</th>
                <th style="text-align: center;">VERIFY</th>
                <th style="text-align: center;">AUDIT</th>
                <th style="text-align: center;">TRANSFER</th>
                <th style="text-align: center;">CREATE CASE</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Administrator</strong></td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
              </tr>
              <tr>
                <td><strong>Department Head</strong></td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
              </tr>
              <tr>
                <td><strong>Investigation Officer</strong></td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: #CBD5E1;">—</td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
              </tr>
              <tr>
                <td><strong>Forensic Officer</strong></td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: #CBD5E1;">—</td>
                <td style="text-align: center; color: #CBD5E1;">—</td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: #CBD5E1;">—</td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: #CBD5E1;">—</td>
              </tr>
              <tr>
                <td><strong>Legal Officer</strong></td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: #CBD5E1;">—</td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: #CBD5E1;">—</td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: #CBD5E1;">—</td>
                <td style="text-align: center; color: #CBD5E1;">—</td>
                <td style="text-align: center; color: #CBD5E1;">—</td>
              </tr>
              <tr style="background-color: #FFFDF0;">
                <td><strong>Auditor (Read-Only)</strong></td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: var(--status-critical); font-weight: 700;">✗</td>
                <td style="text-align: center; color: var(--status-critical); font-weight: 700;">✗</td>
                <td style="text-align: center; color: var(--status-critical); font-weight: 700;">✗</td>
                <td style="text-align: center; color: var(--status-critical); font-weight: 700;">✗</td>
                <td style="text-align: center; color: var(--status-critical); font-weight: 700;">✗</td>
                <td style="text-align: center; color: var(--gov-green);">✓</td>
                <td style="text-align: center; color: var(--status-critical); font-weight: 700;">✗</td>
                <td style="text-align: center; color: var(--status-critical); font-weight: 700;">✗</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // Demonstrate 403 Forbidden Access Denied (Section 15, 31 & 34.2)
  async simulateUnauthorizedAccess() {
    // Switch to Auditor or invoke download endpoint without download clearance
    try {
      const officerId = 'NDIS-AUD-9904'; // Auditor (Read-Only)
      const token = `TOKEN-${officerId}-${Date.now()}`;

      // Call protected download endpoint with Auditor token
      const res = await fetch('/api/v1/documents/doc-001/download', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Officer-ID': officerId
        }
      });

      if (res.status === 403) {
        const data = await res.json();
        API.showSecurityDeniedModal(data.error || {
          message: 'ACCESS DENIED: Officer NDIS-AUD-9904 (Auditor) is restricted to read-only clearance. Decryption download rejected.'
        });
      }
    } catch (e) {
      console.error(e);
    }
  }
};

window.AccessControlView = AccessControlView;
