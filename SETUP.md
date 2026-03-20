# launchkit — Setup Guide

A Next.js 16 App Router multi-template bootstrapper with configurable features and Claude-assisted content setup.

## Stack

- **Next.js 16** App Router · **React 19** · **TypeScript** strict
- **Tailwind CSS v4** · **Framer Motion** · **Geist** fonts
- **i18n**: `/en` + `/pt` routing (optional)
- **Chatbot**: Dialogflow ES (optional, portfolio only)
- **Contact form**: Resend (optional)

---

## Quick Start

### 1. Clone the template

On GitHub click **"Use this template"**, or:

```bash
git clone https://github.com/YOUR_GITHUB/launchkit my-project
cd my-project
npm install
```

### 2. Run the setup script

```bash
node scripts/setup.js
```

Select your project type, then answer `y/n` for each feature:

**Portfolio features:**

| Feature | What it does |
|---------|-------------|
| **i18n** | Bilingual routing (`/en`, `/pt`), LanguageSwitcher, locale dictionaries |
| **WebGL Hero** | Full-screen WebGL shader hero with animated blobs and mouse tracking |
| **Chatbot** | Dialogflow ES chat widget + `/api/chat` proxy route |
| **Contact Form** | Resend email sender + `/api/contact` route |
| **Testimonials** | Infinite-scroll testimonial columns |
| **Work** | Project gallery + individual project detail pages |
| **ProfileSidebar** | Sticky desktop sidebar with photo, bio, social links |

**Business Site features:**

| Feature | What it does |
|---------|-------------|
| **i18n** | Bilingual routing (`/en`, `/pt`), LanguageSwitcher, locale dictionaries |
| **Contact Form** | Resend email sender + `/api/contact` route |
| **FloatingCTA** | Fixed mobile bottom bar with Call / WhatsApp / Book buttons |
| **WhatsApp button** | WhatsApp link in FloatingCTA and contact section |

The script copies the selected template into `app/`, applies feature removals, and generates a trimmed `.env.example`.

### 3. Set up environment variables

```bash
cp .env.example .env.local
# Fill in the values — see comments in .env.example
```

### 4. Bootstrap content with Claude

Paste the bootstrap file for your template type into a new **Claude Code** conversation:

- **Portfolio** → `templates/portfolio/BOOTSTRAP.md`
- **Business Site** → `templates/business/BOOTSTRAP.md`

Claude will ask for your content, fill in all dictionary files and component metadata, and walk you through any service setup.

### 5. Replace placeholder images

**Portfolio:**

| File | Description |
|------|-------------|
| `public/hero.jpg` | Hero background — dark photo works best (1920×1080) |
| `public/profile.jpg` | Your profile photo — square crop |
| `public/og-image.png` | OG social card (1200×630) |
| `public/projects/[slug]/1-3.png` | Screenshots per project |

**Business Site:**

| File | Description |
| ------ | ----------- |
| `public/hero.jpg` | Hero background — dark photo works best (1920×1080) |
| `public/about.jpg` | Team or workspace photo (4:3 or square) |
| `public/og-image.png` | OG social card (1200×630) |

### 6. Preview and deploy

```bash
npm run dev      # http://localhost:3000
npm run build    # verify clean build
npm run lint     # check for lint errors
```

Deploy to [Vercel](https://vercel.com) — connect your repo and add the env vars from `.env.local`.

---

## External Service Setup

### Dialogflow Chatbot (Portfolio only)

1. Create an agent at [console.dialogflow.com](https://console.dialogflow.com)
2. In Google Cloud Console: create a service account with **Dialogflow API Client** role, download JSON key
3. Set `GOOGLE_CREDENTIALS` (single-line JSON) and `DIALOGFLOW_PROJECT_ID` in `.env.local`
4. Seed intents: `node dialogflow/zip.js` → import `dialogflow/portfolio-agent.zip` into Dialogflow
5. Edit `dialogflow/intents/` to match your actual FAQ answers

### Resend Contact Form (if enabled)

1. Sign up at [resend.com](https://resend.com)
2. Set `RESEND_API_KEY` in `.env.local`
3. Verify your sending domain (or use the sandbox for testing)
4. Update `TO_EMAIL` in `app/api/contact/route.ts`

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
