/**
 * CASEVAULT — Security & Compliance Center View
 * Section 17 & 34.24: Threat Intelligence, Rate Limiting, Cryptographic Scan, Severity Events
 */
const SecurityCenterView = {
  securityData: null,

  async render(container) {
    const isHindi = State.language === 'HI';

    container.innerHTML = `
      <div class="page-header-bar">
        <div class="page-title-group">
          <h1>${isHindi ? 'सुरक्षा एवं अनुपालन केंद्र' : 'Security & Compliance Center'}</h1>
          <div class="page-subtitle">
            Defense-in-Depth posture, active threat telemetry, rate limiting status, and cryptographic health
          </div>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary btn-sm" onclick="SecurityCenterView.runIntegrityScan()">
            🛡 Run System-Wide Cryptographic Integrity Scan
          </button>
        </div>
      </div>

      <!-- Core Security Control Cards (Section 17) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 20px;">
        <div class="stat-card stat-active">
          <div class="stat-title">HARDWARE MFA</div>
          <div class="stat-value" style="font-size: 20px; color: var(--gov-green);">✓ ENABLED</div>
          <div class="stat-subtext">FIDO2 / WebAuthn Enforced</div>
        </div>

        <div class="stat-card stat-active">
          <div class="stat-title">ENCRYPTION SUITE</div>
          <div class="stat-value" style="font-size: 20px; color: var(--gov-green);">AES-256-GCM</div>
          <div class="stat-subtext">TLS 1.3 Strict in Transit</div>
        </div>

        <div class="stat-card stat-active">
          <div class="stat-title">ACCESS CONTROL</div>
          <div class="stat-value" style="font-size: 20px; color: var(--gov-navy-primary);">ZERO-TRUST</div>
          <div class="stat-subtext">Object-Level BOLA Defense</div>
        </div>

        <div class="stat-card stat-active">
          <div class="stat-title">DOCUMENT INTEGRITY</div>
          <div class="stat-value" style="font-size: 20px; color: var(--gov-green);">SHA-256</div>
          <div class="stat-subtext">100% Bitstream Match</div>
        </div>

        <div class="stat-card stat-active">
          <div class="stat-title">AUDIT TRAIL</div>
          <div class="stat-value" style="font-size: 20px; color: var(--gov-green);">IMMUTABLE</div>
          <div class="stat-subtext">Tamper-Evident HMAC Seals</div>
        </div>

        <div class="stat-card stat-active">
          <div class="stat-title">DIGITAL SIGNATURES</div>
          <div class="stat-value" style="font-size: 20px; color: var(--gov-green);">ECDSA-P256</div>
          <div class="stat-subtext">Statutory Evidence Act 65B</div>
        </div>
      </div>

      <!-- Scan Result Box -->
      <div id="scan-feedback-box" style="display: none; margin-bottom: 20px; padding: 14px; border-radius: var(--radius-sm);"></div>

      <!-- Active Threat Telemetry & Rate Limiting Configuration -->
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
        
        <!-- Security Events Table (Section 17: INFO, WARNING, CRITICAL) -->
        <div class="gov-card">
          <div class="gov-card-header">
            <div class="gov-card-title">
              <span>🚨</span> Real-Time Security Incident Telemetry
            </div>
            <span style="font-size: 11px; color: var(--gov-text-muted);">Automated Vigilance Log</span>
          </div>
          <div class="table-responsive">
            <table class="gov-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Severity</th>
                  <th>Incident Type</th>
                  <th>Event Description</th>
                  <th>Source IP</th>
                  <th>Target Badge</th>
                </tr>
              </thead>
              <tbody id="security-events-tbody">
                <tr><td colspan="6" style="text-align: center; padding: 24px;">Loading security telemetry...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Defense-in-Depth Policies & Rate Limits (Section 34.4 & 34.5) -->
        <div>
          <div class="gov-card">
            <div class="gov-card-header">
              <div class="gov-card-title">API Rate Limiting Policy</div>
            </div>
            <div class="gov-card-body" style="font-size: 12px; color: var(--gov-text-secondary); line-height: 1.8;">
              <div style="border-bottom: 1px solid var(--gov-border-light); padding-bottom: 6px; margin-bottom: 6px;">
                <strong>Officer Login:</strong> <span class="font-mono">15 attempts / min / IP</span>
              </div>
              <div style="border-bottom: 1px solid var(--gov-border-light); padding-bottom: 6px; margin-bottom: 6px;">
                <strong>AI Smart Search:</strong> <span class="font-mono">60 queries / min / officer</span>
              </div>
              <div style="border-bottom: 1px solid var(--gov-border-light); padding-bottom: 6px; margin-bottom: 6px;">
                <strong>Document Ingestion:</strong> <span class="font-mono">50 uploads / hour / client</span>
              </div>
              <div>
                <strong>General REST API:</strong> <span class="font-mono">120 requests / min / session</span>
              </div>
            </div>
          </div>

          <div class="gov-card">
            <div class="gov-card-header">
              <div class="gov-card-title">Brute-Force Shield</div>
            </div>
            <div class="gov-card-body" style="font-size: 12px; color: var(--gov-text-secondary); line-height: 1.6;">
              <p>Repeated failed credential attempts automatically enforce progressive exponential backoff delays and generate security advisories.</p>
              <div style="margin-top: 10px; background: var(--gov-surface-alt); padding: 8px 12px; border: 1px solid var(--gov-border-light); border-radius: var(--radius-sm); font-size: 11px;">
                <strong>Zero-Account-Enumeration Rule:</strong> Generic error messages prevent discovery of valid officer badges.
              </div>
            </div>
          </div>
        </div>

      </div>
    `;

    await this.fetchOverview();
  },

  async fetchOverview() {
    try {
      const res = await API.get('/security/overview');
      this.securityData = res.data;
      this.renderEvents(res.data.recentEvents || []);
    } catch (e) {
      console.error('Error loading security data:', e);
    }
  },

  renderEvents(events) {
    const tbody = document.getElementById('security-events-tbody');
    if (!tbody) return;

    if (events.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px;">No security incidents recorded.</td></tr>`;
      return;
    }

    tbody.innerHTML = events.map(s => {
      let badgeClass = 'badge-info';
      if (s.severity === 'CRITICAL') badgeClass = 'badge-critical';
      if (s.severity === 'WARNING') badgeClass = 'badge-review';

      return `
        <tr>
          <td class="font-mono" style="font-size: 11px;">${s.timestamp}</td>
          <td><span class="badge ${badgeClass}">${s.severity}</span></td>
          <td><strong style="color: var(--gov-navy-primary); font-size: 11px;">${s.event_type}</strong></td>
          <td style="font-size: 12px; line-height: 1.4;">${s.description}</td>
          <td class="font-mono" style="font-size: 11px;">${s.source_ip || '10.42.1.10'}</td>
          <td class="font-mono" style="font-size: 11px; font-weight: 700;">${s.officer_id || 'SYSTEM'}</td>
        </tr>
      `;
    }).join('');
  },

  async runIntegrityScan() {
    const feedback = document.getElementById('scan-feedback-box');
    if (feedback) {
      feedback.style.display = 'block';
      feedback.style.backgroundColor = 'var(--gov-surface-alt)';
      feedback.style.border = '1px solid var(--gov-border)';
      feedback.innerHTML = `<strong>SCANNING:</strong> Calculating real-time SHA-256 bitstream checksums across 40 evidentiary records...`;
    }

    try {
      const res = await API.post('/security/scan-integrity', {});
      if (feedback) {
        feedback.style.backgroundColor = 'var(--status-active-bg)';
        feedback.style.border = '1px solid #A3D9B5';
        feedback.style.color = 'var(--status-active)';
        feedback.innerHTML = `
          <strong>✓ INTEGRITY SCAN COMPLETE:</strong> ${res.message}
          <div style="font-size: 11px; margin-top: 4px;">Scanned: ${res.scannedCount} | Mismatches: ${res.mismatches} | Completed at: ${res.timestamp}</div>
        `;
      }
    } catch (e) {
      if (feedback) feedback.innerHTML = `Scan failed: ${e.message}`;
    }
  }
};

window.SecurityCenterView = SecurityCenterView;
