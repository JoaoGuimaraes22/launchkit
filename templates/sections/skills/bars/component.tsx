"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface SkillItem {
  name: string;
  level: number;
}

interface SkillsDict {
  title_line1: string;
  title_line2: string;
  items: SkillItem[];
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

      <div className="mt-12 space-y-5">
        {skills.items.map((skill, i) => (
          <motion.div key={skill.name} {...fadeUp(inView, 0.1 + i * 0.05)}>
            <div className="flex justify-between text-sm font-medium text-neutral-700">
              <span>{skill.name}</span>
              <span className="text-neutral-400">{skill.level}%</span>
            </div>
            <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
              <motion.div
                className="h-full rounded-full bg-indigo-600"
                initial={{ width: 0 }}
                animate={inView ? { width: `${skill.level}%` } : { width: 0 }}
                transition={{ duration: 0.8, delay: 0.2 + i * 0.06, ease: [0.16, 1, 0.3, 1] as const }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
