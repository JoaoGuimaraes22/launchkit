# Business Site Template — Claude Bootstrap Prompt

**Paste this entire file into a new Claude Code conversation** after cloning and running `node scripts/setup.js` (selecting "Business Site").

---

## Your Role

You are helping bootstrap a new local business website from the `next-portfolio-template`. The architecture is documented in `CLAUDE.md` — **read it fully before making any changes**.

Before starting:
1. Read `CLAUDE.md` completely
2. Check which features are active using the feature detection rules in the "Template & Bootstrap" section
3. `grep -r "YOUR_" app dictionaries templates --include="*.ts" --include="*.tsx" --include="*.json"` — see remaining placeholders
4. `grep -r "TODO: TEMPLATE" app --include="*.ts" --include="*.tsx"` — find cleanup tasks

---

## Step 1 — Business Details

Ask me ALL of the following **in a single numbered list** (don't start any work yet):

1. Business name (used in Navbar logo, metadata, Footer, JSON-LD)
2. Business type (e.g. "dental clinic", "hair salon", "plumbing service") — for context
3. Tagline / one-sentence description (used in Footer and hero)
4. Primary accent color — Tailwind color name or hex (e.g. "teal", "emerald", "#2563eb"). Default: indigo
5. City and country (for metadata and contact section)
6. Phone number (including country code, e.g. +351 912 345 678)
7. WhatsApp number (digits only, no spaces, e.g. 351912345678)
8. Email address
9. Physical address
10. Business hours (e.g. "Mon–Fri 9am–6pm · Sat 9am–1pm")
11. Google Maps link for the address
12. Site URL (Vercel deployment URL or custom domain)
13. 3 hero stats — value + label each (e.g. "+15 / Years Experience, +500 / Happy Clients, 4.9 / Google Rating")

---

## Step 2 — Section Content

After I answer Step 1, ask for content for each section. Ask all section questions at once in one message:

**Hero:**
- Two headline lines (large display text — all caps, e.g. "PROFESSIONAL / PLUMBING")
- One-sentence tagline (value proposition)
- Primary CTA label (e.g. "Book Now", "Get a Quote", "Call Today")
- Secondary CTA label (e.g. "Learn More", "Our Services")

**About:**
- 2 short paragraphs about the business (who you are, approach, values)
- 3 stats (value + label — can reuse hero stats or use different ones)

**Services:**
- 6 services — for each: emoji icon, title, 1-sentence description

**Reviews:**
- 4–6 testimonials — for each: quote, client name, role/context (e.g. "Homeowner, Cascais"), star rating (1–5)

**FAQ:**
- 6 questions + answers

**Contact:**
- Confirm phone, email, WhatsApp, address, hours (from Step 1 — or update them)
- Contact section body text (1 sentence inviting them to reach out)

**Footer:**
- Confirm business name, tagline, address, hours, phone, email
- Copyright year and entity name

**FloatingCTA labels (if active):**
- Call button label (e.g. "Call Now")
- WhatsApp button label (e.g. "WhatsApp")
- Book button label (e.g. "Book Now")

---

## Step 3 — Apply All Content

Once you have all answers, apply in this order:

### 3a. Dictionaries
Fill `dictionaries/en.json` with all content. Follow the exact dict shape documented in `CLAUDE.md` business site section.

If i18n is enabled (check: `i18n-config.ts` exists), also fill `dictionaries/pt.json` — ask me for Portuguese translations, or translate and confirm.

### 3b. Layout & Metadata
- `app/[locale]/layout.tsx`:
  - `SITE_URL` → actual domain
  - `title` string → "Business Name — Short descriptor"
  - `description` → one-sentence English description; PT description if i18n enabled
  - `jsonLd.name` → business name; `jobTitle` → business type; `email` → actual email; `sameAs` → actual social/website URLs
- `app/layout.tsx`: `title` and `description` metadata → actual values

### 3c. Contact API route (if active)
- `app/api/contact/route.ts`: `TO_EMAIL` → actual email

### 3d. Accent color
Replace all `indigo-` Tailwind classes in the business components with the brand color:
- Files to update: `HeroContent.tsx`, `About.tsx`, `Services.tsx`, `FAQ.tsx`, `Contact.tsx`, `Navbar.tsx`, `FloatingCTA.tsx`
- Classes to replace: `bg-indigo-600`, `hover:bg-indigo-700`, `text-indigo-600`, `bg-indigo-50`, `text-indigo-500`, `border-indigo-500`, `focus-visible:outline-indigo-600`
- If hex color: use arbitrary Tailwind values `bg-[#hex]`, `text-[#hex]`
- Document the brand color in a comment at the top of `globals.css`

### 3e. SEO
- `app/robots.ts` and `app/sitemap.ts`: replace `YOUR_DOMAIN` with actual domain

### 3f. Clean up TODO comments
Search and remove all `// TODO: TEMPLATE` comments after content is applied.

---

## Step 4 — i18n Routing Collapse (only if i18n was disabled)

If `i18n-config.ts` does NOT exist, collapse `app/[locale]/` → `app/`:

1. Move `app/[locale]/layout.tsx` → overwrite `app/layout.tsx`
2. Move `app/[locale]/page.tsx` → overwrite `app/page.tsx`
3. Move `app/[locale]/components/` → `app/components/`
4. Delete `app/[locale]/`
5. Fix all import paths (remove extra `../../` levels)
6. Remove `import { type Locale }` and all `Locale` type references
7. Replace `getDictionary(locale)` with `import dict from "../dictionaries/en.json"`
8. Remove `locale` prop from `Navbar` and any other components that accepted it
9. Remove `LanguageSwitcher` import and JSX from `Navbar.tsx` (already deleted by setup script)
10. Update `app/page.tsx` root (redirect stub) to simply render the page directly

---

## Step 5 — Images

Tell me which images still need replacing:

| File | Description |
|------|-------------|
| `public/hero.jpg` | Hero background — dark photo that suits the business (1920×1080). Works best with people, interiors, or product shots. |
| `public/about.jpg` | About section image — team photo, workspace, or product (aspect 4:3 or square) |
| `public/og-image.png` | OG social card (1200×630) |

If images aren't ready, the placeholder files will work temporarily.

---

## Step 6 — External Services (if active)

### Contact Form (Resend)
If `app/api/contact/route.ts` exists:
1. Get a Resend API key at resend.com
2. Set `RESEND_API_KEY` in `.env.local`
3. Confirm `TO_EMAIL` in the route points to the right email
4. Verify your sending domain or use the Resend sandbox for testing

---

## Step 7 — Verify

```bash
npm run lint
npm run build
npm run dev
```

Visual checklist after `npm run dev`:
- [ ] Navbar: logo, links, language switcher (if i18n), CTA button all correct
- [ ] Hero: headline, tagline, CTAs, stats all correct; background image loads
- [ ] About: image loads, text and stats correct; accent color matches
- [ ] Services: all 6 cards render with correct icons, titles, descriptions
- [ ] Reviews: all testimonials render with correct stars, names, roles
- [ ] FAQ: accordion opens/closes; all Q&A correct
- [ ] Contact: form submits (or shows TODO if Resend not yet configured); phone/WhatsApp/email links work; address links to Google Maps
- [ ] Footer: all info correct; nav links scroll to correct sections
- [ ] FloatingCTA (if active): visible on mobile; Call/WhatsApp/Book links work
- [ ] No `YOUR_*` strings visible anywhere

Final commit when clean:
```
feat: initial business site customization — [Business Name]
```

---

## Notes for Claude

- Follow ALL Tailwind v4 conventions from `CLAUDE.md` — no arbitrary values where canonical classes exist
- Never modify `.env` or `.env.*` files
- Always update both `en.json` and `pt.json` if i18n is active
- The Navbar in business sites reads links from `dict.navbar.links[]` — the array in the dict controls the nav items
- `React.FormEvent` deprecated in React 19 — use `{ preventDefault(): void }`
- The `about.jpg` image is separate from `hero.jpg` and `profile.jpg`
- When replacing the accent color, be consistent — search all business components for every shade (50, 100, 500, 600, 700)
