# launchkit

Next.js 16 project generator — creates standalone sites from templates with configurable features.

## Templates

- **Portfolio** — WebGL hero, sidebar, chatbot, project gallery, testimonials, contact form
- **Business Site** — hero, services, reviews, FAQ, contact, footer, FloatingCTA
- **Blank** — minimal scaffold, clean starting point

## Quick Start

```bash
git clone <repo-url> launchkit && cd launchkit
node scripts/setup.js --name my-site --output ../
# or skip type prompt:
node scripts/setup.js --name my-site --output ../ --portfolio
```

Then in the generated project: copy `.env.example` → `.env.local`, paste the relevant `BOOTSTRAP.md` into Claude Code, replace placeholder images, `npm run dev`.

## Scripts

All scripts support `--help`. Run from the launchkit directory.

```bash
node scripts/setup.js --name <name> --output <dir> [--portfolio|--business|--blank]
node scripts/toggle.js --project <path>     # enable/disable features
node scripts/status.js --project <path>     # view feature state
node scripts/validate.js --project <path>   # check placeholders + TODOs
node scripts/reset.js --project <path>      # strip back to base scaffold
```

See [SETUP.md](SETUP.md) for the full guide and [CLAUDE.md](CLAUDE.md) for architecture reference.
