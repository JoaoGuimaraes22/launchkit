"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { type Locale } from "../../../i18n-config";

interface Project {
  slug: string;
  title: string;
  description: string;
  long_description: string;
  image: string | null;
  images: string[];
  tags: string[];
  live: string | null;
  github: string | null;
}

interface WorkDict {
  title_line1: string;
  title_line2: string;
  cta: string;
  projects: Project[];
}

interface WorkProps {
  work: WorkDict;
  locale: Locale;
}

const TAG_COLORS = [
  "bg-indigo-50 text-indigo-700",
  "bg-blue-50 text-blue-700",
  "bg-emerald-50 text-emerald-700",
  "bg-amber-50 text-amber-700",
  "bg-rose-50 text-rose-700",
  "bg-cyan-50 text-cyan-700",
];

export default function Work({ work, locale }: WorkProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <section id="work" ref={ref} className="px-6 py-16 md:px-8 md:py-24 xl:px-16 xl:py-32">
      <motion.div
        className="leading-none mb-12"
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <h2 className="font-black uppercase tracking-tight text-4xl sm:text-5xl md:text-6xl xl:text-[7rem] text-zinc-900">
          {work.title_line1}
        </h2>
        <h2 className="font-black uppercase tracking-tight text-4xl sm:text-5xl md:text-6xl xl:text-[7rem] text-zinc-200">
          {work.title_line2}
        </h2>
      </motion.div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {work.projects.map((project, i) => (
          <Link key={project.slug} href={`/${locale}/work/${project.slug}`} className="group rounded-2xl overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 + i * 0.12, ease: [0.16, 1, 0.3, 1] as const }}
            className="rounded-2xl border border-zinc-100 bg-white shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 overflow-hidden"
          >
            {/* Image area */}
            <div className="relative h-44 bg-zinc-50 overflow-hidden">
              {project.image ? (
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="text-4xl opacity-20 select-none">🖥️</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-5">
              <div className="mb-3 flex flex-wrap gap-1.5">
                {project.tags.map((tag, ti) => (
                  <span
                    key={tag}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TAG_COLORS[ti % TAG_COLORS.length]}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h3 className="mb-1.5 text-sm font-semibold text-zinc-900 group-hover:text-indigo-600 transition-colors">
                {project.title}
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{project.description}</p>
              <div className="mt-4 flex items-center gap-1 text-xs text-zinc-400 group-hover:text-indigo-600 transition-colors">
                <span>View case study</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </motion.div>
          </Link>
        ))}
      </div>
    </section>
  );
}
