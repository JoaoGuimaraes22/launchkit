"use client";

import { usePathname, useRouter } from "next/navigation";
import { i18n, type Locale } from "../../../i18n-config";

export default function LanguageSwitcher({ currentLocale, scrolled }: { currentLocale: Locale; scrolled: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(locale: Locale) {
    const segments = pathname.split("/");
    segments[1] = locale;
    router.push(segments.join("/"));
  }

  return (
    <div className="flex items-center gap-1 text-sm font-mono">
      {i18n.locales.map((locale, index) => (
        <span key={locale} className="flex items-center gap-1">
          <button
            onClick={() => switchLocale(locale)}
            className={`uppercase tracking-wider transition-colors ${
              currentLocale === locale
                ? scrolled ? "text-indigo-600 font-semibold" : "text-white font-semibold"
                : scrolled ? "text-zinc-400 hover:text-zinc-700" : "text-white/40 hover:text-white/70"
            }`}
          >
            {locale}
          </button>
          {index < i18n.locales.length - 1 && (
            <span className={scrolled ? "text-zinc-300" : "text-white/20"}>/</span>
          )}
        </span>
      ))}
    </div>
  );
}
