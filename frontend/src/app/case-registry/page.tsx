"use client";
import { useState } from "react";
import Sidebar from "../components/sidebar";

const mono = { fontFamily: "'JetBrains Mono', monospace" };
const border = "rgb(38,54,76)";
const amber = "rgb(245,158,11)";
const muted = "rgb(148,163,184)";
const card = "rgb(14,22,37)";

const cases = [
  { id: "CASE-DEL-2026-001", title: "State vs. Sharma", type: "Robbery", station: "Connaught Place", io: "IO-DEL-0421", status: "Active", docs: 12, updated: "2h ago" },
  { id: "CASE-DEL-2026-002", title: "State vs. Mehta", type: "Fraud", station: "Lajpat Nagar", io: "IO-DEL-0388", status: "Active", docs: 8, updated: "1d ago" },
  { id: "CASE-DEL-2026-003", title: "State vs. Kapoor", type: "Assault", station: "Dwarka", io: "IO-DEL-0412", status: "Closed", docs: 21, updated: "3d ago" },
  { id: "CASE-MUM-2026-041", title: "State vs. Patil", type: "Cybercrime", station: "Bandra", io: "IO-MUM-0091", status: "Active", docs: 5, updated: "4h ago" },
  { id: "CASE-MUM-2026-042", title: "State vs. Desai", type: "Narcotics", station: "Andheri", io: "IO-MUM-0102", status: "Under Review", docs: 17, updated: "6h ago" },
  { id: "CASE-BLR-2026-019", title: "State vs. Reddy", type: "Homicide", station: "Whitefield", io: "IO-BLR-0055", status: "Active", docs: 34, updated: "30m ago" },
];
const statusColor: Record<string, string> = {
  Active: "rgb(16,185,129)", Closed: muted, "Under Review": amber,
};

export default function CaseRegistryPage() {
  const [query, setQuery] = useState("");
  const filtered = cases.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.id.toLowerCase().includes(query.toLowerCase()) ||
    c.type.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="px-8 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${border}` }}>
          <div>
            <p className="text-[11px] font-semibold tracking-[1.2px]" style={{ ...mono, color: amber }}>OPERATIONS</p>
            <h1 className="text-xl font-medium mt-0.5" style={{ fontFamily: "Outfit" }}>Case Registry</h1>
          </div>
          <button className="px-4 py-2 text-xs font-bold" style={{ ...mono, background: amber, color: "rgb(17,24,39)" }}>+ New Case</button>
        </header>
        <main className="flex-1 px-8 py-8">
          <input
            className="w-full max-w-md h-10 px-4 mb-6 text-sm"
            style={{ background: card, border: `1px solid ${border}`, color: "rgb(248,250,252)", outline: "none" }}
            placeholder="Search by case ID, title, or type…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div style={{ border: `1px solid ${border}`, background: card }}>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${border}` }}>
                  {["Case ID", "Title", "Type", "Station", "IO", "Docs", "Status", "Updated"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold tracking-[1px]" style={{ ...mono, color: muted }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-[rgb(11,15,23)] cursor-pointer transition-colors" style={{ borderBottom: `1px solid ${border}` }}>
                    <td className="px-5 py-3 text-xs" style={{ ...mono, color: amber }}>{c.id}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: "rgb(203,213,225)" }}>{c.title}</td>
                    <td className="px-5 py-3 text-xs" style={{ ...mono, color: muted }}>{c.type}</td>
                    <td className="px-5 py-3 text-xs" style={{ ...mono, color: muted }}>{c.station}</td>
                    <td className="px-5 py-3 text-xs" style={{ ...mono, color: muted }}>{c.io}</td>
                    <td className="px-5 py-3 text-xs text-center" style={{ ...mono, color: "rgb(203,213,225)" }}>{c.docs}</td>
                    <td className="px-5 py-3 text-xs font-semibold" style={{ ...mono, color: statusColor[c.status] }}>{c.status.toUpperCase()}</td>
                    <td className="px-5 py-3 text-xs" style={{ ...mono, color: "rgb(100,116,139)" }}>{c.updated}</td>
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
