"use client";
import { useState } from "react";
import Sidebar from "../components/sidebar";

const mono = { fontFamily: "'JetBrains Mono', monospace" };
const border = "rgb(38,54,76)";
const amber = "rgb(245,158,11)";
const muted = "rgb(148,163,184)";
const card = "rgb(14,22,37)";
const green = "rgb(16,185,129)";

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className="w-10 h-5 rounded-full relative transition-colors" style={{ background: on ? amber : "rgb(38,54,76)" }}>
      <span className="absolute top-0.5 w-4 h-4 rounded-full transition-all" style={{ background: "rgb(11,15,23)", left: on ? "calc(100% - 18px)" : "2px" }} />
    </button>
  );
}

export default function SettingsPage() {
  const [mfa, setMfa] = useState(true);
  const [sessionAlert, setSessionAlert] = useState(true);
  const [emailNotif, setEmailNotif] = useState(false);
  const [auditExport, setAuditExport] = useState(true);
  const [saved, setSaved] = useState(false);

  function save() { setSaved(true); setTimeout(() => setSaved(false), 2000); }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-6" style={{ border: `1px solid ${border}`, background: card }}>
      <div className="px-6 py-4" style={{ borderBottom: `1px solid ${border}` }}>
        <p className="text-[11px] font-semibold tracking-[1.2px]" style={{ ...mono, color: amber }}>{title}</p>
      </div>
      <div className="px-6 py-4 space-y-4">{children}</div>
    </div>
  );

  const Row = ({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm" style={{ color: "rgb(203,213,225)" }}>{label}</p>
        {sub && <p className="text-xs mt-0.5" style={{ ...mono, color: muted }}>{sub}</p>}
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="px-8 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${border}` }}>
          <div>
            <p className="text-[11px] font-semibold tracking-[1.2px]" style={{ ...mono, color: amber }}>GOVERNANCE</p>
            <h1 className="text-xl font-medium mt-0.5" style={{ fontFamily: "Outfit" }}>Settings</h1>
          </div>
        </header>
        <main className="flex-1 px-8 py-8 max-w-2xl">
          <Section title="ACCOUNT">
            <Row label="Badge Number" sub="Cannot be changed"><span className="text-xs px-3 py-1" style={{ ...mono, color: amber, border: `1px solid ${border}`, background: "rgb(11,15,23)" }}>IO-DEL-0421</span></Row>
            <Row label="Department" sub="Assigned by Admin"><span className="text-xs" style={{ ...mono, color: muted }}>Delhi Police</span></Row>
            <Row label="Email" sub="Used for notifications"><input defaultValue="officer@delhipolice.gov.in" className="text-xs px-3 py-1.5 w-64" style={{ ...mono, background: "rgb(11,15,23)", border: `1px solid ${border}`, color: "rgb(248,250,252)", outline: "none" }} /></Row>
          </Section>

          <Section title="SECURITY">
            <Row label="MFA (TOTP)" sub="Google Authenticator / Authy"><Toggle on={mfa} onChange={() => setMfa(!mfa)} /></Row>
            <Row label="New session alerts" sub="Email on login from new IP"><Toggle on={sessionAlert} onChange={() => setSessionAlert(!sessionAlert)} /></Row>
            <Row label="Change password" sub="Min 12 chars, complexity required">
              <button className="text-xs px-3 py-1.5" style={{ ...mono, border: `1px solid ${border}`, color: muted }}>Change →</button>
            </Row>
            <Row label="Active sessions" sub="2 active sessions">
              <button className="text-xs px-3 py-1.5" style={{ ...mono, border: `1px solid rgb(239,68,68)`, color: "rgb(239,68,68)" }}>Revoke all</button>
            </Row>
          </Section>

          <Section title="NOTIFICATIONS">
            <Row label="Email notifications" sub="Receive sign requests and shares by email"><Toggle on={emailNotif} onChange={() => setEmailNotif(!emailNotif)} /></Row>
            <Row label="Audit export alerts" sub="Notify when audit export is ready"><Toggle on={auditExport} onChange={() => setAuditExport(!auditExport)} /></Row>
          </Section>

          <Section title="SYSTEM">
            <Row label="App version" sub=""><span className="text-xs" style={{ ...mono, color: muted }}>v1.0.0-mvp</span></Row>
            <Row label="Blockchain network" sub=""><span className="text-xs" style={{ ...mono, color: green }}>● Ganache local · Block #1,284</span></Row>
            <Row label="Encryption" sub=""><span className="text-xs" style={{ ...mono, color: green }}>AES-256-GCM at rest · TLS 1.3 in transit</span></Row>
          </Section>

          <div className="flex items-center gap-4">
            <button onClick={save} className="px-6 py-2 text-xs font-bold" style={{ ...mono, background: amber, color: "rgb(17,24,39)" }}>Save Changes</button>
            {saved && <span className="text-xs" style={{ ...mono, color: green }}>✓ Saved</span>}
          </div>
        </main>
      </div>
    </div>
  );
}
