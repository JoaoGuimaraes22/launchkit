"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MenuItem {
  name: string;
  description: string;
  price: string;
  image?: string;
}

interface MenuCategory {
  key: string;
  label: string;
  items: MenuItem[];
}

interface MenuDict {
  title: string;
  subtitle: string;
  categories: MenuCategory[];
}

const ease = [0.16, 1, 0.3, 1] as const;

const gridVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.07, delayChildren: 0.04, duration: 0.25, ease },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18, ease } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};

function ItemCard({ item }: { item: MenuItem }) {
  return (
    <motion.div
      className="group overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm flex flex-col"
      variants={cardVariants}
      whileHover={{ y: -4, boxShadow: "0 12px 36px 0 rgba(0,0,0,0.12)" }}
      suppressHydrationWarning
    >
      <div className="relative h-40 w-full overflow-hidden bg-zinc-100">
        {item.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).parentElement!.classList.add("bg-zinc-100");
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        )}
      </div>
      <div className="flex flex-1 items-end justify-between gap-3 p-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-zinc-900">{item.name}</h3>
          <p className="mt-0.5 text-sm text-zinc-500 line-clamp-2">{item.description}</p>
        </div>
        <span className="shrink-0 text-base font-black text-zinc-800">{item.price}</span>
      </div>
    </motion.div>
  );
}

export default function Menu({ menu }: { menu: MenuDict }) {
  const [activeKey, setActiveKey] = useState(menu.categories[0]?.key ?? "");

  const activeCategory = menu.categories.find((c) => c.key === activeKey) ?? menu.categories[0];
  const highlightItem = activeCategory?.items[0];
  const remainingItems = activeCategory?.items.slice(1) ?? [];

  return (
    <section id="menu" className="px-6 py-16 md:px-8 md:py-24 xl:px-16 xl:py-32">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease }}
        >
          <h2 suppressHydrationWarning className="text-4xl font-black tracking-tight sm:text-5xl">{menu.title}</h2>
          <p suppressHydrationWarning className="mt-4 text-lg text-zinc-500">{menu.subtitle}</p>
        </motion.div>

        {/* Tab bar */}
        <motion.div
          className="mb-10 flex gap-1 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.1, ease }}
          suppressHydrationWarning
        >
          {menu.categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveKey(cat.key)}
              suppressHydrationWarning
              className={`relative shrink-0 rounded-full px-5 py-2 text-sm font-semibold ${
                activeKey === cat.key ? "text-white" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {/* Static inactive background */}
              <span className="absolute inset-0 rounded-full bg-zinc-100" />
              {/* Sliding active pill */}
              {activeKey === cat.key && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-full bg-indigo-600"
                  transition={{ duration: 0.3, ease }}
                />
              )}
              <span className="relative z-10">{cat.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Menu grid — mode="sync" avoids the SSR/client mismatch that mode="wait" causes */}
        <AnimatePresence mode="sync">
          {activeCategory && (
            <motion.div
              key={activeKey}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              variants={gridVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              suppressHydrationWarning
            >
              {/* Highlight card */}
              {highlightItem && (
                <motion.div
                  className="relative overflow-hidden rounded-2xl bg-zinc-900 text-white sm:col-span-2 lg:col-span-1 lg:row-span-2"
                  variants={cardVariants}
                  whileHover={{ scale: 1.015, boxShadow: "0 16px 48px 0 rgba(0,0,0,0.22)" }}
                  suppressHydrationWarning
                >
                  {highlightItem.image && (
                    <div suppressHydrationWarning className="relative h-52 w-full sm:h-64 lg:h-80 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={highlightItem.image}
                        alt={highlightItem.name}
                        suppressHydrationWarning
                        className="h-full w-full object-cover opacity-80 transition-transform duration-500 hover:scale-105"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).parentElement!.style.display =
                            "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-zinc-900/70 to-transparent" />
                    </div>
                  )}
                  <div className="p-6">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-indigo-400">
                      Chef&apos;s Pick
                    </p>
                    <h3 className="text-xl font-bold">{highlightItem.name}</h3>
                    <p className="mt-2 text-sm text-zinc-300">{highlightItem.description}</p>
                    <p className="mt-4 text-lg font-black">{highlightItem.price}</p>
                  </div>
                </motion.div>
              )}

              {/* Remaining items */}
              {remainingItems.map((item) => (
                <ItemCard key={item.name} item={item} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
