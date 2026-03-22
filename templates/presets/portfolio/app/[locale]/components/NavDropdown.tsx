"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NavSection {
  id: string;
  label: string;
}

interface NavDropdownProps {
  sections: NavSection[];
  scrolled: boolean;
}

export default function NavDropdown({ sections, scrolled }: NavDropdownProps) {
  const [activeLabel, setActiveLabel] = useState(sections[0].label);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    sections.forEach(({ id, label }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveLabel(label);
        },
        { rootMargin: "-10% 0px -60% 0px", threshold: 0 },
      );
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [sections]);

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
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="nav-menu"
        className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition-colors ${
          scrolled
            ? "border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
            : "border-white/20 text-white/80 hover:border-white/40 hover:text-white"
        }`}
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
        <div id="nav-menu" className="absolute left-1/2 top-full z-50 mt-2 w-44 -translate-x-1/2 overflow-hidden rounded-xl border border-zinc-100 bg-white py-1 shadow-lg">
          {sections.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => navigate(id)}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-zinc-50 ${
                activeLabel === label
                  ? "text-indigo-600 font-medium"
                  : "text-zinc-500 hover:text-zinc-800"
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
