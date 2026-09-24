/**
 * CASEVAULT — Digital Evidence Vault & Chain of Custody View
 * Section 12: Digital Evidence Vault, Exhibit Registration, and 5-stage Chain of Custody Flow
 */
const EvidenceView = {
  evidenceList: [],
  selectedEvidence: null,

  async render(container) {
    const isHindi = State.language === 'HI';

    container.innerHTML = `
      <div class="page-header-bar">
        <div class="page-title-group">
          <h1>${isHindi ? 'डिजिटल साक्ष्य तिजोरी' : 'Digital Evidence Vault'}</h1>
          <div class="page-subtitle">
            Forensic exhibit depository and immutable statutory Chain of Custody tracking
          </div>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary btn-sm" onclick="EvidenceView.openRegisterModal()">
            + Register Evidence Exhibit
          </button>
        </div>
      </div>

      <!-- Evidence Filters -->
      <div class="filter-toolbar">
        <div class="filter-group" style="flex: 1; min-width: 220px;">
          <input type="text" id="ev-search-input" class="form-control" style="width: 100%;"
            placeholder="Search by exhibit number, title, barcode..." oninput="EvidenceView.handleFilterChange()" />
        </div>

        <div class="filter-group">
          <label class="filter-label">Exhibit Type:</label>
          <select id="ev-filter-type" class="form-control" onchange="EvidenceView.handleFilterChange()">
            <option value="ALL">All Types</option>
            <option value="Digital Storage Media">Digital Storage Media</option>
            <option value="Encrypted Digital Media">Encrypted Digital Media</option>
            <option value="Network Telemetry & Memory Dump">Network Telemetry & Memory Dump</option>
            <option value="Mobile Device">Mobile Device</option>
            <option value="Physical Document & Seal">Physical Document & Seal</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Case:</label>
          <select id="ev-filter-case" class="form-control" onchange="EvidenceView.handleFilterChange()">
            <option value="ALL">All Cases</option>
            <option value="case-041">CASE-2026-041 (Apex FinCorp)</option>
            <option value="case-038">CASE-2026-038 (Power Grid SCADA)</option>
            <option value="case-031">CASE-2026-031 (Auditor Disappearance)</option>
          </select>
        </div>

        <button class="btn btn-secondary btn-sm" onclick="EvidenceView.resetFilters()">Reset</button>
      </div>

      <!-- Evidence Vault Table -->
      <div class="gov-card">
        <div class="gov-card-header">
          <div class="gov-card-title">
            <span>🔐</span> Seized Exhibits in Vault (<span id="ev-count-badge">0</span>)
          </div>
        </div>
        <div class="table-responsive">
          <table class="gov-table">
            <thead>
              <tr>
                <th>Evidence ID</th>
                <th>Case ID</th>
                <th>Evidence Title</th>
                <th>Type</th>
                <th>Collected By</th>
                <th>Collection Date</th>
                <th>Current Custodian</th>
                <th>Integrity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="ev-table-body">
              <tr><td colspan="9" style="text-align: center; padding: 24px;">Loading evidence records...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Evidence Detail & Chain of Custody Workspace (Section 12) -->
      <div id="evidence-detail-pane" style="margin-top: 24px;"></div>
    `;

    await this.fetchEvidence();
  },

  async fetchEvidence() {
    try {
      const search = document.getElementById('ev-search-input')?.value || '';
      const evidenceType = document.getElementById('ev-filter-type')?.value || 'ALL';
      const caseId = document.getElementById('ev-filter-case')?.value || 'ALL';

      const res = await API.get('/evidence', { search, evidenceType, caseId });
      this.evidenceList = res.data || [];
      this.renderTable(this.evidenceList);

      // Default select the first item (ev-001) for chain of custody display
      const targetId = State.selectedEvidenceId || 'ev-001';
      this.loadEvidenceDetail(targetId);
    } catch (e) {
      console.error('Error fetching evidence:', e);
    }
  },

  renderTable(items) {
    const tbody = document.getElementById('ev-table-body');
    const badge = document.getElementById('ev-count-badge');
    if (badge) badge.textContent = items.length;

    if (!tbody) return;

    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 24px;">No evidence exhibits found.</td></tr>`;
      return;
    }

    tbody.innerHTML = items.map(ev => `
      <tr style="${this.selectedEvidence && this.selectedEvidence.id === ev.id ? 'background-color: #EEF4FC;' : ''}">
        <td><strong class="font-mono" style="color: var(--gov-navy-primary);">${ev.evidence_number}</strong></td>
        <td><strong class="font-mono">${ev.case_number || ev.case_id}</strong></td>
        <td>
          <div style="font-weight: 700;">${ev.title}</div>
          <div style="font-size: 11px; color: var(--gov-text-muted);">${ev.storage_location} • Barcode: ${ev.serial_barcode || 'N/A'}</div>
        </td>
        <td><span class="badge badge-info">${ev.evidence_type}</span></td>
        <td>${ev.collector_name || 'Officer A. Sharma'}</td>
        <td style="font-size: 12px;">${ev.collection_date}</td>
        <td>
          <div style="font-weight: 600; color: var(--gov-navy-dark);">${ev.custodian_name || 'Assigned Officer'}</div>
          <div style="font-size: 10px; color: var(--gov-text-muted);">${ev.custodian_department || ''}</div>
        </td>
        <td><span class="badge badge-verified">${ev.integrity_status}</span></td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm" onclick="EvidenceView.loadEvidenceDetail('${ev.id}')">
              Chain of Custody
            </button>
            <button class="btn btn-primary btn-sm" onclick="EvidenceView.openTransferModal('${ev.id}')">
              Transfer
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  handleFilterChange() {
    this.fetchEvidence();
  },

  resetFilters() {
    document.getElementById('ev-search-input').value = '';
    document.getElementById('ev-filter-type').value = 'ALL';
    document.getElementById('ev-filter-case').value = 'ALL';
    this.fetchEvidence();
  },

  async loadEvidenceDetail(evId) {
    try {
      const res = await API.get(`/evidence/${evId}`);
      this.selectedEvidence = res.data;
      State.selectedEvidenceId = evId;
      this.renderDetailPane(res.data);
    } catch (e) {
      console.error('Error loading evidence detail:', e);
    }
  },

  renderDetailPane(ev) {
    const pane = document.getElementById('evidence-detail-pane');
    if (!pane) return;

    const chain = ev.chainOfCustody || [];

    pane.innerHTML = `
      <div class="gov-card">
        <div class="gov-card-header" style="background-color: var(--gov-navy-dark); color: #FFFFFF;">
          <div class="gov-card-title" style="color: #FFFFFF;">
            <span>⛓</span> Chain of Custody & Exhibit Ledger — ${ev.evidence_number}
          </div>
          <button class="btn btn-saffron btn-sm" onclick="EvidenceView.openTransferModal('${ev.id}')">
            + Transfer Custody to Officer
          </button>
        </div>
        <div class="gov-card-body">
          
          <!-- Exhibit Metadata Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; background: var(--gov-surface-alt); padding: 14px; border: 1px solid var(--gov-border-light); margin-bottom: 20px;">
            <div>
              <div class="info-label">Exhibit Title</div>
              <div style="font-weight: 700; font-size: 13px;">${ev.title}</div>
            </div>
            <div>
              <div class="info-label">Seizure Location</div>
              <div style="font-size: 12px;">${ev.collection_location}</div>
            </div>
            <div>
              <div class="info-label">Vault Storage Safe</div>
              <div style="font-size: 12px; font-weight: 600;">${ev.storage_location}</div>
            </div>
            <div>
              <div class="info-label">Current Custodian</div>
              <div style="font-size: 12px; font-weight: 700; color: var(--gov-navy-primary);">${ev.custodian_name || 'Officer'}</div>
            </div>
            <div style="grid-column: 1 / -1;">
              <div class="info-label">Cryptographic SHA-256 Bitstream Hash</div>
              <div class="hash-display-box">${ev.sha256_hash}</div>
            </div>
          </div>

          <!-- Section 12: Official CHAIN OF CUSTODY Flowchart -->
          <div style="margin: 20px 0;">
            <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: var(--gov-navy-dark); margin-bottom: 8px;">
              STATUTORY CHAIN OF CUSTODY (COLLECTED → TRANSFERRED → RECEIVED → EXAMINED → STORED)
            </div>

            <div class="coc-pipeline">
              ${chain.map((c, idx) => `
                <div class="coc-node ${idx === chain.length - 1 ? 'active' : ''}">
                  <div class="coc-node-action">${c.action_type}</div>
                  <div class="coc-node-officer">Officer: ${c.to_officer_name || c.from_officer_name || 'A. Sharma'}</div>
                  <div style="font-size: 10px; color: var(--gov-navy-light); font-weight: 600;">${c.to_department || 'EIU'}</div>
                  <div class="coc-node-date">${c.timestamp || '2026-02-15'}</div>
                  <div style="font-size: 9px; color: var(--gov-text-muted); margin-top: 4px; font-family: var(--font-mono);">
                    SIG: ${c.digital_signature ? c.digital_signature.substring(0, 16) : 'NDIS-DSIG'}...
                  </div>
                </div>
                ${idx < chain.length - 1 ? '<div class="coc-arrow">➔</div>' : ''}
              `).join('')}
            </div>
          </div>

          <!-- Detailed Custody Hop Records Table -->
          <div class="table-responsive" style="margin-top: 14px;">
            <table class="gov-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Releasing Officer / Dept</th>
                  <th>Receiving Officer / Dept</th>
                  <th>Transfer Justification</th>
                  <th>Verification Hash</th>
                </tr>
              </thead>
              <tbody>
                ${chain.map(c => `
                  <tr>
                    <td style="font-size: 11px;" class="font-mono">${c.timestamp}</td>
                    <td><span class="badge badge-info">${c.action_type}</span></td>
                    <td>${c.from_officer_name || 'Seizure Site'} (${c.from_department || 'Field'})</td>
                    <td><strong>${c.to_officer_name || 'R. Patel'}</strong> (${c.to_department || 'FSD'})</td>
                    <td style="font-size: 12px;">${c.transfer_reason}</td>
                    <td class="font-mono" style="font-size: 10px; color: var(--gov-text-muted);">${(c.sha256_verification || ev.sha256_hash).substring(0, 16)}...</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    `;
  },

  // Modal to Transfer Custody (Section 12 & 34.23)
  openTransferModal(evId) {
    const ev = this.evidenceList.find(e => e.id === evId) || this.selectedEvidence;
    if (!ev) return;

    const existing = document.getElementById('transfer-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'transfer-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-card" style="max-width: 580px;">
        <div class="modal-header">
          <div class="modal-title">🔐 Execute Statutory Custody Transfer</div>
          <button class="modal-close-btn" onclick="document.getElementById('transfer-modal').remove()">×</button>
        </div>
        <div class="modal-body">
          <div style="background-color: var(--gov-surface-alt); border: 1px solid var(--gov-border); padding: 10px 14px; border-radius: 4px; margin-bottom: 16px; font-size: 12px;">
            <div><strong>Target Exhibit:</strong> ${ev.evidence_number} — ${ev.title}</div>
            <div><strong>Current Custodian:</strong> ${ev.custodian_name || 'Officer A. Sharma'} (${ev.custodian_department || 'EIU'})</div>
          </div>

          <form id="transfer-form" onsubmit="EvidenceView.submitTransfer(event, '${ev.id}')">
            <div style="margin-bottom: 12px;">
              <label class="filter-label">Receiving Officer (Transferee)</label>
              <select id="transfer-to-officer" class="form-control" style="width: 100%;" required>
                <option value="usr-patel">R. Patel (Senior Forensic Specialist - FSD)</option>
                <option value="usr-deshmukh">P. Deshmukh (Cyber Forensics Lead - CCD)</option>
                <option value="usr-singh">N. Singh (Legal Affairs Department)</option>
                <option value="usr-sharma">A. Sharma (Lead IO - EIU)</option>
              </select>
            </div>

            <div style="margin-bottom: 12px;">
              <label class="filter-label">Transfer Stage Action</label>
              <select id="transfer-action-type" class="form-control" style="width: 100%;">
                <option value="TRANSFERRED">TRANSFERRED (Transit / Laboratory Handover)</option>
                <option value="RECEIVED">RECEIVED (Intake Verification Complete)</option>
                <option value="EXAMINED">EXAMINED (Forensic Bitstream Analysis Complete)</option>
                <option value="STORED">STORED (Placed in Secured Vault Locker)</option>
              </select>
            </div>

            <div style="margin-bottom: 12px;">
              <label class="filter-label">New Storage Location / Lab Facility</label>
              <input type="text" id="transfer-location" class="form-control" style="width: 100%;" value="FSD Digital Forensics Secure Lab Rack 4B" required />
            </div>

            <div style="margin-bottom: 14px;">
              <label class="filter-label">Transfer Requisition / Justification</label>
              <textarea id="transfer-reason" class="form-control" style="width: 100%; height: 65px;" required>Requisition sent for bitstream imaging, write-blocked forensic examination, and unallocated cluster recovery.</textarea>
            </div>

            <div style="background-color: #FEF3C7; border: 1px solid #FCD34D; padding: 10px; border-radius: 4px; font-size: 11px; color: #92400E; margin-bottom: 14px;">
              <strong>GOVERNMENT PROTOCOL NOTICE:</strong> Executing this transfer attaches your cryptographic ECDSA hardware token signature and creates an immutable audit log.
            </div>

            <div class="modal-footer" style="padding: 12px 0 0 0; background: none;">
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('transfer-modal').remove()">Cancel</button>
              <button type="submit" class="btn btn-primary">Sign & Execute Transfer →</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  },

  async submitTransfer(e, evId) {
    e.preventDefault();
    const toOfficerId = document.getElementById('transfer-to-officer').value;
    const actionType = document.getElementById('transfer-action-type').value;
    const newStorageLocation = document.getElementById('transfer-location').value;
    const transferReason = document.getElementById('transfer-reason').value;

    try {
      const res = await API.post(`/evidence/${evId}/transfer`, {
        toOfficerId,
        actionType,
        newStorageLocation,
        transferReason
      });

      document.getElementById('transfer-modal').remove();
      alert(`✓ CUSTODY TRANSFERRED: Exhibit successfully handed over to Officer ${res.data.toOfficer}.\nDigital Signature: ${res.data.digitalSignature.substring(0, 32)}...`);
      await this.fetchEvidence();
      await this.loadEvidenceDetail(evId);
    } catch (err) {
      console.error('Transfer failed:', err);
    }
  },

  // Modal to Register New Evidence Exhibit
  openRegisterModal(preselectedCaseId = 'case-041') {
    const existing = document.getElementById('register-ev-modal');
    if (existing) existing.remove();

    const countNext = this.evidenceList.length + 1;
    const generatedEvNum = `EVD-2026-041-${String(countNext).padStart(2, '0')}`;

    const modal = document.createElement('div');
    modal.id = 'register-ev-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-card" style="max-width: 600px;">
        <div class="modal-header">
          <div class="modal-title">🔐 Register Digital or Physical Evidence Exhibit</div>
          <button class="modal-close-btn" onclick="document.getElementById('register-ev-modal').remove()">×</button>
        </div>
        <div class="modal-body">
          <form id="new-ev-form" onsubmit="EvidenceView.submitRegisterEvidence(event)">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
              <div>
                <label class="filter-label">Evidence Number (Auto)</label>
                <input type="text" class="form-control font-mono" style="width: 100%;" value="${generatedEvNum}" readonly />
              </div>
              <div>
                <label class="filter-label">Evidence Type</label>
                <select id="new-ev-type" class="form-control" style="width: 100%;">
                  <option value="Digital Storage Media">Digital Storage Media (NVMe/SATA/USB)</option>
                  <option value="Encrypted Digital Media">Encrypted Digital Media</option>
                  <option value="Network Telemetry & Memory Dump">Network Telemetry & Memory Dump</option>
                  <option value="Mobile Device">Mobile Device</option>
                  <option value="Physical Document & Seal">Physical Document & Seal</option>
                </select>
              </div>
            </div>

            <div style="margin-bottom: 12px;">
              <label class="filter-label">Exhibit Title</label>
              <input type="text" id="new-ev-title" class="form-control" style="width: 100%;" placeholder="e.g. Seized Accounting Server NVMe SSD 2TB" required />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
              <div>
                <label class="filter-label">Collection Location</label>
                <input type="text" id="new-ev-loc" class="form-control" style="width: 100%;" value="Apex FinCorp HQ Server Room, Gurugram" required />
              </div>
              <div>
                <label class="filter-label">Initial Storage Location</label>
                <input type="text" id="new-ev-storage" class="form-control" style="width: 100%;" value="Central Vault Safe Box #04" required />
              </div>
            </div>

            <div style="margin-bottom: 14px;">
              <label class="filter-label">Exhibit Description & Condition</label>
              <textarea id="new-ev-desc" class="form-control" style="width: 100%; height: 60px;">Recovered under Section 93 CrPC warrant. Sealed in tamper-evident anti-static bag.</textarea>
            </div>

            <div class="modal-footer" style="padding: 12px 0 0 0; background: none;">
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('register-ev-modal').remove()">Cancel</button>
              <button type="submit" class="btn btn-primary">Register Exhibit & Hash →</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  },

  async submitRegisterEvidence(e) {
    e.preventDefault();
    const title = document.getElementById('new-ev-title').value.trim();
    const evidenceType = document.getElementById('new-ev-type').value;
    const collectionLocation = document.getElementById('new-ev-loc').value;
    const storageLocation = document.getElementById('new-ev-storage').value;
    const description = document.getElementById('new-ev-desc').value;

    try {
      const res = await API.post('/evidence', {
        caseId: 'case-041',
        title,
        evidenceType,
        collectionLocation,
        storageLocation,
        description
      });

      document.getElementById('register-ev-modal').remove();
      alert(`✓ SUCCESS: Evidence registered into vault.\nExhibit Number: ${res.data.evidenceNumber}\nSHA-256 Hash: ${res.data.sha256Hash}`);
      await this.fetchEvidence();
    } catch (err) {
      console.error('Registration failed:', err);
    }
  }
};

window.EvidenceView = EvidenceView;
