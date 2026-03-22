---
description: Runs the full launchkit agency workflow to create and launch a new client website from scratch. Use when starting a new client project, building a site for a prospect, or generating a business site to send as a free deliverable. Triggers on: "new client", "create a client site", "build a site for", "start a project for", "new business site".
argument-hint: [client-name] [output-dir]
allowed-tools: [Bash, Read, Write]
---

# New Client — Full Agency Loop

Launchkit root: `/home/sebas/dev/projects/launchkit`

Work through each step in order. Check off as you go.

## Step 1 — Gather details

Ask the user (one message):
1. Client/project name (used as the folder name — no spaces, e.g. `joeshvac`)
2. Output directory (where to create the project, e.g. `../clients/`)
3. Niche — show the available starter profiles:
   - `hvac` — HVAC / heating & cooling
   - `cleaning` — commercial & residential cleaning
   - `landscaping` — landscaping & lawn care
   - `none` — generic business (fill in manually)
4. Language(s): English only / Portuguese only / English + Portuguese

## Step 2 — Generate the project

```bash
cd /home/sebas/dev/projects/launchkit
node scripts/setup.js --name <name> --output <output-dir> --business
```

Follow the prompts: accent color, language(s).

## Step 3 — Personalize content

If a niche profile was chosen:
```bash
node scripts/personalize.js --project <output-dir>/<name> --profile configs/niche-profiles/<niche>.json
```

Then run interactive personalize to fill in the real client details (business name, phone, email, address, WhatsApp, domain):
```bash
node scripts/personalize.js --project <output-dir>/<name>
```

## Step 4 — Add upsell sections (optional)

Ask: "Would you like to add any of these sections now?"

- [ ] **Booking** (`$50–300/mo`) — Calendly appointment embed
- [ ] **Google Reviews CTA** (`$50–300/mo`) — review generation button

For each selected:
```bash
node scripts/sections.js --project <output-dir>/<name> --add booking --variant calendly --yes
node scripts/sections.js --project <output-dir>/<name> --add google-reviews --yes
```

After adding sections, re-run personalize to pick up any new `YOUR_*` tokens:
```bash
node scripts/personalize.js --project <output-dir>/<name>
```

## Step 5 — Deploy

```bash
node scripts/deploy.js --project <output-dir>/<name>
```

Requires Vercel CLI (`npm i -g vercel && vercel login`) or Netlify CLI. If not available, skip and note the manual deploy step.

## Step 6 — Generate outreach email

Ask: which template?
1. Straight shooter
2. Local play
3. The compliment

Then generate the email filled in with the client's real name and the live URL. See `/outreach-email` for the full templates.

## Step 7 — Remind about remaining work

- [ ] Replace `public/hero.jpg` (1920×1080) and `public/about.jpg` (4:3) with real photos
- [ ] Create `.env.local` from `.env.example` — add `RESEND_API_KEY` for contact form
- [ ] If booking section added: set `YOUR_CALENDLY_URL` in `app/[locale]/components/Booking.tsx`
- [ ] If google-reviews added: set `YOUR_GOOGLE_REVIEW_URL` in `app/[locale]/components/GoogleReviews.tsx`
- [ ] Run `node scripts/validate.js --project <path>` to confirm no remaining placeholders

---

**Test prompts:**
1. `/new-client` — walks through the full flow interactively
2. "Build a site for Joe's HVAC, put it in ../clients/" — triggers this skill with context
3. "Start a new client project" — triggers this skill
