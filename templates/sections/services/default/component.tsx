"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface ServiceItem {
  icon: string;
  title: string;
  description: string;
}

interface ServicesDict {
  title_line1: string;
  title_line2: string;
  items: ServiceItem[];
}

export default function Services({ services }: { services: ServicesDict }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="services"
      ref={ref}
      className="bg-white px-6 py-16 md:px-8 md:py-24 xl:px-16 xl:py-32"
    >
      <div className="mx-auto max-w-6xl">
        {/* Heading */}
        <motion.h2
          className="mb-12 font-black uppercase leading-none tracking-tight text-4xl sm:text-5xl md:text-6xl"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <span className="block text-zinc-900">{services.title_line1}</span>
          <span className="block text-zinc-200">{services.title_line2}</span>
        </motion.h2>

        {/* Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.items.map((item, i) => (
            <motion.div
              key={i}
              className="group flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm cursor-default"
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.07, ease: [0.16, 1, 0.3, 1] as const }}
              whileHover={{ y: -4, boxShadow: "0 8px 32px 0 rgba(0,0,0,0.10)" }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl transition-transform duration-200 group-hover:scale-110">
                {item.icon}
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 mb-1">{item.title}</h3>
                <p className="text-xs leading-relaxed text-zinc-500">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
