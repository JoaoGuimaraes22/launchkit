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
3. Template type:
   - `business` — local business (services, reviews, FAQ, contact)
   - `restaurant` — dining venue (dark hero, menu, scrolling reviews, map)
4. Niche profile (optional — pre-fills content):
   - `hvac` — HVAC / heating & cooling (business only)
   - `cleaning` — commercial & residential cleaning (business only)
   - `landscaping` — landscaping & lawn care (business only)
   - `restaurant` — restaurant / café (restaurant only)
   - `none` — generic (fill in manually)
5. Language(s): `en` / `pt` / `en+pt`
6. Accent color: indigo (default), blue, violet, rose, amber, emerald, cyan, orange

## Step 2 — Generate the project

Build the `--answers` JSON from Step 1 choices, then run:

```bash
cd /home/sebas/dev/projects/launchkit
node scripts/setup.js \
  --name <name> \
  --output <output-dir> \
  --<template> \
  --preset <template> \
  --answers '{"languages":"<lang>","accentColor":"<color>"}'
```

Examples:
```bash
# Business with HVAC niche, English only, indigo
node scripts/setup.js --name joeshvac --output ../clients --business --preset business --answers '{"languages":"en","accentColor":"indigo"}'

# Restaurant, bilingual, amber
node scripts/setup.js --name marias --output ../clients --restaurant --preset restaurant --answers '{"languages":"en+pt","accentColor":"amber"}'
```

## Step 3 — Personalize content

If a niche profile was chosen:
```bash
node scripts/personalize.js --project <output-dir>/<name> --profile configs/niche-profiles/<niche>.json
```

Then run interactive personalize to fill in real client details (business name, phone, email, address, WhatsApp, domain):
```bash
node scripts/personalize.js --project <output-dir>/<name>
```

## Step 4 — Add upsell sections (optional)

Ask: "Would you like to add any extra sections now?"

Show the relevant sections for the template type. For the full list with pricing and setup instructions, use `/add-upsell <project-path>`.

Quick picks for **business** clients:
- Floating CTA (call/WhatsApp/book bar on mobile)
- Google Reviews CTA
- Booking (Calendly)
- Stats Counters

Quick picks for **restaurant** clients (if not using the restaurant preset, which includes most of these):
- Stats Counters
- Gallery Strip
- Pricing Cards
- Google Reviews CTA
- Reservation Modal
- Floating CTA

For each selected:
```bash
node scripts/sections.js --project <output-dir>/<name> --add <section> --variant <variant> --yes
```

After adding sections, re-run personalize to pick up any new `YOUR_*` tokens:
```bash
node scripts/personalize.js --project <output-dir>/<name>
```

## Step 5 — Validate & Build

```bash
node scripts/validate.js --project <output-dir>/<name>
cd <output-dir>/<name> && npm run lint && npm run build
```

Fix any remaining `YOUR_*` placeholders or build errors before deploying.

## Step 6 — Deploy

```bash
cd /home/sebas/dev/projects/launchkit
node scripts/deploy.js --project <output-dir>/<name>
```

Requires Vercel CLI (`npm i -g vercel && vercel login`) or Netlify CLI. If not available, skip and note the manual deploy step.

## Step 7 — Generate outreach email

Ask: which template?
1. Straight shooter
2. Local play
3. The compliment

Then generate the email filled in with the client's real name and the live URL. See `/outreach-email` for the full templates.

## Step 8 — Remind about remaining work

- [ ] Replace `public/hero.jpg` (1920×1080) and `public/about.jpg` (4:3) with real photos
- [ ] Create `.env.local` from `.env.example` — fill in required values
- [ ] If booking section added: set `YOUR_CALENDLY_URL` in dictionaries
- [ ] If google-reviews added: set `YOUR_GOOGLE_REVIEW_URL` in dictionaries
- [ ] If reservation added: set `YOUR_FORMSPREE_ID` in dictionaries
- [ ] If contact/map added: set `YOUR_MAPS_EMBED_URL` and `YOUR_MAPS_DIRECTIONS_URL` in dictionaries
- [ ] Run `node scripts/validate.js --project <path>` to confirm no remaining placeholders
- [ ] Run `npm run lint && npm run build` for a clean build

---

**Test prompts:**
1. `/new-client` — walks through the full flow interactively
2. "Build a site for Joe's HVAC, put it in ../clients/" — triggers this skill with context
3. "Start a new restaurant site for Maria's Kitchen" — triggers this skill
