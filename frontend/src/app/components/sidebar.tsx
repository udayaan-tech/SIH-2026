"use client";

import { useRouter, usePathname } from "next/navigation";

const ops = [
  { label: "Command Center", href: "/command-center", icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
  )},
  { label: "Case Registry", href: "/case-registry", icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="1"/><path d="M8 4v16M2 9h6"/></svg>
  )},
  { label: "Document Vault", href: "/document-vault", icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
  )},
  { label: "Integrity Monitor", href: "/integrity-monitor", icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M9 6.8a6 6 0 0 1 9 5.2v2"/><path d="M2 12a10 10 0 0 1 18-6"/></svg>
  )},
  { label: "Redaction Review", href: "/redaction-review", icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><line x1="3" y1="3" x2="21" y2="21"/></svg>
  )},
  { label: "Custody Chain", href: "/custody-chain", icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
  )},
  { label: "National Analytics", href: "/national-analytics", icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  )},
];

const gov = [
  { label: "Global Search", href: "/global-search", icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
  )},
  { label: "Claude Copilot", href: "/claude-copilot", icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
  )},
  { label: "Notifications", href: "/notifications", icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
  )},
  { label: "Audit Trail", href: "/audit-trail", icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
  )},
  { label: "Role Switcher", href: "/role-switcher", icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  )},
  { label: "Settings", href: "/settings", icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  )},
];

const mono = { fontFamily: "'JetBrains Mono', monospace" };
const amber = "rgb(245,158,11)";
const muted = "rgb(148,163,184)";
const border = "rgb(38,54,76)";
const activeBg = "rgb(14,22,37)";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  function NavItem({ label, href, icon }: { label: string; href: string; icon: React.ReactNode }) {
    const active = pathname === href;
    return (
      <button
        onClick={() => router.push(href)}
        className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm transition-colors"
        style={{
          color: active ? "rgb(248,250,252)" : muted,
          background: active ? activeBg : "transparent",
          borderLeft: active ? `2px solid ${amber}` : "2px solid transparent",
        }}
      >
        <span style={{ color: active ? amber : muted, flexShrink: 0 }}>{icon}</span>
        {label}
      </button>
    );
  }

  return (
    <aside className="w-64 min-h-screen flex flex-col py-8 px-4 shrink-0" style={{ borderRight: `1px solid ${border}` }}>
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8 px-1">
        <div className="w-7 h-7 flex items-center justify-center" style={{ border: `1px solid ${amber}`, color: amber }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/>
            <path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>
            <path d="M2 12a10 10 0 0 1 18-6"/>
          </svg>
        </div>
        <span className="font-bold text-sm" style={{ ...mono, color: amber }}>NYAY SURAKSHA</span>
      </div>

      {/* OPERATIONS */}
      <p className="px-3 mb-2 text-[10px] font-semibold tracking-[1.5px]" style={{ ...mono, color: muted }}>OPERATIONS</p>
      <div className="flex flex-col gap-0.5 mb-6">
        {ops.map((item) => <NavItem key={item.href} {...item} />)}
      </div>

      {/* GOVERNANCE */}
      <p className="px-3 mb-2 text-[10px] font-semibold tracking-[1.5px]" style={{ ...mono, color: muted }}>GOVERNANCE</p>
      <div className="flex flex-col gap-0.5 flex-1">
        {gov.map((item) => <NavItem key={item.href} {...item} />)}
      </div>

      {/* Sign out */}
      <button
        onClick={() => router.push("/")}
        className="flex items-center gap-2 px-3 py-2 text-xs mt-4 transition-colors hover:text-foreground"
        style={{ ...mono, color: muted }}
      >
        ← Sign Out
      </button>
    </aside>
  );
}
