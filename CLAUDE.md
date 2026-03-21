# launchkit — Generator Tool

`node scripts/setup.js --name my-project --output ../` creates a standalone Next.js project. The tool repo stays clean; generated projects are self-contained with a `.launchkit` file for sections/config/reset/validate/status via `--project`.

Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion

## Tool Structure

```text
scripts/
  lib.js              Shared helpers: FS ops, .launchkit I/O, collapseI18nBase, loadTemplates,
                      discoverSections, parseSectionsFromPage, detectInstalledSections, LOCALES
  setup.js            --name + --output → create project, delegate to template module
  config.js           --project → project-wide settings (i18n display, accent color recolor)
  sections.js         --project → add/remove/status for all sections (library + template-native)
  reset.js            --project → strip to base scaffold
  validate.js         --project → check YOUR_* placeholders, TODOs, images, .env.local
  status.js           --project → read-only project state + installed sections
  templates/
    portfolio.js      setup() → returns { type, features, sections }
    business.js       setup() + recolor(), COLOR_MAP, COLOR_LABELS
    blank.js          setup() → minimal (i18n only)
templates/
  base/               Clean Next.js scaffold (copied first to every project)
  portfolio/          Portfolio source: app/[locale]/, api/, dialogflow/, dictionaries/, public/
  business/           Business source: app/[locale]/, api/contact/, dictionaries/, public/
  sections/           Section library — each section has variants with component + dict + meta.json
    skills/grid/      Categorized grid cards with animated progress bars
    skills/bars/      Flat horizontal progress bars list
    testimonials/scrolling/  Scrolling multi-column testimonial cards (portfolio)
    contact-form/portfolio/  Resend contact API route (portfolio)
    contact-form/business/   Resend contact API route with phone (business)
    floating-cta/default/    Fixed mobile CTA bar with call/WhatsApp/book (business)
    work/default/            Project gallery + detail pages with hooks (portfolio)
    chatbot/default/         Dialogflow ChatWidget + API route + ChatNudge coupling (portfolio)
    sidebar/default/         ProfileSidebar sticky desktop layout with hooks (portfolio)
    webgl-hero/default/      HeroFull shader/parallax hero, swaps Hero ↔ HeroFull (portfolio)
    whatsapp/default/        WhatsApp button in Contact + FloatingCTA via markers (business)
```

All scripts support `--help`. If `--project` is omitted, scripts fall back to cwd.

**Adding a template:** create `scripts/templates/foo.js` exporting `{ type, setup }` and `templates/foo/`. Templates are auto-discovered at runtime from `scripts/templates/` — no manual registration needed. `setup(rl)` must return `{ type, features, sections }` where `features` holds project-wide config (i18n, accentColor) and `sections` maps section names to `{ variant, addedAt }`.

**Adding a library section:** create `templates/sections/[name]/[variant]/` with `meta.json` and any combination of `component.tsx`, `en.json`, `pt.json`, `hooks.js`. Only `meta.json` is required — `component.tsx` is optional for non-page sections (e.g. contact-form manages only an API route). Sections are auto-discovered by `discoverSections()` — no registration needed. See `meta.json` schema below.

## Generated Project Config

- **Middleware**: `proxy.ts` (NOT `middleware.ts`)
- **i18n**: `i18n-config.ts` + `get-dictionary.ts` + `dictionaries/{en,pt}.json`. Export: `i18n.locales`. Locale list centralized in `lib.js` as `LOCALES`
- **params**: `params: Promise<{ locale: string }>` with `(await params) as { locale: Locale }` cast
- **Fonts**: Geist Sans/Mono · **BG**: `#fafafa` · **Accent**: `indigo-600`

## Section Detection

All sections (template-native and library) are detected by `detectInstalledSections()` which uses `meta.detectFile`, falls back to `{compDir}/{componentName}.tsx`, then to `hooks.detect(ctx)` for content-based detection (e.g. whatsapp checks for `wa.me/` in Contact.tsx). All sections are managed via `sections.js`. Project-wide config (i18n, accent color) is managed via `config.js`.

**Portfolio sections:** `webgl-hero` → `{compDir}/HeroFull.tsx`, `chatbot` → `app/api/chat/route.ts`, `contact-form` → `app/api/contact/route.ts`, `testimonials` → `{compDir}/Reviews.tsx`, `work` → `{compDir}/Work.tsx`, `sidebar` → `{compDir}/ProfileSidebar.tsx`

**Business sections:** `contact-form` → `app/api/contact/route.ts`, `floating-cta` → `{compDir}/FloatingCTA.tsx`, `whatsapp` → custom (content-based)

Components live in `app/[locale]/components/` (i18n on) or `app/components/` (i18n off).

## .launchkit

```json
{
  "version": 1,
  "name": "my-project",
  "type": "portfolio",
  "features": { "i18n": true },
  "sections": {
    "webgl-hero": { "variant": "default", "addedAt": "2026-03-21T..." },
    "chatbot": { "variant": "default", "addedAt": "2026-03-21T..." },
    "contact-form": { "variant": "portfolio", "addedAt": "2026-03-21T..." },
    "testimonials": { "variant": "scrolling", "addedAt": "2026-03-21T..." },
    "work": { "variant": "default", "addedAt": "2026-03-21T..." },
    "sidebar": { "variant": "default", "addedAt": "2026-03-21T..." },
    "skills": { "variant": "grid", "addedAt": "2026-03-21T..." }
  }
}
```

`features` holds project-wide config only: `i18n` (boolean) and `accentColor` (business only). `sections` tracks all sections managed via `sections.js` — both template-native and library sections. File-based detection is authoritative. Do not delete this file.

## Section Library

`node scripts/sections.js --project <path>` — interactive add/remove for all sections (library + template-native).
`--status` lists installed + available sections. `--remove` to remove.

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
  "templates": ["portfolio", "business"], // compatible template types
  "defaultAfter": "services",          // preselected insertion position
  "pageSection": true,                 // true (default) = content section; false = skip position prompt + import/JSX
  "detectFile": null,                  // override component-based detection (e.g. "app/api/contact/route.ts")
  "props": { "i18n": "skills={dict.skills}", "collapsed": "skills={dict.skills}" },
  "collapsePatches": [],               // patches applied when i18n is off
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
  compDir,        // "app/[locale]/components" or "app/components"
  pageFile,       // "app/[locale]/page.tsx" or "app/page.tsx"
  layoutFile,     // "app/[locale]/layout.tsx" or "app/layout.tsx"
  i18nActive,     // boolean
  accentColor,    // current accent color string
  state,          // full .launchkit state
  sections,       // state.sections object
  features,       // state.features object
  meta,           // this section's meta.json
  variantDir,     // absolute path to the variant directory
  lib,            // { replaceInFile, removeLineContaining, addDependency, removeDependency, addNavLink, removeNavLink, copyDir, copyFile, deleteIfExists, safeJsonParse, TOOL_ROOT, LOCALES, LOCALES_TS_LITERAL, DICT_FILES }
}
```

### detectInstalledSections

`detectInstalledSections(compDir, launchkitSections, templateType)` cross-references `discoverSections()` with component files in the project. Filters by template type compatibility to avoid false positives (e.g. business Reviews.tsx ≠ portfolio testimonials). Uses `meta.detectFile` if set, otherwise checks `{compDir}/{componentName}.tsx`. Falls back to `hooks.detect(ctx)` for content-based detection (e.g. whatsapp checks for `wa.me/` in Contact.tsx). Uses `.launchkit` recorded variant to disambiguate when variants share a `componentName`. `parseSectionsFromPage(pageFile)` extracts `<ComponentName` lines from page.tsx, excluding structural components (`Hero`, `HeroFull`, `ProfileSidebar`, `Footer`, `FloatingCTA`).

## Placeholder Markers

Grep for these in generated projects:

- `YOUR_NAME`, `YOUR_EMAIL`, `YOUR_GITHUB`, `YOUR_LINKEDIN`, `YOUR_DOMAIN`
- `YOUR_CITY`, `YOUR_TIMEZONE` (portfolio ProfileSidebar)
- `YOUR_BUSINESS`, `YOUR_PHONE`, `YOUR_WHATSAPP_NUMBER`, `YOUR_ADDRESS` (business)
- `// TODO: TEMPLATE` — marks manual Claude cleanup needed

## Dictionary Shapes

**Portfolio:**

```json
{
  "navbar": { "logo", "cta", "links": [{ "id", "label" }] },
  "hero": { "name", "card_bio", "title_line1", "title_line2", "tagline", "cta", "cta_secondary", "stats": [{ "value", "label" }] },
  "work": { "title_line1", "title_line2", "cta", "projects": [{ "slug", "title", "description", "long_description", "image", "images", "tags", "live", "github" }] },
  "reviews": { "title_line1", "title_line2", "subtitle", "items": [{ "quote", "name", "role", "avatar" }] },
  "services": { "title_line1", "title_line2", "stack_label", "items": [{ "icon", "title", "description", "details": [] }] },
  "process": { "title_line1", "title_line2", "steps": [{ "number", "title", "description" }] },
  "about": { "title_line1", "title_line2", "bio", "fun_facts": [{ "emoji", "text" }] },
  "contact": { "title_line1", "title_line2", "body", "form_*", "email", "github", "linkedin" }
}
```

**Business:** `navbar`, `hero`, `about`, `services`, `reviews` (with `rating`), `faq`, `contact` (with `phone`, `address`, `whatsapp`, `map_link`), `footer`, `cta`

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
5. Update both `en.json` and `pt.json` if i18n active
6. Validate again, then `npm run lint && npm run build`
