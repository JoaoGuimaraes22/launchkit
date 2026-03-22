---
description: Shows the health status of a launchkit client project: remaining placeholders, installed sections, deploy URL, missing images, and environment setup. Use when checking what's left before a site is ready to deliver, before a client handoff, or to debug issues. Triggers on: "client status", "check the project", "what's left to do", "validate the site", "is the site ready", "project health".
argument-hint: <project-path>
allowed-tools: [Bash, Read]
---

# Client Project Status

Launchkit root: `/home/sebas/dev/projects/launchkit`

## Step 1 — Resolve project path

If not provided, ask: "Which client project?"

## Step 2 — Run checks

Run all checks, capture output:

```bash
cd /home/sebas/dev/projects/launchkit
node scripts/validate.js --project <path>
```

```bash
cd /home/sebas/dev/projects/launchkit
node scripts/status.js --project <path>
```

Also check:
- Does `<path>/client-profile.json` exist?
- Does `<path>/.env.local` exist?
- Read `<path>/.launchkit` → get `features.deployUrl`

## Step 3 — Output a clean summary

Format the output as a status board:

```
─── Client: [BUSINESS NAME or project name] ──────────────────────

  Placeholders    ✓ none remaining   |  ✗ 3 remaining (list them)
  Images          ✓ replaced         |  ✗ hero.jpg still default
  .env.local      ✓ exists           |  ✗ missing (cp .env.example .env.local)
  client-profile  ✓ exists           |  ✗ not yet created
  Deploy URL      https://...        |  ✗ not deployed yet

─── Installed sections ───────────────────────────────────────────

  [list from status.js output]

─── Next steps ───────────────────────────────────────────────────

  [only list items that are ✗]
```

Keep it scannable. ✓ items are done — don't explain them. Focus output on what still needs doing.

---

**Test prompts:**
1. `/client-status ../clients/joeshvac` — full health check on a project
2. "Check if the site is ready to go live" — triggers this skill
3. "What's still left to do on the cleaning company site?" — triggers this skill
