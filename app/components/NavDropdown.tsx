"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NavSection {
  id: string;
  label: string;
}

interface NavDropdownProps {
  sections: NavSection[];
}

export default function NavDropdown({ sections }: NavDropdownProps) {
  const [activeLabel, setActiveLabel] = useState(sections[0].label);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Use IntersectionObserver only — no scroll handler to avoid conflicts.
    // The Hero section has id="home" and fills the viewport, so it reliably
    // triggers at the top without needing a separate scroll listener.
    const observers: IntersectionObserver[] = [];
    sections.forEach(({ id, label }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveLabel(label);
        },
        // Active when the section enters the top 70% of the viewport
        { rootMargin: "-10% 0px -60% 0px", threshold: 0 },
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [sections]);

  // Close on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  function navigate(id: string) {
    setOpen(false);
    if (id === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-1.5 text-sm text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
      >
        <span className="relative flex min-w-20 justify-center overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={activeLabel}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="block text-center"
            >
              {activeLabel}
            </motion.span>
          </AnimatePresence>
        </span>
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-44 -translate-x-1/2 overflow-hidden rounded-xl border border-white/10 bg-[#161616] py-1 shadow-2xl">
          {sections.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => navigate(id)}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/5 ${
                activeLabel === label
                  ? "text-blue-400"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
