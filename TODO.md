# launchkit — TODO

## DX / Scripts

- [ ] GitHub Actions CI — lint + build on push/PR; catches broken toggles before they land

## Section Library (`npm run add`)

- [ ] **`npm run add` command** — reads `.launchkit` for context (type, i18n state, active features), presents a list of available sections not yet in the page, copies the component + patches `page.tsx` imports/JSX + patches `Navbar.tsx` + injects dict keys into `en.json`/`pt.json`
  - **Multiple design variants per section** — e.g. an About section could offer "side-by-side image + text", "centered bio card", "grid with stats"; user picks a variant, script adapts it to current context (accent color, i18n state, sidebar vs full-width layout)
  - Sections are stored in `templates/sections/[name]/[variant]/` — each variant ships with a component file, dict fragment (`en.json` / `pt.json` snippets), and a `meta.json` describing nav label, insertion point, and which template types it supports
  - Script is i18n-aware: copies to `app/[locale]/components/` or `app/components/` and applies collapse patches automatically
  - Accent color is applied on copy (same `replaceInFile` swap used by `setup.js`) so the variant matches the site's palette out of the box
  - After adding a section, print the dict keys that need filling and suggest running Bootstrap so content gaps are obvious immediately
  - Candidates to build out: Skills, Timeline, Education (portfolio); Gallery, Pricing, Team, Map (business)
  - Could eventually fold `toggle.js` feature toggles into the same `add`/`remove` interface for consistency
- [ ] **`npm run remove` command** — mirror of `npm run add`; removes a section added via the section library, cleans up `page.tsx` import/JSX, `Navbar.tsx` entry, and dict keys

## Dark Mode

- [ ] Add dark mode support to both templates — Tailwind `dark:` classes throughout, system preference via `prefers-color-scheme`, optional manual toggle component; background flips from `#fafafa` to `#09090b` (zinc-950), accent colors remain the same

## New Templates / Sections

- [ ] Third template type — candidates: SaaS landing page, agency/studio, blog
- [ ] Portfolio: optional Skills / Timeline / Education sections
- [ ] Business: optional Gallery section and Google Maps embed

## Docs

- [x] `README.md` quick start — mention `npm run setup:portfolio`, `setup:business`, and `toggle`
- [x] Audit both `BOOTSTRAP.md` files for accuracy against current template component state
- [ ] Redo both of these after completing multiple changes
