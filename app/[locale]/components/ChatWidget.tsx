"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { type Locale } from "../../../i18n-config";

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
}

const strings = {
  en: {
    title: "Chat with me",
    subtitle: "Typically replies instantly",
    placeholder: "Type a message...",
    greeting: "Hi! I'm YOUR_NAME's assistant. Ask me anything about their work, services, or availability.",
    ariaLabel: "Open chat",
    bubble: "Ask me anything",
    chips: ["What services do you offer?", "What's your pricing?", "Are you available?", "Show me your work"],
  },
  pt: {
    title: "Fala comigo",
    subtitle: "Responde quase instantaneamente",
    placeholder: "Escreve uma mensagem...",
    greeting: "Olá! Sou o assistente de YOUR_NAME. Pergunta-me sobre o seu trabalho, serviços ou disponibilidade.",
    ariaLabel: "Abrir chat",
    bubble: "Pergunta-me algo",
    chips: ["Que serviços ofereces?", "Qual é o teu preço?", "Estás disponível?", "Mostra o teu trabalho"],
  },
};

export default function ChatWidget({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [showBubble, setShowBubble] = useState(true);
  const [showChips, setShowChips] = useState(false);
  const greetedRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const s = strings[locale] ?? strings.en;

  // Listen for open-chat event from sidebar nudge
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-chat", handler);
    return () => window.removeEventListener("open-chat", handler);
  }, []);

  function dismissBubble() {
    setShowBubble(false);
  }

  useEffect(() => {
    if (open && !greetedRef.current) {
      greetedRef.current = true;
      setMessages([{ id: crypto.randomUUID(), role: "bot", text: s.greeting }]);
      setShowChips(true);
    }
  }, [open, s.greeting]);

  async function sendChip(text: string) {
    setShowChips(false);
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId, locale }),
      });
      const { reply } = await res.json();
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "bot", text: reply }]);
    } catch {
      const fallback =
        locale === "pt" ? "Erro de ligação. Tenta novamente." : "Connection error. Please try again.";
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "bot", text: fallback }]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: { preventDefault(): void }) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setShowChips(false);
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId, locale }),
      });
      const { reply } = await res.json();
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "bot", text: reply }]);
    } catch {
      const fallback =
        locale === "pt" ? "Erro de ligação. Tenta novamente." : "Connection error. Please try again.";
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "bot", text: fallback }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
            style={{ transformOrigin: "bottom right" }}
            className="w-[calc(100vw-2rem)] sm:w-96 rounded-2xl border border-zinc-100 bg-white shadow-sm overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
              <div>
                <p className="text-sm font-semibold text-zinc-900">{s.title}</p>
                <p className="text-xs text-zinc-400">{s.subtitle}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-colors"
                aria-label="Close chat"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="overflow-y-auto max-h-80 px-4 py-4 space-y-3 scrollbar-none">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={
                    msg.role === "bot"
                      ? "max-w-[80%] rounded-2xl rounded-tl-sm bg-zinc-100 px-4 py-2.5 text-sm text-zinc-700"
                      : "max-w-[80%] rounded-2xl rounded-tr-sm bg-indigo-600 px-4 py-2.5 text-sm text-white ml-auto"
                  }
                >
                  {msg.text}
                </div>
              ))}
              {loading && (
                <div className="flex gap-1 px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-zinc-400"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick reply chips */}
            {showChips && (
              <div className="flex flex-wrap gap-2 px-4 pb-3">
                {s.chips.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => sendChip(chip)}
                    className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors whitespace-nowrap"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="flex items-center gap-2 px-4 py-3 border-t border-zinc-100"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={s.placeholder}
                className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m22 2-7 20-4-9-9-4 20-7z" />
                  <path d="M22 2 11 13" />
                </svg>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speech bubble */}
      <AnimatePresence>
        {showBubble && !open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 4 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
            className="relative flex items-center gap-2 rounded-xl border border-zinc-100 bg-white px-4 py-2.5 shadow-md"
          >
            <button
              onClick={() => { setOpen(true); dismissBubble(); }}
              className="text-sm font-medium text-zinc-700 hover:text-indigo-600 transition-colors whitespace-nowrap"
            >
              {s.bubble}
            </button>
            <button
              onClick={dismissBubble}
              className="text-zinc-300 hover:text-zinc-500 transition-colors"
              aria-label="Dismiss"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
            {/* Tail pointing to FAB */}
            <div className="absolute -bottom-1.5 right-5 size-3 rotate-45 border-b border-r border-zinc-100 bg-white" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle FAB */}
      <button
        onClick={() => { setOpen((v) => !v); if (showBubble) dismissBubble(); }}
        aria-label={s.ariaLabel}
        className="relative flex size-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition-all"
      >
        {showBubble && !open && (
          <span className="absolute -top-0.5 -right-0.5 flex size-3">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex size-3 rounded-full bg-indigo-500" />
          </span>
        )}
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.svg
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </motion.svg>
          ) : (
            <motion.svg
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </motion.svg>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
