# Portfolio Template — Claude Bootstrap Prompt

**Paste this entire file into a new Claude Code conversation** after cloning and running `node scripts/setup.js`.

---

## Your role

You are helping bootstrap a new portfolio project from the `next-portfolio-template`. The full stack, architecture, and conventions are documented in `CLAUDE.md` — **read it fully before making any changes**.

Before starting:
1. Read `CLAUDE.md` completely
2. Check which features are active by testing file existence (rules in the "Template & Bootstrap" section of `CLAUDE.md`)
3. Run: `grep -r "YOUR_" app dictionaries --include="*.ts" --include="*.tsx" --include="*.json"` to see all placeholders
4. Run: `grep -r "TODO: TEMPLATE" app --include="*.ts" --include="*.tsx"` to find cleanup tasks left by the setup script

---

## Step 1 — Project Details

Ask me ALL of the following questions **in a single numbered list** (don't start any work yet):

1. Your full name (used in metadata, Navbar logo, JSON-LD, sidebar)
2. Your job title / one-line role (e.g. "Full-Stack Developer & UI Designer")
3. Your card bio — 1 line shown in the sidebar (e.g. "Web Designer · Developer · Available for Freelance")
4. Hero title — **two lines** of large display text (e.g. line 1: "FULL-STACK", line 2: "DEVELOPMENT")
5. Hero tagline — one sentence describing your value proposition
6. Your email address (contact form destination, sidebar link, JSON-LD)
7. Your GitHub username
8. Your LinkedIn profile slug (the part after `linkedin.com/in/`)
9. Your city and timezone for the sidebar (e.g. "Lisbon, Portugal · GMT+1")
10. Your site URL (e.g. `https://your-name.vercel.app` or your custom domain)
11. Your 3 stats — value + label each (e.g. "+20 / Websites Launched, +15 / Happy Clients, +4 / Years Experience")
12. Is the "Available for work" badge currently accurate? (yes/no)

---

## Step 2 — Section Content

After I answer Step 1, ask for content for each **enabled** section (check file existence to determine which are active):

### Work section (`app/[locale]/components/Work.tsx` exists)
For each project, ask:
- Title, slug (URL-friendly, lowercase, hyphens), short description (1–2 sentences)
- Long description (2–3 paragraphs)
- Tags (comma-separated)
- Live URL and GitHub URL (or "none")
- Screenshot folder name under `public/projects/`

### Testimonials section (`app/[locale]/components/Testimonials.tsx` exists)
Ask for 9 testimonials (to fill 3 desktop columns). For each:
- Quote, person name, role/company

### Services section (`app/[locale]/components/Services.tsx` exists)
Ask for 4 service cards. For each:
- Emoji icon, title, 1–2 sentence description, 4–6 bullet-point details (shown in modal)

### About section (always active)
- Bio (2–3 paragraphs)
- 4 fun facts (emoji + title + 1-sentence text each)

---

## Step 3 — Apply All Content

Once you have all answers, make all changes in this order:

### 3a. Dictionaries
Update `dictionaries/en.json` with all provided content, following the exact JSON shape in `CLAUDE.md`.

If i18n is enabled (`i18n-config.ts` exists), also update `dictionaries/pt.json` — ask me to provide Portuguese translations, or translate the English content and ask me to confirm.

### 3b. Layout & Metadata
- `app/[locale]/layout.tsx` (or `app/layout.tsx` if i18n disabled):
  - `SITE_URL` → actual domain
  - `title` string → "NAME — Role"
  - `description` strings (en + pt) → actual description
  - `jsonLd.name`, `jsonLd.jobTitle`, `jsonLd.email`, `jsonLd.sameAs` → actual values

- `app/layout.tsx` root: `title` and `description` metadata → actual values

### 3c. ProfileSidebar (if active)
- `app/[locale]/components/ProfileSidebar.tsx`:
  - Location string → actual city/timezone
  - GitHub `href` → actual GitHub URL
  - LinkedIn `href` → actual LinkedIn URL
  - Email `href` → `mailto:actual@email.com`
  - "Available for work" badge: if Step 1 answer was "no", change `bg-emerald-50` badge to "Currently booked" or remove it

### 3d. Work detail page (if active)
- `app/[locale]/work/[slug]/page.tsx`: `generateMetadata` title → `"${project.title} — ACTUAL_NAME"`

### 3e. Contact API route (if active)
- `app/api/contact/route.ts`: `TO_EMAIL` → actual email

### 3f. Chatbot (if active)
- `app/[locale]/components/ChatWidget.tsx`: greeting strings → reference actual name
- `dialogflow/agent.json`: `description` → actual name

### 3g. SEO
- `app/robots.ts` and `app/sitemap.ts`: `SITE_URL` → actual domain (verify they already have placeholders)

### 3h. Clean up TODO comments
After all content is applied, search for and remove all `// TODO: TEMPLATE` comments.

---

## Step 4 — i18n Routing Collapse (only if i18n was disabled)

If `i18n-config.ts` does NOT exist, the `app/[locale]/` folder still needs to be collapsed to `app/`. Do this **after** Step 3 content updates are applied:

1. Move `app/[locale]/layout.tsx` → overwrite `app/layout.tsx`
2. Move `app/[locale]/page.tsx` → overwrite `app/page.tsx`
3. Move `app/[locale]/components/` → `app/components/`
4. Move `app/[locale]/work/` → `app/work/` (if work section is active)
5. Delete the now-empty `app/[locale]/` folder
6. Fix all import paths in moved files (remove extra `../../` levels)
7. In all moved files: remove `import { type Locale } from "../../i18n-config"` and `Locale` type references
8. Replace `const { locale } = (await params) as { locale: Locale }` and `getDictionary(locale)` calls:
   - In `layout.tsx` and `page.tsx`: remove `params` from function signature, replace `getDictionary(locale)` with `import dict from "../dictionaries/en.json"` (static import at top of file)
   - Remove `locale` prop from all components that accepted it (`Navbar`, `Work`, `ChatWidget`, `ProfileSidebar`)
9. In `Navbar.tsx`: remove `LanguageSwitcher` import + JSX (already deleted by setup script)
10. In components that branched on `locale` for strings (e.g., former `ChatWidget`): remove locale branching, keep only English strings
11. In `work/[slug]/page.tsx` (if active): remove `locale` from `generateStaticParams`, simplify to only return slugs without locale prefix
12. Update `app/page.tsx` root (the redirect stub): change to simply render the locale layout directly (no redirect needed)

---

## Step 5 — Images

Tell me which images still need real content:
- `public/hero.jpg` — hero background (dark photo works best)
- `public/profile.jpg` — profile photo (square)
- `public/og-image.png` — OG card (1200×630)
- `public/projects/[slug]/1-3.png` — screenshots per project

If images aren't ready, the placeholder files will work temporarily.

---

## Step 6 — External Services (if active)

### Dialogflow (if `app/api/chat/route.ts` exists)
Walk me through:
1. Creating a Dialogflow ES agent
2. Setting up the Google Cloud service account
3. Setting `GOOGLE_CREDENTIALS` and `DIALOGFLOW_PROJECT_ID` in `.env.local`
4. Running `node dialogflow/zip.js` and importing the zip
5. Customizing `dialogflow/intents/` with my actual FAQ answers

### Resend (if `app/api/contact/route.ts` exists)
Walk me through:
1. Creating a Resend account and getting the API key
2. Setting `RESEND_API_KEY` in `.env.local`
3. Verifying that `TO_EMAIL` in the route is set correctly

---

## Step 7 — Verify

Run in order and fix any errors:

```bash
npm run lint
npm run build
npm run dev
```

After `npm run dev`, do a visual pass:
- Hero: name, tagline, CTAs, stats render correctly
- Navbar: sections match enabled features
- All sections visible with real content (no "YOUR_NAME" strings)
- Contact form submits (if enabled) / social links work
- Language switcher works (if i18n enabled)

Final commit when clean:
```
feat: initial portfolio customization
```

---

## Notes for Claude

- Follow **ALL** patterns in `CLAUDE.md` exactly — Tailwind v4 class names, ease values, `params` Promise type, etc.
- Never modify `.env` or `.env.*` files
- Always update both `en.json` and `pt.json` together if i18n is active
- Framer Motion ease in variants → type errors; use inline `ease: [0.16, 1, 0.3, 1] as const`
- `React.FormEvent` deprecated in React 19 — use `{ preventDefault(): void }`
- When editing dictionaries, preserve the exact JSON shape — do not add or remove top-level keys
- `params` type is always `Promise<{ locale: string }>` cast as `{ locale: Locale }`
