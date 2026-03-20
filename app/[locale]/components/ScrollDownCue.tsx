"use client";

import { useState, useEffect } from "react";

export default function ScrollDownCue() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY < 60);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => document.getElementById("work")?.scrollIntoView({ behavior: "smooth" })}
      className="md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors"
      aria-label="Scroll down"
    >
      <span className="text-xs tracking-widest uppercase">Scroll</span>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-bounce"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}
