"use client";
import { useState } from "react";
import Sidebar from "../components/sidebar";

const mono = { fontFamily: "'JetBrains Mono', monospace" };
const border = "rgb(38,54,76)";
const amber = "rgb(245,158,11)";
const muted = "rgb(148,163,184)";
const card = "rgb(14,22,37)";
const green = "rgb(16,185,129)";

const docs = ["FIR-DEL-2026-0421", "FSL-RPT-0089", "CS-DEL-2026-0112"];

const chains: Record<string, { actor: string; role: string; action: string; time: string; hash: string }[]> = {
  "FIR-DEL-2026-0421": [
    { actor: "IO-DEL-0421", role: "Investigating Officer", action: "DOCUMENT_UPLOAD", time: "11-Sep-2026 08:14", hash: "a3f9…c12e" },
    { actor: "IO-DEL-0421", role: "Investigating Officer", action: "DOCUMENT_SIGN", time: "11-Sep-2026 08:17", hash: "b12c…44fa" },
    { actor: "BLOCKCHAIN", role: "System", action: "HASH_ANCHORED", time: "11-Sep-2026 08:18", hash: "tx:0xd4e5…f6a7" },
    { actor: "IO-DEL-0388", role: "Investigating Officer", action: "DOCUMENT_VIEW", time: "11-Sep-2026 10:02", hash: "c99d…1b3a" },
  ],
  "FSL-RPT-0089": [
    { actor: "FSL-ANALYST-007", role: "Forensic Analyst", action: "DOCUMENT_UPLOAD", time: "11-Sep-2026 06:30", hash: "b81d…44fa" },
    { actor: "BLOCKCHAIN", role: "System", action: "HASH_ANCHORED", time: "11-Sep-2026 06:31", hash: "tx:0xe2f3…a4b5" },
    { actor: "IO-DEL-0421", role: "Investigating Officer", action: "DOCUMENT_VIEW", time: "11-Sep-2026 09:45", hash: "d00e…2c1f" },
  ],
  "CS-DEL-2026-0112": [
    { actor: "IO-DEL-0388", role: "Investigating Officer", action: "DOCUMENT_UPLOAD", time: "10-Sep-2026 17:22", hash: "e02c…9a3b" },
    { actor: "CLERK-DEL-003", role: "Court Clerk", action: "DOCUMENT_VIEW", time: "10-Sep-2026 18:05", hash: "f11b…8d2c" },
  ],
};

const actionColor: Record<string, string> = {
  DOCUMENT_UPLOAD: green, DOCUMENT_SIGN: amber, HASH_ANCHORED: "rgb(99,102,241)", DOCUMENT_VIEW: muted,
};

export default function CustodyChainPage() {
  const [selected, setSelected] = useState(docs[0]);
  const chain = chains[selected];

  return (
    <div className="min-h-screen bg-background text-foreground flex" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="px-8 py-4" style={{ borderBottom: `1px solid ${border}` }}>
          <p className="text-[11px] font-semibold tracking-[1.2px]" style={{ ...mono, color: amber }}>OPERATIONS</p>
          <h1 className="text-xl font-medium mt-0.5" style={{ fontFamily: "Outfit" }}>Custody Chain</h1>
        </header>
        <main className="flex-1 px-8 py-8 flex gap-6">
          {/* Doc selector */}
          <div className="w-64 shrink-0" style={{ border: `1px solid ${border}`, background: card, alignSelf: "flex-start" }}>
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${border}` }}>
              <p className="text-[11px] font-semibold tracking-[1.2px]" style={{ ...mono, color: amber }}>SELECT DOCUMENT</p>
            </div>
            {docs.map((d) => (
              <button key={d} onClick={() => setSelected(d)} className="w-full text-left px-5 py-3 text-xs transition-colors hover:bg-[rgb(11,15,23)]"
                style={{ ...mono, color: selected === d ? amber : muted, borderLeft: selected === d ? `2px solid ${amber}` : "2px solid transparent", background: selected === d ? "rgb(11,15,23)" : "transparent" }}>
                {d}
              </button>
            ))}
          </div>

          {/* Timeline */}
          <div className="flex-1">
            <p className="text-[11px] font-semibold tracking-[1.2px] mb-6" style={{ ...mono, color: amber }}>CHAIN OF CUSTODY — {selected}</p>
            <div className="relative pl-8">
              {/* vertical line */}
              <div className="absolute left-3 top-2 bottom-2 w-px" style={{ background: border }} />
              {chain.map((e, i) => (
                <div key={i} className="relative mb-6">
                  <div className="absolute -left-5 top-1 w-3 h-3 rounded-full border-2" style={{ background: "rgb(11,15,23)", borderColor: actionColor[e.action] ?? muted }} />
                  <div className="p-4" style={{ border: `1px solid ${border}`, background: card }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5" style={{ ...mono, color: actionColor[e.action] ?? muted, border: `1px solid ${actionColor[e.action] ?? muted}`, background: `${actionColor[e.action] ?? muted}14` }}>{e.action}</span>
                      <span className="text-xs" style={{ ...mono, color: "rgb(100,116,139)" }}>{e.time}</span>
                    </div>
                    <p className="text-sm mb-1" style={{ color: "rgb(203,213,225)" }}>{e.actor} <span style={{ color: muted }}>({e.role})</span></p>
                    <p className="text-xs" style={{ ...mono, color: "rgb(100,116,139)" }}>Entry hash: {e.hash}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
