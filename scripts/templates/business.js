#!/usr/bin/env node
// launchkit — Business Site template module
// Owns: setup flow, i18n collapse, accent recolor.

const fs = require("fs");
const path = require("path");
const {
  target,
  ask,
  askChoice,
  copyDir,
  copyTemplateFiles,
  deleteIfExists,
  removeLineContaining,
  replaceInFile,
  addDependency,
  safeJsonParse,
  collapseI18nBase,
  DICT_FILES,
} = require("../lib");

const TYPE = "business";

const COLOR_MAP    = ["indigo", "blue", "violet", "rose", "amber", "emerald", "cyan", "orange"];
const COLOR_LABELS = ["Indigo (default)", "Blue", "Violet", "Rose", "Amber", "Emerald", "Cyan", "Orange"];

// ── Accent color replacement ──────────────────────────────────────────────────

function recolor(fromColor, toColor, compDir, layoutFile) {
  const files = [
    layoutFile,
    `${compDir}/About.tsx`,
    `${compDir}/Contact.tsx`,
    `${compDir}/FAQ.tsx`,
    `${compDir}/FloatingCTA.tsx`,
    `${compDir}/Hero.tsx`,
    `${compDir}/LanguageSwitcher.tsx`,
    `${compDir}/Navbar.tsx`,
    `${compDir}/Reviews.tsx`,
    `${compDir}/ScrollProgress.tsx`,
    `${compDir}/Services.tsx`,
  ];
  for (const f of files) {
    replaceInFile(f, `${fromColor}-`, `${toColor}-`);
  }
}

// ── Full i18n collapse (app/[locale]/ → app/) ─────────────────────────────────

function collapseI18n() {
  collapseI18nBase(null, {
    pageFnName: "BusinessPage",
    beforePatchLayout() {
      // Business-specific: description collapse
      replaceInFile(
        "app/layout.tsx",
        '  const description =\n    locale === "pt"\n      ? "Descrição curta do seu negócio em português."\n      : "Short description of your business in English.";',
        '  const description = "Short description of your business in English.";'
      );
    },
  });
}

// ── Interactive setup ─────────────────────────────────────────────────────────

async function setup(rl) {
  console.log("\n─── Business Site — Feature Selection ─────────────────────────\n");

  const features = {
    i18n:         await ask(rl, "[1/5] Include i18n (bilingual /en /pt routing)?"),
    contactForm:  await ask(rl, "[2/5] Include contact form (Resend email on submit)?"),
    floatingCTA:  await ask(rl, "[3/5] Include FloatingCTA bar (sticky mobile bottom bar)?"),
    whatsapp:     await ask(rl, "[4/5] Include WhatsApp button in contact section?"),
  };

  const colorChoice = await askChoice(rl, "[5/5] Brand accent color?", COLOR_LABELS);
  const accentColor = COLOR_MAP[(colorChoice ?? 1) - 1];

  console.log(`\n─── Copying business template ──────────────────────────────────────\n`);
  copyTemplateFiles(TYPE);

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
      path.join(target(), "app/sitemap.ts"),
      `import type { MetadataRoute } from "next";\n\nconst SITE_URL = "https://YOUR_DOMAIN";\n\nexport default function sitemap(): MetadataRoute.Sitemap {\n  return [{ url: SITE_URL, lastModified: new Date() }];\n}\n`,
      "utf8"
    );
    console.log("  [patched] sitemap.ts — simplified (no i18n)");
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
    for (const dictFile of DICT_FILES) {
      const dictPath = path.join(target(), dictFile);
      if (fs.existsSync(dictPath)) {
        const dict = safeJsonParse(fs.readFileSync(dictPath, "utf8"), dictFile);
        delete dict.cta;
        fs.writeFileSync(dictPath, JSON.stringify(dict, null, 2) + "\n", "utf8");
        console.log("  [patched]", dictFile, "— removed cta section");
      }
    }
  } else {
    console.log("✓  FloatingCTA: enabled");
  }

  if (accentColor !== "indigo") {
    console.log(`\n─── Replacing accent color: indigo → ${accentColor} ──────────────────\n`);
    const colorFiles = [
      "app/[locale]/layout.tsx",
      "app/[locale]/components/About.tsx",
      "app/[locale]/components/Contact.tsx",
      "app/[locale]/components/FAQ.tsx",
      "app/[locale]/components/FloatingCTA.tsx",
      "app/[locale]/components/Hero.tsx",
      "app/[locale]/components/LanguageSwitcher.tsx",
      "app/[locale]/components/Navbar.tsx",
      "app/[locale]/components/Reviews.tsx",
      "app/[locale]/components/ScrollProgress.tsx",
      "app/[locale]/components/Services.tsx",
    ];
    for (const f of colorFiles) replaceInFile(f, "indigo-", `${accentColor}-`);
  }
  console.log(`✓  Accent color: ${accentColor}`);

  if (!features.i18n) collapseI18n();

  // Build sections map for .launchkit (only enabled sections)
  const sections = {};
  const now = new Date().toISOString();
  if (features.contactForm) sections["contact-form"] = { variant: "business", addedAt: now };
  if (features.floatingCTA) sections["floating-cta"] = { variant: "default", addedAt: now };
  if (features.whatsapp)    sections["whatsapp"]     = { variant: "default", addedAt: now };

  return { type: TYPE, features: { i18n: features.i18n, accentColor }, sections };
}

module.exports = { type: TYPE, setup, recolor, COLOR_MAP, COLOR_LABELS };
