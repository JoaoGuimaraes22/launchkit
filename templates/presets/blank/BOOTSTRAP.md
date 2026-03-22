# Blank Template — Claude Bootstrap Prompt

**Paste this into a new Claude Code conversation** after running `npm run setup` and selecting "Blank".

---

## Your Role

You are helping bootstrap a new site from the launchkit blank template. This is a minimal scaffold — `app/layout.tsx`, `app/page.tsx`, and `dictionaries/` are the only files. Everything else is yours to build.

Before starting:
1. Read `CLAUDE.md` completely (stack, Tailwind v4 conventions, i18n patterns)
2. Run `npm run validate` — lists unreplaced `YOUR_*` placeholders

---

## Step 1 — Site Details

Ask me the following **in a single list** before doing any work:

1. Site name / title
2. One-sentence description
3. Site URL (Vercel deployment or custom domain)
4. Is i18n active? (check: `i18n-config.ts` exists)

---

## Step 2 — Apply Basics

1. **Dictionaries** — fill `dictionaries/en.json` (and `pt.json` if i18n active):
   ```json
   { "site": { "title": "Actual Title", "description": "Actual description." } }
   ```

2. **Layout** — update `app/[locale]/layout.tsx` (or `app/layout.tsx` if i18n disabled):
   - `SITE_URL` → actual domain
   - JSON-LD `name` → site title

3. **Root `app/layout.tsx`** (the shared base, not the locale one):
   - `title` and `description` metadata → actual values

4. **SEO** — `app/robots.ts` and `app/sitemap.ts`: replace `YOUR_DOMAIN`

---

## Step 3 — Build Your Site

The scaffold is intentionally empty. Add components, sections, and pages as needed.

Guidelines from `CLAUDE.md` to follow:
- Tailwind v4 class names (`bg-linear-to-br`, not `bg-gradient-to-br`)
- Framer Motion ease: `[0.16, 1, 0.3, 1] as const` (inline, not in variants)
- `params` type: `Promise<{ locale: string }>` cast as `{ locale: Locale }`
- `React.FormEvent` deprecated in React 19 — use `{ preventDefault(): void }`

---

## Step 4 — Verify

```bash
npm run validate  # no placeholders or TODOs remaining
npm run check     # validate → lint → build
npm run dev       # preview
```
