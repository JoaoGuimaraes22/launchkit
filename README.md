# launchkit

A production-ready bootstrapper for multiple site types — personal portfolio and local business website — built with Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, and Framer Motion. Designed to grow: each template is a self-contained unit under `templates/[type]/`, making it easy to add new site types.

## Project Types

```text
node scripts/setup.js
  → [1] Portfolio    — personal showcase with WebGL hero, sidebar, chatbot, project gallery
  → [2] Business     — local business site with hero, services, reviews, FAQ, contact, footer
```

### Portfolio

Pre-built components for a personal portfolio:

- WebGL shader hero with animated blobs and parallax
- Bilingual i18n routing (`/en`, `/pt`)
- Infinite-scroll testimonials, 2×2 services grid with modals
- Project gallery with detail pages and screenshot gallery
- Sticky profile sidebar
- Dialogflow ES chatbot
- Resend contact form
- SEO: OG/Twitter metadata, JSON-LD Person schema, sitemap, robots.txt

### Business Site

Pre-built generic components for any local business (restaurant, clinic, salon, plumber, mechanic, etc.):

- Hero with background image, two-line headline, stats, and dual CTAs
- About section with image and stat cards
- Services grid (6 cards with emoji icons)
- Reviews with star ratings and avatars
- FAQ accordion
- Contact form (Resend) + contact info column
- Footer (3-column: brand / nav / contact)
- FloatingCTA mobile bar (Call / WhatsApp / Book)
- Bilingual i18n routing (optional)
- SEO: OG/Twitter metadata, JSON-LD LocalBusiness schema, sitemap, robots.txt

## Quick Start

```bash
git clone https://github.com/YOUR_GITHUB/launchkit my-project
cd my-project
npm install
npm run setup           # interactive: select project type + features
```

Skip the type prompt with a shorthand:

```bash
npm run setup:portfolio   # go straight to portfolio feature selection
npm run setup:business    # go straight to business site feature selection
```

Then paste the relevant bootstrap file into a Claude Code conversation:

- **Portfolio** → `templates/portfolio/BOOTSTRAP.md`
- **Business Site** → `templates/business/BOOTSTRAP.md`

To enable or disable features after setup:

```bash
npm run toggle    # enable/disable individual features without a full reset
npm run status    # print current template type and active feature state
npm run validate  # check for unreplaced placeholders, TODOs, and default images
npm run check     # pre-deploy gate: validate → lint → build
```

See `SETUP.md` for the full setup guide and `CLAUDE.md` for architecture reference.
