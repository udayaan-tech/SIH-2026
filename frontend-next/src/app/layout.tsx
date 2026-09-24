"use client";

import './globals.css';
import { Inter } from 'next/font/google';
import { StateProvider, useAppState } from '@/lib/StateContext';
import { usePathname, useRouter } from 'next/navigation';
import DemoGuideOverlay from '@/components/DemoGuideOverlay';

const inter = Inter({ subsets: ['latin'] });

function GovShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentOfficer, officers, switchToOfficer, toggleLanguage, applyFontSize, toggleHighContrast } = useAppState();

  // If we are on the public verification portal or login, do not render the shell
  if (pathname.startsWith('/verify') || pathname === '/') {
    return <>{children}</>;
  }

  return (
    <>
      <div className="gov-tricolor-stripe"></div>

      <header className="gov-utility-bar">
        <div className="gov-utility-inner">
          <div className="gov-utility-left">
            <span className="gov-prototype-tag">DEMO / PROTOTYPE PLATFORM</span>
            <span className="gov-utility-divider">|</span>
            <span style={{ fontWeight: 600 }}>Government Digital Services</span>
            <span className="gov-utility-divider">|</span>
            <button className="gov-utility-item" title="Screen Reader Accessibility">
              Screen Reader Access
            </button>
          </div>
          <div className="gov-utility-right">
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>Text Size:</span>
            <button className="gov-utility-item" onClick={() => applyFontSize('sm')} title="Small Text">A-</button>
            <button className="gov-utility-item" onClick={() => applyFontSize('md')} title="Normal Text">A</button>
            <button className="gov-utility-item" onClick={() => applyFontSize('lg')} title="Large Text">A+</button>
            <span className="gov-utility-divider">|</span>
            <button className="gov-utility-item" onClick={toggleHighContrast} title="Toggle High Contrast">
              <i className="fa-solid fa-circle-half-stroke" style={{ marginRight: '4px' }}></i> Contrast
            </button>
            <span className="gov-utility-divider">|</span>
            <button className="gov-utility-item" onClick={toggleLanguage} title="Switch Language">
              हिंदी | English
            </button>
            <span className="gov-utility-divider">|</span>
            <button className="gov-utility-item" onClick={() => (window as any).startDemoGuide?.()} title="Start Interactive Demo">
              Help
            </button>
            <button className="gov-utility-item" onClick={() => alert('NDIS, Central Complex, New Delhi - 110001')}>
              Contact
            </button>
          </div>
        </div>
      </header>

      <div className="gov-main-header">
        <div className="gov-header-inner">
          <div className="gov-identity-group" onClick={() => router.push('/dashboard')} style={{ cursor: 'pointer' }}>
            <div className="gov-emblem-placeholder">
              <i className="fa-solid fa-building-columns gov-emblem-icon"></i>
              <span className="gov-emblem-text">SERVICES</span>
            </div>
            <div className="gov-titles">
              <div className="gov-org-name">National Digital Investigation Services</div>
              <div className="gov-dept-name">Ministry of Home & Legal Affairs Division</div>
              <div className="gov-app-name">
                <strong>CASEVAULT</strong> — Secure Digital Case & Document Management System
              </div>
            </div>
          </div>

          <div className="gov-header-actions">
            <div className="officer-badge-card">
              <div className="officer-avatar">{currentOfficer?.full_name?.charAt(0) || 'A'}</div>
              <div className="officer-meta">
                <div className="officer-name">{currentOfficer?.full_name || 'A. Sharma'}</div>
                <div className="officer-dept-id">{currentOfficer?.officer_id} • {currentOfficer?.department}</div>
                <select className="role-switcher-select" value={currentOfficer?.officer_id || ''} onChange={(e) => switchToOfficer(e.target.value)}>
                  {officers.map(o => (
                    <option key={o.officer_id} value={o.officer_id}>
                      {o.full_name} ({o.role_id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button className="header-action-btn" title="View Notifications">
              <i className="fa-solid fa-bell"></i><span className="badge-count">3</span>
            </button>

            <button className="header-action-btn" onClick={() => router.push('/')} title="Log Out Session">
              <i className="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
        </div>
      </div>

      <nav className="gov-nav-bar">
        <div className="gov-nav-inner">
          <a href="#" onClick={(e) => { e.preventDefault(); router.push('/dashboard'); }} className={`gov-nav-link ${pathname === '/dashboard' ? 'active' : ''}`}>Dashboard</a>
          <a href="#" onClick={(e) => { e.preventDefault(); router.push('/cases'); }} className={`gov-nav-link ${pathname.startsWith('/cases') ? 'active' : ''}`}>Cases</a>
          <a href="#" onClick={(e) => { e.preventDefault(); router.push('/documents'); }} className={`gov-nav-link ${pathname.startsWith('/documents') && !pathname.includes('cert') ? 'active' : ''}`}>Documents</a>
          <a href="#" onClick={(e) => { e.preventDefault(); router.push('/evidence'); }} className={`gov-nav-link ${pathname.startsWith('/evidence') ? 'active' : ''}`}>Evidence Vault</a>
          <a href="#" onClick={(e) => { e.preventDefault(); router.push('/ai-search'); }} className={`gov-nav-link ${pathname.startsWith('/ai-search') ? 'active' : ''}`}>AI Search</a>
          <a href="#" onClick={(e) => { e.preventDefault(); router.push('/ai-intel'); }} className={`gov-nav-link ${pathname.startsWith('/ai-intel') ? 'active' : ''}`}>AI Intelligence</a>
          <a href="#" onClick={(e) => { e.preventDefault(); router.push('/audit-trail'); }} className={`gov-nav-link ${pathname.startsWith('/audit-trail') ? 'active' : ''}`}>Audit Trail</a>
          <a href="#" onClick={(e) => { e.preventDefault(); router.push('/access-control'); }} className={`gov-nav-link ${pathname.startsWith('/access-control') ? 'active' : ''}`}>Access Control</a>
          <a href="#" onClick={(e) => { e.preventDefault(); router.push('/reports'); }} className={`gov-nav-link ${pathname.startsWith('/reports') ? 'active' : ''}`}>Reports</a>
          <a href="#" onClick={(e) => { e.preventDefault(); router.push('/security-center'); }} className={`gov-nav-link ${pathname.startsWith('/security-center') ? 'active' : ''}`}>Security</a>
          <a href="#" onClick={(e) => { e.preventDefault(); router.push('/api-docs'); }} className={`gov-nav-link ${pathname.startsWith('/api-docs') ? 'active' : ''}`}>API Docs</a>
        </div>
      </nav>

      <main className="gov-main-content">
        {children}
      </main>

      <footer className="gov-footer">
        <div className="gov-footer-inner">
          <div className="gov-footer-top">
            <div>
              <div className="gov-footer-heading">CASEVAULT Platform</div>
              <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.6, marginBottom: '8px' }}>
                National Digital Investigation Services (NDIS). A production-quality prototype platform engineered for lawful evidentiary governance, digital forensics, and tamper-evident custody tracking.
              </p>
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                Complies with Section 65B of Indian Evidence Act & IT Act 2000.
              </div>
            </div>
            <div>
              <div className="gov-footer-heading">Platform Modules</div>
              <ul className="gov-footer-links">
                <li><a href="#" onClick={(e) => { e.preventDefault(); router.push('/cases'); }}>Case Management</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); router.push('/documents'); }}>SHA-256 Vault</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); router.push('/evidence'); }}>Chain of Custody</a></li>
              </ul>
            </div>
          </div>
          <div className="gov-footer-bottom">
            <div>© 2026 National Digital Investigation Services (NDIS), Government of India. Prototype Demonstration Platform.</div>
            <div>Last Updated: 23 September 2026 | FIPS 180-4 SHA-256 Verified</div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>CASEVAULT — Secure Digital Case & Document Management System | Government of India</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className={inter.className}>
        <StateProvider>
          <GovShell>
            {children}
            <DemoGuideOverlay />
          </GovShell>
        </StateProvider>
      </body>
    </html>
  );
}
