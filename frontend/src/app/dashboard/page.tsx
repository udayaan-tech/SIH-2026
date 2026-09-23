"use client";
import Sidebar from "../components/sidebar";

const stats = [
  { label: "Active Cases", value: "142", delta: "+3 today" },
  { label: "Pending Signatures", value: "7", delta: "2 urgent" },
  { label: "Documents Uploaded", value: "1,284", delta: "+18 this week" },
  { label: "Integrity Checks", value: "100%", delta: "All passed" },
];
const recentDocs = [
  { id: "FIR-DEL-2026-0421", type: "FIR", case: "State vs. Sharma", status: "Signed", time: "2h ago" },
  { id: "FSL-RPT-0089", type: "Forensic Report", case: "State vs. Sharma", status: "Pending Sign", time: "5h ago" },
  { id: "CS-DEL-2026-0112", type: "Charge Sheet", case: "State vs. Mehta", status: "Under Review", time: "1d ago" },
  { id: "WS-DEL-2026-0033", type: "Witness Statement", case: "State vs. Mehta", status: "Signed", time: "1d ago" },
  { id: "JO-DEL-2026-0007", type: "Court Order", case: "State vs. Kapoor", status: "Signed", time: "2d ago" },
];
const statusColor: Record<string, string> = {
  "Signed": "text-[rgb(16,185,129)]",
  "Pending Sign": "text-[rgb(245,158,11)]",
  "Under Review": "text-[rgb(148,163,184)]",
};
const mono = { fontFamily: "'JetBrains Mono', monospace" };
const border = "rgb(38,54,76)";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="px-8 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${border}` }}>
          <div>
            <p className="text-[11px] font-semibold tracking-[1.2px]" style={{ ...mono, color: "rgb(245,158,11)" }}>MINISTRY OF HOME AFFAIRS • NCRB</p>
            <h1 className="text-xl font-medium mt-0.5" style={{ fontFamily: "Outfit" }}>Investigating Officer Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[rgb(16,185,129)]" style={{ boxShadow: "0 0 0 3px rgba(16,185,129,0.2)" }} />
            <span className="text-xs" style={{ ...mono, color: "rgb(148,163,184)" }}>IO-DEL-0421 · Session active</span>
          </div>
        </header>
        <main className="flex-1 px-8 py-8">
          <div className="grid grid-cols-4 gap-4 mb-8">
            {stats.map((s) => (
              <div key={s.label} className="p-5" style={{ border: `1px solid ${border}`, background: "rgb(14,22,37)" }}>
                <p className="text-xs mb-2" style={{ ...mono, color: "rgb(148,163,184)" }}>{s.label.toUpperCase()}</p>
                <p className="text-3xl font-medium mb-1" style={{ fontFamily: "Outfit" }}>{s.value}</p>
                <p className="text-xs" style={{ ...mono, color: "rgb(16,185,129)" }}>{s.delta}</p>
              </div>
            ))}
          </div>
          <div style={{ border: `1px solid ${border}`, background: "rgb(14,22,37)" }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${border}` }}>
              <p className="text-[11px] font-semibold tracking-[1.2px]" style={{ ...mono, color: "rgb(245,158,11)" }}>RECENT DOCUMENTS</p>
              <button className="text-xs hover:text-foreground" style={{ ...mono, color: "rgb(148,163,184)" }}>View all →</button>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${border}` }}>
                  {["Document ID", "Type", "Case", "Status", "Time"].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-[11px] font-semibold tracking-[1px]" style={{ ...mono, color: "rgb(148,163,184)" }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[rgb(11,15,23)] transition-colors cursor-pointer" style={{ borderBottom: `1px solid ${border}` }}>
                    <td className="px-6 py-4 text-sm" style={{ ...mono, color: "rgb(245,158,11)" }}>{doc.id}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: "rgb(203,213,225)" }}>{doc.type}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: "rgb(148,163,184)" }}>{doc.case}</td>
                    <td className={`px-6 py-4 text-xs font-semibold ${statusColor[doc.status]}`} style={mono}>{doc.status.toUpperCase()}</td>
                    <td className="px-6 py-4 text-xs" style={{ ...mono, color: "rgb(100,116,139)" }}>{doc.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-8 text-[10px]" style={{ ...mono, color: "rgb(100,116,139)" }}>Protected under BSA 2023 · DPDPA 2023 · CERT-In directives · All actions are audit-logged</p>
        </main>
      </div>
    </div>
  );
}
