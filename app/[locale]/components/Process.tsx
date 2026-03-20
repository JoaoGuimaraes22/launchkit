"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface Step {
  number: string;
  title: string;
  description: string;
}

interface ProcessDict {
  title_line1: string;
  title_line2: string;
  steps: Step[];
}

interface ProcessProps {
  process: ProcessDict;
}

function RightArrow() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function DownArrow() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
  );
}

export default function Process({ process }: ProcessProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="process" ref={ref} className="px-6 py-16 md:px-8 md:py-24 xl:px-16 xl:py-32">
      <motion.div
        className="leading-none mb-16"
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <h2 className="font-black uppercase tracking-tight text-4xl sm:text-5xl md:text-6xl xl:text-[7rem] text-zinc-900">
          {process.title_line1}
        </h2>
        <h2 className="font-black uppercase tracking-tight text-4xl sm:text-5xl md:text-6xl xl:text-[7rem] text-zinc-200">
          {process.title_line2}
        </h2>
      </motion.div>

      {/* ── Desktop: horizontal flow ── */}
      <div className="hidden lg:flex items-start">
        {process.steps.map((step, i) => (
          <div key={step.number} className="flex items-start flex-1">
            {/* Step node */}
            <motion.div
              className="group flex flex-col items-center text-center flex-1 cursor-default"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.15, ease: [0.16, 1, 0.3, 1] as const }}
            >
              {/* Circle */}
              <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white font-mono font-bold text-base shadow-sm mb-6 ring-4 ring-[#fafafa]">
                {step.number}
              </div>
              {/* Card */}
              <div className="rounded-xl border border-zinc-100 bg-white px-6 py-5 shadow-sm w-full transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md">
                <h3 className="text-base font-semibold text-zinc-900 mb-2">{step.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{step.description}</p>
              </div>
            </motion.div>

            {/* Horizontal connector */}
            {i < process.steps.length - 1 && (
              <motion.div
                className="flex items-center shrink-0 mt-8 mx-2"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.25 + i * 0.15 }}
              >
                <div className="w-8 h-px bg-zinc-200" />
                <span className="text-zinc-300"><RightArrow /></span>
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* ── Mobile: vertical flow ── */}
      <div className="flex flex-col lg:hidden">
        {process.steps.map((step, i) => (
          <div key={step.number}>
            {/* Step node */}
            <motion.div
              className="group flex items-start gap-4 cursor-default"
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.15, ease: [0.16, 1, 0.3, 1] as const }}
            >
              {/* Circle */}
              <div className="shrink-0 w-11 h-11 rounded-full bg-indigo-600 flex items-center justify-center text-white font-mono font-bold text-sm shadow-sm ring-4 ring-[#fafafa]">
                {step.number}
              </div>
              {/* Card */}
              <div className="flex-1 rounded-xl border border-zinc-100 bg-white px-4 py-4 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md">
                <h3 className="text-sm font-semibold text-zinc-900 mb-1.5">{step.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{step.description}</p>
              </div>
            </motion.div>

            {/* Vertical connector */}
            {i < process.steps.length - 1 && (
              <motion.div
                className="flex flex-col items-center ml-5 py-1 gap-0.5"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.25 + i * 0.15 }}
              >
                <div className="w-px h-4 bg-zinc-200" />
                <span className="text-zinc-300"><DownArrow /></span>
                <div className="w-px h-4 bg-zinc-200" />
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
