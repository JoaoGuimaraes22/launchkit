#!/usr/bin/env node
// launchkit — Setup Script
// Run: node scripts/setup.js
// Selects a template type (Portfolio or Business Site), copies it into app/,
// then applies optional feature toggles.

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

function copyDir(srcRel, destRel) {
  const src = path.join(ROOT, srcRel);
  const dest = path.join(ROOT, destRel);
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const srcEntry = path.join(src, entry);
    const destEntry = path.join(dest, entry);
    if (fs.statSync(srcEntry).isDirectory()) {
      copyDir(path.join(srcRel, entry), path.join(destRel, entry));
    } else {
      fs.copyFileSync(srcEntry, destEntry);
      console.log("  [copied]", path.join(srcRel, entry), "→", path.join(destRel, entry));
    }
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

function addDependency(depName, version) {
  const pkgPath = path.join(ROOT, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  if (!pkg.dependencies) pkg.dependencies = {};
  if (!pkg.dependencies[depName]) {
    pkg.dependencies[depName] = version;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
    console.log("  [patched] package.json — added dependency:", depName, version);
  }
}

function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question + " [y/n] ", (answer) => {
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

function askChoice(rl, question, choices) {
  return new Promise((resolve) => {
    console.log(question);
    choices.forEach((c, i) => console.log(`  [${i + 1}] ${c}`));
    rl.question("Enter choice: ", (answer) => {
      const n = parseInt(answer.trim(), 10);
      resolve(n >= 1 && n <= choices.length ? n : 1);
    });
  });
}

// ─── Copy Template → app/ ────────────────────────────────────────────────────

function copyTemplateToProject(type) {
  console.log(`\n─── Copying ${type} template ────────────────────────────────────\n`);
  // Copy app/ subtree (merges into root app/, which already has layout.tsx/globals.css/page.tsx)
  copyDir(`templates/${type}/app`, "app");
  // Copy dictionaries
  copyDir(`templates/${type}/dictionaries`, "dictionaries");
  // Copy public assets (hero.jpg, etc.)
  copyDir(`templates/${type}/public`, "public");
  // Portfolio: copy dialogflow agent
  if (type === "portfolio") {
    copyDir("templates/portfolio/dialogflow", "dialogflow");
  }
}

// ─── Portfolio Setup ──────────────────────────────────────────────────────────

async function setupPortfolio(rl) {
  console.log("\n─── Portfolio — Feature Selection ─────────────────────────────\n");

  const features = {
    i18n: await ask(rl, "[1/7] Include i18n (multi-language /en /pt routing)?"),
    webglHero: await ask(rl, "[2/7] Include WebGL shader hero (vs. simple static hero)?"),
    chatbot: await ask(rl, "[3/7] Include Dialogflow chatbot (ChatWidget + /api/chat)?"),
    contactForm: await ask(rl, "[4/7] Include Resend contact form (email on submit)?"),
    testimonials: await ask(rl, "[5/7] Include Testimonials section?"),
    work: await ask(rl, "[6/7] Include Work section (project gallery + detail pages)?"),
    sidebar: await ask(rl, "[7/7] Include ProfileSidebar (sticky desktop sidebar)?"),
  };

  copyTemplateToProject("portfolio");

  console.log("\n─── Applying portfolio feature selections ───────────────────────\n");

  if (features.i18n) {
    console.log("✓  i18n: enabled");
    copyDir("templates/portfolio/root", ".");
  } else {
    console.log("⚙  i18n: disabled");
    deleteIfExists("app/[locale]/components/LanguageSwitcher.tsx");
    deleteIfExists("app/[locale]/components/LangSetter.tsx");
    // Write a minimal sitemap that doesn't depend on get-dictionary
    fs.writeFileSync(
      path.join(ROOT, "app/sitemap.ts"),
      `import type { MetadataRoute } from "next";\n\nconst SITE_URL = "https://YOUR_DOMAIN";\n\n// TODO: TEMPLATE — add slugs after i18n collapse and content setup\nexport default function sitemap(): MetadataRoute.Sitemap {\n  return [{ url: SITE_URL, lastModified: new Date() }];\n}\n`,
      "utf8"
    );
    console.log("  [patched] sitemap.ts — simplified (no i18n)");
    console.log("\n  ⚠  The app/[locale]/ routing collapse requires TypeScript refactoring.");
    console.log("     Paste templates/portfolio/BOOTSTRAP.md into a Claude Code conversation to complete this.\n");
  }

  if (!features.webglHero) {
    console.log("⚙  WebGL Hero: disabled");
    deleteIfExists("app/[locale]/components/HeroFull.tsx");
    replaceInFile(
      "app/[locale]/page.tsx",
      'import HeroFull from "./components/HeroFull";',
      'import Hero from "./components/Hero";'
    );
    replaceInFile("app/[locale]/page.tsx", "<HeroFull hero={dict.hero} />", "<Hero hero={dict.hero} />");
  } else {
    console.log("✓  WebGL Hero: enabled");
  }

  if (!features.chatbot) {
    console.log("⚙  Chatbot: disabled");
    deleteIfExists("app/[locale]/components/ChatWidget.tsx");
    deleteIfExists("app/api/chat");
    deleteIfExists("dialogflow");
    removeLineContaining("app/[locale]/layout.tsx", 'import ChatWidget from "./components/ChatWidget"');
    removeLineContaining("app/[locale]/layout.tsx", "<ChatWidget");
    if (features.sidebar) {
      deleteIfExists("app/[locale]/components/ChatNudge.tsx");
      removeLineContaining("app/[locale]/components/ProfileSidebar.tsx", 'import ChatNudge from "./ChatNudge"');
      removeLineContaining("app/[locale]/components/ProfileSidebar.tsx", "<ChatNudge");
    }
  } else {
    console.log("✓  Chatbot: enabled");
    addDependency("google-auth-library", "^10.6.2");
    addDependency("adm-zip", "^0.5.16");
  }

  if (!features.contactForm) {
    console.log("⚙  Contact Form: disabled");
    deleteIfExists("app/api/contact");
    const contactPath = path.join(ROOT, "app/[locale]/components/Contact.tsx");
    if (fs.existsSync(contactPath)) {
      const content = fs.readFileSync(contactPath, "utf8");
      if (!content.includes("TODO: TEMPLATE")) {
        fs.writeFileSync(
          contactPath,
          "// TODO: TEMPLATE — contact form removed. Keep social links section; remove form JSX and useState for name/email/message/loading/submitted/error.\n" + content,
          "utf8"
        );
        console.log("  [patched] Contact.tsx — added TODO comment for Claude");
      }
    }
  } else {
    console.log("✓  Contact Form: enabled");
    addDependency("resend", "^6.9.4");
  }

  if (!features.testimonials) {
    console.log("⚙  Testimonials: disabled");
    deleteIfExists("app/[locale]/components/Testimonials.tsx");
    removeLineContaining("app/[locale]/page.tsx", 'import Testimonials from "./components/Testimonials"');
    removeLineContaining("app/[locale]/page.tsx", "<Testimonials");
    const navbarPath = path.join(ROOT, "app/[locale]/components/Navbar.tsx");
    if (fs.existsSync(navbarPath)) {
      const content = fs.readFileSync(navbarPath, "utf8");
      const updated = content.split("\n").filter((l) => !l.includes('"testimonials"') && !l.includes("nav.reviews")).join("\n");
      if (updated !== content) fs.writeFileSync(navbarPath, updated, "utf8");
      console.log("  [patched] Navbar.tsx — removed testimonials entry");
    }
  } else {
    console.log("✓  Testimonials: enabled");
  }

  if (!features.work) {
    console.log("⚙  Work section: disabled");
    deleteIfExists("app/[locale]/components/Work.tsx");
    deleteIfExists("app/[locale]/work");
    deleteIfExists("public/projects");
    removeLineContaining("app/[locale]/page.tsx", 'import Work from "./components/Work"');
    removeLineContaining("app/[locale]/page.tsx", "<Work");
    const navbarPath = path.join(ROOT, "app/[locale]/components/Navbar.tsx");
    if (fs.existsSync(navbarPath)) {
      const content = fs.readFileSync(navbarPath, "utf8");
      const updated = content.split("\n").filter((l) => !(l.includes('"work"') && l.includes("nav.work"))).join("\n");
      if (updated !== content) fs.writeFileSync(navbarPath, updated, "utf8");
      console.log("  [patched] Navbar.tsx — removed work entry");
    }
    if (features.i18n) {
      // Rewrite sitemap without work paths
      const locales = '["en", "pt"] as const';
      fs.writeFileSync(
        path.join(ROOT, "app/sitemap.ts"),
        `import type { MetadataRoute } from "next";\n\nconst SITE_URL = "https://YOUR_DOMAIN";\nconst locales = ${locales};\n\nexport default function sitemap(): MetadataRoute.Sitemap {\n  return locales.map((locale) => ({\n    url: \`\${SITE_URL}/\${locale}\`,\n    lastModified: new Date(),\n    alternates: {\n      languages: Object.fromEntries(locales.map((l) => [l, \`\${SITE_URL}/\${l}\`])),\n    },\n  }));\n}\n`,
        "utf8"
      );
      console.log("  [patched] sitemap.ts — simplified (no work paths)");
    }
  } else {
    console.log("✓  Work section: enabled");
  }

  if (!features.sidebar) {
    console.log("⚙  ProfileSidebar: disabled");
    deleteIfExists("app/[locale]/components/ProfileSidebar.tsx");
    deleteIfExists("app/[locale]/components/ChatNudge.tsx");
    removeLineContaining("app/[locale]/page.tsx", 'import ProfileSidebar from "./components/ProfileSidebar"');
    const pagePath = path.join(ROOT, "app/[locale]/page.tsx");
    if (fs.existsSync(pagePath)) {
      const content = fs.readFileSync(pagePath, "utf8");
      if (!content.includes("TODO: TEMPLATE")) {
        fs.writeFileSync(
          pagePath,
          "// TODO: TEMPLATE — ProfileSidebar removed. Replace the md:flex sidebar layout with a single-column <main> wrapper. Remove <aside> block and any ProfileSidebar JSX.\n" + content,
          "utf8"
        );
        console.log("  [patched] page.tsx — added TODO comment for Claude");
      }
    }
  } else {
    console.log("✓  ProfileSidebar: enabled");
  }

  return { type: "portfolio", features };
}

// ─── Business Site Setup ──────────────────────────────────────────────────────

async function setupBusiness(rl) {
  console.log("\n─── Business Site — Feature Selection ─────────────────────────\n");

  const features = {
    i18n: await ask(rl, "[1/4] Include i18n (bilingual /en /pt routing)?"),
    contactForm: await ask(rl, "[2/4] Include contact form (Resend email on submit)?"),
    floatingCTA: await ask(rl, "[3/4] Include FloatingCTA bar (sticky mobile bottom bar)?"),
    whatsapp: await ask(rl, "[4/4] Include WhatsApp button in contact section?"),
  };

  copyTemplateToProject("business");

  console.log("\n─── Applying business site feature selections ───────────────────\n");

  if (features.i18n) {
    console.log("✓  i18n: enabled");
    copyDir("templates/business/root", ".");
  } else {
    console.log("⚙  i18n: disabled");
    deleteIfExists("app/[locale]/components/LanguageSwitcher.tsx");
    deleteIfExists("app/[locale]/components/LangSetter.tsx");
    removeLineContaining("app/[locale]/layout.tsx", 'import LangSetter from "./components/LangSetter"');
    removeLineContaining("app/[locale]/layout.tsx", "<LangSetter");
    removeLineContaining("app/[locale]/components/Navbar.tsx", 'import LanguageSwitcher from "./LanguageSwitcher"');
    removeLineContaining("app/[locale]/components/Navbar.tsx", "<LanguageSwitcher");
    fs.writeFileSync(
      path.join(ROOT, "app/sitemap.ts"),
      `import type { MetadataRoute } from "next";\n\nconst SITE_URL = "https://YOUR_DOMAIN";\n\nexport default function sitemap(): MetadataRoute.Sitemap {\n  return [{ url: SITE_URL, lastModified: new Date() }];\n}\n`,
      "utf8"
    );
    console.log("  [patched] sitemap.ts — simplified (no i18n)");
    console.log("\n  ⚠  The app/[locale]/ routing collapse requires TypeScript refactoring.");
    console.log("     Paste templates/business/BOOTSTRAP.md into a Claude Code conversation to complete this.\n");
  }

  if (!features.contactForm) {
    console.log("⚙  Contact Form: disabled");
    deleteIfExists("app/api/contact");
  } else {
    console.log("✓  Contact Form: enabled");
    addDependency("resend", "^6.9.4");
  }

  if (!features.floatingCTA) {
    console.log("⚙  FloatingCTA: disabled");
    deleteIfExists("app/[locale]/components/FloatingCTA.tsx");
    removeLineContaining("app/[locale]/page.tsx", 'import FloatingCTA from "./components/FloatingCTA"');
    removeLineContaining("app/[locale]/page.tsx", "<FloatingCTA");
    for (const dictFile of ["dictionaries/en.json", "dictionaries/pt.json"]) {
      const dictPath = path.join(ROOT, dictFile);
      if (fs.existsSync(dictPath)) {
        const dict = JSON.parse(fs.readFileSync(dictPath, "utf8"));
        delete dict.cta;
        fs.writeFileSync(dictPath, JSON.stringify(dict, null, 2) + "\n", "utf8");
        console.log("  [patched]", dictFile, "— removed cta section");
      }
    }
  } else {
    console.log("✓  FloatingCTA: enabled");
  }

  return { type: "business", features };
}

// ─── .env.example ─────────────────────────────────────────────────────────────

function generateEnvExample(type, features) {
  let env = `# ── Required ──────────────────────────────────────────────────────────────\nNEXT_PUBLIC_SITE_URL=https://YOUR_DOMAIN\n\n`;
  if (features.contactForm) {
    env += `# ── Contact Form (Resend) ─────────────────────────────────────────────────\n# Sign up at https://resend.com — get your API key from the dashboard\nRESEND_API_KEY=re_...\n\n`;
  }
  if (type === "portfolio" && features.chatbot) {
    env += `# ── Chatbot (Dialogflow ES) ───────────────────────────────────────────────\n# Create a Google Cloud service account with "Dialogflow API Client" role\n# Download the JSON key, stringify it, and paste as a single line below\nGOOGLE_CREDENTIALS={"type":"service_account","project_id":"..."}\nDIALOGFLOW_PROJECT_ID=your-dialogflow-project-id\n\n`;
  }
  fs.writeFileSync(path.join(ROOT, ".env.example"), env, "utf8");
  console.log("  [created] .env.example");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║          launchkit — Setup               ║");
  console.log("╚══════════════════════════════════════════╝\n");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const typeChoice = await askChoice(rl, "[0] Project type?", [
    "Portfolio    — personal showcase (WebGL hero, sidebar, chatbot, project gallery)",
    "Business Site — local business (services, reviews, FAQ, contact, footer)",
  ]);

  let result;
  if (typeChoice === 1) {
    result = await setupPortfolio(rl);
  } else {
    result = await setupBusiness(rl);
  }

  rl.close();

  console.log("\n─── Generating .env.example ────────────────────────────────────\n");
  generateEnvExample(result.type, result.features);

  console.log("\n─── Running npm install ─────────────────────────────────────────\n");
  try {
    execSync("npm install", { stdio: "inherit", cwd: ROOT });
  } catch {
    console.warn("  npm install encountered warnings — check output above.");
  }

  const bootstrapFile = `templates/${result.type}/BOOTSTRAP.md`;

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║  Setup complete!                                             ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log("║  Next steps:                                                 ║");
  console.log("║  1. Copy .env.example → .env.local and fill in values        ║");
  console.log(`║  2. Paste ${bootstrapFile.padEnd(49)}║`);
  console.log("║     into a new Claude Code conversation                      ║");
  console.log("║  3. Replace placeholder images in public/                    ║");
  console.log("║  4. npm run dev  →  preview your site                        ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const hasTodos =
    !result.features.i18n ||
    (result.type === "portfolio" && (!result.features.contactForm || !result.features.sidebar));
  if (hasTodos) {
    console.log("⚠  Some steps require Claude to finish:");
    if (!result.features.i18n) console.log("   • Collapse app/[locale]/ routing (i18n disabled)");
    if (result.type === "portfolio" && !result.features.contactForm) console.log("   • Remove form JSX from Contact.tsx");
    if (result.type === "portfolio" && !result.features.sidebar) console.log("   • Simplify page.tsx sidebar layout");
    console.log(`   → Paste ${bootstrapFile} into Claude Code to handle these.\n`);
  }
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
