"use client";
import { useState } from "react";
import Sidebar from "../components/sidebar";

const mono = { fontFamily: "'JetBrains Mono', monospace" };
const border = "rgb(38,54,76)";
const amber = "rgb(245,158,11)";
const muted = "rgb(148,163,184)";
const card = "rgb(14,22,37)";

const allResults = [
  { id: "FIR-DEL-2026-0421", title: "First Information Report", kind: "Document", case: "State vs. Sharma", snippet: "…accused was found in possession of a firearm near Connaught Place on the night of…", time: "2h ago" },
  { id: "CASE-DEL-2026-001", title: "State vs. Sharma", kind: "Case", case: "—", snippet: "Robbery · Connaught Place PS · IO-DEL-0421 · 12 documents", time: "2h ago" },
  { id: "FSL-RPT-0089", title: "Forensic Lab Report — Ballistics", kind: "Document", case: "State vs. Sharma", snippet: "…ballistic analysis confirms the recovered cartridge matches the weapon serial…", time: "5h ago" },
  { id: "CASE-DEL-2026-002", title: "State vs. Mehta", kind: "Case", case: "—", snippet: "Fraud · Lajpat Nagar PS · IO-DEL-0388 · 8 documents", time: "1d ago" },
  { id: "CS-DEL-2026-0112", title: "Charge Sheet — Section 302 IPC", kind: "Document", case: "State vs. Mehta", snippet: "…charge sheet filed under Section 302 read with Section 34 of the Indian Penal Code…", time: "1d ago" },
  { id: "CASE-BLR-2026-019", title: "State vs. Reddy", kind: "Case", case: "—", snippet: "Homicide · Whitefield PS · IO-BLR-0055 · 34 documents", time: "30m ago" },
];

const kindColor: Record<string, string> = { Document: "rgb(99,102,241)", Case: amber };

export default function GlobalSearchPage() {
  const [query, setQuery] = useState("");
  const results = query.length > 1
    ? allResults.filter((r) => r.title.toLowerCase().includes(query.toLowerCase()) || r.snippet.toLowerCase().includes(query.toLowerCase()) || r.id.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <div className="min-h-screen bg-background text-foreground flex" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="px-8 py-4" style={{ borderBottom: `1px solid ${border}` }}>
          <p className="text-[11px] font-semibold tracking-[1.2px]" style={{ ...mono, color: amber }}>GOVERNANCE</p>
          <h1 className="text-xl font-medium mt-0.5" style={{ fontFamily: "Outfit" }}>Global Search</h1>
        </header>
        <main className="flex-1 px-8 py-8">
          {/* Search bar */}
          <div className="relative mb-8 max-w-2xl">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              autoFocus
              className="w-full h-12 pl-11 pr-4 text-sm"
              style={{ background: card, border: `1px solid ${query ? amber : border}`, color: "rgb(248,250,252)", outline: "none", transition: "border-color 0.15s" }}
              placeholder="Search cases, documents, FIR numbers, IPC sections, names…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs" style={{ ...mono, color: muted }}>{results.length} result{results.length !== 1 ? "s" : ""}</span>}
          </div>

          {query.length > 1 && results.length === 0 && (
            <p className="text-sm" style={{ color: muted }}>No results found for "<span style={{ color: amber }}>{query}</span>"</p>
          )}

          {query.length <= 1 && (
            <p className="text-sm" style={{ color: muted }}>Type at least 2 characters to search across all cases and documents.</p>
          )}

          <div className="space-y-3">
            {results.map((r) => (
              <div key={r.id} className="p-5 cursor-pointer hover:bg-[rgb(11,15,23)] transition-colors" style={{ border: `1px solid ${border}`, background: card }}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5" style={{ ...mono, color: kindColor[r.kind], border: `1px solid ${kindColor[r.kind]}`, background: `${kindColor[r.kind]}14` }}>{r.kind.toUpperCase()}</span>
                  <span className="text-xs font-semibold" style={{ ...mono, color: amber }}>{r.id}</span>
                  <span className="ml-auto text-xs" style={{ ...mono, color: "rgb(100,116,139)" }}>{r.time}</span>
                </div>
                <p className="text-sm font-medium mb-1" style={{ color: "rgb(248,250,252)" }}>{r.title}</p>
                {r.case !== "—" && <p className="text-xs mb-1" style={{ ...mono, color: muted }}>Case: {r.case}</p>}
                <p className="text-xs" style={{ color: muted }}>{r.snippet}</p>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
