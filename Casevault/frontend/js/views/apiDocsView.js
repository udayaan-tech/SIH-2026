/**
 * CASEVAULT — Interactive API Documentation & OWASP Security Matrix View
 * Sections 34.25 & 34.26: Versioned Endpoints, Schemas, RBAC Requirements, and OWASP Defense Architecture
 */
const ApiDocsView = {
  specData: null,

  async render(container) {
    container.innerHTML = `
      <div class="page-header-bar">
        <div class="page-title-group">
          <h1>CASEVAULT REST API v1 Specification & Security Baseline</h1>
          <div class="page-subtitle">
            Zero-Trust, defense-in-depth government integration interfaces and OWASP API security mitigations
          </div>
        </div>
      </div>

      <div id="api-docs-loading" style="text-align: center; padding: 40px;">
        Loading API specification...
      </div>
      <div id="api-docs-content" style="display: none;"></div>
    `;

    try {
      const res = await API.get('/docs');
      this.specData = res.data;
      this.renderContent(document.getElementById('api-docs-content'));
      document.getElementById('api-docs-loading').style.display = 'none';
      document.getElementById('api-docs-content').style.display = 'block';
    } catch (e) {
      console.error('Error fetching API spec:', e);
    }
  },

  renderContent(container) {
    const s = this.specData;

    container.innerHTML = `
      <!-- Security Architecture Banner (Section 34 & 35) -->
      <div class="gov-card" style="border-left: 4px solid var(--gov-saffron); padding: 18px; margin-bottom: 20px;">
        <div style="font-size: 13px; font-weight: 800; color: var(--gov-navy-dark); text-transform: uppercase; margin-bottom: 6px;">
          SECTION 35 SECURITY PRINCIPLE: THE FRONTEND IS NEVER TRUSTED
        </div>
        <div style="font-size: 12px; color: var(--gov-text-secondary); line-height: 1.6;">
          <code>Request → Authentication (Token) → Authorization (RBAC) → Input Validation → Business Rules → Database / Storage → Immutable Audit Logging → Response</code>
          <div style="margin-top: 6px; color: var(--gov-navy-dark); font-weight: 600;">
            "Deny by default. Grant only required access. Record every sensitive action."
          </div>
        </div>
      </div>

      <!-- OWASP Top 10 API Security Baseline (Section 34.25) -->
      <div class="gov-card">
        <div class="gov-card-header">
          <div class="gov-card-title">
            <span>🛡</span> OWASP API Security Baseline Implementation Matrix
          </div>
        </div>
        <div class="table-responsive">
          <table class="gov-table">
            <thead>
              <tr>
                <th style="width: 35%;">OWASP Risk Category</th>
                <th>CASEVAULT Defense-in-Depth Implementation</th>
              </tr>
            </thead>
            <tbody>
              ${s.owaspMatrix.map(m => `
                <tr>
                  <td><strong>${m.risk}</strong></td>
                  <td style="font-size: 12px; color: var(--gov-text-secondary);">${m.mitigation}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Versioned Endpoints (Section 34.26) -->
      <div class="gov-card" style="margin-top: 24px;">
        <div class="gov-card-header">
          <div class="gov-card-title">
            <span>🌐</span> CASEVAULT API v1 Protected Endpoints
          </div>
          <span class="badge badge-info">BASE PATH: /api/v1</span>
        </div>
        <div class="table-responsive">
          <table class="gov-table">
            <thead>
              <tr>
                <th>Method</th>
                <th>Endpoint Path</th>
                <th>Authentication & Role</th>
                <th>Description</th>
                <th>Request & Response Schemas</th>
              </tr>
            </thead>
            <tbody>
              ${s.endpoints.map(ep => {
                let mBadge = 'badge-info';
                if (ep.method === 'POST') mBadge = 'badge-verified';
                if (ep.method === 'PATCH') mBadge = 'badge-review';
                if (ep.method === 'DELETE') mBadge = 'badge-critical';

                return `
                  <tr>
                    <td><span class="badge ${mBadge}" style="font-weight: 800;">${ep.method}</span></td>
                    <td class="font-mono" style="font-weight: 700; color: var(--gov-navy-primary);">${ep.path}</td>
                    <td>
                      <div style="font-size: 11px; font-weight: 600;">${ep.auth}</div>
                      <span class="badge badge-secondary" style="font-size: 10px;">${ep.permission}</span>
                    </td>
                    <td style="font-size: 12px; max-width: 250px;">${ep.description}</td>
                    <td style="font-size: 11px;">
                      <div><strong>Req:</strong> <code class="font-mono" style="color: var(--gov-text-muted);">${ep.request}</code></div>
                      <div style="margin-top: 4px;"><strong>Res:</strong> <code class="font-mono" style="color: var(--gov-green);">${ep.response}</code></div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
};

window.ApiDocsView = ApiDocsView;
