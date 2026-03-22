---
description: Replaces YOUR_* placeholders in a launchkit-generated client project with real business content. Use when a project has been generated but not personalized, after adding new sections that introduce new placeholders, or to update existing client details. Triggers on: "personalize", "fill in placeholders", "replace YOUR_", "inject client content", "update client details".
argument-hint: <project-path> [--profile <client.json>]
allowed-tools: [Bash, Read]
---

# Personalize a Client Project

Launchkit root: `/home/sebas/dev/projects/launchkit`

## Step 1 — Resolve project path

If not provided as an argument, ask: "Which project? Provide the path."

Check if `client-profile.json` exists in the project root:
```bash
ls <project-path>/client-profile.json 2>/dev/null && echo "profile found" || echo "no profile"
```

If found, show the current saved values so the user knows what's already set.

## Step 2 — Run personalize

**If a `--profile` JSON was provided:**
```bash
cd /home/sebas/dev/projects/launchkit
node scripts/personalize.js --project <project-path> --profile <json-path>
```

**Otherwise (interactive):**
```bash
cd /home/sebas/dev/projects/launchkit
node scripts/personalize.js --project <project-path>
```

The script is idempotent — already-replaced fields show `[skip]`, safe to re-run.

## Step 3 — Show remaining work

```bash
cd /home/sebas/dev/projects/launchkit
node scripts/validate.js --project <project-path>
```

Summarize what's still left: remaining `YOUR_*` tokens, missing images, missing `.env.local`.

## Step 4 — Remind about section-specific placeholders

These are NOT caught by personalize.js (they live inside component files as constants):

| Token | File |
|---|---|
| `YOUR_CALENDLY_URL` | `app/[locale]/components/Booking.tsx` |
| `YOUR_GOOGLE_REVIEW_URL` | `app/[locale]/components/GoogleReviews.tsx` |

Offer to open those files if the user wants to set them now.

---

**Note:** After adding new sections via `sections.js`, always re-run personalize — new sections may introduce additional `YOUR_*` tokens in their component files.

---

**Test prompts:**
1. `/personalize-client ../clients/joeshvac` — personalize a specific project
2. "Fill in the placeholders for the HVAC site" — triggers this skill
3. `/personalize-client ../clients/joeshvac --profile scraped-data.json` — batch inject from JSON
