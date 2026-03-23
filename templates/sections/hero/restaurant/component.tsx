"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

interface Stat {
  value: string;
  label: string;
}

interface HeroDict {
  logo: string;
  tagline: string;
  cta: string;
  cta_secondary: string;
  stats: Stat[];
}

function SmokeWisp({
  delay,
  duration,
  left,
  size,
  blur,
  hidden,
}: {
  delay: number;
  duration: number;
  left: string;
  size: number;
  blur: number;
  hidden?: boolean;
}) {
  if (hidden) return null;
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left,
        bottom: "48%",
        width: `${size}px`,
        height: `${size * 2}px`,
        borderRadius: "50%",
        background: `radial-gradient(ellipse at center, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 30%, rgba(200,200,200,0.1) 60%, transparent 80%)`,
        filter: `blur(${blur}px)`,
        animation: `smoke-float ${duration}s ease-out ${delay}s infinite`,
      }}
    />
  );
}

export default function Hero({ hero }: { hero: HeroDict }) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedRaw = useReducedMotion();
  const prefersReduced = mounted ? (prefersReducedRaw ?? false) : false;

  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 800], [0, 280]);
  const contentOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const contentY = useTransform(scrollY, [0, 500], [0, -60]);

  useEffect(() => {
    const mountTimer = setTimeout(() => setMounted(true), 0);
    const visTimer = setTimeout(() => setVisible(true), 60);
    return () => { clearTimeout(mountTimer); clearTimeout(visTimer); };
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black"
    >
      <style>{`
        @keyframes slow-zoom {
          from { transform: scale(1.15); }
          to { transform: scale(1); }
        }
        @keyframes smoke-float {
          0% { transform: translateY(0) scaleX(1); opacity: 0; }
          10% { opacity: 1; }
          80% { opacity: 0.6; }
          100% { transform: translateY(-180px) scaleX(1.4); opacity: 0; }
        }
        @keyframes cinematic-up {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes line-expand {
          from { width: 0; opacity: 0; }
          to { width: 200px; opacity: 1; }
        }
        @keyframes scrollPulse {
          0%, 100% { transform: translateY(-100%); opacity: 0; }
          30% { opacity: 1; }
          70% { opacity: 1; }
          100% { transform: translateY(200%); opacity: 0; }
        }
      `}</style>

      {/* Background — full bleed with parallax */}
      <motion.div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ y: bgY }}
      >
        <div
          className="absolute"
          style={{
            top: "-20%",
            bottom: "-20%",
            left: 0,
            right: 0,
            animation: prefersReduced ? undefined : "slow-zoom 22s ease-in-out infinite alternate",
          }}
        >
          {/* TODO: TEMPLATE — replace /hero.jpg with your hero image */}
          <div className="absolute inset-0 bg-zinc-900" />
        </div>
      </motion.div>

      {/* Cinematic gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-zinc-950/95 via-zinc-950/55 to-zinc-950/20" />

      {/* Smoke wisps */}
      <div className="absolute inset-0 z-5 pointer-events-none overflow-hidden">
        <SmokeWisp delay={0} duration={4} left="39%" size={80} blur={12} hidden={prefersReduced} />
        <SmokeWisp delay={0.8} duration={5.2} left="48%" size={100} blur={16} hidden={prefersReduced} />
        <SmokeWisp delay={1.6} duration={4.5} left="43%" size={60} blur={10} hidden={prefersReduced} />
        <SmokeWisp delay={2.6} duration={5.8} left="53%" size={90} blur={14} hidden={prefersReduced} />
        <SmokeWisp delay={3.4} duration={6} left="46%" size={120} blur={20} hidden={prefersReduced} />
        <SmokeWisp delay={0.3} duration={4.8} left="51%" size={50} blur={8} hidden={prefersReduced} />
        <SmokeWisp delay={2} duration={5} left="56%" size={70} blur={11} hidden={prefersReduced} />
      </div>

      {/* Film grain */}
      <div
        className="absolute inset-0 z-6 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-center"
        style={prefersReduced ? {} : { opacity: contentOpacity, y: contentY }}
      >
        {/* Logo / business name */}
        <div
          style={
            visible
              ? { animation: "cinematic-up 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s both" }
              : { opacity: 0 }
          }
        >
          <p className="mx-auto mb-6 text-5xl font-black tracking-widest text-white uppercase md:text-7xl">
            {hero.logo}
          </p>
        </div>

        {/* Divider line */}
        <div
          className="mx-auto mb-8 h-px bg-white/30"
          style={
            visible
              ? { animation: "line-expand 0.8s cubic-bezier(0.16,1,0.3,1) 0.35s both" }
              : { opacity: 0, width: 0 }
          }
        />

        {/* Tagline */}
        <p
          className="mx-auto mb-10 max-w-2xl text-base text-zinc-300 sm:text-lg md:text-xl"
          style={
            visible
              ? { animation: "cinematic-up 0.9s cubic-bezier(0.16,1,0.3,1) 0.45s both" }
              : { opacity: 0 }
          }
        >
          {hero.tagline}
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col items-center justify-center gap-3 sm:flex-row"
          style={
            visible
              ? { animation: "cinematic-up 0.9s cubic-bezier(0.16,1,0.3,1) 0.6s both" }
              : { opacity: 0 }
          }
        >
          <button
            onClick={() => scrollTo("contact")}
            className="rounded-xl bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-indigo-700"
          >
            {hero.cta}
          </button>
          <button
            onClick={() => scrollTo("menu")}
            className="rounded-xl border border-white/30 px-8 py-3.5 text-sm font-semibold text-white/90 backdrop-blur-sm transition-colors hover:border-white/60 hover:bg-white/10"
          >
            {hero.cta_secondary}
          </button>
        </div>

        {/* Stats */}
        {hero.stats.length > 0 && (
          <div
            className="mt-16 flex flex-col items-center justify-center gap-8 sm:flex-row sm:gap-16"
            style={
              visible
                ? { animation: "cinematic-up 0.9s cubic-bezier(0.16,1,0.3,1) 0.75s both" }
                : { opacity: 0 }
            }
          >
            {hero.stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-black text-white sm:text-4xl">{stat.value}</div>
                <div className="mt-1 text-xs font-medium tracking-wide text-zinc-400 uppercase">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center gap-2"
        style={
          visible
            ? { animation: "cinematic-up 0.9s cubic-bezier(0.16,1,0.3,1) 0.9s both" }
            : { opacity: 0 }
        }
      >
        <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">Scroll</span>
        <div className="relative h-8 w-px overflow-hidden bg-white/20">
          <div
            className="absolute top-0 h-3 w-full bg-white/60"
            style={{ animation: "scrollPulse 2s ease-in-out infinite" }}
          />
        </div>
      </div>
    </section>
  );
}
