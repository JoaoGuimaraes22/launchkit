# Portfolio Template — Setup Guide

A Next.js 16 App Router portfolio template with configurable features and Claude-assisted content bootstrapping.

## Stack

- **Next.js 16** App Router · **React 19** · **TypeScript** strict
- **Tailwind CSS v4** · **Framer Motion** · **Geist** fonts
- **i18n**: `/en` + `/pt` routing (optional)
- **Chatbot**: Dialogflow ES (optional)
- **Contact form**: Resend (optional)

---

## Quick Start

### 1. Clone the template

On GitHub click **"Use this template"**, or:

```bash
git clone https://github.com/YOUR_GITHUB/next-portfolio-template my-portfolio
cd my-portfolio
npm install
```

### 2. Run the setup script

```bash
node scripts/setup.js
```

Answer `y/n` for each of the 7 feature layers:

| Feature | What it does |
|---------|-------------|
| **i18n** | Bilingual routing (`/en`, `/pt`), LanguageSwitcher, locale dictionaries |
| **WebGL Hero** | Full-screen WebGL shader hero with animated blobs and mouse tracking |
| **Chatbot** | Dialogflow ES chat widget + `/api/chat` proxy route |
| **Contact Form** | Resend email sender + `/api/contact` route |
| **Testimonials** | Infinite-scroll testimonial columns |
| **Work** | Project gallery + individual project detail pages |
| **ProfileSidebar** | Sticky desktop sidebar with photo, bio, social links |

The script removes files for disabled features, patches imports, and generates a trimmed `.env.example`.

### 3. Set up environment variables

```bash
cp .env.example .env.local
# Fill in the values — see comments in .env.example
```

### 4. Bootstrap content with Claude

Paste `BOOTSTRAP.md` into a new **Claude Code** conversation. Claude will:
- Ask for your name, title, tagline, email, social links, and stats
- Ask for project/testimonials/services/bio content
- Fill in all dictionary files and component metadata
- Handle any TypeScript refactors (e.g., i18n routing collapse)
- Walk you through Dialogflow and Resend setup if enabled

### 5. Replace placeholder images

| File | Description |
|------|-------------|
| `public/hero.jpg` | Hero background — dark photo works best (1920×1080) |
| `public/profile.jpg` | Your profile photo — square crop |
| `public/og-image.png` | OG social card (1200×630) |
| `public/projects/[slug]/1-3.png` | Screenshots per project |

### 6. Preview and deploy

```bash
npm run dev      # http://localhost:3000
npm run build    # verify clean build
npm run lint     # check for lint errors
```

Deploy to [Vercel](https://vercel.com) — connect your repo and add the env vars from `.env.local`.

---

## External Service Setup

### Dialogflow Chatbot (if enabled)

1. Create an agent at [console.dialogflow.com](https://console.dialogflow.com)
2. In Google Cloud Console: create a service account with **Dialogflow API Client** role, download JSON key
3. Set `GOOGLE_CREDENTIALS` (single-line JSON) and `DIALOGFLOW_PROJECT_ID` in `.env.local`
4. Seed intents: `node dialogflow/zip.js` → import `dialogflow/portfolio-agent.zip` into Dialogflow
5. Edit `dialogflow/intents/` to match your actual FAQ answers

### Resend Contact Form (if enabled)

1. Sign up at [resend.com](https://resend.com)
2. Set `RESEND_API_KEY` in `.env.local`
3. Verify your sending domain (or use the sandbox for testing)
4. Update `TO_EMAIL` in `app/[locale]/api/contact/route.ts`

---

## Grep for Placeholders

After bootstrapping, verify no placeholders remain:

```bash
grep -r "YOUR_" app dictionaries --include="*.ts" --include="*.tsx" --include="*.json"
grep -r "TODO: TEMPLATE" app --include="*.ts" --include="*.tsx"
```

---

## Architecture Reference

See `CLAUDE.md` for full stack documentation, design patterns, Tailwind v4 conventions, and file structure.
