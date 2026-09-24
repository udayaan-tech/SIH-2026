/**
 * CASEVAULT — Register New FIR / Case View
 * Section 3: Ingestion of new criminal cases with auto-POCSO detection.
 */
const NewCaseView = {
  render(container) {
    const isHindi = State.language === 'HI';
    const autoFir = 'FIR-DEL-2026-' + Math.floor(Math.random() * 9000 + 1000);
    const officerId = State.currentOfficer ? State.currentOfficer.officer_id : 'NDIS-IO-4102';

    container.innerHTML = `
      <div class="page-header-bar">
        <div class="page-title-group">
          <h1>${isHindi ? 'नई एफआईआर दर्ज करें' : 'Register New FIR / Case'}</h1>
          <div class="page-subtitle">
            Secure digital ingestion of formal criminal complaints and case metadata
          </div>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" onclick="App.navigate('cases')">Cancel</button>
          <button class="btn btn-primary btn-sm" onclick="NewCaseView.submitCase()">
            📋 Register Case
          </button>
        </div>
      </div>

      <div class="gov-card" style="max-width: 800px; margin: 0 auto;">
        <div class="gov-card-header">
          <div class="gov-card-title">Initial Information Report (IIR) Form</div>
        </div>
        <div class="gov-card-body">
          
          <div id="pocso-warning" style="display: none; background-color: #FFF5F5; border: 1px solid #FED7D7; padding: 12px; border-radius: 4px; margin-bottom: 16px; color: #9B2C2C; font-size: 13px;">
            <strong>⚠ POCSO / WOMEN SAFETY FLAGGED:</strong> Victim details will be auto-redacted in public records. Special confidentiality protocols have been activated for this case.
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label class="filter-label">FIR Number (Auto-Generated)</label>
              <input type="text" class="form-control" id="nc-fir-num" value="${autoFir}" readonly style="background-color: var(--gov-surface-alt); font-family: var(--font-mono); font-weight: 700; color: var(--gov-navy-primary);" />
            </div>
            <div>
              <label class="filter-label">Police Station / Jurisdiction</label>
              <select class="form-control" id="nc-station">
                <option value="Central EOW">Central Economic Offences Wing</option>
                <option value="Cyber Cell">Cyber Cell Division</option>
                <option value="Special Cell">Special Cell (Anti-Terror)</option>
                <option value="Women Cell">Women Security Cell</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label class="filter-label">Date & Time of Incident</label>
              <input type="datetime-local" class="form-control" id="nc-datetime" value="2026-09-23T10:00" />
            </div>
            <div>
              <label class="filter-label">Investigating Officer Badge ID</label>
              <input type="text" class="form-control" id="nc-io-badge" value="${officerId}" readonly style="background-color: var(--gov-surface-alt);" />
            </div>
          </div>

          <div style="margin-bottom: 16px;">
            <label class="filter-label">Legal Sections Applied (e.g., BNS 303, BNS 376)</label>
            <input type="text" class="form-control" id="nc-sections" placeholder="Enter BNS sections..." onkeyup="NewCaseView.checkPocso()" />
            <div style="font-size: 11px; color: var(--gov-text-muted); margin-top: 4px;">Separate multiple sections with commas.</div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label class="filter-label">Accused Details (Name, Father's Name)</label>
              <textarea class="form-control" id="nc-accused" rows="3" placeholder="Enter known accused details..."></textarea>
            </div>
            <div>
              <label class="filter-label">Victim / Complainant Details</label>
              <textarea class="form-control" id="nc-victim" rows="3" placeholder="Enter victim details..."></textarea>
            </div>
          </div>

          <div style="margin-bottom: 24px;">
            <label class="filter-label">Brief Description / Gist of Incident</label>
            <textarea class="form-control" id="nc-description" rows="4" placeholder="Provide a summary of the incident..."></textarea>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 12px; padding-top: 16px; border-top: 1px solid var(--gov-border-light);">
            <button class="btn btn-secondary" onclick="App.navigate('cases')">Cancel</button>
            <button class="btn btn-primary" onclick="NewCaseView.submitCase()">Register Case & Generate Vault</button>
          </div>

        </div>
      </div>
    `;
  },

  checkPocso() {
    const sections = (document.getElementById('nc-sections').value || '').toLowerCase();
    const warning = document.getElementById('pocso-warning');
    if (sections.includes('376') || sections.includes('pocso') || sections.includes('64') || sections.includes('65')) {
      warning.style.display = 'block';
    } else {
      warning.style.display = 'none';
    }
  },

  submitCase() {
    const isPocso = document.getElementById('pocso-warning').style.display === 'block';
    
    // Simulate API call
    setTimeout(() => {
      alert("✅ CASE REGISTERED SUCCESSFULLY\\nImmutable Vault Created.\\n" + (isPocso ? "POCSO Redaction protocols activated." : ""));
      State.selectedCaseId = 'case-042'; // Just an example new ID
      App.navigate('case-detail');
    }, 600);
  }
};

window.NewCaseView = NewCaseView;
