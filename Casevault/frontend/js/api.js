/**
 * CASEVAULT — Secure API Client
 * Automatically handles session tokens, correlation IDs, and Zero-Trust headers
 */
const API = {
  baseUrl: '/api/v1',

  async request(endpoint, options = {}) {
    const officerId = localStorage.getItem('casevault_officer_id') || 'NDIS-IO-4102';
    const token = localStorage.getItem('casevault_token') || `TOKEN-${officerId}-${Date.now()}`;
    const requestId = 'req_' + Math.random().toString(36).substring(2, 10);

    const headers = {
      'Accept': 'application/json',
      'X-Officer-ID': officerId,
      'X-Request-ID': requestId,
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };

    // If body is JSON, set content-type
    if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object') {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers
      });

      // Special handling for 403 Access Denied
      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        API.showSecurityDeniedModal(errorData.error || { message: 'ACCESS DENIED: Insufficient Security Clearance.' });
        throw new Error(errorData.error ? errorData.error.message : 'ACCESS_DENIED');
      }

      // Special handling for 429 Rate Limit
      if (response.status === 429) {
        const errorData = await response.json().catch(() => ({}));
        alert(`⚠ SECURITY ADVISORY: ${errorData.error ? errorData.error.message : 'Rate limit exceeded'}`);
        throw new Error('RATE_LIMITED');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  },

  // GET helper
  get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return this.request(url, { method: 'GET' });
  },

  // POST helper
  post(endpoint, body = {}) {
    return this.request(endpoint, { method: 'POST', body });
  },

  // PATCH helper
  patch(endpoint, body = {}) {
    return this.request(endpoint, { method: 'PATCH', body });
  },

  // Government Security 403 Access Denied Alert Modal
  showSecurityDeniedModal(errorObj) {
    const existing = document.getElementById('security-denied-modal');
    if (existing) existing.remove();

    const officerId = localStorage.getItem('casevault_officer_id') || 'UNKNOWN';
    const timestamp = new Date().toISOString();

    const modal = document.createElement('div');
    modal.id = 'security-denied-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-card" style="max-width: 520px; border-top: 4px solid var(--status-critical);">
        <div class="modal-header" style="background-color: var(--status-critical-bg);">
          <div class="modal-title" style="color: var(--status-critical); display: flex; align-items: center; gap: 8px;">
            <span>🛡</span> ACCESS DENIED — 403 FORBIDDEN
          </div>
          <button class="modal-close-btn" onclick="document.getElementById('security-denied-modal').remove()">×</button>
        </div>
        <div class="modal-body">
          <div style="background-color: #FFF5F5; border: 1px solid #FED7D7; padding: 12px; border-radius: 4px; margin-bottom: 16px;">
            <p style="font-weight: 700; color: #9B2C2C; font-size: 13px; margin-bottom: 4px;">
              GOVERNMENT SECURITY POLICY ENFORCEMENT
            </p>
            <p style="color: #742A2A; font-size: 12px;">
              ${errorObj.message || 'You do not have the statutory authorization or clearance tier to perform this action.'}
            </p>
          </div>
          <div style="font-size: 12px; color: var(--gov-text-secondary); line-height: 1.6;">
            <div><strong>Target Officer Badge:</strong> ${officerId}</div>
            <div><strong>Security Violation Ref:</strong> <span class="font-mono">SEC-ERR-${Date.now().toString(36).toUpperCase()}</span></div>
            <div><strong>Correlation ID:</strong> <span class="font-mono">${errorObj.requestId || 'req_sec_violation'}</span></div>
            <div><strong>Timestamp:</strong> ${timestamp}</div>
            <div style="margin-top: 10px; color: var(--status-critical); font-size: 11px; font-weight: 600;">
              ⚠ An immutable security event has been logged in the vigilance audit ledger.
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="document.getElementById('security-denied-modal').remove()">
            Acknowledge & Close
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
};
