---
description: Adds MRR upsell sections to an existing launchkit client project and guides through the post-install setup for each. Use when a client has accepted the free deliverable and is ready to pay for add-on services, or when pitching recurring revenue services. Triggers on: "add upsell", "add sections", "upsell the client", "add booking", "add chatbot", "add google reviews", "monthly services".
argument-hint: <project-path>
allowed-tools: [Bash, Read, Write]
---

# Add Upsell Sections

Launchkit root: `/home/sebas/dev/projects/launchkit`

## Available upsell sections

Present this menu. User can pick any combination.

| # | Section | MRR | What it does | Templates |
|---|---------|-----|--------------|-----------|
| 1 | **Booking** (Calendly) | $50–300/mo | Inline appointment scheduling embed | any |
| 2 | **Google Reviews CTA** | $50–300/mo | Star display + "Leave a review" button | any |
| 3 | **AI Chatbot** (Dialogflow) | $50–500/mo | Lead capture chatbot with FAQ responses | portfolio |
| 4 | **Reservation Modal** (Formspree) | $50–200/mo | Full-screen table booking with calendar + time slots | business |
| 5 | **Reserve Bar** | incl. with reservation | Mobile sticky CTA bar that opens the reservation modal | business |
| 6 | **Menu** (tabbed) | $50–150/mo | Tabbed category menu with highlight card | business |
| 7 | **Gallery Strip** | $30–100/mo | Autoscrolling photo strip (add to any section) | any |
| 8 | **Parallax Hero** | incl. with site | rAF-throttled parallax background effect on hero | business |

## Step 1 — Resolve project path

If not provided, ask: "Which client project?"

## Step 2 — Add selected sections

Run each selected section. Use `--yes` to skip confirmation prompts:

**Booking:**
```bash
cd /home/sebas/dev/projects/launchkit
node scripts/sections.js --project <path> --add booking --variant calendly --yes
```
Post-install: set `YOUR_CALENDLY_URL` in `app/[locale]/components/Booking.tsx`
→ Get the URL from: calendly.com → your event → copy scheduling link

**Google Reviews:**
```bash
cd /home/sebas/dev/projects/launchkit
node scripts/sections.js --project <path> --add google-reviews --yes
```
Post-install: set `YOUR_GOOGLE_REVIEW_URL` in `app/[locale]/components/GoogleReviews.tsx`
→ Get the URL from: Google Maps → business profile → "Get more reviews" → copy link

**Chatbot:**
```bash
cd /home/sebas/dev/projects/launchkit
node scripts/sections.js --project <path> --add chatbot --yes
```
Post-install: add to `.env.local`:
- `GOOGLE_CREDENTIALS` — single-line JSON from Dialogflow service account
- `DIALOGFLOW_PROJECT_ID` — found in Dialogflow console settings

**Reservation Modal (business only):**
```bash
cd /home/sebas/dev/projects/launchkit
node scripts/sections.js --project <path> --add reservation --variant formspree --yes
```
Post-install: set `YOUR_FORMSPREE_ID` in `app/[locale]/components/Reservation.tsx`
→ Get the ID from: formspree.io → create form → copy form ID from the endpoint URL

**Reserve Bar (business only — pairs with reservation):**
```bash
cd /home/sebas/dev/projects/launchkit
node scripts/sections.js --project <path> --add reserve-bar --yes
```
Post-install: set `YOUR_ORDER_URL` in `dictionaries/en.json` (and `pt.json`) under `reserveBar.order_url`

**Menu (business only):**
```bash
cd /home/sebas/dev/projects/launchkit
node scripts/sections.js --project <path> --add menu --variant tabbed --yes
```
Post-install: update `dictionaries/en.json` (and `pt.json`) under `menu.categories` with real items and prices

**Gallery Strip:**
```bash
cd /home/sebas/dev/projects/launchkit
node scripts/sections.js --project <path> --add gallery-strip --yes
```
Post-install: add 6 photos to `public/gallery/` named `1.jpg` through `6.jpg`

**Parallax Hero (business only):**
```bash
cd /home/sebas/dev/projects/launchkit
node scripts/sections.js --project <path> --add parallax-hero --yes
```
No post-install needed — uses the existing `public/hero.jpg`

## Step 3 — Re-run personalize

New sections may introduce additional `YOUR_*` tokens:
```bash
cd /home/sebas/dev/projects/launchkit
node scripts/personalize.js --project <path>
```

## Step 4 — Re-deploy

```bash
cd /home/sebas/dev/projects/launchkit
node scripts/deploy.js --project <path>
```

## Step 5 — Pricing guidance

If the user asks about pricing, reference the playbook:
- Start under $300/mo total to get the first yes
- Month-to-month, no long contracts
- Increase prices after 3+ satisfied paying clients

---

**Test prompts:**
1. `/add-upsell ../clients/joeshvac` — shows the upsell menu for a project
2. "The client wants to add online booking" — triggers this skill
3. "Add chatbot and google reviews to the cleaning company site" — triggers this skill
