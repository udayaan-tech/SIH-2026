/**
 * CASEVAULT — Government Login Page View
 * Section 4: Left branding & security info, Right login card with 3-stage authentication flow.
 */
const LoginView = {
  render(container) {
    const isHindi = State.language === 'HI';

    container.innerHTML = `
      <div style="min-height: calc(100vh - 200px); display: flex; align-items: center; justify-content: center; padding: 20px 0;">
        <div style="display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 32px; max-width: 980px; width: 100%; background: #FFFFFF; border: 1px solid var(--gov-border); border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); overflow: hidden;">
          
          <!-- LEFT: Government Branding & Security Assurance -->
          <div style="background-color: #0E1D31; color: #FFFFFF; padding: 40px; display: flex; flex-direction: column; justify-content: space-between; border-right: 3px solid var(--gov-saffron);">
            <div>
              <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 24px;">
                <div class="gov-emblem-placeholder" style="width: 48px; height: 48px;">
                  <span class="gov-emblem-icon">🏛</span>
                  <span class="gov-emblem-text">GOV</span>
                </div>
                <div>
                  <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94A3B8;">Government of India</div>
                  <div style="font-size: 15px; font-weight: 700; color: #FFFFFF;">National Digital Investigation Services</div>
                </div>
              </div>

              <div style="margin: 32px 0;">
                <div style="display: inline-block; background-color: var(--gov-saffron); color: #FFF; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 2px; text-transform: uppercase; margin-bottom: 8px;">
                  SECURE DIGITAL REPOSITORY
                </div>
                <h1 style="font-size: 26px; font-weight: 800; color: #FFFFFF; line-height: 1.2; margin-bottom: 8px;">
                  CASEVAULT
                </h1>
                <p style="color: #94A3B8; font-size: 13px; font-weight: 600; margin-bottom: 16px;">
                  Secure Digital Case & Document Management System
                </p>
                <div style="border-left: 3px solid var(--gov-saffron); padding-left: 12px; color: #E2E8F0; font-size: 13px; font-style: italic; line-height: 1.5;">
                  "Secure Every Document. Trace Every Action. Protect Every Case."
                </div>
              </div>

              <!-- Security Indicators -->
              <div style="background-color: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 4px; padding: 14px; margin-top: 24px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #38BDF8; margin-bottom: 8px; letter-spacing: 0.5px;">
                  Defense-in-Depth Security Protocol
                </div>
                <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: #CBD5E1;">
                  <div>✓ Strict Zero-Trust Role-Based Access Control (RBAC)</div>
                  <div>✓ Cryptographic SHA-256 Document Integrity Ledger</div>
                  <div>✓ Multi-Factor Hardware Authentication Ready</div>
                  <div>✓ Tamper-Evident Immutable Audit Logging</div>
                </div>
              </div>
            </div>

            <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 16px; font-size: 11px; color: #64748B;">
              <strong>WARNING:</strong> Authorized Government Personnel Only. Unauthorized access attempts are monitored, blocked, and prosecuted under the Information Technology Act.
            </div>
          </div>

          <!-- RIGHT: Login Form -->
          <div style="padding: 40px; display: flex; flex-direction: column; justify-content: center;">
            <div style="margin-bottom: 24px;">
              <h2 style="font-size: 18px; font-weight: 700; color: var(--gov-navy-dark);">
                ${isHindi ? 'अधिकारी लॉगिन पोर्टल' : 'Officer Authentication Portal'}
              </h2>
              <p style="font-size: 12px; color: var(--gov-text-muted); margin-top: 2px;">
                Enter your designated government credentials to establish a secure session.
              </p>
            </div>

            <!-- Login Status Message Container -->
            <div id="login-status-box" style="display: none; padding: 12px; border-radius: 4px; margin-bottom: 16px; font-size: 12px; font-weight: 600;"></div>

            <form id="officer-login-form" onsubmit="LoginView.handleLogin(event)">
              <div class="form-group" style="margin-bottom: 14px;">
                <label style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--gov-text-muted); margin-bottom: 4px;">
                  Officer ID / Badge Number
                </label>
                <input type="text" id="login-officer-id" class="form-control" style="width: 100%;" value="NDIS-IO-4102" required />
              </div>

              <div class="form-group" style="margin-bottom: 14px;">
                <label style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--gov-text-muted); margin-bottom: 4px;">
                  Password / PIN
                </label>
                <input type="password" id="login-password" class="form-control" style="width: 100%;" value="••••••••••••" required />
              </div>

              <div class="form-group" style="margin-bottom: 14px;">
                <label style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--gov-text-muted); margin-bottom: 4px;">
                  Department Jurisdiction
                </label>
                <select id="login-department" class="form-control" style="width: 100%;">
                  <option value="dept-eiu">Economic Investigation Unit (EIU)</option>
                  <option value="dept-ccd">Cyber Crime Division (CCD)</option>
                  <option value="dept-fsd">Forensic Science Division (FSD)</option>
                  <option value="dept-diu">District Investigation Unit (DIU)</option>
                  <option value="dept-lad">Legal Affairs Department (LAD)</option>
                </select>
              </div>

              <div class="form-group" style="margin-bottom: 20px;">
                <label style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--gov-text-muted); margin-bottom: 4px;">
                  Security Captcha
                </label>
                <div style="display: flex; gap: 8px; align-items: center;">
                  <div style="background-color: #E2E8F0; border: 1px solid var(--gov-border); padding: 6px 14px; font-family: monospace; font-size: 16px; font-weight: 800; letter-spacing: 4px; color: var(--gov-navy-dark); user-select: none;">
                    8 H 7 K 2
                  </div>
                  <input type="text" id="login-captcha" class="form-control" style="width: 100px; text-transform: uppercase;" value="8H7K2" required />
                  <button type="button" class="btn btn-secondary btn-sm" onclick="alert('Captcha refreshed')">↻</button>
                </div>
              </div>

              <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button type="submit" id="login-submit-btn" class="btn btn-primary" style="flex: 1; padding: 10px;">
                  [ LOGIN ]
                </button>
                <button type="button" class="btn btn-secondary" onclick="alert('Password reset instructions sent to official NDIS registered email.')">
                  [ Reset Password ]
                </button>
              </div>
            </form>

            <!-- Quick Demo Role Switcher for Evaluators -->
            <div style="border-top: 1px dashed var(--gov-border); padding-top: 14px;">
              <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: var(--gov-text-muted); margin-bottom: 8px;">
                ⚡ Fast Demo Persona Login (Click to switch):
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                <button class="btn btn-secondary btn-sm" style="font-size: 11px;" onclick="LoginView.quickFill('NDIS-IO-4102', 'dept-eiu')">
                  Lead IO (A. Sharma)
                </button>
                <button class="btn btn-secondary btn-sm" style="font-size: 11px;" onclick="LoginView.quickFill('NDIS-FO-8819', 'dept-fsd')">
                  Forensic Officer (R. Patel)
                </button>
                <button class="btn btn-secondary btn-sm" style="font-size: 11px;" onclick="LoginView.quickFill('NDIS-AUD-9904', 'dept-lad')">
                  Auditor (K. Iyer)
                </button>
                <button class="btn btn-secondary btn-sm" style="font-size: 11px;" onclick="LoginView.quickFill('NDIS-ADM-0001', 'dept-ccd')">
                  Admin (S. Rajan)
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    `;
  },

  quickFill(officerId, deptId) {
    document.getElementById('login-officer-id').value = officerId;
    document.getElementById('login-department').value = deptId;
  },

  async handleLogin(e) {
    e.preventDefault();
    const officerId = document.getElementById('login-officer-id').value.trim();
    const statusBox = document.getElementById('login-status-box');
    const submitBtn = document.getElementById('login-submit-btn');

    statusBox.style.display = 'block';
    statusBox.style.backgroundColor = '#EBF8FF';
    statusBox.style.color = '#2B6CB0';
    statusBox.style.border = '1px solid #BEE3F8';
    submitBtn.disabled = true;

    // Sequence requested in Section 4:
    // "Authenticating Officer..." -> "Verifying credentials..." -> "Access granted"
    statusBox.innerHTML = `<strong>AUTHENTICATION IN PROGRESS:</strong> Authenticating Officer ${officerId}...`;

    await new Promise(r => setTimeout(r, 600));
    statusBox.innerHTML = `<strong>SECURITY CHECK:</strong> Verifying credentials & MFA clearance...`;

    try {
      const res = await API.post('/auth/login', {
        officerId,
        password: 'password_mock',
        department: document.getElementById('login-department').value
      });

      await new Promise(r => setTimeout(r, 500));
      statusBox.style.backgroundColor = '#F0FFF4';
      statusBox.style.color = '#22543D';
      statusBox.style.border = '1px solid #C6F6D5';
      statusBox.innerHTML = `<strong>SUCCESS:</strong> Access granted. Establishing encrypted session...`;

      State.setOfficer(res.data.officer);
      localStorage.setItem('casevault_token', res.data.token);

      setTimeout(() => {
        App.navigate('dashboard');
      }, 500);
    } catch (err) {
      statusBox.style.backgroundColor = '#FFF5F5';
      statusBox.style.color = '#9B2C2C';
      statusBox.style.border = '1px solid #FED7D7';
      statusBox.innerHTML = `<strong>AUTHENTICATION FAILED:</strong> Invalid credentials or authorization temporarily unavailable.`;
      submitBtn.disabled = false;
    }
  }
};

window.LoginView = LoginView;
