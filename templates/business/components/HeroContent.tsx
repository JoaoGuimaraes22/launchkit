"use client";

import Image from "next/image";
import { useRef, useEffect, useState } from "react";

interface Stat {
  value: string;
  label: string;
}

interface HeroDict {
  title_line1: string;
  title_line2: string;
  tagline: string;
  cta: string;
  cta_secondary: string;
  stats: Stat[];
}

export default function HeroContent({ hero }: { hero: HeroDict }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="home" ref={ref} className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background image */}
      <Image
        src="/hero.jpg"
        alt="Hero background"
        fill
        className="object-cover"
        priority
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-zinc-900/65" />

      {/* Gradient overlay for text legibility at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-zinc-900/60 to-transparent" />

      {/* Content */}
      <div
        className={`relative z-10 mx-auto max-w-4xl px-6 py-24 text-center transition-all duration-700 ${
          visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        {/* Headline */}
        <h1 className="mb-6 font-black uppercase leading-none tracking-tight text-5xl sm:text-6xl md:text-7xl xl:text-[7rem]">
          <span className="block text-white">{hero.title_line1}</span>
          <span className="block text-white/30">{hero.title_line2}</span>
        </h1>

        {/* Tagline */}
        <p className="mx-auto mb-10 max-w-2xl text-base text-zinc-300 sm:text-lg md:text-xl">
          {hero.tagline}
        </p>

        {/* CTAs */}
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            onClick={() => scrollTo("contact")}
            className="rounded-xl bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            {hero.cta}
          </button>
          <button
            onClick={() => scrollTo("about")}
            className="rounded-xl border border-white/30 px-8 py-3.5 text-sm font-semibold text-white/90 backdrop-blur-sm transition-colors hover:border-white/60 hover:bg-white/10"
          >
            {hero.cta_secondary}
          </button>
        </div>

        {/* Stats */}
        {hero.stats.length > 0 && (
          <div className="mt-16 flex flex-col items-center justify-center gap-8 sm:flex-row sm:gap-16">
            {hero.stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-black text-white sm:text-4xl">{stat.value}</div>
                <div className="mt-1 text-xs font-medium tracking-wide text-zinc-400 uppercase">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-white/40">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </section>
  );
}
