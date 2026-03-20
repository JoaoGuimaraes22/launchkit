"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

interface TestimonialItem {
  quote: string;
  name: string;
  role: string;
  avatar: string | null;
}

interface TestimonialsDict {
  title_line1: string;
  title_line2: string;
  subtitle: string;
  items: TestimonialItem[];
}

interface TestimonialsProps {
  testimonials: TestimonialsDict;
}

const AVATAR_COLORS = [
  { bg: "bg-indigo-100", text: "text-indigo-700" },
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
  { bg: "bg-cyan-100", text: "text-cyan-700" },
];

function TestimonialCard({
  item,
  colorIndex,
}: {
  item: TestimonialItem;
  colorIndex: number;
}) {
  const color = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];
  const parts = item.name.trim().split(" ");
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();

  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm flex flex-col gap-4 mb-4 transition-all duration-300 hover:shadow-md hover:scale-[1.02] hover:border-zinc-200">
      <svg
        width="24"
        height="18"
        viewBox="0 0 24 18"
        fill="none"
        className="text-indigo-200 shrink-0"
      >
        <path
          d="M0 18V10.8C0 7.2 1.2 4.2 3.6 1.8L5.4 0l2.4 1.8C6.6 3 5.7 4.5 5.4 6H9V18H0zm13.2 0V10.8c0-3.6 1.2-6.6 3.6-9L18.6 0l2.4 1.8C19.8 3 18.9 4.5 18.6 6H22.2V18H13.2z"
          fill="currentColor"
        />
      </svg>
      <p className="text-sm text-zinc-600 leading-relaxed flex-1">
        {item.quote}
      </p>
      <div className="flex items-center gap-3 pt-2 border-t border-zinc-50">
        <div
          className={`h-9 w-9 rounded-full ${color.bg} flex items-center justify-center shrink-0`}
        >
          <span className={`text-xs font-bold ${color.text}`}>{initials}</span>
        </div>
        <div>
          <p className="text-xs font-semibold text-zinc-900">{item.name}</p>
          <p className="text-xs text-zinc-400">{item.role}</p>
        </div>
      </div>
    </div>
  );
}

function ScrollColumn({
  items,
  duration,
  globalIndexOffset,
}: {
  items: TestimonialItem[];
  duration: string;
  globalIndexOffset: number;
}) {
  const prefersReduced = useReducedMotion();
  // Triple the array: moving -33.333% of total height = exactly 1 set height → seamless loop
  const tripled = [...items, ...items, ...items];

  return (
    <div className="flex-1 min-w-0 overflow-hidden">
      <div
        className="hover:[animation-play-state:paused]"
        style={prefersReduced ? {} : {
          animation: `testimonials-scroll-up ${duration} linear infinite`,
        }}
      >
        {tripled.map((item, i) => (
          <TestimonialCard
            key={i}
            item={item}
            colorIndex={(i % items.length) + globalIndexOffset}
          />
        ))}
      </div>
    </div>
  );
}

export default function Testimonials({ testimonials }: TestimonialsProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const col1 = testimonials.items.slice(0, 3);
  const col2 = testimonials.items.slice(3, 6);
  const col3 = testimonials.items.slice(6, 9);
  // Mobile: all items in one column
  const allItems = testimonials.items;

  return (
    <section
      id="testimonials"
      ref={ref}
      className="px-6 py-16 md:px-8 md:py-24 xl:px-16 xl:py-32 bg-zinc-50"
    >
      <style>{`
        @keyframes testimonials-scroll-up {
          from { transform: translateY(0); }
          to   { transform: translateY(-33.3333%); }
        }
      `}</style>

      <motion.div
        className="leading-none mb-12"
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <h2 className="font-black uppercase tracking-tight text-4xl sm:text-5xl md:text-6xl xl:text-[7rem] text-zinc-900">
          {testimonials.title_line1}
        </h2>
        <h2 className="font-black uppercase tracking-tight text-4xl sm:text-5xl md:text-6xl xl:text-[7rem] text-zinc-200">
          {testimonials.title_line2}
        </h2>
        {testimonials.subtitle && (
          <p className="mt-4 text-sm text-zinc-500 max-w-md">
            {testimonials.subtitle}
          </p>
        )}
      </motion.div>

      {/* Scrolling columns container */}
      <motion.div
        className="relative h-150 md:h-175 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{
          duration: 0.6,
          delay: 0.3,
          ease: [0.16, 1, 0.3, 1] as const,
        }}
      >
        {/* Gradient fades */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-zinc-50 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-zinc-50 to-transparent z-10" />

        {/* Mobile: single column (all items) */}
        <div className="md:hidden h-full">
          <ScrollColumn items={allItems} duration="65s" globalIndexOffset={0} />
        </div>

        {/* Desktop: 3 columns at different speeds */}
        <div className="hidden md:flex gap-4 h-full">
          {/* Left — fastest */}
          <ScrollColumn items={col1} duration="20s" globalIndexOffset={0} />
          {/* Middle — slowest */}
          <ScrollColumn items={col2} duration="35s" globalIndexOffset={3} />
          {/* Right — medium */}
          <ScrollColumn items={col3} duration="25s" globalIndexOffset={6} />
        </div>
      </motion.div>
    </section>
  );
}
