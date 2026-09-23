"use client";
import { useState } from "react";
import Sidebar from "../components/sidebar";

const mono = { fontFamily: "'JetBrains Mono', monospace" };
const border = "rgb(38,54,76)";
const amber = "rgb(245,158,11)";
const muted = "rgb(148,163,184)";
const card = "rgb(14,22,37)";
const green = "rgb(16,185,129)";

const roles = [
  { id: "inspector", label: "Inspector / IO", badge: "IO-DEL-0421", dept: "Delhi Police", perms: ["Upload FIRs", "Sign documents", "Share with forensics/court", "View own cases", "Verify integrity"] },
  { id: "forensic", label: "Forensic Analyst", badge: "FSL-ANALYST-007", dept: "FSL Delhi", perms: ["Upload forensic reports", "Sign reports", "Share with police", "View assigned cases"] },
  { id: "clerk", label: "Court Clerk", badge: "CLERK-DEL-003", dept: "Delhi District Court", perms: ["Register filings", "Assign to judge", "Share documents", "View dockets"] },
  { id: "judge", label: "Judge / Magistrate", badge: "JUDGE-DEL-001", dept: "Delhi High Court", perms: ["View all case docs", "Digitally sign orders", "Verify integrity", "Legal hold"] },
  { id: "auditor", label: "Auditor", badge: "AUDIT-NCRB-01", dept: "NCRB", perms: ["Full audit trail view", "Read-only access", "Verify integrity", "Export reports"] },
  { id: "admin", label: "System Admin", badge: "ADMIN-NCRB-01", dept: "NCRB IT Cell", perms: ["Manage users & roles", "System config", "Soft delete", "All permissions"] },
];

export default function RoleSwitcherPage() {
  const [active, setActive] = useState("inspector");
  const [switching, setSwitching] = useState(false);
  const [switched, setSwitched] = useState(false);

  function switchRole(id: string) {
    setActive(id);
    setSwitching(true);
    setSwitched(false);
    setTimeout(() => { setSwitching(false); setSwitched(true); }, 800);
  }

  const current = roles.find((r) => r.id === active)!;

  return (
    <div className="min-h-screen bg-background text-foreground flex" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="px-8 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${border}` }}>
          <div>
            <p className="text-[11px] font-semibold tracking-[1.2px]" style={{ ...mono, color: amber }}>GOVERNANCE</p>
            <h1 className="text-xl font-medium mt-0.5" style={{ fontFamily: "Outfit" }}>Role Switcher</h1>
          </div>
          <span className="text-xs px-2 py-1" style={{ ...mono, color: amber, border: `1px solid ${amber}`, background: "rgba(245,158,11,0.08)" }}>DEMO MODE</span>
        </header>
        <main className="flex-1 px-8 py-8 flex gap-6">
          {/* Role cards */}
          <div className="grid grid-cols-2 gap-4 flex-1 content-start">
            {roles.map((r) => (
              <button key={r.id} onClick={() => switchRole(r.id)} className="text-left p-5 transition-all"
                style={{ border: `1px solid ${active === r.id ? amber : border}`, background: active === r.id ? "rgba(245,158,11,0.06)" : card }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium" style={{ color: active === r.id ? amber : "rgb(248,250,252)" }}>{r.label}</p>
                  {active === r.id && <span className="text-[10px] font-bold px-1.5 py-0.5" style={{ ...mono, color: green, border: `1px solid ${green}`, background: `${green}14` }}>ACTIVE</span>}
                </div>
                <p className="text-xs mb-1" style={{ ...mono, color: amber }}>{r.badge}</p>
                <p className="text-xs" style={{ ...mono, color: muted }}>{r.dept}</p>
              </button>
            ))}
          </div>

          {/* Active role detail */}
          <div className="w-72 shrink-0">
            <div className="p-6" style={{ border: `1px solid ${border}`, background: card }}>
              <p className="text-[11px] font-semibold tracking-[1.2px] mb-4" style={{ ...mono, color: amber }}>ACTIVE ROLE PERMISSIONS</p>
              <p className="text-base font-medium mb-1" style={{ fontFamily: "Outfit" }}>{current.label}</p>
              <p className="text-xs mb-4" style={{ ...mono, color: muted }}>{current.badge} · {current.dept}</p>
              <div className="space-y-2">
                {current.perms.map((p) => (
                  <div key={p} className="flex items-center gap-2">
                    <span style={{ color: green }}>✓</span>
                    <span className="text-xs" style={{ color: "rgb(203,213,225)" }}>{p}</span>
                  </div>
                ))}
              </div>
              {switching && <p className="mt-4 text-xs" style={{ ...mono, color: amber }}>Switching role…</p>}
              {switched && !switching && <p className="mt-4 text-xs" style={{ ...mono, color: green }}>✓ Role switched. Session updated.</p>}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
