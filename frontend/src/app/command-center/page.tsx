"use client";
import Sidebar from "../components/sidebar";

const mono = { fontFamily: "'JetBrains Mono', monospace" };
const border = "rgb(38,54,76)";
const amber = "rgb(245,158,11)";
const muted = "rgb(148,163,184)";
const card = "rgb(14,22,37)";

const alerts = [
  { level: "CRITICAL", msg: "Charge sheet CS-DEL-2026-0112 unsigned for 48h", case: "State vs. Mehta", time: "10m ago" },
  { level: "WARNING", msg: "Forensic report FSL-RPT-0089 awaiting countersign", case: "State vs. Sharma", time: "1h ago" },
  { level: "INFO", msg: "New witness statement uploaded by IO Verma", case: "State vs. Kapoor", time: "3h ago" },
  { level: "INFO", msg: "Blockchain anchor confirmed for FIR-DEL-2026-0421", case: "State vs. Sharma", time: "5h ago" },
];
const levelColor: Record<string, string> = {
  CRITICAL: "rgb(239,68,68)", WARNING: amber, INFO: "rgb(16,185,129)",
};
const metrics = [
  { label: "Cases Open", value: "142" }, { label: "Docs Today", value: "38" },
  { label: "Pending MFA", value: "3" }, { label: "Chain Anchors", value: "1,284" },
  { label: "Failed Verif.", value: "0" }, { label: "Active Users", value: "21" },
];

export default function CommandCenterPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="px-8 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${border}` }}>
          <div>
            <p className="text-[11px] font-semibold tracking-[1.2px]" style={{ ...mono, color: amber }}>OPERATIONS</p>
            <h1 className="text-xl font-medium mt-0.5" style={{ fontFamily: "Outfit" }}>Command Center</h1>
          </div>
          <span className="text-xs px-2 py-1" style={{ ...mono, color: "rgb(239,68,68)", border: "1px solid rgb(239,68,68)", background: "rgba(239,68,68,0.08)" }}>● LIVE</span>
        </header>
        <main className="flex-1 px-8 py-8">
          {/* Metrics grid */}
          <div className="grid grid-cols-6 gap-3 mb-8">
            {metrics.map((m) => (
              <div key={m.label} className="p-4 text-center" style={{ border: `1px solid ${border}`, background: card }}>
                <p className="text-2xl font-medium mb-1" style={{ fontFamily: "Outfit", color: m.label === "Failed Verif." ? "rgb(16,185,129)" : "rgb(248,250,252)" }}>{m.value}</p>
                <p className="text-[10px]" style={{ ...mono, color: muted }}>{m.label.toUpperCase()}</p>
              </div>
            ))}
          </div>
          {/* Alerts */}
          <div style={{ border: `1px solid ${border}`, background: card }}>
            <div className="px-6 py-4" style={{ borderBottom: `1px solid ${border}` }}>
              <p className="text-[11px] font-semibold tracking-[1.2px]" style={{ ...mono, color: amber }}>LIVE ALERTS</p>
            </div>
            <div className="divide-y" style={{ borderColor: border }}>
              {alerts.map((a, i) => (
                <div key={i} className="px-6 py-4 flex items-start gap-4">
                  <span className="text-[10px] font-bold px-2 py-0.5 mt-0.5 shrink-0" style={{ ...mono, color: levelColor[a.level], border: `1px solid ${levelColor[a.level]}`, background: `${levelColor[a.level]}14` }}>{a.level}</span>
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: "rgb(203,213,225)" }}>{a.msg}</p>
                    <p className="text-xs mt-1" style={{ ...mono, color: muted }}>{a.case}</p>
                  </div>
                  <span className="text-xs shrink-0" style={{ ...mono, color: "rgb(100,116,139)" }}>{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
