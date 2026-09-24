/**
 * CASEVAULT — User & Badge Management View
 * Administrative view for managing officer accounts and access controls.
 */
const AdminUsersView = {
  render(container) {
    container.innerHTML = `
      <div class="page-header-bar">
        <div class="page-title-group">
          <h1>User & Badge Management</h1>
          <div class="page-subtitle">Manage officer accounts, PKI badges, and access levels</div>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary btn-sm" onclick="AdminUsersView.showCreateModal()">
            + Create New User
          </button>
        </div>
      </div>

      <div class="gov-card" style="margin-bottom: 20px;">
        <div class="gov-card-header">
          <div class="gov-card-title">Registered Personnel</div>
          <div style="display: flex; gap: 10px;">
            <input type="text" class="form-control" placeholder="Search by name, ID, or rank..." style="width: 250px; font-size: 13px;" />
            <select class="form-control" style="font-size: 13px;">
              <option>All Jurisdictions</option>
              <option>Delhi Police HQ</option>
              <option>CBI HQ</option>
              <option>FSL Rohini</option>
            </select>
          </div>
        </div>
        
        <table class="data-table" style="width: 100%; font-size: 13px;">
          <thead>
            <tr>
              <th>Officer ID / Badge</th>
              <th>Full Name & Rank</th>
              <th>Jurisdiction</th>
              <th>Role Level</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="font-mono">NDIS-IO-4102</td>
              <td><strong>Rajesh Sharma</strong><br><span style="color: var(--gov-text-muted); font-size: 11px;">Sub-Inspector</span></td>
              <td>Delhi Police (Central)</td>
              <td>Investigating Officer (L2)</td>
              <td><span class="badge badge-verified">Active</span></td>
              <td><button class="btn btn-secondary btn-sm">Edit</button> <button class="btn btn-sm" style="color: red; border-color: red;">Revoke</button></td>
            </tr>
            <tr>
              <td class="font-mono">NDIS-FSL-88</td>
              <td><strong>Dr. Meera Verma</strong><br><span style="color: var(--gov-text-muted); font-size: 11px;">Senior Forensic Analyst</span></td>
              <td>FSL Rohini</td>
              <td>Forensic Analyst (L3)</td>
              <td><span class="badge badge-verified">Active</span></td>
              <td><button class="btn btn-secondary btn-sm">Edit</button> <button class="btn btn-sm" style="color: red; border-color: red;">Revoke</button></td>
            </tr>
            <tr>
              <td class="font-mono">NDIS-PP-105</td>
              <td><strong>Arjun Reddy</strong><br><span style="color: var(--gov-text-muted); font-size: 11px;">Public Prosecutor</span></td>
              <td>Delhi High Court</td>
              <td>Prosecutor (L4)</td>
              <td><span class="badge badge-verified">Active</span></td>
              <td><button class="btn btn-secondary btn-sm">Edit</button> <button class="btn btn-sm" style="color: red; border-color: red;">Revoke</button></td>
            </tr>
            <tr>
              <td class="font-mono">NDIS-CBI-04</td>
              <td><strong>Vikram Singh</strong><br><span style="color: var(--gov-text-muted); font-size: 11px;">Joint Director</span></td>
              <td>CBI HQ</td>
              <td>Supervisory (L5)</td>
              <td><span class="badge badge-verified">Active</span></td>
              <td><button class="btn btn-secondary btn-sm">Edit</button> <button class="btn btn-sm" style="color: red; border-color: red;">Revoke</button></td>
            </tr>
            <tr style="opacity: 0.6; background-color: #F8FAFC;">
              <td class="font-mono">NDIS-IO-3392</td>
              <td><strong>Karan Patel</strong><br><span style="color: var(--gov-text-muted); font-size: 11px;">Constable</span></td>
              <td>Delhi Police (East)</td>
              <td>Patrol (L1)</td>
              <td><span class="badge" style="background-color: #E2E8F0; color: #64748B;">Suspended</span></td>
              <td><button class="btn btn-secondary btn-sm">Re-issue</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Create User Modal Placeholder -->
      <div id="create-user-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center;">
        <div class="gov-card" style="width: 500px; background: #fff;">
          <div class="gov-card-header" style="display: flex; justify-content: space-between;">
            <div class="gov-card-title">Provision New Officer</div>
            <button style="background:none; border:none; cursor:pointer;" onclick="document.getElementById('create-user-modal').style.display='none'">✕</button>
          </div>
          <div class="gov-card-body">
            <div style="margin-bottom: 12px;">
              <label class="filter-label">Full Name</label>
              <input type="text" class="form-control" />
            </div>
            <div style="margin-bottom: 12px;">
              <label class="filter-label">Rank / Designation</label>
              <input type="text" class="form-control" />
            </div>
            <div style="margin-bottom: 12px;">
              <label class="filter-label">Jurisdiction</label>
              <input type="text" class="form-control" />
            </div>
            <div style="margin-bottom: 12px;">
              <label class="filter-label">Access Level</label>
              <select class="form-control">
                <option>L1 - View Public/Unclassified</option>
                <option>L2 - Investigating Officer (Upload/Edit)</option>
                <option>L3 - Forensic Analyst</option>
                <option>L4 - Prosecutor</option>
                <option>L5 - Supervisor/Judge</option>
              </select>
            </div>
            <div style="margin-bottom: 24px;">
              <label class="filter-label">Biometric Auth Registration</label>
              <div style="padding: 12px; background: #E2E8F0; border-radius: 4px; text-align: center; color: var(--gov-text-muted); font-size: 13px;">
                Connect NDIS Fingerprint Scanner to provision PKI token.
              </div>
            </div>
            <div style="text-align: right;">
              <button class="btn btn-secondary" onclick="document.getElementById('create-user-modal').style.display='none'">Cancel</button>
              <button class="btn btn-primary" onclick="alert('User provisioned. PKI Token Generated.'); document.getElementById('create-user-modal').style.display='none'">Provision Badge</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  showCreateModal() {
    const modal = document.getElementById('create-user-modal');
    if (modal) {
      modal.style.display = 'flex';
    }
  }
};

window.AdminUsersView = AdminUsersView;
