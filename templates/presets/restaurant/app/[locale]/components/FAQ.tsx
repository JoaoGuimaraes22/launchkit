"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQDict {
  title_line1: string;
  title_line2: string;
  items: FAQItem[];
}

export default function FAQ({ faq }: { faq: FAQDict }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section id="faq" className="bg-white px-6 py-16 md:px-8 md:py-24 xl:px-16 xl:py-32">
      <div className="mx-auto max-w-3xl">
        {/* Heading */}
        <h2 className="mb-12 font-black uppercase leading-none tracking-tight text-4xl sm:text-5xl md:text-6xl">
          <span className="block text-zinc-900">{faq.title_line1}</span>
          <span className="block text-zinc-200">{faq.title_line2}</span>
        </h2>

        {/* Accordion */}
        <div className="divide-y divide-zinc-100 rounded-2xl border border-zinc-100 bg-white shadow-sm">
          {faq.items.map((item, i) => (
            <div key={i}>
              <button
                onClick={() => toggle(i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-zinc-50"
              >
                <span className="text-sm font-semibold text-zinc-900">{item.question}</span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`shrink-0 text-indigo-500 transition-transform duration-200 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {openIndex === i && (
                <div className="px-6 pb-5">
                  <p className="text-sm leading-relaxed text-zinc-500">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
