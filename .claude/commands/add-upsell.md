---
description: Adds MRR upsell sections to an existing launchkit client project and guides through the post-install setup for each. Use when a client has accepted the free deliverable and is ready to pay for add-on services, or when pitching recurring revenue services. Triggers on: "add upsell", "add sections", "upsell the client", "add booking", "add chatbot", "add google reviews", "monthly services".
argument-hint: <project-path>
allowed-tools: [Bash, Read, Write]
---

# Add Upsell Sections

Launchkit root: `/home/sebas/dev/projects/launchkit`

## Available upsell sections

Present this menu. User can pick any combination. Check the project's `.launchkit` file for `type` to know which template is in use.

### Universal (any template)

| # | Section | MRR | What it does |
|---|---------|-----|--------------|
| 1 | **Booking** (Calendly) | $50–300/mo | Inline appointment scheduling embed |
| 2 | **Google Reviews CTA** | $50–300/mo | Star display + "Leave a review" button |
| 3 | **Stats Counters** | $30–100/mo | Animated number counters (RAF-eased) |
| 4 | **Gallery Strip** | $30–100/mo | Autoscrolling photo strip |
| 5 | **Reviews** (scrolling) | incl. | Scrolling multi-column testimonial cards (replaces default grid) |

### Business + Restaurant

| # | Section | MRR | What it does |
|---|---------|-----|--------------|
| 6 | **Floating CTA** | incl. with site | Fixed mobile bar: call / WhatsApp / book |
| 7 | **Pricing Cards** | $50–200/mo | 3-column pricing with feature lists |
| 8 | **Reservation Modal** (Formspree) | $50–200/mo | Full-screen booking with calendar + time slots |
| 9 | **Reserve Bar** | incl. with reservation | Mobile sticky CTA bar for reserve/order |
| 10 | **Contact Map** | incl. | Replaces Contact with Google Maps iframe + info |
| 11 | **Menu** (tabbed) | $50–150/mo | Tabbed category menu with highlight card |
| 12 | **Schedule** (weekly) | $50–150/mo | 7-day timetable grid + mobile accordion |
| 13 | **Team Spotlight** | $30–100/mo | 2-col parallax image with glassmorphic stats |

### Other

| # | Section | MRR | What it does |
|---|---------|-----|--------------|
| 14 | **AI Chatbot** (Dialogflow) | $50–500/mo | Lead capture chatbot with FAQ responses |
| 15 | **Parallax Hero** | incl. with site | rAF-throttled parallax background on hero |
| 16 | **WebGL Hero** | incl. with site | Shader-based animated hero effect |

## Step 1 — Resolve project path

If not provided, ask: "Which client project?" Read `.launchkit` to determine template type and already-installed sections.

## Step 2 — Add selected sections

Run each selected section. Use `--yes` to skip confirmation prompts:

**Booking:**
```bash
cd /home/sebas/dev/projects/launchkit
node scripts/sections.js --project <path> --add booking --variant calendly --yes
```
Post-install: set `YOUR_CALENDLY_URL` in dictionaries (`en.json` + `pt.json` if bilingual)

**Google Reviews:**
```bash
node scripts/sections.js --project <path> --add google-reviews --yes
```
Post-install: set `YOUR_GOOGLE_REVIEW_URL` in dictionaries
→ Get URL from: Google Maps → business profile → "Get more reviews" → copy link

**Stats Counters:**
```bash
node scripts/sections.js --project <path> --add stats --variant counters --yes
```
Post-install: update `statsCounters.items` in dictionaries with real stats (target number, label, suffix)

**Gallery Strip:**
```bash
node scripts/sections.js --project <path> --add gallery-strip --yes
```
Post-install: add 6 photos to `public/gallery/` named `1.jpg` through `6.jpg`

**Reviews (scrolling):**
```bash
node scripts/sections.js --project <path> --add reviews --variant scrolling --yes
```
Post-install: replaces the default static grid Reviews with scrolling multi-column. No extra config needed.

**Floating CTA:**
```bash
node scripts/sections.js --project <path> --add floating-cta --yes
```
Post-install: update `cta` dict key with correct phone, WhatsApp number, and button labels

**Pricing Cards:**
```bash
node scripts/sections.js --project <path> --add pricing --variant cards --yes
```
Post-install: update `pricing.plans` in dictionaries with real plan names, prices, features

**Reservation Modal (pairs with Reserve Bar):**
```bash
node scripts/sections.js --project <path> --add reservation --variant formspree --yes
```
Post-install: set `YOUR_FORMSPREE_ID` in dictionaries
→ Get ID from: formspree.io → create form → copy form ID from endpoint URL

**Reserve Bar (pairs with Reservation):**
```bash
node scripts/sections.js --project <path> --add reserve-bar --yes
```
Post-install: set `YOUR_ORDER_URL` in dictionaries under `reserveBar.order_url`

**Contact Map:**
```bash
node scripts/sections.js --project <path> --add contact --variant map --yes
```
Post-install: set `YOUR_MAPS_EMBED_URL` and `YOUR_MAPS_DIRECTIONS_URL` in dictionaries
→ Get embed URL: Google Maps → Share → Embed a map → copy the `src` from the iframe
→ Get directions URL: Google Maps → Directions → copy the URL

**Menu (tabbed):**
```bash
node scripts/sections.js --project <path> --add menu --variant tabbed --yes
```
Post-install: update `menu.categories` in dictionaries with real items and prices

**Schedule (weekly):**
```bash
node scripts/sections.js --project <path> --add schedule --variant weekly --yes
```
Post-install: update `schedule` dict key with real day/time slots

**Team Spotlight:**
```bash
node scripts/sections.js --project <path> --add team --variant spotlight --yes
```
Post-install: update `team` dict key with real name, stats, tags, quote. Add team photo.

**Chatbot (Dialogflow):**
```bash
node scripts/sections.js --project <path> --add chatbot --yes
```
Post-install: add to `.env.local`:
- `GOOGLE_CREDENTIALS` — single-line JSON from Dialogflow service account
- `DIALOGFLOW_PROJECT_ID` — found in Dialogflow console settings

**Parallax Hero:**
```bash
node scripts/sections.js --project <path> --add hero --variant parallax --yes
```
No post-install needed — uses existing `public/hero.jpg`

**WebGL Hero:**
```bash
node scripts/sections.js --project <path> --add hero --variant webgl --yes
```
No post-install needed.

## Step 3 — Re-run personalize

New sections may introduce additional `YOUR_*` tokens:
```bash
cd /home/sebas/dev/projects/launchkit
node scripts/personalize.js --project <path>
```

## Step 4 — Validate & Re-deploy

```bash
node scripts/validate.js --project <path>
cd <path> && npm run lint && npm run build
cd /home/sebas/dev/projects/launchkit
node scripts/deploy.js --project <path>
```

## Step 5 — Pricing guidance

If the user asks about pricing:
- Start under $300/mo total to get the first yes
- Month-to-month, no long contracts
- Increase prices after 3+ satisfied paying clients

---

**Test prompts:**
1. `/add-upsell ../clients/joeshvac` — shows the upsell menu for a project
2. "The client wants to add online booking" — triggers this skill
3. "Add chatbot and google reviews to the cleaning company site" — triggers this skill
