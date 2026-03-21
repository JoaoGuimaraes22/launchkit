# launchkit — TODO

## Bugs

- [x] `reset.js` does not delete `.launchkit` — after `npm run reset` the file is stale and `npm run toggle` reads the wrong type; fix: add `.launchkit` to reset's removal list

## DX / Scripts

- [x] Extract shared helpers into `scripts/lib.js` — `deleteIfExists`, `copyDir`, `copyFile`, `removeLineContaining`, `replaceInFile`, `addDependency`, `removeDependency` are duplicated verbatim between `setup.js` and `toggle.js`
- [x] `npm run status` — read-only: print `.launchkit` type + ✓/✗ feature table, no prompts, no changes
- [x] `npm run check` — single pre-deploy command: runs `validate` → `lint` → `build` in sequence, exits on first failure
- [x] Toggle loop — after a successful toggle, ask "toggle another?" instead of always exiting
- [x] `npm run setup` shorthand alias in `package.json` (currently requires `node scripts/setup.js`)
- [x] Update `SETUP.md` to document `npm run toggle`, `npm run setup:portfolio`, `npm run setup:business`
- [ ] GitHub Actions CI — lint + build on push/PR; catches broken toggles before they land

## toggle.js Gaps

- [ ] Business accent color toggle — only `setup.js` handles this today; `npm run toggle` should expose a re-color option for business sites
- [ ] Business WhatsApp toggle — listed in `SETUP.md` as a standalone feature but not independently toggleable (currently tied to FloatingCTA)
- [ ] Harden `enableChatbot` ProfileSidebar re-injection — relies on exact JSX string matching; add a clear fallback message if the anchor isn't found
- [ ] `.launchkit` drift detection — before any toggle, warn if recorded feature state doesn't match actual file state (e.g. someone manually deleted a component file)

## validate.js Improvements

- [ ] Warn when placeholder images (`hero.jpg`, `profile.jpg`, `og-image.png`) are still the shipped defaults — check by file size or hash
- [ ] Group output by category (Placeholders / TODOs / Env) for easier scanning at a glance

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

- [ ] **Blank template** — minimal scaffold: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `public/`, `dictionaries/` (if i18n), no sections or components — clean starting point for custom builds
- [ ] Third template type — candidates: SaaS landing page, agency/studio, blog
- [ ] Portfolio: optional Skills / Timeline / Education sections
- [ ] Business: optional Gallery section and Google Maps embed

## Docs

- [ ] `README.md` quick start — mention `npm run setup:portfolio`, `setup:business`, and `toggle`
- [ ] Audit both `BOOTSTRAP.md` files for accuracy against current template component state
