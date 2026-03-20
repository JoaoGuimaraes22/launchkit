"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface FunFact {
  emoji: string;
  title: string;
  text: string;
}

interface AboutDict {
  title_line1: string;
  title_line2: string;
  bio: string;
  bio_callout: string;
  bio_cta: string;
  fun_facts: FunFact[];
}

interface AboutProps {
  about: AboutDict;
}

const FACT_STYLES = [
  {
    wrapper: "bg-indigo-600",
    title: "text-white",
    body: "text-white/70",
    emoji: "text-white",
  },
  {
    wrapper: "bg-white border border-zinc-100 shadow-sm",
    title: "text-zinc-900",
    body: "text-zinc-500",
    emoji: "text-zinc-100/80",
  },
  {
    wrapper: "bg-zinc-100",
    title: "text-zinc-900",
    body: "text-zinc-500",
    emoji: "text-zinc-200/70",
  },
  {
    wrapper: "bg-indigo-50",
    title: "text-indigo-900",
    body: "text-indigo-400",
    emoji: "text-indigo-100",
  },
];

export default function About({ about }: AboutProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const bioParagraphs = about.bio.split("\n\n");

  return (
    <section
      id="about"
      ref={ref}
      className="px-6 py-16 md:px-8 md:py-24 xl:px-16 xl:py-32"
    >
      <motion.div
        className="leading-none mb-12"
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <h2 className="font-black uppercase tracking-tight text-4xl sm:text-5xl md:text-6xl xl:text-[7rem] text-zinc-900">
          {about.title_line1}
        </h2>
        <h2 className="font-black uppercase tracking-tight text-4xl sm:text-5xl md:text-6xl xl:text-[7rem] text-zinc-200">
          {about.title_line2}
        </h2>
      </motion.div>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Bio column */}
        <div className="flex flex-col gap-6">
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.7,
              delay: 0.1,
              ease: [0.16, 1, 0.3, 1] as const,
            }}
          >
            {bioParagraphs.map((para, i) => (
              <p
                key={i}
                className={
                  i === 0
                    ? "text-base text-zinc-800 font-medium leading-relaxed"
                    : "text-sm text-zinc-500 leading-relaxed"
                }
              >
                {para}
              </p>
            ))}
          </motion.div>

          {/* Indigo callout strip */}
          <motion.div
            className="rounded-2xl bg-indigo-600 px-6 py-5 flex items-center justify-between gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.6,
              delay: 0.35,
              ease: [0.16, 1, 0.3, 1] as const,
            }}
          >
            <p className="text-sm font-medium text-white/90 leading-snug">
              {about.bio_callout}
            </p>
            <a
              href="#contact"
              className="shrink-0 text-xs font-semibold uppercase tracking-widest text-white/80 hover:text-white transition-all duration-300 hover:-translate-y-0.5 hover:drop-shadow-sm"
            >
              {about.bio_cta}
            </a>
          </motion.div>
        </div>

        {/* Fun facts grid */}
        <div className="grid grid-cols-2 gap-3 content-start">
          {about.fun_facts.map((fact, i) => {
            const style = FACT_STYLES[i % FACT_STYLES.length];
            return (
              <motion.div
                key={i}
                className={`relative rounded-2xl p-5 overflow-hidden min-h-32 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${style.wrapper}`}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.6,
                  delay: 0.15 + i * 0.12,
                  ease: [0.16, 1, 0.3, 1] as const,
                }}
              >
                {/* Decorative emoji */}
                <span
                  className={`absolute bottom-2 right-3 text-5xl leading-none select-none pointer-events-none ${style.emoji}`}
                  aria-hidden
                >
                  {fact.emoji}
                </span>

                <div className="relative z-10">
                  <p
                    className={`text-sm font-semibold leading-snug mb-1 ${style.title}`}
                  >
                    {fact.title}
                  </p>
                  <p className={`text-xs leading-relaxed ${style.body}`}>
                    {fact.text}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
