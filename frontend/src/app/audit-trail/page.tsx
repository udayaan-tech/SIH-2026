"use client";
import { useState } from "react";
import Sidebar from "../components/sidebar";

const mono = { fontFamily: "'JetBrains Mono', monospace" };
const border = "rgb(38,54,76)";
const amber = "rgb(245,158,11)";
const muted = "rgb(148,163,184)";
const card = "rgb(14,22,37)";
const green = "rgb(16,185,129)";

const events = [
  { id: "EVT-001", actor: "IO-DEL-0421", role: "Investigating Officer", action: "LOGIN", resource: "—", case: "—", ip: "103.21.44.12", time: "11-Sep-2026 08:10", hash: "a1b2…c3d4" },
  { id: "EVT-002", actor: "IO-DEL-0421", role: "Investigating Officer", action: "DOCUMENT_UPLOAD", resource: "FIR-DEL-2026-0421", case: "CASE-DEL-2026-001", ip: "103.21.44.12", time: "11-Sep-2026 08:14", hash: "b2c3…d4e5" },
  { id: "EVT-003", actor: "IO-DEL-0421", role: "Investigating Officer", action: "DOCUMENT_SIGN", resource: "FIR-DEL-2026-0421", case: "CASE-DEL-2026-001", ip: "103.21.44.12", time: "11-Sep-2026 08:17", hash: "c3d4…e5f6" },
  { id: "EVT-004", actor: "SYSTEM", role: "System", action: "HASH_ANCHORED", resource: "FIR-DEL-2026-0421", case: "CASE-DEL-2026-001", ip: "internal", time: "11-Sep-2026 08:18", hash: "d4e5…f6a7" },
  { id: "EVT-005", actor: "FSL-ANALYST-007", role: "Forensic Analyst", action: "DOCUMENT_UPLOAD", resource: "FSL-RPT-0089", case: "CASE-DEL-2026-001", ip: "10.0.1.55", time: "11-Sep-2026 06:30", hash: "e5f6…a7b8" },
  { id: "EVT-006", actor: "IO-DEL-0388", role: "Investigating Officer", action: "DOCUMENT_VIEW", resource: "FIR-DEL-2026-0421", case: "CASE-DEL-2026-001", ip: "103.21.44.99", time: "11-Sep-2026 10:02", hash: "f6a7…b8c9" },
  { id: "EVT-007", actor: "CLERK-DEL-003", role: "Court Clerk", action: "DOCUMENT_SHARE", resource: "CS-DEL-2026-0112", case: "CASE-DEL-2026-002", ip: "10.0.2.11", time: "11-Sep-2026 11:30", hash: "a7b8…c9d0" },
  { id: "EVT-008", actor: "IO-DEL-0421", role: "Investigating Officer", action: "INTEGRITY_VERIFY", resource: "FSL-RPT-0089", case: "CASE-DEL-2026-001", ip: "103.21.44.12", time: "11-Sep-2026 12:00", hash: "b8c9…d0e1" },
];

const actionColor: Record<string, string> = {
  LOGIN: green, DOCUMENT_UPLOAD: "rgb(99,102,241)", DOCUMENT_SIGN: amber,
  HASH_ANCHORED: green, DOCUMENT_VIEW: muted, DOCUMENT_SHARE: "rgb(236,72,153)",
  INTEGRITY_VERIFY: green,
};

const allActions = ["ALL", ...Array.from(new Set(events.map((e) => e.action)))];

export default function AuditTrailPage() {
  const [filter, setFilter] = useState("ALL");
  const [query, setQuery] = useState("");

  const filtered = events.filter((e) =>
    (filter === "ALL" || e.action === filter) &&
    (query === "" || e.actor.toLowerCase().includes(query.toLowerCase()) || e.resource.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="px-8 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${border}` }}>
          <div>
            <p className="text-[11px] font-semibold tracking-[1.2px]" style={{ ...mono, color: amber }}>GOVERNANCE</p>
            <h1 className="text-xl font-medium mt-0.5" style={{ fontFamily: "Outfit" }}>Audit Trail</h1>
          </div>
          <span className="text-xs px-2 py-1" style={{ ...mono, color: green, border: `1px solid ${green}`, background: `${green}14` }}>APPEND-ONLY · TAMPER-PROOF</span>
        </header>
        <main className="flex-1 px-8 py-8">
          {/* Filters */}
          <div className="flex gap-3 mb-6 flex-wrap">
            <input
              className="h-9 px-3 text-xs w-56"
              style={{ background: card, border: `1px solid ${border}`, color: "rgb(248,250,252)", outline: "none" }}
              placeholder="Filter by actor or resource…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {allActions.map((a) => (
              <button key={a} onClick={() => setFilter(a)} className="h-9 px-3 text-[10px] font-bold transition-colors"
                style={{ ...mono, border: `1px solid ${filter === a ? amber : border}`, color: filter === a ? amber : muted, background: filter === a ? "rgba(245,158,11,0.08)" : card }}>
                {a}
              </button>
            ))}
          </div>

          <div style={{ border: `1px solid ${border}`, background: card }}>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${border}` }}>
                  {["Event ID", "Actor", "Role", "Action", "Resource", "Case", "IP", "Time", "Hash"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold" style={{ ...mono, color: muted }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} style={{ borderBottom: `1px solid ${border}` }}>
                    <td className="px-4 py-3 text-xs" style={{ ...mono, color: "rgb(100,116,139)" }}>{e.id}</td>
                    <td className="px-4 py-3 text-xs" style={{ ...mono, color: amber }}>{e.actor}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: muted }}>{e.role}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-1.5 py-0.5" style={{ ...mono, color: actionColor[e.action] ?? muted, border: `1px solid ${actionColor[e.action] ?? muted}`, background: `${actionColor[e.action] ?? muted}14` }}>{e.action}</span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ ...mono, color: "rgb(203,213,225)" }}>{e.resource}</td>
                    <td className="px-4 py-3 text-xs" style={{ ...mono, color: muted }}>{e.case}</td>
                    <td className="px-4 py-3 text-xs" style={{ ...mono, color: "rgb(100,116,139)" }}>{e.ip}</td>
                    <td className="px-4 py-3 text-xs" style={{ ...mono, color: "rgb(100,116,139)" }}>{e.time}</td>
                    <td className="px-4 py-3 text-xs" style={{ ...mono, color: "rgb(100,116,139)" }}>{e.hash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
