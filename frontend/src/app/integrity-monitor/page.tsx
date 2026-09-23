"use client";
import { useState } from "react";
import Sidebar from "../components/sidebar";

const mono = { fontFamily: "'JetBrains Mono', monospace" };
const border = "rgb(38,54,76)";
const amber = "rgb(245,158,11)";
const muted = "rgb(148,163,184)";
const card = "rgb(14,22,37)";
const green = "rgb(16,185,129)";
const red = "rgb(239,68,68)";

const records = [
  { id: "FIR-DEL-2026-0421", stored: "a3f9b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0c12e", chain: "a3f9b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0c12e", pass: true, lastVerified: "10m ago" },
  { id: "FSL-RPT-0089", stored: "b81d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c244fa", chain: "b81d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c244fa", pass: true, lastVerified: "1h ago" },
  { id: "CS-DEL-2026-0112", stored: "e02c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b09a3b", chain: "PENDING", pass: null, lastVerified: "Never" },
  { id: "WS-DEL-2026-0033", stored: "f77a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f71c90", chain: "f77a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f71c90", pass: true, lastVerified: "2h ago" },
];

export default function IntegrityMonitorPage() {
  const [verifying, setVerifying] = useState<string | null>(null);
  const [verified, setVerified] = useState<string[]>([]);

  function verify(id: string) {
    setVerifying(id);
    setTimeout(() => { setVerifying(null); setVerified((v) => [...v, id]); }, 1200);
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="px-8 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${border}` }}>
          <div>
            <p className="text-[11px] font-semibold tracking-[1.2px]" style={{ ...mono, color: amber }}>OPERATIONS</p>
            <h1 className="text-xl font-medium mt-0.5" style={{ fontFamily: "Outfit" }}>Integrity Monitor</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: green, boxShadow: `0 0 0 3px rgba(16,185,129,0.2)` }} />
            <span className="text-xs" style={{ ...mono, color: green }}>ALL SYSTEMS NOMINAL</span>
          </div>
        </header>
        <main className="flex-1 px-8 py-8">
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[{ label: "Total Verified", value: "1,284", color: green }, { label: "Pending Anchor", value: "1", color: amber }, { label: "Tamper Detected", value: "0", color: green }].map((s) => (
              <div key={s.label} className="p-5" style={{ border: `1px solid ${border}`, background: card }}>
                <p className="text-xs mb-2" style={{ ...mono, color: muted }}>{s.label.toUpperCase()}</p>
                <p className="text-3xl font-medium" style={{ fontFamily: "Outfit", color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
          <div style={{ border: `1px solid ${border}`, background: card }}>
            <div className="px-6 py-4" style={{ borderBottom: `1px solid ${border}` }}>
              <p className="text-[11px] font-semibold tracking-[1.2px]" style={{ ...mono, color: amber }}>HASH VERIFICATION RECORDS</p>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${border}` }}>
                  {["Document ID", "Stored Hash", "On-Chain Hash", "Result", "Last Verified", "Action"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold" style={{ ...mono, color: muted }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const justVerified = verified.includes(r.id);
                  const pass = justVerified ? true : r.pass;
                  return (
                    <tr key={r.id} style={{ borderBottom: `1px solid ${border}` }}>
                      <td className="px-5 py-4 text-xs" style={{ ...mono, color: amber }}>{r.id}</td>
                      <td className="px-5 py-4 text-xs" style={{ ...mono, color: "rgb(100,116,139)" }}>{r.stored.slice(0, 16)}…</td>
                      <td className="px-5 py-4 text-xs" style={{ ...mono, color: r.chain === "PENDING" ? amber : "rgb(100,116,139)" }}>{r.chain === "PENDING" ? "PENDING" : r.chain.slice(0, 16) + "…"}</td>
                      <td className="px-5 py-4 text-xs font-bold" style={{ ...mono, color: pass === null ? muted : pass ? green : red }}>
                        {pass === null ? "—" : pass ? "✓ PASS" : "✗ FAIL"}
                      </td>
                      <td className="px-5 py-4 text-xs" style={{ ...mono, color: "rgb(100,116,139)" }}>{justVerified ? "just now" : r.lastVerified}</td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => verify(r.id)}
                          disabled={verifying === r.id}
                          className="text-xs px-3 py-1 transition-colors"
                          style={{ ...mono, border: `1px solid ${amber}`, color: amber, background: "transparent", opacity: verifying === r.id ? 0.5 : 1 }}
                        >
                          {verifying === r.id ? "Verifying…" : "Verify"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
