"use client";

interface CTADict {
  call_label: string;
  phone: string;
  whatsapp_label: string;
  whatsapp: string;
  book_label: string;
}

export default function FloatingCTA({ cta }: { cta: CTADict }) {
  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-zinc-200 bg-white/95 shadow-lg backdrop-blur-sm md:hidden">
      <a
        href={`tel:${cta.phone}`}
        className="flex flex-1 items-center justify-center gap-1.5 py-3.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.1 3.4 2 2 0 0 1 3.08 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z" />
        </svg>
        {cta.call_label}
      </a>

      <div className="w-px bg-zinc-200" />

      <a
        href={`https://wa.me/${cta.whatsapp}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-1 items-center justify-center gap-1.5 py-3.5 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-50"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.099 1.51 5.818L.06 23.25l5.577-1.422A11.942 11.942 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.647-.518-5.154-1.42l-.37-.219-3.313.846.88-3.22-.24-.373A9.942 9.942 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
        </svg>
        {cta.whatsapp_label}
      </a>

      <div className="w-px bg-zinc-200" />

      <button
        onClick={scrollToContact}
        className="flex flex-1 items-center justify-center gap-1.5 py-3.5 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-50"
      >
        {cta.book_label}
      </button>
    </div>
  );
}
