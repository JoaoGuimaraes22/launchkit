# next-portfolio-template

A production-ready bootstrapper for two types of sites — personal portfolio and local business website — built with Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, and Framer Motion.

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
git clone https://github.com/YOUR_GITHUB/next-portfolio-template my-project
cd my-project
npm install
node scripts/setup.js   # select project type and features
```

Then paste the relevant bootstrap file into a Claude Code conversation:

- **Portfolio** → `BOOTSTRAP.md`
- **Business Site** → `templates/business/BOOTSTRAP-BUSINESS.md`

See `SETUP.md` for the full setup guide and `CLAUDE.md` for architecture reference.
