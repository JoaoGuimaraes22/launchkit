#!/usr/bin/env node
// launchkit — Blank template module
// Minimal scaffold: only i18n is selectable.

const fs = require("fs");
const path = require("path");
const {
  target,
  ask,
  copyDir,
  copyDirInProject,
  copyFileInProject,
  copyTemplateFiles,
  deleteIfExists,
  SECONDARY_DICT_FILES,
} = require("../lib");

const TYPE = "blank";

// ── i18n collapse (app/[locale]/ → app/) ─────────────────────────────────────

function collapseI18n() {
  console.log("\n─── Collapsing i18n routing (app/[locale]/ → app/) ─────────────\n");
  copyDirInProject("app/[locale]/components", "app/components");
  copyFileInProject("app/[locale]/layout.tsx", "app/layout.tsx");
  copyFileInProject("app/[locale]/page.tsx", "app/page.tsx");
  deleteIfExists("app/[locale]");
  for (const f of SECONDARY_DICT_FILES) deleteIfExists(f);
  console.log("\n✓  i18n routing collapsed — app/ is now locale-free");
}

// ── Interactive setup ─────────────────────────────────────────────────────────

async function setup(rl) {
  console.log("\n─── Blank — Feature Selection ──────────────────────────────────\n");

  const features = {
    i18n: await ask(rl, "[1/1] Include i18n (bilingual /en /pt routing)?"),
  };

  console.log(`\n─── Copying blank template ─────────────────────────────────────────\n`);
  copyTemplateFiles(TYPE);

  console.log("\n─── Applying blank template selections ──────────────────────────\n");

  if (features.i18n) {
    console.log("✓  i18n: enabled");
    copyDir("templates/blank/root", ".");
  } else {
    console.log("⚙  i18n: disabled");
    fs.writeFileSync(
      path.join(target(), "app/sitemap.ts"),
      `import type { MetadataRoute } from "next";\n\nconst SITE_URL = "https://YOUR_DOMAIN";\n\nexport default function sitemap(): MetadataRoute.Sitemap {\n  return [{ url: SITE_URL, lastModified: new Date() }];\n}\n`,
      "utf8"
    );
    console.log("  [patched] sitemap.ts — simplified (no i18n)");
    collapseI18n();
  }

  return { type: TYPE, features: { i18n: features.i18n }, sections: {} };
}

module.exports = { type: TYPE, setup };
