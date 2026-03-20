"use client";

import { type Locale } from "../../../i18n-config";

const nudgeText: Record<Locale, string> = {
  en: "Have questions? Chat with me",
  pt: "Tens dúvidas? Fala comigo",
};

export default function ChatNudge({ locale }: { locale: Locale }) {
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent("open-chat"))}
      className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-indigo-600 transition-colors"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      {nudgeText[locale] ?? nudgeText.en}
    </button>
  );
}
