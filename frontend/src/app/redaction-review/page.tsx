"use client";
import { useState } from "react";
import Sidebar from "../components/sidebar";

const mono = { fontFamily: "'JetBrains Mono', monospace" };
const border = "rgb(38,54,76)";
const amber = "rgb(245,158,11)";
const muted = "rgb(148,163,184)";
const card = "rgb(14,22,37)";

const pending = [
  { id: "WS-DEL-2026-0033", name: "Witness Statement — Ravi Kumar", requestedBy: "IO-DEL-0421", reason: "Witness protection — identity concealment", status: "Pending" },
  { id: "FIR-DEL-2026-0421", name: "First Information Report", requestedBy: "IO-DEL-0388", reason: "Victim minor — personal details", status: "Pending" },
  { id: "FSL-RPT-0089", name: "Forensic Lab Report", requestedBy: "IO-DEL-0412", reason: "Informant identity", status: "Approved" },
];

export default function RedactionReviewPage() {
  const [selected, setSelected] = useState(pending[0]);
  const [statuses, setStatuses] = useState<Record<string, string>>({});

  function act(id: string, action: "Approved" | "Rejected") {
    setStatuses((s) => ({ ...s, [id]: action }));
  }

  const statusColor: Record<string, string> = { Pending: amber, Approved: "rgb(16,185,129)", Rejected: "rgb(239,68,68)" };

  return (
    <div className="min-h-screen bg-background text-foreground flex" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="px-8 py-4" style={{ borderBottom: `1px solid ${border}` }}>
          <p className="text-[11px] font-semibold tracking-[1.2px]" style={{ ...mono, color: amber }}>OPERATIONS</p>
          <h1 className="text-xl font-medium mt-0.5" style={{ fontFamily: "Outfit" }}>Redaction Review</h1>
        </header>
        <main className="flex-1 px-8 py-8 flex gap-6">
          {/* Queue */}
          <div className="w-80 shrink-0" style={{ border: `1px solid ${border}`, background: card }}>
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${border}` }}>
              <p className="text-[11px] font-semibold tracking-[1.2px]" style={{ ...mono, color: amber }}>REDACTION QUEUE</p>
            </div>
            <div className="divide-y" style={{ borderColor: border }}>
              {pending.map((p) => {
                const st = statuses[p.id] ?? p.status;
                return (
                  <button key={p.id} onClick={() => setSelected(p)} className="w-full text-left px-5 py-4 transition-colors hover:bg-[rgb(11,15,23)]"
                    style={{ background: selected.id === p.id ? "rgb(11,15,23)" : "transparent", borderLeft: selected.id === p.id ? `2px solid ${amber}` : "2px solid transparent" }}>
                    <p className="text-xs font-semibold mb-1" style={{ ...mono, color: amber }}>{p.id}</p>
                    <p className="text-sm mb-2" style={{ color: "rgb(203,213,225)" }}>{p.name}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5" style={{ ...mono, color: statusColor[st], border: `1px solid ${statusColor[st]}`, background: `${statusColor[st]}14` }}>{st.toUpperCase()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="p-6" style={{ border: `1px solid ${border}`, background: card }}>
              <p className="text-[11px] font-semibold tracking-[1.2px] mb-4" style={{ ...mono, color: amber }}>REDACTION REQUEST DETAIL</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[["Document ID", selected.id], ["Document Name", selected.name], ["Requested By", selected.requestedBy], ["Reason", selected.reason]].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-[10px] mb-1" style={{ ...mono, color: muted }}>{k.toUpperCase()}</p>
                    <p style={{ color: "rgb(203,213,225)" }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Simulated doc preview */}
            <div className="flex-1 p-6 relative" style={{ border: `1px solid ${border}`, background: card, minHeight: 200 }}>
              <p className="text-[11px] font-semibold tracking-[1.2px] mb-4" style={{ ...mono, color: amber }}>DOCUMENT PREVIEW</p>
              <div className="space-y-2 text-sm" style={{ color: "rgb(148,163,184)", lineHeight: 1.8 }}>
                <p>Case No: {selected.id} &nbsp;|&nbsp; Date: 11-Sep-2026</p>
                <p>Station: Connaught Place PS &nbsp;|&nbsp; Section: 302 IPC</p>
                <p>Complainant: <span className="px-8 py-0.5 rounded" style={{ background: "rgb(17,24,39)", color: "rgb(17,24,39)", border: `1px solid ${border}` }}>████████████</span></p>
                <p>Address: <span className="px-16 py-0.5 rounded" style={{ background: "rgb(17,24,39)", color: "rgb(17,24,39)", border: `1px solid ${border}` }}>████████████████████</span></p>
                <p>Incident description: On the night of 10-Sep-2026, the accused was found…</p>
              </div>
            </div>
            {/* Actions */}
            {!(statuses[selected.id]) && (
              <div className="flex gap-3">
                <button onClick={() => act(selected.id, "Approved")} className="px-6 py-2 text-xs font-bold" style={{ ...mono, background: "rgb(16,185,129)", color: "rgb(11,15,23)" }}>Approve Redaction</button>
                <button onClick={() => act(selected.id, "Rejected")} className="px-6 py-2 text-xs font-bold" style={{ ...mono, border: `1px solid rgb(239,68,68)`, color: "rgb(239,68,68)" }}>Reject</button>
              </div>
            )}
            {statuses[selected.id] && (
              <p className="text-sm font-semibold" style={{ ...mono, color: statusColor[statuses[selected.id]] }}>
                ✓ Request {statuses[selected.id].toUpperCase()} — audit log entry created.
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
