#!/usr/bin/env node
// launchkit — Business Site template module
// Owns: setup flow (i18n + accent color only), i18n collapse for core layout components.
// Optional sections (contact-form, floating-cta, whatsapp) are managed via sections.js / presets.

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
  collapseI18nBase,
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
    `${compDir}/FloatingCTA.tsx`, // may be installed via floating-cta section
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
      replaceInFile(
        "app/layout.tsx",
        '  const description =\n    locale === "pt"\n      ? "Descrição curta do seu negócio em português."\n      : "Short description of your business in English.";',
        '  const description = "Short description of your business in English.";'
      );
    },
    afterCollapse() {
      removeLineContaining("app/layout.tsx", "import LangSetter");
      removeLineContaining("app/layout.tsx", "<LangSetter");
      removeLineContaining("app/components/Navbar.tsx", "import LanguageSwitcher");
      replaceInFile("app/components/Navbar.tsx", "href={`/${locale}`}", 'href="/"');
      removeLineContaining("app/components/Navbar.tsx", "<LanguageSwitcher");
      deleteIfExists("app/components/LanguageSwitcher.tsx");
      deleteIfExists("app/components/LangSetter.tsx");
    },
  });
}

// ── Interactive setup ─────────────────────────────────────────────────────────

async function setup(rl) {
  console.log("\n─── Business Site — Setup ──────────────────────────────────────\n");

  const i18n = await ask(rl, "[1/2] Include i18n (bilingual /en /pt routing)?");
  const colorChoice = await askChoice(rl, "[2/2] Brand accent color?", COLOR_LABELS);
  const accentColor = COLOR_MAP[(colorChoice ?? 1) - 1];

  console.log(`\n─── Copying business template ──────────────────────────────────────\n`);
  copyTemplateFiles(TYPE);

  if (i18n) {
    console.log("✓  i18n: enabled");
    copyDir("templates/presets/business/root", ".");
  } else {
    console.log("⚙  i18n: disabled");
    fs.writeFileSync(
      path.join(target(), "app/sitemap.ts"),
      `import type { MetadataRoute } from "next";\n\nconst SITE_URL = "https://YOUR_DOMAIN";\n\nexport default function sitemap(): MetadataRoute.Sitemap {\n  return [{ url: SITE_URL, lastModified: new Date() }];\n}\n`,
      "utf8"
    );
    console.log("  [created] sitemap.ts");
    collapseI18n();
  }

  if (accentColor !== "indigo") {
    console.log(`\n─── Replacing accent color: indigo → ${accentColor} ──────────────────\n`);
    const colorFiles = [
      "app/[locale]/layout.tsx",
      "app/[locale]/components/About.tsx",
      "app/[locale]/components/Contact.tsx",
      "app/[locale]/components/FAQ.tsx",
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

  return { type: TYPE, features: { i18n, accentColor }, sections: {} };
}

module.exports = { type: TYPE, setup, recolor, COLOR_MAP, COLOR_LABELS };
