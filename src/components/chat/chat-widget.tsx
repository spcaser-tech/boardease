"use client";
import { useState } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I’m the **BoardEase AI Assistant**. Ask me about available rooms, your bills, or property stats." },
  ]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply || data.error || "Sorry, I couldn’t respond." }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Network error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 no-print">
      {open && (
        <div className="mb-3 flex h-[480px] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-white">
            <div className="flex items-center gap-2 font-medium"><Bot size={18} /> AI Chatbot Assistant</div>
            <button onClick={() => setOpen(false)} aria-label="Close"><X size={18} /></button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-3 bg-slate-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${m.role === "user" ? "bg-primary text-white" : "bg-white border border-slate-200 text-slate-800"}`}>
                  {m.role === "assistant" ? <div className="prose prose-sm max-w-none"><ReactMarkdown>{m.content}</ReactMarkdown></div> : m.content}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-slate-400">Thinking…</div>}
          </div>
          <div className="flex gap-2 border-t border-slate-200 p-2 bg-white">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about rooms, bills, stats…"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button onClick={send} disabled={loading} className="rounded-lg bg-primary px-3 text-white hover:bg-primary-dark disabled:opacity-50"><Send size={16} /></button>
          </div>
        </div>
      )}
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-white shadow-lg hover:bg-primary-dark">
        <MessageCircle size={20} />
        <span className="hidden text-sm font-medium sm:inline">AI Chatbot Assistant</span>
      </button>
    </div>
  );
}
