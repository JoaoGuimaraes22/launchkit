#!/usr/bin/env node
// Portfolio Template Setup Script
// Run: node scripts/setup.js
// Prompts for 7 feature toggles, removes disabled feature files, generates .env.example

const readline = require("readline");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");

// ─── Helpers ─────────────────────────────────────────────────────────────────

function deleteIfExists(relPath) {
  const full = path.join(ROOT, relPath);
  if (fs.existsSync(full)) {
    fs.rmSync(full, { recursive: true, force: true });
    console.log("  [removed]", relPath);
  }
}

function removeLineContaining(relPath, substring) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return;
  const original = fs.readFileSync(full, "utf8");
  const filtered = original
    .split("\n")
    .filter((line) => !line.includes(substring))
    .join("\n");
  if (filtered !== original) {
    fs.writeFileSync(full, filtered, "utf8");
    console.log("  [patched]", relPath, "— removed line containing:", substring.trim());
  }
}

function replaceInFile(relPath, searchStr, replaceStr) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return;
  const original = fs.readFileSync(full, "utf8");
  const updated = original.split(searchStr).join(replaceStr);
  if (updated !== original) {
    fs.writeFileSync(full, updated, "utf8");
    console.log("  [patched]", relPath);
  }
}

function removeDependency(depName) {
  const pkgPath = path.join(ROOT, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  let changed = false;
  if (pkg.dependencies && pkg.dependencies[depName]) {
    delete pkg.dependencies[depName];
    changed = true;
  }
  if (pkg.devDependencies && pkg.devDependencies[depName]) {
    delete pkg.devDependencies[depName];
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
    console.log("  [patched] package.json — removed dependency:", depName);
  }
}

function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question + " [y/n] ", (answer) => {
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║   Portfolio Template — Feature Setup     ║");
  console.log("╚══════════════════════════════════════════╝\n");
  console.log("Answer y/n for each feature. Disabled features will have their");
  console.log("files removed and imports patched automatically.\n");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const features = {
    i18n: await ask(rl, "[1/7] Include i18n (multi-language /en /pt routing)?"),
    webglHero: await ask(rl, "[2/7] Include WebGL shader hero (vs. simple static hero)?"),
    chatbot: await ask(rl, "[3/7] Include Dialogflow chatbot (ChatWidget + /api/chat)?"),
    contactForm: await ask(rl, "[4/7] Include Resend contact form (email on submit)?"),
    testimonials: await ask(rl, "[5/7] Include Testimonials section?"),
    work: await ask(rl, "[6/7] Include Work section (project gallery + detail pages)?"),
    sidebar: await ask(rl, "[7/7] Include ProfileSidebar (sticky desktop sidebar)?"),
  };

  rl.close();

  console.log("\n─── Applying feature selections ───────────────────────────────\n");

  // ── Feature 1: i18n ──────────────────────────────────────────────────────
  if (!features.i18n) {
    console.log("⚙  i18n: disabled");
    deleteIfExists("proxy.ts");
    deleteIfExists("i18n-config.ts");
    deleteIfExists("get-dictionary.ts");
    deleteIfExists("dictionaries");
    deleteIfExists("app/[locale]/components/LanguageSwitcher.tsx");
    deleteIfExists("app/[locale]/components/LangSetter.tsx");
    console.log(
      "\n  ⚠  The app/[locale]/ routing collapse requires TypeScript refactoring."
    );
    console.log(
      "     Open BOOTSTRAP.md and paste it into a Claude Code conversation"
    );
    console.log("     to complete the i18n removal.\n");
  } else {
    console.log("✓  i18n: enabled");
  }

  // ── Feature 2: WebGL Hero ────────────────────────────────────────────────
  if (!features.webglHero) {
    console.log("⚙  WebGL Hero: disabled");
    deleteIfExists("app/[locale]/components/HeroFull.tsx");
    replaceInFile(
      "app/[locale]/page.tsx",
      'import HeroFull from "./components/HeroFull";',
      'import Hero from "./components/Hero";'
    );
    replaceInFile(
      "app/[locale]/page.tsx",
      "<HeroFull hero={dict.hero} />",
      "<Hero hero={dict.hero} />"
    );
  } else {
    console.log("✓  WebGL Hero: enabled");
  }

  // ── Feature 3: Chatbot ───────────────────────────────────────────────────
  if (!features.chatbot) {
    console.log("⚙  Chatbot: disabled");
    deleteIfExists("app/[locale]/components/ChatWidget.tsx");
    deleteIfExists("app/api/chat");
    deleteIfExists("dialogflow");
    // Remove ChatWidget from layout.tsx
    removeLineContaining("app/[locale]/layout.tsx", 'import ChatWidget from "./components/ChatWidget"');
    removeLineContaining("app/[locale]/layout.tsx", "<ChatWidget");
    // Remove ChatNudge from ProfileSidebar only if sidebar is also kept;
    // if sidebar is being removed too, ChatNudge cleanup happens in that block.
    if (features.sidebar) {
      deleteIfExists("app/[locale]/components/ChatNudge.tsx");
      removeLineContaining("app/[locale]/components/ProfileSidebar.tsx", 'import ChatNudge from "./ChatNudge"');
      removeLineContaining("app/[locale]/components/ProfileSidebar.tsx", "<ChatNudge");
    }
    removeDependency("google-auth-library");
  } else {
    console.log("✓  Chatbot: enabled");
  }

  // ── Feature 4: Contact Form ──────────────────────────────────────────────
  if (!features.contactForm) {
    console.log("⚙  Contact Form: disabled");
    deleteIfExists("app/api/contact");
    // Add a TODO comment to Contact.tsx for Claude to clean up the form state
    const contactPath = path.join(ROOT, "app/[locale]/components/Contact.tsx");
    if (fs.existsSync(contactPath)) {
      const content = fs.readFileSync(contactPath, "utf8");
      if (!content.includes("TODO: TEMPLATE")) {
        fs.writeFileSync(
          contactPath,
          '// TODO: TEMPLATE — contact form removed. Keep social links section; remove form JSX and useState for name/email/message/loading/submitted/error.\n' +
            content,
          "utf8"
        );
        console.log("  [patched] Contact.tsx — added TODO comment for Claude");
      }
    }
    removeDependency("resend");
  } else {
    console.log("✓  Contact Form: enabled");
  }

  // ── Feature 5: Testimonials ──────────────────────────────────────────────
  if (!features.testimonials) {
    console.log("⚙  Testimonials: disabled");
    deleteIfExists("app/[locale]/components/Testimonials.tsx");
    removeLineContaining("app/[locale]/page.tsx", 'import Testimonials from "./components/Testimonials"');
    removeLineContaining("app/[locale]/page.tsx", "<Testimonials");
    // Remove from Navbar sections array
    const navbarPath = path.join(ROOT, "app/[locale]/components/Navbar.tsx");
    if (fs.existsSync(navbarPath)) {
      const content = fs.readFileSync(navbarPath, "utf8");
      // Remove the testimonials entry line from the sections array
      const updated = content
        .split("\n")
        .filter((line) => !line.includes('"testimonials"') && !line.includes("nav.reviews"))
        .join("\n");
      if (updated !== content) {
        fs.writeFileSync(navbarPath, updated, "utf8");
        console.log("  [patched] Navbar.tsx — removed testimonials section entry");
      }
    }
  } else {
    console.log("✓  Testimonials: enabled");
  }

  // ── Feature 6: Work ──────────────────────────────────────────────────────
  if (!features.work) {
    console.log("⚙  Work section: disabled");
    deleteIfExists("app/[locale]/components/Work.tsx");
    deleteIfExists("app/[locale]/work");
    deleteIfExists("public/projects");
    removeLineContaining("app/[locale]/page.tsx", 'import Work from "./components/Work"');
    removeLineContaining("app/[locale]/page.tsx", "<Work");
    // Remove from Navbar
    const navbarPath = path.join(ROOT, "app/[locale]/components/Navbar.tsx");
    if (fs.existsSync(navbarPath)) {
      const content = fs.readFileSync(navbarPath, "utf8");
      const updated = content
        .split("\n")
        .filter((line) => !(line.includes('"work"') && line.includes("nav.work")))
        .join("\n");
      if (updated !== content) {
        fs.writeFileSync(navbarPath, updated, "utf8");
        console.log("  [patched] Navbar.tsx — removed work section entry");
      }
    }
    // Simplify sitemap.ts
    const sitemapPath = path.join(ROOT, "app/sitemap.ts");
    if (fs.existsSync(sitemapPath)) {
      fs.writeFileSync(
        sitemapPath,
        `import { MetadataRoute } from "next";

const SITE_URL = "https://YOUR_DOMAIN.vercel.app";
const locales = ["en", "pt"];

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: \`\${SITE_URL}/\${locale}\`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 1,
  }));
}
`,
        "utf8"
      );
      console.log("  [patched] sitemap.ts — simplified (work paths removed)");
    }
  } else {
    console.log("✓  Work section: enabled");
  }

  // ── Feature 7: ProfileSidebar ────────────────────────────────────────────
  if (!features.sidebar) {
    console.log("⚙  ProfileSidebar: disabled");
    deleteIfExists("app/[locale]/components/ProfileSidebar.tsx");
    // Also delete ChatNudge if not already done
    deleteIfExists("app/[locale]/components/ChatNudge.tsx");
    removeLineContaining("app/[locale]/page.tsx", 'import ProfileSidebar from "./components/ProfileSidebar"');
    // Replace sidebar layout with single-column wrapper — add TODO for Claude
    const pagePath = path.join(ROOT, "app/[locale]/page.tsx");
    if (fs.existsSync(pagePath)) {
      const content = fs.readFileSync(pagePath, "utf8");
      if (!content.includes("TODO: TEMPLATE")) {
        fs.writeFileSync(
          pagePath,
          '// TODO: TEMPLATE — ProfileSidebar removed. Replace the md:flex sidebar layout with a single-column <main> wrapper. Remove <aside> block and any ProfileSidebar JSX.\n' +
            content,
          "utf8"
        );
        console.log("  [patched] page.tsx — added TODO comment for Claude");
      }
    }
  } else {
    console.log("✓  ProfileSidebar: enabled");
  }

  // ── Generate .env.example ────────────────────────────────────────────────
  console.log("\n─── Generating .env.example ────────────────────────────────────\n");
  let envContent = `# ── Required ──────────────────────────────────────────────────────────────
NEXT_PUBLIC_SITE_URL=https://YOUR_DOMAIN.vercel.app

`;
  if (features.contactForm) {
    envContent += `# ── Contact Form (Resend) ─────────────────────────────────────────────────
# Sign up at https://resend.com — get your API key from the dashboard
RESEND_API_KEY=re_...

`;
  }
  if (features.chatbot) {
    envContent += `# ── Chatbot (Dialogflow ES) ───────────────────────────────────────────────
# Create a Google Cloud service account with "Dialogflow API Client" role
# Download the JSON key, stringify it, and paste as a single line below
GOOGLE_CREDENTIALS={"type":"service_account","project_id":"..."}
DIALOGFLOW_PROJECT_ID=your-dialogflow-project-id

`;
  }
  fs.writeFileSync(path.join(ROOT, ".env.example"), envContent, "utf8");
  console.log("  [created] .env.example");

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log("\n─── Running npm install ─────────────────────────────────────────\n");
  try {
    execSync("npm install", { stdio: "inherit", cwd: ROOT });
  } catch {
    console.warn("  npm install encountered warnings — check output above.");
  }

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║  Setup complete!                                             ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log("║  Next steps:                                                 ║");
  console.log("║  1. Copy .env.example → .env.local and fill in values        ║");
  console.log("║  2. Paste BOOTSTRAP.md into a new Claude Code conversation   ║");
  console.log("║     Claude will gather your content and wire everything up   ║");
  console.log("║  3. Replace public/hero.jpg, profile.jpg, og-image.png       ║");
  console.log("║  4. npm run dev  →  preview your site                        ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const hasTodos = !features.i18n || !features.contactForm || !features.sidebar;
  if (hasTodos) {
    console.log("⚠  Some features require Claude to finish cleanup:");
    if (!features.i18n) console.log("   • i18n: collapse app/[locale]/ routing");
    if (!features.contactForm) console.log("   • Contact form: remove form JSX from Contact.tsx");
    if (!features.sidebar) console.log("   • Sidebar: simplify page.tsx layout");
    console.log("   → Paste BOOTSTRAP.md into Claude Code to handle these.\n");
  }
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
