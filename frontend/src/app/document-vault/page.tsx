"use client";
import { useState } from "react";
import Sidebar from "../components/sidebar";

const mono = { fontFamily: "'JetBrains Mono', monospace" };
const border = "rgb(38,54,76)";
const amber = "rgb(245,158,11)";
const muted = "rgb(148,163,184)";
const card = "rgb(14,22,37)";

const docs = [
  { id: "FIR-DEL-2026-0421", name: "First Information Report", type: "FIR", size: "1.2 MB", hash: "a3f9…c12e", signed: true, anchored: true, uploaded: "2h ago" },
  { id: "FSL-RPT-0089", name: "Forensic Lab Report — Ballistics", type: "Forensic Report", size: "4.7 MB", hash: "b81d…44fa", signed: false, anchored: true, uploaded: "5h ago" },
  { id: "CS-DEL-2026-0112", name: "Charge Sheet — Section 302 IPC", type: "Charge Sheet", size: "2.1 MB", hash: "e02c…9a3b", signed: false, anchored: false, uploaded: "1d ago" },
  { id: "WS-DEL-2026-0033", name: "Witness Statement — Ravi Kumar", type: "Witness Statement", size: "0.4 MB", hash: "f77a…1c90", signed: true, anchored: true, uploaded: "1d ago" },
  { id: "JO-DEL-2026-0007", name: "Court Order — Bail Rejected", type: "Court Order", size: "0.8 MB", hash: "d44e…8b21", signed: true, anchored: true, uploaded: "2d ago" },
];

export default function DocumentVaultPage() {
  const [dragging, setDragging] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="px-8 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${border}` }}>
          <div>
            <p className="text-[11px] font-semibold tracking-[1.2px]" style={{ ...mono, color: amber }}>OPERATIONS</p>
            <h1 className="text-xl font-medium mt-0.5" style={{ fontFamily: "Outfit" }}>Document Vault</h1>
          </div>
          <button className="px-4 py-2 text-xs font-bold" style={{ ...mono, background: amber, color: "rgb(17,24,39)" }}>+ Upload Document</button>
        </header>
        <main className="flex-1 px-8 py-8">
          {/* Drop zone */}
          <div
            className="w-full mb-8 flex flex-col items-center justify-center py-10 transition-colors cursor-pointer"
            style={{ border: `2px dashed ${dragging ? amber : border}`, background: dragging ? "rgba(245,158,11,0.05)" : card }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={() => setDragging(false)}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={amber} strokeWidth="1.5" className="mb-3">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p className="text-sm" style={{ color: muted }}>Drag & drop files here, or <span style={{ color: amber }}>browse</span></p>
            <p className="text-xs mt-1" style={{ ...mono, color: "rgb(100,116,139)" }}>PDF · DOCX · JPG · PNG — AES-256 encrypted at rest</p>
          </div>

          {/* Document table */}
          <div style={{ border: `1px solid ${border}`, background: card }}>
            <div className="px-6 py-4" style={{ borderBottom: `1px solid ${border}` }}>
              <p className="text-[11px] font-semibold tracking-[1.2px]" style={{ ...mono, color: amber }}>VAULT CONTENTS</p>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${border}` }}>
                  {["ID", "Name", "Type", "Size", "SHA-256", "Signed", "On-Chain", "Uploaded"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold tracking-[1px]" style={{ ...mono, color: muted }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id} className="hover:bg-[rgb(11,15,23)] cursor-pointer transition-colors" style={{ borderBottom: `1px solid ${border}` }}>
                    <td className="px-5 py-3 text-xs" style={{ ...mono, color: amber }}>{d.id}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: "rgb(203,213,225)" }}>{d.name}</td>
                    <td className="px-5 py-3 text-xs" style={{ ...mono, color: muted }}>{d.type}</td>
                    <td className="px-5 py-3 text-xs" style={{ ...mono, color: muted }}>{d.size}</td>
                    <td className="px-5 py-3 text-xs" style={{ ...mono, color: "rgb(100,116,139)" }}>{d.hash}</td>
                    <td className="px-5 py-3 text-xs font-bold" style={{ ...mono, color: d.signed ? "rgb(16,185,129)" : "rgb(239,68,68)" }}>{d.signed ? "YES" : "NO"}</td>
                    <td className="px-5 py-3 text-xs font-bold" style={{ ...mono, color: d.anchored ? "rgb(16,185,129)" : muted }}>{d.anchored ? "YES" : "PENDING"}</td>
                    <td className="px-5 py-3 text-xs" style={{ ...mono, color: "rgb(100,116,139)" }}>{d.uploaded}</td>
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
