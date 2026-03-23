# Claude Code Rules

@BOOTSTRAP.md

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Minimal code, minimal impact.
- **No Temporary Fixes**: Find root causes. Senior developer standards.
- **Verify Before Done**: Run `npm run lint && npm run build` after every batch of changes.
- **Plan First**: Enter plan mode for any non-trivial task (3+ steps or architectural decisions).

## Commands

```bash
npm run lint      # ESLint check
npm run build     # production build — ALWAYS run before delivery
npm run dev       # dev server with hot reload
```

## Key Rules

- Always update **both** `dictionaries/en.json` AND `dictionaries/pt.json` if both exist
- Never modify `.env` or `.env.*` files directly — tell the user what values to set
- Dict keys are the single source of truth for all visible text — never hardcode strings in components
- The Navbar reads links from `dict.navbar.links[]` — the dict array controls nav items
- Run lint + build after every batch of changes — don't accumulate errors
- Check `.launchkit` to understand project type, installed sections, and features
