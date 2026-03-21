# launchkit — Setup Guide

A Next.js 16 App Router project generator with configurable templates, feature toggles, and Claude-assisted content setup.

## Stack (generated projects)

- **Next.js 16** App Router · **React 19** · **TypeScript** strict
- **Tailwind CSS v4** · **Framer Motion** · **Geist** fonts
- **i18n**: `/en` + `/pt` routing (optional)
- **Chatbot**: Dialogflow ES (optional, portfolio only)
- **Contact form**: Resend (optional)

---

## Quick Start

### 1. Clone the tool

```bash
git clone https://github.com/YOUR_GITHUB/launchkit
cd launchkit
```

No `npm install` needed — launchkit is a generator tool with no dependencies of its own.

### 2. Generate a project

```bash
node scripts/setup.js --output ../my-project
```

Skip the type-selection prompt with a flag:

```bash
node scripts/setup.js --output ../my-project --portfolio
node scripts/setup.js --output ../my-project --business
node scripts/setup.js --output ../my-project --blank
```

Or use the npm shorthand (will prompt for output path interactively):

```bash
npm run setup              # interactive type + output selection
npm run setup:portfolio    # skip type selection
npm run setup:business     # skip type selection
npm run setup:blank        # skip type selection
```

Select your project type, then answer `y/n` for each feature:

**Portfolio features:**

| Feature            | What it does                                                            |
| ------------------ | ----------------------------------------------------------------------- |
| **i18n**           | Bilingual routing (`/en`, `/pt`), LanguageSwitcher, locale dictionaries |
| **WebGL Hero**     | Full-screen WebGL shader hero with animated blobs and mouse tracking    |
| **Chatbot**        | Dialogflow ES chat widget + `/api/chat` proxy route                     |
| **Contact Form**   | Resend email sender + `/api/contact` route                              |
| **Testimonials**   | Infinite-scroll testimonial columns                                     |
| **Work**           | Project gallery + individual project detail pages                       |
| **ProfileSidebar** | Sticky desktop sidebar with photo, bio, social links                    |

**Business Site features:**

| Feature                | What it does                                                               |
| ---------------------- | -------------------------------------------------------------------------- |
| **i18n**               | Bilingual routing (`/en`, `/pt`), LanguageSwitcher, locale dictionaries    |
| **Contact Form**       | Resend email sender + `/api/contact` route                                 |
| **FloatingCTA**        | Fixed mobile bottom bar with Call / WhatsApp / Book buttons                |
| **WhatsApp button**    | WhatsApp link in FloatingCTA and contact section                           |
| **Brand accent color** | Replaces all `indigo-` Tailwind classes with your chosen color (8 presets) |

The script creates a standalone Next.js project at the output path: copies the base scaffold, layers the selected template on top, applies feature removals, replaces accent colors, collapses i18n routing if disabled, generates a trimmed `.env.example`, runs `npm install`, and writes a `.launchkit` file that records your choices:

```json
{
  "type": "portfolio",
  "features": {
    "i18n": true,
    "webglHero": true,
    "chatbot": false,
    "contactForm": true,
    "testimonials": true,
    "work": true,
    "sidebar": true
  }
}
```

`.launchkit` lives in the generated project and is the authoritative record of template type and active features — do not delete it.

### 3. Set up environment variables

```bash
cd ../my-project
cp .env.example .env.local
# Fill in the values — see comments in .env.example
```

### 4. Bootstrap content with Claude

Open a **Claude Code** conversation in the generated project directory and paste the bootstrap file for your template type:

- **Portfolio** → `templates/portfolio/BOOTSTRAP.md` (in the tool repo)
- **Business Site** → `templates/business/BOOTSTRAP.md` (in the tool repo)

Claude will ask for your content, fill in all dictionary files and component metadata, and walk you through any service setup.

### 5. Replace placeholder images

**Portfolio:**

| File                             | Description                                         |
| -------------------------------- | --------------------------------------------------- |
| `public/hero.jpg`                | Hero background — dark photo works best (1920×1080) |
| `public/profile.jpg`             | Your profile photo — square crop                    |
| `public/og-image.png`            | OG social card (1200×630)                           |
| `public/projects/[slug]/1-3.png` | Screenshots per project                             |

**Business Site:**

| File                  | Description                                         |
| --------------------- | --------------------------------------------------- |
| `public/hero.jpg`     | Hero background — dark photo works best (1920×1080) |
| `public/about.jpg`    | Team or workspace photo (4:3 or square)             |
| `public/og-image.png` | OG social card (1200×630)                           |

### 6. Preview and deploy

From the generated project directory:

```bash
npm run dev      # http://localhost:3000
npm run build    # verify clean build
npm run lint     # check for lint errors
```

Deploy to [Vercel](https://vercel.com) — connect the project repo and add the env vars from `.env.local`.

---

## Managing Projects After Setup

All management scripts are run from the **launchkit tool directory** using `--project` to point at the generated project:

```bash
# From launchkit/
node scripts/toggle.js --project ../my-project     # enable/disable features
node scripts/status.js --project ../my-project      # view template type + feature state
node scripts/validate.js --project ../my-project    # check for placeholders + TODOs
node scripts/reset.js --project ../my-project       # strip back to base scaffold
```

If `--project` is omitted, scripts fall back to the current working directory — so running from inside a generated project also works.

---

## External Service Setup

### Dialogflow Chatbot (Portfolio only)

1. Create an agent at [console.dialogflow.com](https://console.dialogflow.com)
2. In Google Cloud Console: create a service account with **Dialogflow API Client** role, download JSON key
3. Set `GOOGLE_CREDENTIALS` (single-line JSON) and `DIALOGFLOW_PROJECT_ID` in `.env.local`
4. Edit `dialogflow/generate.js` (in the generated project) — look for `// EDIT:` comments and update name, services, pricing, email, projects, location
5. Run `node dialogflow/generate.js` → then `node dialogflow/zip.js` → import `dialogflow/portfolio-agent.zip` into Dialogflow
   **Do not edit `dialogflow/intents/` directly** — they are overwritten by `generate.js`

### Resend Contact Form (if enabled)

1. Sign up at [resend.com](https://resend.com)
2. Set `RESEND_API_KEY` in `.env.local`
3. Verify your sending domain (or use the sandbox for testing)
4. Update `TO_EMAIL` in `app/api/contact/route.ts`

---

## Validate Before Deploying

After bootstrapping, run from the tool repo:

```bash
node scripts/validate.js --project ../my-project
```

Or from inside the generated project:

```bash
npx launchkit validate   # if available, or run the tool script directly
```

This checks for unreplaced `YOUR_*` placeholders, `// TODO: TEMPLATE` comments, and a missing `.env.local`. Exits with code `1` if anything is found.

---

## Scripts Reference

### Tool scripts (run from launchkit/)

| Script                                                     | What it does                                                   |
| ---------------------------------------------------------- | -------------------------------------------------------------- |
| `node scripts/setup.js --output <path>`                    | Generate a new project at the given path                       |
| `node scripts/setup.js --output <path> --portfolio`        | Skip type selection, go straight to portfolio feature prompts  |
| `node scripts/setup.js --output <path> --business`         | Skip type selection, go straight to business site prompts      |
| `node scripts/setup.js --output <path> --blank`            | Skip type selection, go straight to blank template setup       |
| `node scripts/toggle.js --project <path>`                  | Enable/disable individual features without a full reset        |
| `node scripts/status.js --project <path>`                  | Print current template type and feature state (read-only)      |
| `node scripts/reset.js --project <path>`                   | Remove everything setup added; restore base scaffold           |
| `node scripts/validate.js --project <path>`                | Check for unreplaced placeholders and TODO comments            |

### Project scripts (run from generated project/)

| Script          | What it does                                  |
| --------------- | --------------------------------------------- |
| `npm run dev`   | Start Next.js dev server at localhost:3000    |
| `npm run build` | Production build (verify before deploying)    |
| `npm run start` | Start production server                       |
| `npm run lint`  | Run ESLint across the project                 |

---

## Architecture Reference

See `CLAUDE.md` for full stack documentation, design patterns, Tailwind v4 conventions, and file structure.
