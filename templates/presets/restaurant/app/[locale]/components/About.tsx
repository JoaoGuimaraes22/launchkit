"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useInView } from "motion";

interface Stat {
  value: string;
  label: string;
}

interface AboutDict {
  title_line1: string;
  title_line2: string;
  body: string;
  stats: Stat[];
}

export default function About({ about }: { about: AboutDict }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const paragraphs = about.body.split("\n\n").filter(Boolean);

  return (
    <section
      id="about"
      ref={ref}
      className="bg-zinc-50 px-6 py-16 md:px-8 md:py-24 xl:px-16 xl:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Image */}
          <motion.div
            className="relative aspect-4/3 overflow-hidden rounded-2xl shadow-md lg:aspect-square"
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <Image src="/about.jpg" alt="About us" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="mb-8 font-black uppercase leading-none tracking-tight text-4xl sm:text-5xl md:text-6xl">
              <span className="block text-zinc-900">{about.title_line1}</span>
              <span className="block text-zinc-200">{about.title_line2}</span>
            </h2>

            <div className="space-y-4">
              {paragraphs.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-zinc-600 md:text-base">
                  {p}
                </p>
              ))}
            </div>

            {/* Stats */}
            {about.stats.length > 0 && (
              <div className="mt-10 grid grid-cols-3 gap-4 border-t border-zinc-200 pt-8">
                {about.stats.map((stat, i) => (
                  <motion.div
                    key={i}
                    className="text-center"
                    initial={{ opacity: 0, y: 16 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.3 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="text-2xl font-black text-orange-600 sm:text-3xl">
                      {stat.value}
                    </div>
                    <div className="mt-1 text-xs font-medium text-zinc-500 leading-tight">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
