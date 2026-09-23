/**
 * CASEVAULT — Global State Management
 */
const State = {
  currentOfficer: {
    id: 'usr-sharma',
    officer_id: 'NDIS-IO-4102',
    full_name: 'A. Sharma',
    badge_number: 'NDIS-88214',
    designation: 'Lead Investigation Officer (EIU)',
    department_name: 'Economic Investigation Unit',
    department_code: 'EIU',
    role_id: 'role-io',
    role_name: 'Investigation Officer',
    mfa_enabled: true,
    permissions: ['VIEW', 'UPLOAD', 'DOWNLOAD', 'EDIT', 'SHARE', 'VERIFY', 'TRANSFER', 'CREATE_CASE']
  },
  currentView: 'dashboard',
  selectedCaseId: 'case-041',
  selectedDocId: 'doc-002',
  selectedEvidenceId: 'ev-001',
  language: 'EN', // 'EN' or 'HI'
  notifications: [],
  unreadNotifications: 3,

  init() {
    // Check local storage
    const savedOfficerId = localStorage.getItem('casevault_officer_id');
    if (!savedOfficerId) {
      localStorage.setItem('casevault_officer_id', this.currentOfficer.officer_id);
    }
  },

  setOfficer(officer) {
    this.currentOfficer = officer;
    localStorage.setItem('casevault_officer_id', officer.officer_id);
    localStorage.setItem('casevault_role_id', officer.role_id);
    this.updateHeaderUI();
  },

  updateHeaderUI() {
    const nameEl = document.getElementById('header-officer-name');
    const deptEl = document.getElementById('header-officer-dept');
    const avatarEl = document.getElementById('header-officer-avatar');
    const roleSelect = document.getElementById('header-role-switcher');

    if (nameEl) nameEl.textContent = this.currentOfficer.full_name;
    if (deptEl) deptEl.textContent = `${this.currentOfficer.officer_id} • ${this.currentOfficer.department_code || 'NDIS'}`;
    if (avatarEl) avatarEl.textContent = this.currentOfficer.full_name.charAt(0);
    if (roleSelect) roleSelect.value = this.currentOfficer.officer_id;
  },

  toggleLanguage() {
    this.language = this.language === 'EN' ? 'HI' : 'EN';
    const langBtn = document.getElementById('lang-toggle-btn');
    if (langBtn) {
      langBtn.textContent = this.language === 'EN' ? 'हिंदी | English' : 'English | हिंदी';
    }
    // Re-render current view to reflect language
    if (window.App) window.App.navigate(this.currentView);
  }
};

window.State = State;
