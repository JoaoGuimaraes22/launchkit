"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface Skill {
  name: string;
  level: number;
}

interface Category {
  label: string;
  skills: Skill[];
}

interface SkillsDict {
  title_line1: string;
  title_line2: string;
  categories: Category[];
}

const fadeUp = (inView: boolean, delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 },
  transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as const },
});

export default function Skills({ skills }: { skills: SkillsDict }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="skills" ref={ref} className="py-20 px-6 md:px-10">
      <motion.div {...fadeUp(inView)}>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
          {skills.title_line1}
        </h2>
        <p className="mt-1 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
          {skills.title_line2}
        </p>
      </motion.div>

      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {skills.categories.map((cat, ci) => (
          <motion.div
            key={cat.label}
            {...fadeUp(inView, 0.1 + ci * 0.1)}
            className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
          >
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">
              {cat.label}
            </h3>
            <ul className="space-y-3">
              {cat.skills.map((skill) => (
                <li key={skill.name}>
                  <div className="flex justify-between text-sm font-medium text-neutral-700">
                    <span>{skill.name}</span>
                    <span className="text-neutral-400">{skill.level}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                    <motion.div
                      className="h-full rounded-full bg-indigo-600"
                      initial={{ width: 0 }}
                      animate={inView ? { width: `${skill.level}%` } : { width: 0 }}
                      transition={{ duration: 0.8, delay: 0.3 + ci * 0.1, ease: [0.16, 1, 0.3, 1] as const }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
