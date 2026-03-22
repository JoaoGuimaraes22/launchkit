# launchkit — Generator Tool

`node scripts/setup.js --name my-project --output ../` creates a standalone Next.js project. The tool repo stays clean; generated projects are self-contained with a `.launchkit` file for sections/config/reset/validate/status via `--project`.

Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion

## Tool Structure

```text
scripts/
  lib.js              Shared helpers: FS ops, .launchkit I/O, marker utilities
                      (extractBetweenMarkers, removeMarkerBlock), loadTemplates, loadPresets,
                      loadSetupConfigs, loadPalettes, discoverSections, discoverComponents,
                      detectInstalledSections, detectInstalledComponents, parseSectionsFromPage, LOCALES
  collapse.js         Shared i18n collapse helpers for components: collapseChatWidgetTsx, collapseChatNudgeTsx
  setup.js            --name + --output → create project, delegate to template module, then preset prompt
  personalize.js      --project → replace YOUR_* placeholders interactively or from --profile client.json
                      Template-aware (business: BUSINESS/PHONE/EMAIL/ADDRESS/WHATSAPP_NUMBER/DOMAIN;
                      portfolio: NAME/EMAIL/GITHUB/LINKEDIN/DOMAIN/CITY/TIMEZONE). Saves client-profile.json.
                      Accepts Apify envelope { "result": { ... } }. Idempotent — safe to re-run after adding sections.
  deploy.js           --project → build + deploy to Vercel or Netlify (auto-detected). Stores live URL in .launchkit.
                      --platform vercel|netlify to force. --no-build to skip npm run build.
  config.js           --project → project-wide settings (palette, accent color recolor)
  sections.js         --project → add/remove/status for all sections (universal, all templates)
  components.js       --project → add/remove/status for UI atoms (Button, Card, etc.)
  reset.js            --project → strip to base scaffold
  validate.js         --project → check YOUR_* placeholders, TODOs, images, .env.local
  status.js           --project → read-only project state + installed sections
  templates/
    portfolio.js      setup() → copies template files → returns { type, sections: {} }
    business.js       setup() → copies files + accent color prompt → returns { type, features: { accentColor }, sections: {} }; exports recolor, COLOR_MAP, COLOR_LABELS
    blank.js          setup() → copies template files → returns { type, sections: {} }
  presets/
    portfolio.js      Full portfolio preset: webgl-hero, chatbot, contact-form, testimonials, work, sidebar
    business.js       Full business preset: contact-form, floating-cta, whatsapp
configs/
  setup/              Setup-time configs — prompted during project creation, baked into file structure
    languages/        Language(s) select — writes i18n-config.ts, get-dictionary.ts, removes unused dict files
  palettes/           Live configs — changeable post-setup via config.js
    default/          bg:#fafafa fg:#111111 accent:indigo (baseline)
    midnight/         bg:#0c0c0f fg:#f4f4f5 accent:violet
    azure-drift/      bg:#fcf9f2 fg:#1a1a1a accent:teal (coastal, warm sand)
  niche-profiles/     Starter JSON profiles for personalize.js --profile (niche-appropriate content hints)
    hvac.json         HVAC/heating/cooling services starter
    cleaning.json     Commercial & residential cleaning starter
    landscaping.json  Landscaping & lawn care starter
templates/
  presets/
    base/             Clean Next.js scaffold + i18n infrastructure (i18n-config.ts, get-dictionary.ts, proxy.ts)
    blank/            Minimal scaffold — base only, no page sections
    portfolio/        Portfolio base: app/[locale]/ core layout only (Hero, Services, Process, About, Contact)
    business/         Business base: app/[locale]/ core layout only (Hero, About, Services, Reviews, FAQ, Contact, Footer)
  sections/           Section library — each section has variants with component + dict + meta.json
    skills/grid/      Categorized grid cards with animated progress bars
    skills/bars/      Flat horizontal progress bars list
    testimonials/scrolling/  Scrolling multi-column testimonial cards
    contact-form/portfolio/  Resend contact API route (portfolio variant)
    contact-form/business/   Resend contact API route with phone (business variant)
    floating-cta/default/    Fixed mobile CTA bar with call/WhatsApp/book
    work/default/            Project gallery + detail pages with hooks
    chatbot/default/         Dialogflow ChatWidget + API route + ChatNudge coupling
    sidebar/default/         ProfileSidebar sticky desktop layout with hooks
    webgl-hero/default/      HeroFull shader/parallax hero, swaps Hero ↔ HeroFull
    whatsapp/default/        WhatsApp button in Contact + FloatingCTA via markers
    booking/calendly/        Calendly inline embed; YOUR_CALENDLY_URL placeholder; no npm deps
    google-reviews/default/  Google review CTA with star display; YOUR_GOOGLE_REVIEW_URL placeholder
    gallery-strip/default/   Autoscrolling image strip (CSS keyframes, infinite loop, pause on hover)
    parallax-hero/default/   rAF-throttled parallax hero (business); swaps Hero ↔ ParallaxHero via hooks
    reserve-bar/default/     Mobile sticky bottom bar; dispatches open-reservation event; links order URL
    menu/tabbed/             Tabbed category menu with highlight card and 2-col item grid (business)
    reservation/formspree/   Full-screen booking modal (calendar + time slots + Formspree); YOUR_FORMSPREE_ID
    pricing/cards/           3-column pricing cards with popular highlight, feature list, CTA (business)
    schedule/weekly/         7-day class timetable grid + mobile accordion, current-day highlight, 4 type colors (business)
    stats/counters/          Animated RAF counter band with IntersectionObserver trigger (portfolio + business)
    contact/map/             Google Maps iframe embed + address + directions CTA; YOUR_MAPS_EMBED_URL / YOUR_MAPS_DIRECTIONS_URL (business)
    team/spotlight/          2-col team section with parallax image, glassmorphic stats overlay, tags + quote (portfolio + business)
  components/         UI atom library — each component has variants with component.tsx + meta.json
    button/primary/   Primary CTA button (solid + outline, sized, accent-aware)
    fade-in/default/  IntersectionObserver fade-in wrapper with direction (up/left/right/none) + delay props
```

All scripts support `--help`. If `--project` is omitted, scripts fall back to cwd.

**Adding a template:** create `scripts/templates/foo.js` exporting `{ type, setup }` and `templates/presets/foo/`. Templates are auto-discovered at runtime from `scripts/templates/` — no manual registration needed. `setup(rl)` must return `{ type, features, sections: {} }` — `features` holds project-wide config (accentColor); sections are always empty from setup and populated later via presets or `sections.js`.

**Adding a preset:** create `scripts/presets/foo.js` exporting `{ name, description, base, sections: [{ name, variant }] }`. Presets are auto-discovered from `scripts/presets/` — no registration needed. `base` must match a template type. Presets are applied by `setup.js` after template setup, running each section via child process with `--yes --no-install`, then a single `npm install`.

**Adding a library section:** create `templates/sections/[name]/[variant]/` with `meta.json` and any combination of `component.tsx`, `en.json`, `pt.json`, `hooks.js`. Only `meta.json` is required — `component.tsx` is optional for non-page sections (e.g. contact-form manages only an API route). Sections are auto-discovered by `discoverSections()` — no registration needed. See `meta.json` schema below.

**Adding a component:** create `templates/components/[name]/[variant]/` with `component.tsx` and `meta.json`. Components are atomic UI atoms (Button, Card, Modal, etc.) with no page injection, no dict keys, no nav links. Auto-discovered by `discoverComponents()`. `meta.json` needs only `componentName`, `description`, `accentColorToken` (optional), `dependencies` (optional). Components install to `compDir/ui/[ComponentName].tsx`.

**Adding a setup config:** create `configs/setup/[key]/meta.json` with `key`, `label`, `description`, `type` (`"boolean"` or `"select"`), `default`, `prompt`, `templates` (null = all, or `["portfolio"]` to scope). For `"select"` type, also include `options` (array of values) and `labels` (display strings). Add `hooks.js` exporting `async apply(ctx)` where `ctx` has `{ enabled, value, projectType, tmpl, lib }`. `setup.js` auto-discovers and prompts for all setup configs before calling `tmpl.setup()`, then calls each hook's `apply()`.

**Adding a live config (palette-style):** create `configs/[category]/[name]/meta.json` following the palette schema for that category. Add a `load[Category]()` discovery function to `lib.js` (mirrors `loadPalettes()`). Wire it into `config.js` as a new menu option. Live configs can be changed post-setup at any time.

**Adding a niche profile:** create `configs/niche-profiles/[niche].json` with `BUSINESS`, `PHONE`, `EMAIL`, `ADDRESS`, `WHATSAPP_NUMBER`, `DOMAIN` keys (use placeholder strings as values), and an optional `_content_hints` object with niche-appropriate service names, FAQ samples, hero copy, etc. Pass with `personalize.js --profile configs/niche-profiles/[niche].json`. The `_*` prefixed keys are ignored by `personalize.js`.

## Generated Project Config

- **Middleware**: `proxy.ts` (NOT `middleware.ts`) — rewrites for single locale (clean URLs), redirects for multi-locale
- **i18n**: Always active. `i18n-config.ts` + `get-dictionary.ts` + `dictionaries/{en,pt}.json`. Language(s) set during setup: `"en"`, `"pt"`, or `"en+pt"`. Export: `i18n.locales`. `LanguageSwitcher` returns null when `i18n.locales.length <= 1`.
- **params**: `params: Promise<{ locale: string }>` with `(await params) as { locale: Locale }` cast
- **Fonts**: Geist Sans/Mono · **BG**: `#fafafa` · **Accent**: `indigo-600`

## Section Detection

All sections (template-native and library) are detected by `detectInstalledSections()` which uses `meta.detectFile`, falls back to `{compDir}/{componentName}.tsx`, then to `hooks.detect(ctx)` for content-based detection (e.g. whatsapp checks for `wa.me/` in Contact.tsx). All sections are managed via `sections.js`. Project-wide config (accent color, palette) is managed via `config.js`.

**Portfolio sections:** `webgl-hero` → `{compDir}/HeroFull.tsx`, `chatbot` → `app/api/chat/route.ts`, `contact-form` → `app/api/contact/route.ts`, `testimonials` → `{compDir}/Reviews.tsx`, `work` → `{compDir}/Work.tsx`, `sidebar` → `{compDir}/ProfileSidebar.tsx`

**Business sections:** `contact-form` → `app/api/contact/route.ts`, `floating-cta` → `{compDir}/FloatingCTA.tsx`, `whatsapp` → custom (content-based)

**Universal upsell sections:** `booking` → `{compDir}/Booking.tsx`, `google-reviews` → `{compDir}/GoogleReviews.tsx`

**New universal sections:** `pricing` → `{compDir}/Pricing.tsx`, `schedule` → `{compDir}/Schedule.tsx`, `stats` → `{compDir}/StatsCounters.tsx`, `contact/map` → `{compDir}/ContactMap.tsx`, `team` → `{compDir}/Team.tsx`

Components live in `app/[locale]/components/`.

## .launchkit

```json
{
  "version": 1,
  "name": "my-project",
  "type": "portfolio",
  "features": { "languages": "en+pt", "accentColor": "indigo", "palette": "default", "deployUrl": "https://my-project.vercel.app" },
  "sections": {
    "webgl-hero":   { "variant": "default",   "addedAt": "2026-03-21T..." },
    "chatbot":      { "variant": "default",   "addedAt": "2026-03-21T..." },
    "contact-form": { "variant": "portfolio", "addedAt": "2026-03-21T..." },
    "testimonials": { "variant": "scrolling", "addedAt": "2026-03-21T..." },
    "work":         { "variant": "default",   "addedAt": "2026-03-21T..." },
    "sidebar":      { "variant": "default",   "addedAt": "2026-03-21T..." },
    "skills":       { "variant": "grid",      "addedAt": "2026-03-21T..." }
  },
  "components": {
    "Button": { "variant": "primary", "addedAt": "2026-03-21T..." }
  }
}
```

`features`: `languages` (`"en"`, `"pt"`, or `"en+pt"`), `accentColor` (Tailwind token, all templates), `palette` (named palette, default: "default"), `deployUrl` (written by `deploy.js` after a successful deployment). `sections` is always `{}` after template setup — populated by presets or `sections.js`. `components` tracks installed UI atoms from `components.js`. File-based detection is authoritative. Do not delete this file.

## Section Library

`node scripts/sections.js --project <path>` — interactive add/remove for all sections. Sections are universal — any section can be added to any project. Sections designed for a different template are shown with `[!]` as an advisory warning (not a hard block).

`--status` lists all installed + available sections; cross-template sections marked `[!]`. `--remove` to remove.

`--add <name>` — non-interactive add: `--add skills --variant grid --after services --yes` (variant defaults to first available; after defaults to meta.defaultAfter; --yes skips confirmation). `--no-install` skips npm install (used by setup.js to batch all deps into one final install).

Complex sections use `hooks.js` for logic beyond meta.json (directory copies, layout injection, component swaps, marker-based JSX, sitemap regeneration). Hook execution order: `afterEnable` runs after `standardEnable`; `beforeDisable` runs before `standardDisable`; `afterDisable` runs after.

Sections live in `templates/sections/[name]/[variant]/`. Each variant contains:

- `component.tsx` — the React component (copied to `compDir/ComponentName.tsx`). Optional for non-page sections (e.g. contact-form).
- `en.json` / `pt.json` — dict fragments merged under `meta.dictKey`. Optional if `dictKey` is null.
- `meta.json` — section metadata driving the add/remove flow
- `hooks.js` (optional) — `afterEnable(ctx)`, `beforeDisable(ctx)`, `afterDisable(ctx)`, `detect(ctx)`

### meta.json Schema

```jsonc
{
  "componentName": "Skills",           // PascalCase, matches default export. null = no component
  "dictKey": "skills",                 // top-level key in en.json/pt.json. null = no dict merge
  "navLink": { "id": "skills", "label": { "en": "Skills", "pt": "Competências" } },
  "templates": ["portfolio", "business"], // advisory — shown as [!] on non-native templates, not a hard block
  "defaultAfter": "services",          // preselected insertion position
  "pageSection": true,                 // true (default) = content section; false = skip position prompt + import/JSX
  "detectFile": null,                  // override component-based detection (e.g. "app/api/contact/route.ts")
  "props": { "i18n": "skills={dict.skills}", "collapsed": "skills={dict.skills}" },
  "collapsePatches": [],               // legacy — never applied (i18n always active)
  "accentColorToken": "indigo",        // color token swapped to project accent
  "dependencies": [],                  // [["package", "^version"]] for npm deps
  "extraFiles": []                     // [{ src, dest, destCollapsed?, cleanupDir? }]
}
```

### hooks.js Context

The `ctx` object passed to hook functions contains:

```js
{
  projectDir,     // absolute path to the generated project
  compDir,        // "app/[locale]/components"
  pageFile,       // "app/[locale]/page.tsx"
  layoutFile,     // "app/[locale]/layout.tsx"
  i18nActive,     // boolean — always true
  accentColor,    // current accent color string
  state,          // full .launchkit state
  sections,       // state.sections object
  features,       // state.features object
  meta,           // this section's meta.json
  variantDir,     // absolute path to the variant directory
  lib,            // full scripts/lib.js module — all exports available (replaceInFile, removeLineContaining, extractBetweenMarkers, removeMarkerBlock, addDependency, removeDependency, addNavLink, removeNavLink, copyDir, copyFile, deleteIfExists, safeJsonParse, TOOL_ROOT, LOCALES, LOCALES_TS_LITERAL, DICT_FILES, ...)
}
```

### detectInstalledSections

`detectInstalledSections(compDir, launchkitSections, templateType)` cross-references `discoverSections()` with component files in the project. Filters by template type compatibility to avoid false positives (e.g. business Reviews.tsx ≠ portfolio testimonials). Uses `meta.detectFile` if set, otherwise checks `{compDir}/{componentName}.tsx`. Falls back to `hooks.detect(ctx)` for content-based detection (e.g. whatsapp checks for `wa.me/` in Contact.tsx). Uses `.launchkit` recorded variant to disambiguate when variants share a `componentName`. `parseSectionsFromPage(pageFile)` extracts `<ComponentName` lines from page.tsx, excluding structural components (`Hero`, `HeroFull`, `ProfileSidebar`, `Footer`, `FloatingCTA`).

## Placeholder Markers

Grep for these in generated projects:

- `YOUR_NAME`, `YOUR_EMAIL`, `YOUR_GITHUB`, `YOUR_LINKEDIN`, `YOUR_DOMAIN`
- `YOUR_CITY`, `YOUR_TIMEZONE` (portfolio ProfileSidebar)
- `YOUR_BUSINESS`, `YOUR_PHONE`, `YOUR_WHATSAPP_NUMBER`, `YOUR_ADDRESS` (business)
- `YOUR_CALENDLY_URL` (booking/calendly section)
- `YOUR_GOOGLE_REVIEW_URL` (google-reviews section)
- `YOUR_FORMSPREE_ID` (reservation/formspree section — get at formspree.io)
- `YOUR_ORDER_URL` (reserve-bar/default section — link to external ordering platform)
- `YOUR_MAPS_EMBED_URL` (contact/map section — Google Maps embed src URL)
- `YOUR_MAPS_DIRECTIONS_URL` (contact/map section — Google Maps directions href)
- `// TODO: TEMPLATE` — marks manual Claude cleanup needed

Use `node scripts/personalize.js --project <path>` to replace all `YOUR_*` placeholders interactively or via `--profile client.json`. The script is template-aware, idempotent, and re-scans component files dynamically so it picks up new placeholders added by sections installed after initial setup.

## Dictionary Shapes

**Portfolio base** (always present):

```json
{
  "navbar": { "logo", "cta", "links": [{ "id", "label" }] },
  "hero": { "name", "card_bio", "title_line1", "title_line2", "tagline", "cta", "cta_secondary", "stats": [{ "value", "label" }] },
  "services": { "title_line1", "title_line2", "stack_label", "items": [{ "icon", "title", "description", "details": [] }] },
  "process": { "title_line1", "title_line2", "steps": [{ "number", "title", "description" }] },
  "about": { "title_line1", "title_line2", "bio", "bio_callout", "bio_cta", "fun_facts": [{ "emoji", "title", "text" }] },
  "contact": { "title_line1", "title_line2", "body", "form_*", "email", "github", "linkedin" }
}
```

Section-owned dict keys (added when section is installed): `work` (work section), `reviews` (testimonials section), `skills` (skills section).

**Business base** (always present): `navbar`, `hero`, `about`, `services`, `reviews` (with `rating`), `faq`, `contact` (with `phone`, `address`, `whatsapp`, `map_link`), `footer`

Section-owned dict keys: `cta` (floating-cta section), `skills` (skills section).

## Tailwind v4 Gotchas

- `bg-linear-to-br` not `bg-gradient-to-br`
- `mix-blend-screen` not `mix-blend-mode-screen`
- `min-h-55`, `md:w-88`, `z-60`, `max-w-350` — use numeric scale, not arbitrary
- Arbitrary calc: `w-[calc((100%-2rem)/3)]` — no underscores

## Known Gotchas

- `params` must be `Promise<{ locale: string }>`, cast with `as { locale: Locale }`
- Framer Motion ease in variants → type errors; use `ease: [0.16, 1, 0.3, 1] as const`
- `React.FormEvent` deprecated in React 19 — use `{ preventDefault(): void }`
- ScrollProgress `z-60` > Navbar `z-50`
- HeroFull is outside sidebar layout — `id="home"` lives there
- WebGL: `alpha: true` + `premultipliedAlpha: false` + `gl.clear` each frame
- ScreenshotGallery: double-rAF init; `suppressResetRef` during smooth scroll
- `app/page.tsx` must export a default or build fails
- Navbar is a client component — do not revert to server

## Chatbot (Dialogflow ES)

- Auth: `GOOGLE_CREDENTIALS` (single-line JSON) + `DIALOGFLOW_PROJECT_ID`
- ZIP: `node dialogflow/zip.js` (forward slashes — PowerShell breaks import)
- Restore: Dialogflow console → Settings → Import & Export → Restore from zip
- Workflow: edit `generate.js` → `node dialogflow/generate.js` → `node dialogflow/zip.js` → import. Never edit `intents/` directly.

## Bootstrap Flow

1. Read this file
2. Check active features via file existence
3. `node scripts/validate.js --project <path>` — find remaining placeholders
4. Follow the relevant `BOOTSTRAP.md` to gather content
5. Update `en.json` and `pt.json` if `features.languages === "en+pt"`, otherwise only the active locale
6. Validate again, then `npm run lint && npm run build`
