# launchkit — Setup Guide

## 1. Generate a project

```bash
node scripts/setup.js --name my-project --output ../
```

Select template type, answer y/n for each feature. The script copies base scaffold + template, applies feature toggles, runs `npm install`, writes `.launchkit`.

**Portfolio features:** i18n, WebGL Hero, Chatbot (Dialogflow ES), Contact Form (Resend), Testimonials, Work (project gallery), ProfileSidebar

**Business features:** i18n, Contact Form (Resend), FloatingCTA (mobile bar), WhatsApp button, Brand accent color (8 presets)

## 2. Environment variables

```bash
cd ../my-project
cp .env.example .env.local   # fill in values per comments
```

## 3. Bootstrap content

Open Claude Code in the generated project and paste the bootstrap file:

- Portfolio → `templates/portfolio/BOOTSTRAP.md`
- Business → `templates/business/BOOTSTRAP.md`

## 4. Replace images

| Portfolio                         | Business                          |
| --------------------------------- | --------------------------------- |
| `public/hero.jpg` (1920×1080)     | `public/hero.jpg` (1920×1080)     |
| `public/profile.jpg` (square)     | `public/about.jpg` (4:3)          |
| `public/og-image.png` (1200×630)  | `public/og-image.png` (1200×630)  |
| `public/projects/[slug]/1-3.png`  |                                   |

## 5. Preview and deploy

```bash
npm run dev       # localhost:3000
npm run build     # verify clean
npm run lint
```

Deploy to Vercel — add env vars from `.env.local`.

## Managing projects

```bash
node scripts/toggle.js --project ../my-project     # enable/disable features
node scripts/status.js --project ../my-project      # view feature state
node scripts/validate.js --project ../my-project    # check placeholders + TODOs
node scripts/reset.js --project ../my-project       # strip to base scaffold
```

All scripts support `--help` and fall back to cwd if `--project` is omitted.

## External services

**Dialogflow (portfolio chatbot):** Create agent at console.dialogflow.com → service account with Dialogflow API Client role → set `GOOGLE_CREDENTIALS` + `DIALOGFLOW_PROJECT_ID` in `.env.local` → edit `dialogflow/generate.js` → `node dialogflow/generate.js` → `node dialogflow/zip.js` → import zip. Never edit `intents/` directly.

**Resend (contact form):** Sign up at resend.com → set `RESEND_API_KEY` → verify domain → update `TO_EMAIL` in `app/api/contact/route.ts`.
