# launchkit — TODO

## DX / Scripts

- [ ] Extract shared helpers into `scripts/lib.js` — `deleteIfExists`, `copyDir`, `copyFile`, `removeLineContaining`, `replaceInFile`, `addDependency`, `removeDependency` are duplicated verbatim between `setup.js` and `toggle.js`
- [ ] `npm run status` — read-only: print `.launchkit` type + ✓/✗ feature table, no prompts, no changes
- [ ] Toggle loop — after a successful toggle, ask "toggle another?" instead of always exiting
- [ ] `npm run setup` shorthand alias in `package.json` (currently requires `node scripts/setup.js`)
- [ ] Update `SETUP.md` to document `npm run toggle`, `npm run setup:portfolio`, `npm run setup:business`

## toggle.js Gaps

- [ ] Business accent color toggle — only `setup.js` handles this today; `npm run toggle` should expose a re-color option for business sites
- [ ] Business WhatsApp toggle — listed in `SETUP.md` as a standalone feature but not independently toggleable (currently tied to FloatingCTA)
- [ ] Harden `enableChatbot` ProfileSidebar re-injection — relies on exact JSX string matching; add a clear fallback message if the anchor isn't found

## validate.js Improvements

- [ ] Warn when placeholder images (`hero.jpg`, `profile.jpg`, `og-image.png`) are still the shipped defaults — check by file size or hash
- [ ] Group output by category (Placeholders / TODOs / Env) for easier scanning at a glance

## Section Library (`npm run add`)

- [ ] **`npm run add` command** — reads `.launchkit` for context (type, i18n state, active features), presents a list of available sections not yet in the page, copies the component + patches `page.tsx` imports/JSX + patches `Navbar.tsx` + injects dict keys into `en.json`/`pt.json`
  - Sections are stored in `templates/sections/[name]/` — each with a component file, a dict fragment (`en.json` / `pt.json` snippets), and a metadata file describing insertion point and nav label
  - Script is i18n-aware: copies to `app/[locale]/components/` or `app/components/` and applies collapse patches automatically
  - Candidates to build out: Skills, Timeline, Education (portfolio); Gallery, Pricing, Team, Map (business)
  - Could eventually fold `toggle.js` feature toggles into the same `add`/`remove` interface for consistency

## New Templates / Sections

- [ ] **Blank template** — minimal scaffold: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `public/`, `dictionaries/` (if i18n), no sections or components — clean starting point for custom builds
- [ ] Third template type — candidates: SaaS landing page, agency/studio, blog
- [ ] Portfolio: optional Skills / Timeline / Education sections
- [ ] Business: optional Gallery section and Google Maps embed

## Docs

- [ ] `README.md` quick start — mention `npm run setup:portfolio`, `setup:business`, and `toggle`
- [ ] Audit both `BOOTSTRAP.md` files for accuracy against current template component state
