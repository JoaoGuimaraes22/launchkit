"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    let rafId: number;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 60);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const handleNavClick = (id: string) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between px-4 transition-all duration-300 md:px-8 ${
        scrolled
          ? "border-b border-zinc-100 bg-white/90 shadow-sm backdrop-blur-md"
          : "border-b border-white/10 bg-transparent"
      }`}
    >
      {/* Logo */}
      <a
        href={`/${locale}#home`}
        className={`text-sm font-bold tracking-wide transition-colors ${
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
            onClick={() => handleNavClick(link.id)}
            className={`text-sm font-medium transition-colors hover:opacity-70 ${
              scrolled ? "text-zinc-700" : "text-white/80"
            }`}
          >
            {link.label}
          </button>
        ))}
        <LanguageSwitcher locale={locale} scrolled={scrolled} />
        <button
          onClick={() => handleNavClick("contact")}
          className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          {nav.cta}
        </button>
      </nav>

      {/* Mobile: hamburger */}
      <div className="flex items-center gap-3 md:hidden">
        <LanguageSwitcher locale={locale} scrolled={scrolled} />
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          className={`transition-colors ${scrolled ? "text-zinc-700" : "text-white"}`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute top-14 left-0 right-0 border-b border-zinc-100 bg-white/95 px-4 py-4 shadow-md backdrop-blur-md md:hidden">
          <nav className="flex flex-col gap-3">
            {nav.links.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className="text-left text-sm font-medium text-zinc-700 transition-colors hover:text-indigo-600"
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => handleNavClick("contact")}
              className="mt-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              {nav.cta}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
