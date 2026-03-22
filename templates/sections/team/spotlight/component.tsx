"use client";

import { useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";

interface StatEntry {
  label: string;
  value: string;
}

interface TeamDict {
  title_line1: string;
  title_line2: string;
  body: string;
  tags: string[];
  quote: string;
  stats: StatEntry[];
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
  imageAlt: string;
}

const fadeUp = (inView: boolean, delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 },
  transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
});

export default function Team({ team }: { team: TeamDict }) {
  const sectionRef = useRef<HTMLElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-80px" });

  // Parallax on the background image
  useEffect(() => {
    const section = sectionRef.current;
    const img = imgRef.current;
    if (!section || !img) return;

    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const viewH = window.innerHeight;
      const progress = 1 - (rect.top + rect.height) / (viewH + rect.height);
      const offset = (progress - 0.5) * rect.height * 0.18;
      img.style.transform = `translateY(${offset}px)`;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      id="team"
      ref={sectionRef}
      className="relative overflow-hidden border-t border-neutral-200 py-20 px-6 md:px-10"
    >
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Left: content */}
        <div className="flex flex-col justify-center">
          <motion.h2
            {...fadeUp(inView)}
            className="text-sm font-semibold uppercase tracking-widest text-indigo-600"
          >
            {team.title_line1}
          </motion.h2>
          <motion.p
            {...fadeUp(inView, 0.05)}
            className="mt-1 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl"
          >
            {team.title_line2}
          </motion.p>
          <motion.p
            {...fadeUp(inView, 0.1)}
            className="mt-4 text-lg leading-relaxed text-neutral-600"
          >
            {team.body}
          </motion.p>

          {team.tags.length > 0 && (
            <motion.div
              {...fadeUp(inView, 0.15)}
              className="mt-6 flex flex-wrap gap-2"
            >
              {team.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700"
                >
                  {tag}
                </span>
              ))}
            </motion.div>
          )}

          {team.quote && (
            <motion.blockquote
              {...fadeUp(inView, 0.2)}
              className="mt-6 border-l-2 border-indigo-600 pl-5 text-sm italic leading-relaxed text-neutral-500"
            >
              &ldquo;{team.quote}&rdquo;
            </motion.blockquote>
          )}

          {team.ctaLabel && (
            <motion.div {...fadeUp(inView, 0.25)} className="mt-8">
              <a
                href={team.ctaHref || "#contact"}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700"
              >
                {team.ctaLabel}
              </a>
            </motion.div>
          )}
        </div>

        {/* Right: image + stats overlay */}
        <motion.div
          {...fadeUp(inView, 0.1)}
          className="relative overflow-hidden rounded-2xl border border-neutral-200"
          style={{ minHeight: "420px" }}
        >
          {/* Parallax image wrapper */}
          <div
            ref={imgRef}
            className="absolute"
            style={{ inset: "-15% 0", willChange: "transform" }}
          >
            <Image
              src={team.imageUrl}
              alt={team.imageAlt}
              fill
              className="object-cover"
            />
          </div>

          {/* Gradient overlay */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)",
            }}
          />

          {/* Stats grid overlay */}
          {team.stats.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="grid grid-cols-2 gap-3">
                {team.stats.map((stat, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-white/10 bg-white/10 p-4 text-center backdrop-blur-sm"
                  >
                    <div className="text-2xl font-bold text-white">
                      {stat.value}
                    </div>
                    <div className="mt-0.5 text-xs font-medium uppercase tracking-wide text-white/70">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
