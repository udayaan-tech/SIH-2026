"use client";
import { useState } from "react";
import Sidebar from "../components/sidebar";

const mono = { fontFamily: "'JetBrains Mono', monospace" };
const border = "rgb(38,54,76)";
const amber = "rgb(245,158,11)";
const muted = "rgb(148,163,184)";
const card = "rgb(14,22,37)";
const green = "rgb(16,185,129)";

const initial = [
  { id: 1, type: "SIGN_REQUEST", title: "Signature requested on FSL-RPT-0089", body: "IO-DEL-0388 has requested your countersignature on the Forensic Lab Report for State vs. Sharma.", time: "10m ago", read: false },
  { id: 2, type: "SHARE", title: "Document shared with you", body: "CS-DEL-2026-0112 (Charge Sheet) has been shared by CLERK-DEL-003 for your review.", time: "1h ago", read: false },
  { id: 3, type: "INTEGRITY", title: "Blockchain anchor confirmed", body: "FIR-DEL-2026-0421 has been successfully anchored to the blockchain. Tx: 0xd4e5…f6a7", time: "2h ago", read: false },
  { id: 4, type: "ACCESS", title: "New login from Delhi NCR", body: "Your account IO-DEL-0421 was accessed from IP 103.21.x.x at 08:14 IST.", time: "3h ago", read: true },
  { id: 5, type: "ALERT", title: "Charge sheet unsigned for 48h", body: "CS-DEL-2026-0112 has been pending signature for over 48 hours. Action required.", time: "6h ago", read: true },
  { id: 6, type: "SHARE", title: "Access revoked", body: "Your access to CASE-MUM-2026-041 has been revoked by Admin.", time: "1d ago", read: true },
];

const typeColor: Record<string, string> = { SIGN_REQUEST: amber, SHARE: "rgb(99,102,241)", INTEGRITY: green, ACCESS: muted, ALERT: "rgb(239,68,68)" };

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(initial);

  function markRead(id: number) { setNotifs((n) => n.map((x) => x.id === id ? { ...x, read: true } : x)); }
  function markAll() { setNotifs((n) => n.map((x) => ({ ...x, read: true }))); }

  const unread = notifs.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-background text-foreground flex" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="px-8 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${border}` }}>
          <div>
            <p className="text-[11px] font-semibold tracking-[1.2px]" style={{ ...mono, color: amber }}>GOVERNANCE</p>
            <h1 className="text-xl font-medium mt-0.5" style={{ fontFamily: "Outfit" }}>Notifications</h1>
          </div>
          <div className="flex items-center gap-4">
            {unread > 0 && <span className="text-xs px-2 py-0.5 font-bold" style={{ ...mono, background: amber, color: "rgb(17,24,39)" }}>{unread} UNREAD</span>}
            <button onClick={markAll} className="text-xs" style={{ ...mono, color: muted }}>Mark all read</button>
          </div>
        </header>
        <main className="flex-1 px-8 py-8 max-w-3xl">
          <div className="space-y-2">
            {notifs.map((n) => (
              <div key={n.id} className="p-5 transition-colors" style={{ border: `1px solid ${n.read ? border : amber + "55"}`, background: n.read ? card : "rgba(245,158,11,0.04)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {!n.read && <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: amber }} />}
                    {n.read && <span className="w-2 h-2 mt-1.5 shrink-0" />}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.5" style={{ ...mono, color: typeColor[n.type], border: `1px solid ${typeColor[n.type]}`, background: `${typeColor[n.type]}14` }}>{n.type}</span>
                        <span className="text-xs" style={{ ...mono, color: "rgb(100,116,139)" }}>{n.time}</span>
                      </div>
                      <p className="text-sm font-medium mb-1" style={{ color: "rgb(248,250,252)" }}>{n.title}</p>
                      <p className="text-xs" style={{ color: muted }}>{n.body}</p>
                    </div>
                  </div>
                  {!n.read && (
                    <button onClick={() => markRead(n.id)} className="text-xs shrink-0" style={{ ...mono, color: muted }}>Dismiss</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
