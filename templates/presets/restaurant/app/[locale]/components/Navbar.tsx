"use client";

import { useEffect, useState, useCallback } from "react";
import { type Locale } from "../../../i18n-config";
import LanguageSwitcher from "./LanguageSwitcher";

interface NavLink {
  id: string;
  label: string;
}

interface NavbarDict {
  logo: string;
  cta: string;
  links: NavLink[];
}

interface NavbarProps {
  locale: Locale;
  nav: NavbarDict;
}

export default function Navbar({ locale, nav }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  /* ---- scroll detection ---- */
  useEffect(() => {
    const check = () => setScrolled(window.scrollY > 60);
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);

  /* ---- active section tracking ---- */
  useEffect(() => {
    const ids = ["home", ...nav.links.map((l) => l.id)];
    const observers: IntersectionObserver[] = [];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { threshold: 0.3 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [nav.links]);

  const scrollTo = useCallback((id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  /* ---- close mobile menu on resize to desktop ---- */
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 h-14 transition-colors duration-300 ${
          scrolled ? "bg-white/90 shadow-sm backdrop-blur-md" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 md:px-8">
          {/* Logo */}
          <a
            href={`/${locale}#home`}
            className={`shrink-0 text-sm font-bold tracking-wide transition-colors ${
              scrolled ? "text-zinc-900" : "text-white"
            }`}
          >
            {nav.logo}
          </a>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 md:flex">
            {nav.links.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className={`relative cursor-pointer text-sm font-medium transition-colors hover:opacity-70 ${
                  scrolled ? "text-zinc-700" : "text-white/80"
                }`}
              >
                {link.label}
                {activeSection === link.id && (
                  <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-indigo-500" />
                )}
              </button>
            ))}
            <LanguageSwitcher currentLocale={locale} scrolled={scrolled} />
            <button
              onClick={() => scrollTo("contact")}
              className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              {nav.cta}
            </button>
          </nav>

          {/* Mobile hamburger */}
          <div className="flex items-center gap-3 md:hidden">
            <LanguageSwitcher currentLocale={locale} scrolled={scrolled} />
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
              className={`transition-colors ${scrolled ? "text-zinc-700" : "text-white"}`}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {menuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile dropdown — rendered outside header to avoid overflow issues */}
      <div
        className={`fixed inset-x-0 top-14 z-40 shadow-md backdrop-blur-md transition-all duration-300 md:hidden ${
          scrolled ? "bg-white/95" : "bg-zinc-950/95"
        } ${
          menuOpen ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        <nav className="flex flex-col gap-3 px-4 py-4">
          {nav.links.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className={`text-left text-sm font-medium transition-colors hover:text-indigo-600 ${
                activeSection === link.id
                  ? "text-indigo-600"
                  : scrolled
                    ? "text-zinc-700"
                    : "text-white/80"
              }`}
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => scrollTo("contact")}
            className="mt-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            {nav.cta}
          </button>
        </nav>
      </div>
    </>
  );
}
