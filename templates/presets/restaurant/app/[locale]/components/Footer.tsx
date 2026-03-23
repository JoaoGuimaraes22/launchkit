interface NavLink {
  id: string;
  label: string;
}

interface FooterDict {
  tagline: string;
  address: string;
  hours: string;
  phone: string;
  email: string;
  copyright: string;
  book_cta: string;
  explore_label: string;
  hours_label: string;
  find_us_label: string;
  made_in: string;
  nav_links: NavLink[];
}

interface FooterProps {
  footer: FooterDict;
  logo: string;
}

export default function Footer({ footer, logo }: FooterProps) {
  return (
    <footer className="bg-zinc-950 px-6 pt-16 pb-8 md:px-8 xl:px-16">
      <div className="mx-auto max-w-6xl">

        {/* Top: brand + tagline */}
        <div className="mb-12 flex flex-col gap-4 border-b border-zinc-800 pb-12 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-4 text-lg font-bold text-white">{logo}</div>
            <p className="max-w-xs text-sm leading-relaxed text-zinc-400">{footer.tagline}</p>
          </div>
          <a
            href="#contact"
            className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            {footer.book_cta}
          </a>
        </div>

        {/* Middle: nav + contact */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 mb-12">

          {/* Nav */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              {footer.explore_label}
            </p>
            <nav className="flex flex-col gap-2.5">
              {footer.nav_links.map((link) => (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  className="cursor-pointer text-sm text-zinc-400 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Hours */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              {footer.hours_label}
            </p>
            <p className="text-sm text-zinc-400 leading-relaxed">{footer.hours}</p>
          </div>

          {/* Contact */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              {footer.find_us_label}
            </p>
            <div className="flex flex-col gap-2 text-sm text-zinc-400">
              <span className="leading-relaxed">{footer.address}</span>
              <a href={`tel:${footer.phone}`} className="cursor-pointer transition-colors hover:text-white">
                {footer.phone}
              </a>
              <a href={`mailto:${footer.email}`} className="cursor-pointer transition-colors hover:text-white">
                {footer.email}
              </a>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-2 border-t border-zinc-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-600">{footer.copyright}</p>
          <p className="text-xs text-zinc-700">{footer.made_in}</p>
        </div>

      </div>
    </footer>
  );
}
