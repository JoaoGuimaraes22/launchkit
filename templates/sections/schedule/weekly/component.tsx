"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface ClassEntry {
  time: string;
  name: string;
  day: number; // 0 = Monday … 6 = Sunday
  type: "1" | "2" | "3" | "4";
}

interface TypeItem {
  key: string;
  label: string;
}

interface ScheduleDict {
  title_line1: string;
  title_line2: string;
  days: string[];
  noClass: string;
  today: string;
  types: TypeItem[];
  classes: ClassEntry[];
}

// Type 1 uses accent color (indigo → swapped by accentColorToken).
// Types 2–4 use fixed semantic colors.
const TYPE_BORDER: Record<string, string> = {
  "1": "#6366f1", // indigo-500
  "2": "#f97316", // amber-500
  "3": "#14b8a6", // teal-500
  "4": "#a855f7", // violet-500
};

const TYPE_DOT: Record<string, string> = {
  "1": "bg-indigo-500",
  "2": "bg-amber-500",
  "3": "bg-teal-500",
  "4": "bg-violet-500",
};

// JS getDay(): 0=Sun … 6=Sat → convert to Mon-based: 0=Mon … 6=Sun
const todayIndex = (new Date().getDay() + 6) % 7;

const fadeUp = (inView: boolean, delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
  transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as const },
});

export default function Schedule({ schedule }: { schedule: ScheduleDict }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const sorted = [...schedule.classes].sort((a, b) =>
    a.time.localeCompare(b.time)
  );

  return (
    <section id="schedule" ref={ref} className="py-20 px-6 md:px-10">
      <motion.div {...fadeUp(inView)}>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
          {schedule.title_line1}
        </h2>
        <p className="mt-1 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
          {schedule.title_line2}
        </p>
      </motion.div>

      {/* Desktop grid */}
      <motion.div
        {...fadeUp(inView, 0.15)}
        className="mt-10 hidden overflow-x-auto lg:block"
      >
        <div className="grid min-w-[800px] grid-cols-7 divide-x divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200">
          {schedule.days.map((day, d) => {
            const isToday = d === todayIndex;
            const dayClasses = sorted.filter((c) => c.day === d);
            return (
              <div
                key={d}
                className={isToday ? "bg-indigo-50" : "bg-white"}
              >
                <div
                  className={[
                    "border-b px-3 py-3 text-center text-xs font-bold uppercase tracking-widest",
                    isToday
                      ? "border-indigo-200 bg-indigo-100 text-indigo-700"
                      : "border-neutral-200 text-neutral-500",
                  ].join(" ")}
                >
                  {day}
                  {isToday && (
                    <span className="ml-1.5 rounded-full bg-indigo-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      {schedule.today}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 p-2">
                  {dayClasses.map((cls, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-neutral-50 px-2 py-2"
                      style={{ borderLeft: `3px solid ${TYPE_BORDER[cls.type] ?? TYPE_BORDER["1"]}` }}
                    >
                      <div className="text-[11px] font-medium text-neutral-400">
                        {cls.time}
                      </div>
                      <div className="text-xs font-semibold text-neutral-700">
                        {cls.name}
                      </div>
                    </div>
                  ))}
                  {dayClasses.length === 0 && (
                    <div className="py-4 text-center text-xs text-neutral-300">
                      {schedule.noClass}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Mobile accordion list */}
      <motion.div
        {...fadeUp(inView, 0.15)}
        className="mt-10 flex flex-col gap-6 lg:hidden"
      >
        {schedule.days.map((day, d) => {
          const isToday = d === todayIndex;
          const dayClasses = sorted.filter((c) => c.day === d);
          if (dayClasses.length === 0) return null;
          return (
            <div key={d}>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-indigo-600">
                {day}
                {isToday && (
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[9px] font-bold text-indigo-700">
                    {schedule.today}
                  </span>
                )}
              </h3>
              <div className="flex flex-col gap-2">
                {dayClasses.map((cls, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 rounded-xl bg-neutral-50 px-4 py-3"
                    style={{ borderLeft: `3px solid ${TYPE_BORDER[cls.type] ?? TYPE_BORDER["1"]}` }}
                  >
                    <span className="w-12 shrink-0 text-sm font-medium text-neutral-400">
                      {cls.time}
                    </span>
                    <span className="text-sm font-semibold text-neutral-700">
                      {cls.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Legend */}
      <motion.div
        {...fadeUp(inView, 0.25)}
        className="mt-8 flex flex-wrap gap-4"
      >
        {schedule.types.map((t) => (
          <div key={t.key} className="flex items-center gap-2">
            <div className={`h-2.5 w-4 rounded-full ${TYPE_DOT[t.key] ?? TYPE_DOT["1"]}`} />
            <span className="text-xs text-neutral-500">{t.label}</span>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
