/**
 * CASEVAULT — Main Application Orchestrator & Router
 */
const App = {
  views: {
    'login': LoginView,
    'dashboard': DashboardView,
    'cases': CasesView,
    'new-case': NewCaseView,
    'case-detail': CaseDetailView,
    'documents': DocumentsView,
    'doc-viewer': DocViewerView,
    'cert-view': CertView,
    'evidence': EvidenceView,
    'ai-search': AISearchView,
    'ai-intel': AIIntelView,
    'access-control': AccessControlView,
    'integrity-monitor': IntegrityMonitorView,
    'admin-users': AdminUsersView,
    'audit-trail': AuditTrailView,
    'security-center': SecurityCenterView,
    'reports': ReportsView,
    'api-docs': ApiDocsView
  },

  async init() {
    State.init();
    DemoGuide.init();

    // Setup nav listeners
    document.querySelectorAll('.gov-nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = link.getAttribute('data-view');
        if (targetView) this.navigate(targetView);
      });
    });

    // Populate role switcher dropdown
    await this.loadOfficersDropdown();

    // Check if initial login or direct dashboard
    const savedOfficer = localStorage.getItem('casevault_officer_id');
    if (savedOfficer) {
      this.navigate('dashboard');
    } else {
      this.navigate('login');
    }

    this.loadNotifications();
  },

  navigate(viewName) {
    State.currentView = viewName;

    // Update active nav link
    document.querySelectorAll('.gov-nav-link').forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-view') === viewName);
    });

    // Hide or show nav bar if on login screen
    const navBar = document.getElementById('gov-navigation-bar');
    const headerActions = document.getElementById('gov-header-actions-panel');
    if (navBar) navBar.style.display = viewName === 'login' ? 'none' : 'block';
    if (headerActions) headerActions.style.display = viewName === 'login' ? 'none' : 'flex';

    // Render corresponding view
    const container = document.getElementById('main-content-container');
    const viewHandler = this.views[viewName] || DashboardView;

    if (container && viewHandler && viewHandler.render) {
      viewHandler.render(container);
      window.scrollTo(0, 0);
    }
  },

  // Helper shortcuts for cross-view navigation
  openCase(caseId) {
    State.selectedCaseId = caseId;
    this.navigate('case-detail');
  },

  openDocViewer(docId) {
    State.selectedDocId = docId;
    this.navigate('doc-viewer');
  },

  openEvidenceChain(evId) {
    State.selectedEvidenceId = evId;
    this.navigate('evidence');
  },

  async switchToOfficer(officerId) {
    try {
      const res = await API.post('/auth/switch-officer', { officerId });
      State.setOfficer(res.data.officer);
      localStorage.setItem('casevault_token', res.data.token);

      // Re-render current view with new officer permissions
      this.navigate(State.currentView);
    } catch (e) {
      console.error('Error switching officer:', e);
    }
  },

  async loadOfficersDropdown() {
    try {
      const res = await API.get('/auth/officers');
      const switcher = document.getElementById('header-role-switcher');
      if (switcher && res.data) {
        switcher.innerHTML = res.data.map(u => `
          <option value="${u.officer_id}" ${u.officer_id === State.currentOfficer.officer_id ? 'selected' : ''}>
            ${u.full_name} (${u.role_name} - ${u.department_code})
          </option>
        `).join('');
      }
    } catch (e) {
      console.error('Failed to load officers:', e);
    }
  },

  async loadNotifications() {
    try {
      const res = await API.get('/notifications');
      State.notifications = res.data || [];
      const badge = document.getElementById('notif-badge-count');
      const unread = State.notifications.filter(n => !n.is_read).length;
      if (badge) {
        badge.textContent = unread;
        badge.style.display = unread > 0 ? 'inline-block' : 'none';
      }
    } catch (e) {
      console.error('Failed to load notifications:', e);
    }
  },

  toggleNotifDrawer() {
    let drawer = document.getElementById('notifications-drawer');
    if (!drawer) {
      drawer = document.createElement('div');
      drawer.id = 'notifications-drawer';
      drawer.className = 'notif-drawer';
      document.body.appendChild(drawer);
    }

    const isOpen = drawer.classList.contains('open');
    if (isOpen) {
      drawer.classList.remove('open');
    } else {
      drawer.innerHTML = `
        <div class="notif-drawer-header">
          <div style="font-weight: 700; font-size: 14px;">Government Alerts & Notifications</div>
          <button style="background: none; border: none; color: #FFF; font-size: 20px; cursor: pointer;" onclick="App.toggleNotifDrawer()">×</button>
        </div>
        <div class="notif-list">
          ${State.notifications.map(n => `
            <div class="notif-item" onclick="App.handleNotifClick('${n.id}', '${n.resource_type}', '${n.resource_id}')">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span class="badge ${n.notification_type === 'CRITICAL' ? 'badge-critical' : n.notification_type === 'WARNING' ? 'badge-review' : 'badge-active'}">${n.notification_type}</span>
                <span style="font-size: 10px; color: var(--gov-text-muted);">${n.priority}</span>
              </div>
              <div style="font-weight: 700; font-size: 12px; color: var(--gov-navy-dark);">${n.title}</div>
              <div style="font-size: 11px; color: var(--gov-text-secondary); margin-top: 2px;">${n.message}</div>
            </div>
          `).join('')}
        </div>
      `;
      drawer.classList.add('open');
    }
  },

  async handleNotifClick(notifId, resourceType, resourceId) {
    await API.patch(`/notifications/${notifId}/read`, {}).catch(() => {});
    this.toggleNotifDrawer();
    this.loadNotifications();

    if (resourceType === 'DOCUMENT') {
      this.openDocViewer(resourceId);
    } else if (resourceType === 'EVIDENCE') {
      this.openEvidenceChain(resourceId);
    } else if (resourceType === 'SECURITY') {
      this.navigate('security-center');
    }
  },

  // Accessibility Handlers (Section 21)
  setFontSize(size) {
    document.body.classList.remove('font-size-sm', 'font-size-lg');
    if (size === 'sm') document.body.classList.add('font-size-sm');
    if (size === 'lg') document.body.classList.add('font-size-lg');
  },

  toggleHighContrast() {
    document.body.classList.toggle('high-contrast-mode');
  },

  toggleScreenReader() {
    alert('Screen Reader Access Mode: Enhanced ARIA announcements and keyboard focus highlights enabled.');
  }
};

window.App = App;

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
