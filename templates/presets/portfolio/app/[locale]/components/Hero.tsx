"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface Stat {
  value: string;
  label: string;
}

interface HeroDict {
  title_line1: string;
  title_line2: string;
  tagline: string;
  cta: string;
  cta_secondary: string;
  stats: Stat[];
}

interface HeroProps {
  hero: HeroDict;
}

export default function Hero({ hero }: HeroProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="home"
      ref={ref}
      className="flex min-h-screen flex-col justify-center px-6 py-16 md:px-8 md:py-24 xl:px-16 xl:py-32"
    >
      {/* Title */}
      <motion.div
        className="leading-none mb-10"
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <h1 className="font-black uppercase tracking-tight text-4xl sm:text-5xl md:text-6xl xl:text-[7rem] text-zinc-900">
          {hero.title_line1}
        </h1>
        <h1 className="font-black uppercase tracking-tight text-4xl sm:text-5xl md:text-6xl xl:text-[7rem] text-zinc-200">
          {hero.title_line2}
        </h1>
      </motion.div>

      {/* Tagline */}
      <motion.p
        className="max-w-md text-base text-zinc-500 leading-relaxed mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const }}
      >
        {hero.tagline}
      </motion.p>

      {/* CTAs */}
      <motion.div
        className="flex flex-wrap gap-3 mb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <a
          href="#contact"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          {hero.cta}
        </a>
        <a
          href="#work"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("work")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="rounded-xl border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 transition-colors"
        >
          {hero.cta_secondary}
        </a>
      </motion.div>

      {/* Stats */}
      <div className="flex flex-wrap gap-10">
        {hero.stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.35 + i * 0.12, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <p className="text-3xl font-black text-zinc-900">{stat.value}</p>
            <p className="text-xs text-zinc-400 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
