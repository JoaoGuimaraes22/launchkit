# launchkit — Generator Tool

`node scripts/setup.js --name my-project --output ../` creates a standalone Next.js project. The tool repo stays clean; generated projects are self-contained with a `.launchkit` file for toggle/reset/validate/status via `--project`.

Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion

## Tool Structure

```text
scripts/
  lib.js              Shared helpers: FS ops, .launchkit I/O, collapseI18nBase, loadTemplates,
                      detectStateFromRegistry, discoverSections, parseSectionsFromPage,
                      detectInstalledSections, LOCALES
  setup.js            --name + --output → create project, delegate to template module
  toggle.js           --project → enable/disable features
  sections.js         --project → add/remove/status for library sections
  reset.js            --project → strip to base scaffold
  validate.js         --project → check YOUR_* placeholders, TODOs, images, .env.local
  status.js           --project → read-only feature state
  templates/
    portfolio.js      setup(), featureList (with detectFile + deps), enable(), disable()
    business.js       same interface + recolor(), whatsapp has custom detect
    blank.js          setup(), minimal featureList (i18n only)
templates/
  base/               Clean Next.js scaffold (copied first to every project)
  portfolio/          Portfolio source: app/[locale]/, api/, dialogflow/, dictionaries/, public/
  business/           Business source: app/[locale]/, api/contact/, dictionaries/, public/
  sections/           Section library — each section has variants with component + dict + meta.json
    skills/grid/      Categorized grid cards with animated progress bars
    skills/bars/      Flat horizontal progress bars list
```

All scripts support `--help`. If `--project` is omitted, scripts fall back to cwd.

**Adding a template:** create `scripts/templates/foo.js` exporting `{ type, featureList, detectState, setup, enable, disable }` and `templates/foo/`. Templates are auto-discovered at runtime from `scripts/templates/` — no manual registration needed. Each feature in `featureList` should declare `detectFile` (use `{compDir}` placeholder for component paths), `deps` (array of feature keys it depends on), and standard `label`/`key`.

**Adding a library section:** create `templates/sections/[name]/[variant]/` with `component.tsx`, `en.json`, `pt.json`, and `meta.json`. Sections are auto-discovered by `discoverSections()` — no registration needed. See `meta.json` schema below.

## Generated Project Config

- **Middleware**: `proxy.ts` (NOT `middleware.ts`)
- **i18n**: `i18n-config.ts` + `get-dictionary.ts` + `dictionaries/{en,pt}.json`. Export: `i18n.locales`. Locale list centralized in `lib.js` as `LOCALES`
- **params**: `params: Promise<{ locale: string }>` with `(await params) as { locale: Locale }` cast
- **Fonts**: Geist Sans/Mono · **BG**: `#fafafa` · **Accent**: `indigo-600`

## Feature Detection

Features are detected by file existence via `detectFile` in each feature's registry entry (overrides `.launchkit` if files changed manually). Detection is driven by `detectStateFromRegistry()` in `lib.js` — templates only need custom `detectState` logic for content-based checks (e.g. business `whatsapp` checks for `wa.me/` in Contact.tsx).

**Portfolio:** `webglHero` → `{compDir}/HeroFull.tsx`, `chatbot` → `app/api/chat/route.ts`, `contactForm` → `app/api/contact/route.ts`, `testimonials` → `{compDir}/Reviews.tsx`, `work` → `{compDir}/Work.tsx`, `sidebar` → `{compDir}/ProfileSidebar.tsx`, `i18n` → `i18n-config.ts`

**Business:** `contactForm` → `app/api/contact/route.ts`, `floatingCTA` → `{compDir}/FloatingCTA.tsx`, `whatsapp` → custom (content-based), `i18n` → `i18n-config.ts`

**Feature dependencies:** declared via `deps` array in `featureList`. Toggle warns before enabling a feature with missing deps or disabling a feature that others depend on. Example: business `whatsapp` depends on `["contactForm", "floatingCTA"]`.

Components live in `app/[locale]/components/` (i18n on) or `app/components/` (i18n off).

## .launchkit

```json
{
  "version": 1,
  "name": "my-project",
  "type": "portfolio",
  "features": { "i18n": true, "webglHero": true, "chatbot": false, "contactForm": true, "testimonials": true, "work": true, "sidebar": true },
  "sections": { "skills": { "variant": "grid", "addedAt": "2026-03-21T..." } }
}
```

`features` holds project-wide config and template-native toggles. `sections` tracks library sections added via `sections.js`. Business features: `i18n`, `contactForm`, `floatingCTA`, `whatsapp`, `accentColor`. Do not delete this file.

## Section Library

`node scripts/sections.js --project <path>` — interactive add/remove for library sections.
`--status` lists installed + available sections. `--remove` to remove.

Sections live in `templates/sections/[name]/[variant]/`. Each variant contains:

- `component.tsx` — the React component (copied to `compDir/ComponentName.tsx`)
- `en.json` / `pt.json` — dict fragments merged under `meta.dictKey`
- `meta.json` — section metadata driving the add/remove flow
- `hooks.js` (optional) — `afterEnable(ctx)`, `beforeDisable(ctx)`, `afterDisable(ctx)`, `detect(ctx)`

### meta.json Schema

```jsonc
{
  "componentName": "Skills",           // PascalCase, matches default export
  "dictKey": "skills",                 // top-level key in en.json/pt.json
  "navLink": { "id": "skills", "label": { "en": "Skills", "pt": "Competências" } },
  "templates": ["portfolio", "business"], // compatible template types
  "defaultAfter": "services",          // preselected insertion position
  "props": { "i18n": "skills={dict.skills}", "collapsed": "skills={dict.skills}" },
  "collapsePatches": [],               // patches applied when i18n is off
  "accentColorToken": "indigo",        // color token swapped to project accent
  "dependencies": [],                  // [["package", "^version"]] for npm deps
  "extraFiles": []                     // [{ src, dest, destCollapsed? }]
}
```

### Section Detection

`detectInstalledSections(compDir, launchkitSections)` cross-references `discoverSections()` with component files in the project. Uses `.launchkit` recorded variant to disambiguate when variants share a `componentName`. `parseSectionsFromPage(pageFile)` extracts `<ComponentName` lines from page.tsx, excluding structural components (`Hero`, `HeroFull`, `ProfileSidebar`, `Footer`, `FloatingCTA`).

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
