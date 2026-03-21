# launchkit — Portfolio · Business Site

**Template repo** — `node scripts/setup.js` copies a template into `app/` and applies feature toggles.
All sections below describe the **post-setup** state of `app/`.

Next.js 16.1.6 App Router · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion

## Stack & Config

- **Middleware**: `proxy.ts` (NOT `middleware.ts`)
- **i18n**: `i18n-config.ts` + `get-dictionary.ts` + `dictionaries/en.json` + `dictionaries/pt.json`. Locales: `en` (default), `pt`. Export: `i18n.locales`, not `locales`.
- **params type**: `params: Promise<{ locale: string }>` with `(await params) as { locale: Locale }` cast
- **Fonts**: Geist Sans / Geist Mono · **BG**: `#fafafa` · **Accent**: `indigo-600`
- **Real contacts**: email `Jssgmrs22@gmail.com`, GitHub `JoaoGuimaraes22`, LinkedIn `joão-sebastião-guimarães-4abaa7197`

## Template Repo Structure

```text
templates/
  portfolio/              Source for Portfolio type (copied to app/ by setup.js)
    app/[locale]/         locale layout, page, components, work/[slug]/
    app/api/              chat/, contact/
    app/components/       LanguageSwitcher, NavDropdown, ScrollProgress
    app/robots.ts / app/sitemap.ts
    root/                 proxy.ts, i18n-config.ts, get-dictionary.ts (copied to root if i18n on)
    dictionaries/         en.json, pt.json
    dialogflow/           Dialogflow ES agent config
    public/               hero.jpg, profile.jpg, og-image.png, projects/
    BOOTSTRAP.md          Claude kickstart for portfolio customization
  business/               Source for Business Site type (copied to app/ by setup.js)
    app/[locale]/         locale layout, page, components
    app/api/contact/      Resend route
    app/robots.ts / app/sitemap.ts
    root/                 proxy.ts, i18n-config.ts, get-dictionary.ts
    dictionaries/         en.json, pt.json
    public/               hero.jpg
    BOOTSTRAP.md          Claude kickstart for business customization
```

## File Structure (post-setup — portfolio)

```text
proxy.ts                      middleware (locale redirect)
i18n-config.ts                locales + Locale type
get-dictionary.ts             lazy JSON loader
dictionaries/en.json / pt.json
app/[locale]/
  layout.tsx                  generateMetadata (OG/Twitter/JSON-LD), ScrollProgress
  page.tsx                    HeroFull + sidebar layout
  work/[slug]/
    page.tsx                  project detail (server component)
    ScreenshotGallery.tsx     client — infinite horizontal scroll gallery
  components/
    Navbar.tsx                CLIENT — transparent→white on scroll; scrolled prop → NavDropdown, LanguageSwitcher
    NavDropdown.tsx           IntersectionObserver section tracking
    HeroFull.tsx              CLIENT — WebGL shader + parallax hero.jpg
    Testimonials.tsx          CLIENT — infinite vertical scroll columns
    Services.tsx              CLIENT — 2×2 card grid + modal popup
    Work.tsx                  id="work", image cards → /[locale]/work/[slug]
    Process.tsx               id="process", numbered steps
    About.tsx                 id="about", bio + fun facts
    Contact.tsx               id="contact", form + social links
    ProfileSidebar.tsx        sticky card: photo, bio, CTA, ChatNudge, social icons
    ChatNudge.tsx             CLIENT — fires open-chat custom event
    ScrollProgress.tsx        fixed top indigo bar, z-60
    ChatWidget.tsx            CLIENT — Dialogflow ES chat, fixed bottom-right z-50
app/api/chat/route.ts         POST proxy → Dialogflow ES detectIntent
public/
  hero.jpg / profile.jpg / og-image.png
  projects/[slug-folder]/1-5.png   (folder ≠ slug — see Projects table)
```

## Layout (page.tsx)

```tsx
<>
  <HeroFull hero={dict.hero} /> {/* full-width, outside sidebar */}
  <div className="md:flex xl:mx-auto xl:max-w-350">
    <aside className="hidden md:flex md:sticky md:top-14 md:h-[calc(100vh-3.5rem)] md:w-88 ...">
      <ProfileSidebar />
    </aside>
    <main className="min-w-0 flex-1">
      <div className="xl:max-w-4xl 2xl:max-w-5xl">
        <Work /> <Testimonials /> <Services /> <Process /> <About /> <Contact />
      </div>
    </main>
  </div>
</>
```

No `pt-14` on outer wrapper — navbar floats over HeroFull. Sidebar `md:top-14` clears navbar after hero.

## Sections

| Section      | id             | Nav label | Dict key       |
| ------------ | -------------- | --------- | -------------- |
| Hero         | `home`         | Home      | `hero`         |
| Work         | `work`         | Work      | `work`         |
| Testimonials | `testimonials` | Reviews   | `testimonials` |
| Services     | `services`     | Services  | `services`     |
| Process      | `process`      | Workflow  | `process`      |
| About        | `about`        | About     | `about`        |
| Contact      | `contact`      | Contact   | `contact`      |

## HeroFull

Client component. Layer order (bottom → top):

1. `<motion.div h-[130%]>` wrapping `<Image fill>` for hero.jpg — parallax `y: useTransform([0,1], ["0%","20%"])`
2. `<div className="bg-zinc-900/70">` — uniform dark overlay so shader pops
3. `<canvas mix-blend-screen>` — WebGL fragment shader (4 animated blobs + mouse blob)
4. `<div bg-linear-to-t from-zinc-900/90>` — gradient overlay for text legibility
5. Content: title (white/white-25), tagline, CTAs, stats, scroll cue

**WebGL shader**: `getContext("webgl", { alpha: true })`, clears to transparent each frame. 4 always-animated blobs (indigo/violet/sky/rose) on sin/cos orbits, `t * 0.60`. Mouse blob lerps at `0.12` per frame. `mix-blend-mode: screen` → black = transparent, colors overlay photo. Fallback: `bg-zinc-950` on section.

## Testimonials

Client component. `bg-zinc-50`. Infinite vertical scroll via `@keyframes testimonials-scroll-up` (`translateY(0 → -33.333%)`), arrays tripled for seamless loop. Hover pauses via `hover:[animation-play-state:paused]`.

- **Desktop (md+)**: 3 columns — left `20s`, middle `35s` (slowest), right `25s`
- **Mobile**: 1 column, all 9 items, `65s`
- Top/bottom gradient fade overlays (`bg-linear-to-b/t from-zinc-50`)
- Card hover: `hover:scale-[1.02] hover:shadow-md hover:border-zinc-200 transition-all duration-300`
- Dict: `{ title_line1, title_line2, subtitle, items: [{ quote, name, role, avatar }] }` — 9 items total (3 per desktop column)

## Services

Client component. 2×2 grid (`grid-cols-1 sm:grid-cols-2 gap-4`), `min-h-55` cards.

**Card styles** (by index):

| #   | Background        | Text color | Hover            |
| --- | ----------------- | ---------- | ---------------- |
| 0   | `bg-indigo-600`   | white      | `brightness-110` |
| 1   | `bg-white border` | zinc-900   | `shadow-md`      |
| 2   | `bg-zinc-100`     | zinc-900   | `shadow-md`      |
| 3   | `bg-indigo-50`    | indigo-900 | `shadow-md`      |

Card anatomy: title + description (top), `Learn more →` button + large emoji (bottom). Clicking "Learn more" opens an `AnimatePresence` modal with `scale 0.92→1` entrance, checklist of `details[]` items, Escape/backdrop-click to close, body scroll locked.

**Tech stack strip** below cards — 5 hardcoded categories (Frontend/indigo, Backend/blue, Database/emerald, Cloud & DevOps/amber, AI & Tools/violet), pills from `PILL_COLORS`.

Dict: `services.items[].details: string[]` (added) — bullet points shown in modal.

## ScreenshotGallery

- Triples array, starts scrollLeft at middle set; stride measured via `getBoundingClientRect`
- Reset teleports ±singleSetWidth; suppressed during arrow scroll via `suppressResetRef` + 450ms
- Double-rAF init (single rAF too early for flex layout)
- Mobile: 1 image (`w-full`) · Desktop: 3 images (`md:w-[calc((100%-2rem)/3)]`)

## Design Patterns

- **Two-tone title**: line1 `text-zinc-900`, line2 `text-zinc-200` · `font-black uppercase tracking-tight text-4xl sm:text-5xl md:text-6xl xl:text-[7rem]` · `motion.div leading-none mb-12`
- **Hero title**: line1 `text-white`, line2 `text-white/25` · `xl:text-[8rem]`
- **Section padding**: `px-6 py-16 md:px-8 md:py-24 xl:px-16 xl:py-32`
- **Scroll entrance**: `useInView(ref, { once: true, margin: "-80px" })`, stagger `delay: i * 0.12`
- **Ease**: `[0.16, 1, 0.3, 1] as const` everywhere
- **Cards**: `rounded-2xl border border-zinc-100 bg-white shadow-sm`
- **Avatar colors**: `AVATAR_COLORS` array indigo/blue/emerald/amber/rose/cyan `bg-*-100 text-*-700`

## Dictionary Shape

```json
{
  "nav": { "home","work","reviews","services","workflow","about","contact" },
  "hero": { "name","card_bio","title_line1","title_line2","tagline","cta","cta_secondary","stats":[{"value","label"}] },
  "work": { "title_line1","title_line2","cta","projects":[{ "slug","title","description","long_description","image","images","tags","live","github" }] },
  "testimonials": { "title_line1","title_line2","subtitle","items":[{ "quote","name","role","avatar" }] },
  "services": { "title_line1","title_line2","stack_label","items":[{ "icon","title","description","details":["..."] }] },
  "process":  { "title_line1","title_line2","steps":[{ "number","title","description" }] },
  "about":    { "title_line1","title_line2","bio","fun_facts":[{ "emoji","text" }] },
  "contact":  { "title_line1","title_line2","body","form_name","form_email","form_message",
                "form_name_placeholder","form_email_placeholder","form_message_placeholder",
                "form_submit","form_success","email_label","email","github","linkedin" }
}
```

## Projects (6 live)

| Slug               | Folder           | Live                              |
| ------------------ | ---------------- | --------------------------------- |
| `cascais-volley`   | `cascaisvolley/` | cascaisvolley.com                 |
| `koya-bistro`      | `restaurant/`    | koya-bistro.vercel.app            |
| `sorriso-plus`     | `clinic/`        | dentist-flax-psi.vercel.app       |
| `aquafix`          | `plumber/`       | plumber-xi.vercel.app             |
| `revicar`          | `mechanic/`      | mechanic-five.vercel.app          |
| `bella-hair-salon` | `hairsalon/`     | hair-salon-omega-taupe.vercel.app |

## Tailwind v4

- `bg-linear-to-br` not `bg-gradient-to-br`
- `mix-blend-screen` not `mix-blend-mode-screen`
- `min-h-55` not `min-h-[220px]` · `max-w-55` not `max-w-[220px]`
- `md:w-88`, `z-60`, `max-w-350` — no arbitrary values for these
- Arbitrary calc: `w-[calc((100%-2rem)/3)]` — no underscores (linter enforces)
- Linter suggests canonical classes — always apply suggestions

## Scripts

| Script         | Command                                              | What it does                                                                                                          |
| -------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Setup          | `node scripts/setup.js`                              | Select template, toggle features, collapse i18n if disabled, replace accent color (business), generate `.env.example` |
| Setup (direct) | `npm run setup:portfolio` / `npm run setup:business` | Skip type-selection prompt and go straight to feature selection                                                       |
| Reset          | `npm run reset`                                      | Remove everything setup.js added; restore base state                                                                  |
| Toggle         | `npm run toggle`                                     | Show current feature state and enable/disable individual features without full reset                                  |
| Validate       | `npm run validate`                                   | Check for unreplaced `YOUR_*` placeholders + `TODO: TEMPLATE` comments; exit 1 if found                               |
| Dialogflow gen | `node dialogflow/generate.js`                        | Regenerate `intents/` from `generate.js` source (portfolio only)                                                      |
| Dialogflow zip | `node dialogflow/zip.js`                             | Bundle `intents/` into `portfolio-agent.zip` for Dialogflow import (portfolio only)                                   |

> **Dialogflow workflow**: edit `generate.js` (look for `// EDIT:` comments) → `node dialogflow/generate.js` → `node dialogflow/zip.js` → import zip in Dialogflow console. Never edit `intents/` directly.

## Chatbot (Dialogflow ES)

- Auth: `GOOGLE_CREDENTIALS` (service account JSON, single-line) + `DIALOGFLOW_PROJECT_ID=portfolio-xost`
- Session: `crypto.randomUUID()` in `useState` — one per tab
- ZIP: always use `node dialogflow/zip.js` (forward-slash paths — PowerShell breaks Dialogflow import)
- Restore: Dialogflow console → Settings → Import & Export → Restore from zip

## SEO

- `generateMetadata` in `[locale]/layout.tsx` — OG, Twitter, JSON-LD Person schema
- Language alternates: `en` → `/en`, `pt` → `/pt`

## Known Gotchas

- `params` must be `Promise<{ locale: string }>`, cast with `as { locale: Locale }`
- Framer Motion ease in variants → type errors; inline `ease: [0.16, 1, 0.3, 1] as const`
- `React.FormEvent` deprecated in React 19 — use `{ preventDefault(): void }`
- ScrollProgress `z-60` (above Navbar `z-50`)
- HeroFull is outside the sidebar layout — `id="home"` lives there
- WebGL canvas needs `alpha: true` + `premultipliedAlpha: false` + `gl.clear` each frame for transparency
- ScreenshotGallery: double-rAF for init; `suppressResetRef` during smooth scroll
- `scroll-behavior: smooth` on `html` in `globals.css`
- `app/page.tsx` must export a default or build fails
- Navbar is a client component — do not revert to server component

## Template & Bootstrap

This repo is a GitHub template. Run `node scripts/setup.js` after cloning to select a template type and features, then paste the relevant BOOTSTRAP.md into a Claude Code conversation to fill in content.

- **Portfolio** → `templates/portfolio/BOOTSTRAP.md`
- **Business Site** → `templates/business/BOOTSTRAP.md`

### Placeholder Markers

Personal content uses these sentinel strings — grep for them to find what needs replacing:

- `YOUR_NAME` — full name
- `YOUR_EMAIL` — email address
- `YOUR_GITHUB` — GitHub username
- `YOUR_LINKEDIN` — LinkedIn profile slug
- `YOUR_DOMAIN` — site URL / Vercel domain
- `YOUR_CITY` / `YOUR_TIMEZONE` — location in ProfileSidebar
- `// TODO: TEMPLATE` — comment left by setup script marking manual Claude cleanup

### `.launchkit`

`setup.js` writes `.launchkit` (JSON) at the end of every run. It is the authoritative source for template type and initial feature choices — read by `npm run toggle` and `npm run status`.

```json
{
  "type": "portfolio",
  "features": {
    "i18n": true,
    "webglHero": true,
    "chatbot": false,
    "contactForm": true,
    "testimonials": true,
    "work": true,
    "sidebar": true
  }
}
```

For a business site the `features` keys are `i18n`, `contactForm`, `floatingCTA`, `whatsapp`. `toggle.js` updates this file after each toggle. Do not delete it.

### Feature Detection

Check file existence to determine which features are currently active (overrides `.launchkit` if files were changed manually):

| Feature        | Active if this file exists                   |
| -------------- | -------------------------------------------- |
| i18n           | `i18n-config.ts`                             |
| WebGL Hero     | `app/[locale]/components/HeroFull.tsx`       |
| Chatbot        | `app/api/chat/route.ts`                      |
| Contact Form   | `app/api/contact/route.ts`                   |
| Testimonials   | `app/[locale]/components/Testimonials.tsx`   |
| Work           | `app/[locale]/components/Work.tsx`           |
| ProfileSidebar | `app/[locale]/components/ProfileSidebar.tsx` |

If i18n was disabled during setup, `app/[locale]/` does not exist — `setup.js` collapses it to `app/` automatically. Substitute `app/` for `app/[locale]/` in the paths above.

### Bootstrap Flow

When helping someone customize a fresh clone:

1. Read this file (`CLAUDE.md`) completely
2. Check active features using the table above
3. `npm run validate` — lists all remaining `YOUR_*` placeholders and `TODO: TEMPLATE` comments
4. Follow `templates/portfolio/BOOTSTRAP.md` to gather project details before touching anything
5. Always update both `en.json` and `pt.json` together if i18n is active
6. `npm run validate` again to confirm clean, then `npm run lint && npm run build`

---

## Business Site Template

When `node scripts/setup.js` selects **Business Site**, the business template is copied into `app/` from `templates/business/`. Use `templates/business/BOOTSTRAP.md` as the Claude kickstart.

### Feature Detection (Business Site)

| Feature         | Active if this file exists                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------ |
| Business site   | `app/[locale]/components/Footer.tsx` (or `app/components/Footer.tsx` if i18n disabled)           |
| i18n            | `i18n-config.ts`                                                                                 |
| Contact form    | `app/api/contact/route.ts`                                                                       |
| FloatingCTA bar | `app/[locale]/components/FloatingCTA.tsx` (or `app/components/FloatingCTA.tsx` if i18n disabled) |

### Key Differences from Portfolio

- **No sidebar** — all sections are full-width stacked
- **No WebGL** — hero uses `<Image fill>` + dark overlay, CSS transitions only
- **Footer present** — `Footer.tsx` is a full 3-column server component (`bg-zinc-900`)
- **FloatingCTA** — fixed mobile bottom bar with Call / WhatsApp / Book buttons
- **No Dialogflow** — no chatbot, no `app/api/chat/` route
- **Dict key**: `dict.navbar` (not `dict.nav`) — links are an array `navbar.links[]`
- **Navbar** reads links from `dict.navbar.links[]` — the array controls nav items

### Business Site Components

```text
app/[locale]/components/
  Navbar.tsx         CLIENT — transparent→white on scroll; links from dict.navbar.links[]
  HeroContent.tsx    CLIENT — Image fill bg + overlay, two-line headline, stats, dual CTAs
  About.tsx          SERVER — lg:grid-cols-2 side-by-side, about.jpg, stat cards
  Services.tsx       SERVER — lg:grid-cols-3 grid, emoji icon in bg-indigo-50 container
  Reviews.tsx        SERVER — lg:grid-cols-3 grid, star ratings, avatar initials
  FAQ.tsx            CLIENT — accordion, single openIndex state, chevron rotates
  Contact.tsx        CLIENT — form + contact info column, fetch /api/contact
  Footer.tsx         SERVER — lg:grid-cols-3 (brand/nav/contact), bg-zinc-900
  FloatingCTA.tsx    CLIENT — fixed bottom bar, md:hidden, Call/WhatsApp/Book
  ScrollProgress.tsx fixed top indigo bar (shared with portfolio)
  LangSetter.tsx     sets html[lang] attr (shared with portfolio)
  LanguageSwitcher.tsx locale toggle (shared, present if i18n enabled)
```

### Business Site Dict Shape

```json
{
  "navbar": {
    "logo": "YOUR_BUSINESS",
    "cta": "Book Now",
    "links": [{ "id": "about", "label": "About" }, ...]
  },
  "hero": {
    "title_line1": "YOUR", "title_line2": "HEADLINE",
    "tagline": "...", "cta": "Book Now", "cta_secondary": "Learn More",
    "stats": [{ "value": "0+", "label": "Clients Served" }]
  },
  "about": {
    "title_line1": "ABOUT", "title_line2": "US",
    "body": "...",
    "stats": [{ "value": "0+", "label": "Years Experience" }]
  },
  "services": {
    "title_line1": "OUR", "title_line2": "SERVICES",
    "items": [{ "icon": "⭐", "title": "Service", "description": "..." }]
  },
  "reviews": {
    "title_line1": "WHAT CLIENTS", "title_line2": "SAY",
    "subtitle": "...",
    "items": [{ "quote": "...", "name": "...", "role": "...", "rating": 5 }]
  },
  "faq": {
    "title_line1": "COMMON", "title_line2": "QUESTIONS",
    "items": [{ "question": "...", "answer": "..." }]
  },
  "contact": {
    "title_line1": "GET IN", "title_line2": "TOUCH",
    "body": "...",
    "form_name": "Name", "form_email": "Email", "form_phone": "Phone",
    "form_message": "Message", "form_submit": "Send Message", "form_success": "Message sent!",
    "phone": "YOUR_PHONE", "email": "YOUR_EMAIL",
    "address": "YOUR_ADDRESS", "hours": "Mon–Fri 9am–6pm",
    "whatsapp": "YOUR_WHATSAPP_NUMBER",
    "map_link": "https://maps.google.com/?q=YOUR_ADDRESS"
  },
  "footer": {
    "tagline": "Short brand tagline.",
    "address": "YOUR_ADDRESS", "hours": "Mon–Fri 9am–6pm",
    "phone": "YOUR_PHONE", "email": "YOUR_EMAIL",
    "copyright": "© 2025 YOUR_BUSINESS. All rights reserved.",
    "nav_links": [{ "id": "about", "label": "About" }, ...]
  },
  "cta": {
    "call_label": "Call Now", "phone": "YOUR_PHONE",
    "whatsapp_label": "WhatsApp", "whatsapp": "YOUR_WHATSAPP_NUMBER",
    "book_label": "Book Now"
  }
}
```

### Business Site Placeholder Markers

- `YOUR_BUSINESS` — business name (Navbar logo, JSON-LD, Footer)
- `YOUR_PHONE` — phone number with country code
- `YOUR_WHATSAPP_NUMBER` — digits only, no spaces (for wa.me URL)
- `YOUR_EMAIL` — contact email
- `YOUR_ADDRESS` — physical address
- `YOUR_DOMAIN` — site URL / Vercel domain

### Business Site Bootstrap Flow

1. Read `CLAUDE.md` completely
2. Check active features using the business feature detection table above
3. `npm run validate` — lists all remaining `YOUR_*` placeholders and `TODO: TEMPLATE` comments
4. Follow `templates/business/BOOTSTRAP.md` to gather content
5. Apply to `dictionaries/en.json` (and `pt.json` if i18n active)
6. Update `app/[locale]/layout.tsx` (or `app/layout.tsx` if i18n was disabled): `SITE_URL`, title, description, `jsonLd`
7. Accent color replacement: **automated by `setup.js`** if a preset was chosen; only needed for custom hex values
8. i18n routing collapse: **automated by `setup.js`** — `app/[locale]/` does not exist if i18n was disabled
9. `npm run validate` again to confirm clean, then `npm run lint && npm run build`
