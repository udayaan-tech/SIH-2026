"use client";
import { useState, useRef, useEffect } from "react";
import Sidebar from "../components/sidebar";

const mono = { fontFamily: "'JetBrains Mono', monospace" };
const border = "rgb(38,54,76)";
const amber = "rgb(245,158,11)";
const muted = "rgb(148,163,184)";
const card = "rgb(14,22,37)";

type Msg = { role: "user" | "assistant"; text: string };

const suggestions = [
  "Summarise FIR-DEL-2026-0421",
  "Which IPC sections apply to State vs. Sharma?",
  "List all unsigned documents in active cases",
  "Explain Section 65B of the Indian Evidence Act",
];

const canned: Record<string, string> = {
  "Summarise FIR-DEL-2026-0421": "FIR-DEL-2026-0421 was registered at Connaught Place PS on 11-Sep-2026 under Section 302 IPC. The accused was apprehended near the scene with a firearm. IO-DEL-0421 is the assigned officer. The document is signed and blockchain-anchored. Integrity: PASS.",
  "Which IPC sections apply to State vs. Sharma?": "Based on the charge sheet CS-DEL-2026-0112, the applicable sections are:\n• Section 302 IPC — Murder\n• Section 34 IPC — Acts done by several persons in furtherance of common intention\n• Section 25 Arms Act — Possession of unlicensed firearm",
  "List all unsigned documents in active cases": "2 unsigned documents found:\n1. FSL-RPT-0089 — Forensic Lab Report (State vs. Sharma) — awaiting IO countersign\n2. CS-DEL-2026-0112 — Charge Sheet (State vs. Mehta) — awaiting IO + Clerk sign",
  "Explain Section 65B of the Indian Evidence Act": "Section 65B of the Indian Evidence Act, 1872 governs the admissibility of electronic records as evidence. A certificate under 65B(4) must be provided by a responsible official certifying that the electronic record was produced by a computer in regular use, the computer was operating properly, and the information was fed in the ordinary course of activities. This is critical for digital FIRs and forensic reports to be admissible in court.",
};

export default function ClaudeCopilotPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Hello. I'm the Nyay Suraksha Copilot. I can help you query cases, summarise documents, explain legal provisions, and identify compliance gaps. How can I assist?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function send(text: string) {
    if (!text.trim()) return;
    const userMsg: Msg = { role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    setTimeout(() => {
      const reply = canned[text] ?? "I've noted your query. In a production environment I would search across all case documents and provide a detailed, cited response. For this demo, please try one of the suggested prompts.";
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
      setLoading(false);
    }, 900);
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="px-8 py-4" style={{ borderBottom: `1px solid ${border}` }}>
          <p className="text-[11px] font-semibold tracking-[1.2px]" style={{ ...mono, color: amber }}>GOVERNANCE</p>
          <h1 className="text-xl font-medium mt-0.5" style={{ fontFamily: "Outfit" }}>Claude Copilot</h1>
        </header>
        <div className="flex-1 flex flex-col px-8 py-6 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-xl px-4 py-3 text-sm whitespace-pre-line" style={{
                  background: m.role === "user" ? "rgba(245,158,11,0.12)" : card,
                  border: `1px solid ${m.role === "user" ? amber : border}`,
                  color: m.role === "user" ? "rgb(248,250,252)" : "rgb(203,213,225)",
                  borderRadius: 2,
                }}>
                  {m.role === "assistant" && <p className="text-[10px] font-bold mb-2" style={{ ...mono, color: amber }}>COPILOT</p>}
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-4 py-3 text-sm" style={{ background: card, border: `1px solid ${border}` }}>
                  <p className="text-[10px] font-bold mb-2" style={{ ...mono, color: amber }}>COPILOT</p>
                  <span style={{ color: muted }}>Thinking…</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length < 3 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {suggestions.map((s) => (
                <button key={s} onClick={() => send(s)} className="text-xs px-3 py-1.5 transition-colors hover:border-amber-400"
                  style={{ ...mono, border: `1px solid ${border}`, color: muted, background: card }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-3">
            <input
              className="flex-1 h-11 px-4 text-sm"
              style={{ background: card, border: `1px solid ${border}`, color: "rgb(248,250,252)", outline: "none" }}
              placeholder="Ask about a case, document, or legal provision…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
            />
            <button onClick={() => send(input)} className="px-5 text-xs font-bold" style={{ ...mono, background: amber, color: "rgb(17,24,39)" }}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
