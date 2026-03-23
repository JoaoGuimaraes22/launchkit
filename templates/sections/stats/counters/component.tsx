"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

interface StatItem {
  label: string;
  target: number;
  suffix: string;
}

interface StatsCountersDict {
  title_line1: string;
  title_line2: string;
  items: StatItem[];
}

function useCountUp(target: number, duration: number, active: boolean, skip: boolean) {
  const [value, setValue] = useState(() => skip ? target : 0);
  useEffect(() => {
    if (skip || !active) return;
    const start = performance.now();
    const frame = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [active, target, duration, skip]);
  return value;
}

function Counter({ item }: { item: StatItem }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const prefersReduced = useReducedMotion();
  const count = useCountUp(item.target, 1800, inView, prefersReduced ?? false);

  return (
    <div ref={ref} className="flex flex-col items-center gap-1 py-8 text-center">
      <span className="text-4xl font-bold tracking-tight text-indigo-600 sm:text-5xl">
        {(inView || prefersReduced) ? count.toLocaleString() : "0"}
        {item.suffix}
      </span>
      <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
        {item.label}
      </span>
    </div>
  );
}

export default function StatsCounters({ statsCounters }: { statsCounters: StatsCountersDict }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="border-y border-neutral-200 bg-neutral-50 px-6 py-4 md:px-10">
      {(statsCounters.title_line1 || statsCounters.title_line2) && (
        <motion.div
          className="mb-6 text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        >
          {statsCounters.title_line1 && (
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
              {statsCounters.title_line1}
            </p>
          )}
          {statsCounters.title_line2 && (
            <p className="mt-1 text-2xl font-bold text-neutral-900">{statsCounters.title_line2}</p>
          )}
        </motion.div>
      )}

      <div
        className={[
          "mx-auto grid max-w-4xl divide-x divide-neutral-200",
          ({ 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3" } as Record<number, string>)[
            statsCounters.items.length
          ] ?? "grid-cols-2 sm:grid-cols-4",
        ].join(" ")}
      >
        {statsCounters.items.map((item, i) => (
          <Counter key={i} item={item} />
        ))}
      </div>
    </section>
  );
}
