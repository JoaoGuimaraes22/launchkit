---
description: Generates a personalized cold outreach email for a prospect using one of three proven templates from the agency playbook. Fills in real client details from the project's client-profile.json and live URL from .launchkit. Use when ready to contact a prospect with a free website deliverable. Triggers on: "outreach email", "write an email to the client", "cold email", "prospect email", "contact the business", "send the site".
argument-hint: <project-path>
allowed-tools: [Read, Bash]
---

# Outreach Email Generator

## Step 1 — Read project data

Read `<project-path>/client-profile.json` for business name.
Read `<project-path>/.launchkit` for `features.deployUrl`.

If either is missing, ask the user for the business name and live URL.

## Step 2 — Choose template

Ask: "Which email style?"
1. Straight shooter — direct, no fluff
2. Local play — emphasizes being in the same city
3. The compliment — leads with a specific compliment + one quick win observation

## Step 3 — Generate the email

Fill in `[BUSINESS]`, `[OWNER]` (ask if unknown), `[YOUR_NAME]`, `[CITY]` (ask if needed), `[LINK]` with the live URL.

---

### Template 1 — Straight shooter

**Subject:** built you a new website (it's free)

Hey [OWNER],

I'm [YOUR_NAME]. I came across [BUSINESS] and thought your website could be doing more for you.

So I built you a new one. Here it is: [LINK]

It's yours — completely free. I'm building my portfolio and your business stood out.

If you want me to fine-tune anything, just ping back with changes and I'll sort it. Or happy to jump on a 10-min call to dial it in for you.

[YOUR_NAME]

P.S. It's mobile-friendly and ready to go live whenever you are.

---

### Template 2 — Local play

**Subject:** also in [CITY] — made you something

Hey [OWNER],

I'm [YOUR_NAME], also based here in [CITY]. I've been working with local businesses on their web presence.

Checked out [BUSINESS] and your online presence doesn't match the quality of what you actually do. So I built you a new site — free. Take a look: [LINK]

No catch. Just building experience with businesses I rate.

[YOUR_NAME]

P.S. I've been building websites and digital systems for several years — just so you know this isn't random.

---

### Template 3 — The compliment

**Subject:** your website undersells you — so I fixed it

Hi [OWNER],

Been looking at [NICHE] businesses in [CITY] and [BUSINESS] stood out — [SPECIFIC_COMPLIMENT, e.g. "your Google reviews are consistently excellent"].

One thing I noticed: your website undersells you. So I built you a new one for free: [LINK]

Let me know what you think — happy to tweak anything in a quick 15-min call.

[YOUR_NAME]

P.S. I also spotted [ONE_QUICK_WIN, e.g. "your Google Business Profile is missing opening hours — easy fix that helps with local search"].

---

## Step 4 — Output

Print the complete, filled-in email ready to copy-paste. Include the subject line.

If `[OWNER]` or `[CITY]` were unknown, print them as `[OWNER NAME]` / `[YOUR CITY]` so the user knows what to fill in manually.

---

**Test prompts:**
1. `/outreach-email ../clients/joeshvac` — generates email from project data
2. "Write an outreach email for the HVAC site" — triggers this skill
3. "Draft a cold email to send with the cleaning company site" — triggers this skill
