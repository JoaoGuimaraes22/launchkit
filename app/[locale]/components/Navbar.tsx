"use client";

import { useEffect, useState } from "react";
import { type Locale } from "../../../i18n-config";
import NavDropdown from "./NavDropdown";
import LanguageSwitcher from "./LanguageSwitcher";

interface NavDict {
  home: string;
  work: string;
  reviews: string;
  services: string;
  workflow: string;
  about: string;
  contact: string;
}

interface NavbarProps {
  locale: Locale;
  nav: NavDict;
}

export default function Navbar({ locale, nav }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let rafId: number;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setScrolled(window.scrollY > window.innerHeight * 0.8);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const sections = [
    { id: "home", label: nav.home },
    { id: "work", label: nav.work },
    { id: "testimonials", label: nav.reviews },
    { id: "services", label: nav.services },
    { id: "process", label: nav.workflow },
    { id: "about", label: nav.about },
    { id: "contact", label: nav.contact },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between px-4 transition-all duration-300 md:px-8 ${
        scrolled
          ? "border-b border-zinc-100 bg-white/90 backdrop-blur-md"
          : "border-b border-white/10 bg-transparent"
      }`}
    >
      {/* Logo */}
      <a
        href={`/${locale}`}
        className={`text-sm font-semibold tracking-widest uppercase transition-colors duration-300 ${
          scrolled ? "text-zinc-900 hover:text-indigo-600" : "text-white/90 hover:text-white"
        }`}
      >
        JG<span className={scrolled ? "text-indigo-600" : "text-indigo-400"}>.</span>
      </a>

      {/* Nav + Language */}
      <div className="flex items-center gap-4">
        <NavDropdown sections={sections} scrolled={scrolled} />
        <LanguageSwitcher currentLocale={locale} scrolled={scrolled} />
      </div>
    </header>
  );
}
