"use client";
import Sidebar from "../components/sidebar";

const mono = { fontFamily: "'JetBrains Mono', monospace" };
const border = "rgb(38,54,76)";
const amber = "rgb(245,158,11)";
const muted = "rgb(148,163,184)";
const card = "rgb(14,22,37)";
const green = "rgb(16,185,129)";

const stateData = [
  { state: "Delhi", cases: 142, docs: 1284, integrity: 100 },
  { state: "Maharashtra", cases: 218, docs: 2103, integrity: 99.8 },
  { state: "Karnataka", cases: 97, docs: 876, integrity: 100 },
  { state: "Tamil Nadu", cases: 134, docs: 1102, integrity: 99.5 },
  { state: "UP", cases: 301, docs: 2890, integrity: 98.9 },
  { state: "Gujarat", cases: 88, docs: 741, integrity: 100 },
];

const maxCases = Math.max(...stateData.map((s) => s.cases));

const monthly = [38, 52, 47, 61, 55, 70, 66, 80, 74, 90, 85, 95];
const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
const maxM = Math.max(...monthly);

export default function NationalAnalyticsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="px-8 py-4" style={{ borderBottom: `1px solid ${border}` }}>
          <p className="text-[11px] font-semibold tracking-[1.2px]" style={{ ...mono, color: amber }}>OPERATIONS</p>
          <h1 className="text-xl font-medium mt-0.5" style={{ fontFamily: "Outfit" }}>National Analytics</h1>
        </header>
        <main className="flex-1 px-8 py-8">
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[{ l: "Total Cases (National)", v: "980", c: "rgb(248,250,252)" }, { l: "Documents Stored", v: "8,996", c: "rgb(248,250,252)" }, { l: "Avg Integrity Score", v: "99.7%", c: green }, { l: "States Connected", v: "6 / 28", c: amber }].map((s) => (
              <div key={s.l} className="p-5" style={{ border: `1px solid ${border}`, background: card }}>
                <p className="text-xs mb-2" style={{ ...mono, color: muted }}>{s.l.toUpperCase()}</p>
                <p className="text-3xl font-medium" style={{ fontFamily: "Outfit", color: s.c }}>{s.v}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Bar chart — cases by state */}
            <div className="p-6" style={{ border: `1px solid ${border}`, background: card }}>
              <p className="text-[11px] font-semibold tracking-[1.2px] mb-6" style={{ ...mono, color: amber }}>ACTIVE CASES BY STATE</p>
              <div className="space-y-3">
                {stateData.map((s) => (
                  <div key={s.state} className="flex items-center gap-3">
                    <span className="w-20 text-xs text-right shrink-0" style={{ ...mono, color: muted }}>{s.state}</span>
                    <div className="flex-1 h-5 rounded-sm overflow-hidden" style={{ background: "rgb(11,15,23)" }}>
                      <div className="h-full rounded-sm transition-all" style={{ width: `${(s.cases / maxCases) * 100}%`, background: amber }} />
                    </div>
                    <span className="w-8 text-xs" style={{ ...mono, color: "rgb(203,213,225)" }}>{s.cases}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly uploads */}
            <div className="p-6" style={{ border: `1px solid ${border}`, background: card }}>
              <p className="text-[11px] font-semibold tracking-[1.2px] mb-6" style={{ ...mono, color: amber }}>MONTHLY DOCUMENT UPLOADS</p>
              <div className="flex items-end gap-2 h-40">
                {monthly.map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-sm" style={{ height: `${(v / maxM) * 140}px`, background: i === monthly.length - 1 ? amber : "rgb(38,54,76)" }} />
                    <span className="text-[9px]" style={{ ...mono, color: muted }}>{months[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Integrity table */}
            <div className="col-span-2 p-6" style={{ border: `1px solid ${border}`, background: card }}>
              <p className="text-[11px] font-semibold tracking-[1.2px] mb-4" style={{ ...mono, color: amber }}>STATE-WISE INTEGRITY SCORES</p>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${border}` }}>
                    {["State", "Active Cases", "Documents", "Integrity Score"].map((h) => (
                      <th key={h} className="text-left px-4 py-2 text-[10px] font-semibold" style={{ ...mono, color: muted }}>{h.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stateData.map((s) => (
                    <tr key={s.state} style={{ borderBottom: `1px solid ${border}` }}>
                      <td className="px-4 py-3 text-sm" style={{ color: "rgb(203,213,225)" }}>{s.state}</td>
                      <td className="px-4 py-3 text-sm" style={{ ...mono, color: muted }}>{s.cases}</td>
                      <td className="px-4 py-3 text-sm" style={{ ...mono, color: muted }}>{s.docs.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm font-bold" style={{ ...mono, color: s.integrity === 100 ? green : amber }}>{s.integrity}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
