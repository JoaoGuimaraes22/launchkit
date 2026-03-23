# launchkit — Generator Tool

## Always do

- Update references and docs
- Commit and push to git after success

`node scripts/setup.js --name my-project --output ../` creates a standalone Next.js project. Tool repo stays clean; generated projects are self-contained with a `.launchkit` file.

**Stack:** Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion

## Essential Commands

```bash
# Tool (run from repo root)
node scripts/setup.js --name foo --output ../           # create project
node scripts/setup.js --name foo --output ../ --business --preset restaurant \
  --answers '{"languages":"en+pt","accentColor":"amber"}'  # fully non-interactive
node scripts/sections.js --project <path> --status      # list installed + available sections
node scripts/sections.js --project <path> --add <name> --yes  # add non-interactively
node scripts/validate.js --project <path>               # check YOUR_* placeholders + TODOs
node scripts/personalize.js --project <path>            # replace placeholders interactively
node scripts/deploy.js --project <path>                 # build + deploy (Vercel/Netlify auto-detect)

# Generated project (run from project dir)
npm run lint && npm run build                           # ALWAYS run before delivery
```

## Tool Structure

```text
scripts/
  lib.js            Shared helpers: FS ops, .launchkit I/O, marker utilities, discoverSections,
                    discoverComponents, detectInstalledSections, parseSectionsFromPage, LOCALES
  setup.js          --name + --output → create project, then preset prompt
  personalize.js    --project → replace YOUR_* (template-aware, idempotent). Saves client-profile.json.
  deploy.js         --project → build + deploy. Stores live URL in .launchkit.
  config.js         --project → palette + accent color recolor
  sections.js       --project → add/remove/status for all sections
  components.js     --project → add/remove/status for UI atoms
  validate.js       --project → check placeholders, TODOs, images, .env.local
  status.js         --project → read-only project state
  templates/        business.js · restaurant.js · blank.js (auto-discovered)
  presets/          business.js · restaurant.js (auto-discovered)
configs/
  setup/languages/  Language select — writes i18n-config.ts, get-dictionary.ts
  palettes/         default (indigo) · midnight (violet) · azure-drift (teal)
  niche-profiles/   hvac.json · cleaning.json · landscaping.json · restaurant.json
templates/
  presets/
    base/           Clean Next.js scaffold + i18n infrastructure
    blank/          Minimal scaffold
    business/       Hero, About, Services, Reviews, FAQ, Contact, Footer
    restaurant/     Hero (dark), About, Menu, Reviews (scrolling), FAQ, Contact (map), Footer
  sections/         — see Section Library below —
  components/
    button/primary/   Solid + outline CTA, accent-aware
    fade-in/default/  IntersectionObserver fade-in wrapper (direction + delay props)
```

All scripts support `--help`. `--project` falls back to cwd if omitted.

## Generated Project Config

- **Middleware**: `proxy.ts` (NOT `middleware.ts`) — rewrites for single locale, redirects for multi
- **i18n**: Always active. `i18n-config.ts` + `get-dictionary.ts` + `dictionaries/{en,pt}.json`. `"en"`, `"pt"`, or `"en+pt"`.
- **params**: `Promise<{ locale: string }>` cast with `as { locale: Locale }`
- **Fonts**: Geist Sans/Mono · **BG**: `#fafafa` · **Accent**: `indigo-600`
- **.launchkit**: `{ version, name, type, features: { languages, accentColor, palette, deployUrl }, sections, components }` — file-based detection is authoritative, never delete

## Section Library

### Base Template Sections (swappable/detectable)

```text
hero/default/           Business hero — full-bleed image, overlay, CTA (business)
hero/webgl/             WebGL shader hero; swaps Hero ↔ HeroFull (universal upgrade)
hero/parallax/          rAF parallax hero; swaps Hero ↔ ParallaxHero (business upgrade)
about/default/          Business about — image + stats grid (business)
services/default/       Business services — icon cards grid (business)
reviews/default/        Static grid with star ratings (business)
reviews/scrolling/      Scrolling multi-column testimonial cards (universal)
faq/default/            Accordion FAQ with expand/collapse (business)
process/default/        Numbered process steps with animations (business)
contact/default/        Business contact — phone, address, hours, WhatsApp (business)
```

### Add-on Sections

```text
skills/grid/            Categorized grid cards with animated progress bars (universal)
skills/bars/            Flat horizontal progress bars list (universal)
contact-form/business/  Resend contact API route with phone (business)
projects/default/       Project gallery + detail pages with slug routes (universal)
chatbot/default/        Dialogflow ChatWidget + API route + ChatNudge (universal)
floating-cta/default/   Fixed mobile CTA bar with call/WhatsApp/book (business)
whatsapp/default/       WhatsApp button in Contact + FloatingCTA via markers (business)
booking/calendly/       Calendly inline embed; YOUR_CALENDLY_URL (universal upsell)
google-reviews/default/ Google review CTA + star display; YOUR_GOOGLE_REVIEW_URL (universal upsell)
gallery-strip/default/  Autoscrolling image strip, pause on hover (universal)
reserve-bar/default/    Mobile sticky CTA bar; YOUR_ORDER_URL (business)
menu/tabbed/            Tabbed category menu + 2-col item grid (business)
reservation/formspree/  Full-screen booking modal + Formspree; YOUR_FORMSPREE_ID (business)
pricing/cards/          3-col pricing cards, popular highlight, feature list (business) [src: mrbig]
schedule/weekly/        7-day timetable grid + mobile accordion, today highlight (business) [src: mrbig]
stats/counters/         RAF-eased animated counters, IntersectionObserver (universal) [src: mrbig]
contact/map/            Google Maps iframe + address + directions; YOUR_MAPS_EMBED_URL (business) [src: mrbig]
team/spotlight/         2-col parallax image, glassmorphic stats overlay, tags + quote (universal) [src: mrbig]
```

`[src: mrbig]` = extracted from webcarca/mrbig gym client project (2026-03). Revisit for improvements.

### Niche → Section Coverage

| Niche               | Sections to add                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------ |
| Gym / Fitness       | `schedule/weekly` + `pricing/cards` + `stats/counters` + `team/spotlight` + `floating-cta` |
| Restaurant / Café   | template: `restaurant` + preset: `restaurant` (stats + gallery + pricing + reservation + CTA) |
| Services / Agency   | `floating-cta` + `contact-form` + `google-reviews` + `booking/calendly` + `stats/counters` |
| Agency / Studio     | `projects/default` + `reviews/scrolling` + `hero/webgl` + `skills/grid`                    |
| Retail / E-commerce | `reserve-bar` + `pricing/cards` + `gallery-strip` + `google-reviews` + `contact/map`       |

## Placeholder Markers

Replaced by `personalize.js`. All checked by `validate.js`.

```
YOUR_BUSINESS / YOUR_PHONE / YOUR_WHATSAPP_NUMBER / YOUR_ADDRESS            (business base)
YOUR_CALENDLY_URL        booking/calendly
YOUR_GOOGLE_REVIEW_URL   google-reviews
YOUR_FORMSPREE_ID        reservation/formspree  (get at formspree.io)
YOUR_ORDER_URL           reserve-bar
YOUR_MAPS_EMBED_URL          contact/map  (Google Maps iframe src)
YOUR_MAPS_DIRECTIONS_URL     contact/map  (directions button href)
YOUR_ORDER_URL               reserve-bar  (TheFork, booking link, or takeaway platform)
// TODO: TEMPLATE             marks manual content that needs replacing
```

## Section Authoring Rules

**IMPORTANT:** Follow these rules when writing any section component:

- Use Framer Motion `useInView` for all animations — never raw `IntersectionObserver` or `setTimeout`
- `default export`, prop name = `dictKey` (e.g. `{ pricing }: { pricing: PricingDict }`)
- No dynamic Tailwind classes (e.g. `` `grid-cols-${n}` `` breaks JIT) — use const maps with static strings
- Inline styles only for values that cannot be expressed as Tailwind classes
- `accentColorToken: "indigo"` in meta.json for any brand-color Tailwind class — it gets swapped on install

> For full authoring reference (meta.json schema, hooks context, Adding-X guides, dict shapes): @.claude/rules/section-authoring.md

## Tailwind v4 Gotchas

- `bg-linear-to-br` not `bg-gradient-to-br`; `mix-blend-screen` not `mix-blend-mode-screen`
- Numeric scale only: `min-h-55`, `md:w-88`, `z-60`, `max-w-350`
- Arbitrary calc: `w-[calc((100%-2rem)/3)]` — no underscores

## Known Gotchas

- `params` must be `Promise<{ locale: string }>`, cast with `as { locale: Locale }`
- Framer Motion ease in variants → type errors; use `ease: [0.16, 1, 0.3, 1] as const`
- `React.FormEvent` deprecated in React 19 — use `{ preventDefault(): void }`
- `ScrollProgress z-60` > `Navbar z-50`
- WebGL: `alpha: true` + `premultipliedAlpha: false` + `gl.clear` each frame
- `app/page.tsx` must export a default or build fails
- Navbar is a client component — do not revert to server

## Chatbot (Dialogflow ES)

- Auth: `GOOGLE_CREDENTIALS` (single-line JSON) + `DIALOGFLOW_PROJECT_ID`
- ZIP: `node dialogflow/zip.js` (forward slashes — PowerShell breaks import)
- Workflow: edit `generate.js` → `node dialogflow/generate.js` → zip → Dialogflow import. Never edit `intents/` directly.

## Bootstrap Flow

1. Read this file + run `node scripts/validate.js --project <path>`
2. Follow the relevant `BOOTSTRAP.md` to gather content
3. Update `en.json` + `pt.json` (or only active locale if single-language)
4. Validate again, then `npm run lint && npm run build`
