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
  nav_links: NavLink[];
}

interface FooterProps {
  footer: FooterDict;
  logo: string;
}

export default function Footer({ footer, logo }: FooterProps) {
  return (
    <footer className="bg-zinc-900 px-6 py-12 md:px-8 xl:px-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="mb-3 text-sm font-bold text-white">{logo}</div>
            <p className="text-xs leading-relaxed text-zinc-400">{footer.tagline}</p>
          </div>

          {/* Nav links */}
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Navigation</div>
            <nav className="flex flex-col gap-2">
              {footer.nav_links.map((link) => (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  className="text-xs text-zinc-400 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Contact info */}
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Contact</div>
            <div className="flex flex-col gap-1.5 text-xs text-zinc-400">
              <span>{footer.address}</span>
              <span>{footer.hours}</span>
              <a href={`tel:${footer.phone}`} className="transition-colors hover:text-white">{footer.phone}</a>
              <a href={`mailto:${footer.email}`} className="transition-colors hover:text-white">{footer.email}</a>
            </div>
          </div>
        </div>

        {/* Divider + copyright */}
        <div className="mt-10 border-t border-zinc-800 pt-6 text-xs text-zinc-600">
          {footer.copyright}
        </div>
      </div>
    </footer>
  );
}
