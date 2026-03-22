"use client";

import { useState } from "react";
import Image from "next/image";

interface MenuItem {
  name: string;
  description: string;
  price: string;
}

interface MenuCategory {
  key: string;
  label: string;
  highlight_image?: string;
  items: MenuItem[];
}

interface MenuDict {
  title: string;
  subtitle: string;
  categories: MenuCategory[];
}

export default function Menu({ menu }: { menu: MenuDict }) {
  const [activeKey, setActiveKey] = useState(menu.categories[0]?.key ?? "");

  const activeCategory = menu.categories.find((c) => c.key === activeKey) ?? menu.categories[0];
  const highlightItem = activeCategory?.items[0];
  const remainingItems = activeCategory?.items.slice(1) ?? [];

  return (
    <section id="menu" className="py-24 px-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
            {menu.title}
          </h2>
          <p className="mt-4 text-lg text-zinc-500">{menu.subtitle}</p>
        </div>

        {/* Tab bar */}
        <div
          className="mb-10 flex gap-1 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {menu.categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveKey(cat.key)}
              className={`shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                activeKey === cat.key
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Menu grid */}
        {activeCategory && (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Highlight card — first item */}
            {highlightItem && (
              <div className="relative overflow-hidden rounded-2xl bg-zinc-900 text-white md:row-span-2">
                {activeCategory.highlight_image && (
                  <div className="relative h-52 w-full md:h-64">
                    <Image
                      src={activeCategory.highlight_image}
                      alt={highlightItem.name}
                      fill
                      className="object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-zinc-900 to-transparent" />
                  </div>
                )}
                <div className={`p-6 ${!activeCategory.highlight_image ? "pt-8" : ""}`}>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-indigo-400">
                    Chef&apos;s Pick
                  </p>
                  <h3 className="text-xl font-bold">{highlightItem.name}</h3>
                  <p className="mt-2 text-sm text-zinc-300">{highlightItem.description}</p>
                  <p className="mt-4 text-lg font-black">{highlightItem.price}</p>
                </div>
              </div>
            )}

            {/* Remaining items */}
            {remainingItems.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="mt-0.5 text-sm text-zinc-500 line-clamp-2">{item.description}</p>
                </div>
                <span className="shrink-0 font-black text-zinc-800">{item.price}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
