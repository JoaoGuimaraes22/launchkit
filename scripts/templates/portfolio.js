#!/usr/bin/env node
// launchkit — Portfolio template module
// Owns: setup flow (i18n only), i18n collapse for core layout components.
// Optional sections (chatbot, sidebar, work, testimonials, webgl-hero, contact-form)
// are managed via sections.js / presets — not bundled here.

const fs = require("fs");
const path = require("path");
const {
  target,
  ask,
  copyDir,
  copyTemplateFiles,
  deleteIfExists,
  removeLineContaining,
  replaceInFile,
  collapseI18nBase,
  LOCALES_TS_LITERAL,
} = require("../lib");

const TYPE = "portfolio";

// ── Full i18n collapse (app/[locale]/ → app/) ─────────────────────────────────

function collapseI18n() {
  collapseI18nBase({}, {
    pageFnName: "LocalePage",
    beforePatchLayout() {
      replaceInFile(
        "app/layout.tsx",
        '  const description =\n    locale === "pt"\n      ? "Descrição curta do seu perfil em português. Disponível para freelance."\n      : "Short description of your profile in English. Available for freelance.";',
        '  const description = "Short description of your profile in English. Available for freelance.";'
      );
    },
    afterCollapse() {
      // Layout patches
      removeLineContaining("app/layout.tsx", "import LangSetter");
      removeLineContaining("app/layout.tsx", "<LangSetter");

      // Navbar patches
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
  console.log("\n─── Portfolio — Setup ──────────────────────────────────────────\n");

  const i18n = await ask(rl, "[1/1] Include i18n (multi-language /en /pt routing)?");

  console.log(`\n─── Copying portfolio template ─────────────────────────────────\n`);
  copyTemplateFiles(TYPE);

  if (i18n) {
    console.log("✓  i18n: enabled");
    copyDir("templates/presets/portfolio/root", ".");
  } else {
    console.log("⚙  i18n: disabled");
    deleteIfExists("app/[locale]/components/LanguageSwitcher.tsx");
    deleteIfExists("app/[locale]/components/LangSetter.tsx");
    fs.writeFileSync(
      path.join(target(), "app/sitemap.ts"),
      `import type { MetadataRoute } from "next";\n\nconst SITE_URL = "https://YOUR_DOMAIN";\n\nexport default function sitemap(): MetadataRoute.Sitemap {\n  return [{ url: SITE_URL, lastModified: new Date() }];\n}\n`,
      "utf8"
    );
    console.log("  [created] sitemap.ts");
    collapseI18n();
  }

  return { type: TYPE, features: { i18n }, sections: {} };
}

module.exports = { type: TYPE, setup };
