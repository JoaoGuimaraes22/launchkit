#!/usr/bin/env node
// launchkit — Restaurant template module
// Owns: template file copy, accent color setup.
// Language setup is prompted and applied by setup.js via configs/setup/languages/.
// Optional sections (stats, gallery-strip, pricing, reservation, etc.) are managed via sections.js / presets.

const {
  askChoice,
  copyTemplateFiles,
  replaceInFile,
} = require("../lib");

const TYPE = "restaurant";

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
    `${compDir}/Menu.tsx`,
    `${compDir}/Navbar.tsx`,
    `${compDir}/Reviews.tsx`,
    `${compDir}/ScrollProgress.tsx`,
  ];
  for (const f of files) {
    replaceInFile(f, `${fromColor}-`, `${toColor}-`);
  }
}

// ── Template file copy + accent color ─────────────────────────────────────────

async function setup(rl, answers) {
  console.log("\n─── Restaurant — Setup ─────────────────────────────────────────\n");

  let accentColor;
  if (answers?.accentColor && COLOR_MAP.includes(answers.accentColor)) {
    accentColor = answers.accentColor;
    console.log(`  [answers] accentColor: ${accentColor}`);
  } else {
    const colorChoice = await askChoice(rl, "[1/1] Brand accent color?", COLOR_LABELS);
    accentColor = COLOR_MAP[(colorChoice ?? 1) - 1];
  }

  console.log(`\n─── Copying restaurant template ────────────────────────────────────\n`);
  copyTemplateFiles(TYPE);

  if (accentColor !== "indigo") {
    console.log(`\n─── Replacing accent color: indigo → ${accentColor} ──────────────────\n`);
    const colorFiles = [
      "app/[locale]/layout.tsx",
      "app/[locale]/components/About.tsx",
      "app/[locale]/components/Contact.tsx",
      "app/[locale]/components/FAQ.tsx",
      "app/[locale]/components/Hero.tsx",
      "app/[locale]/components/LanguageSwitcher.tsx",
      "app/[locale]/components/Menu.tsx",
      "app/[locale]/components/Navbar.tsx",
      "app/[locale]/components/Reviews.tsx",
      "app/[locale]/components/ScrollProgress.tsx",
    ];
    for (const f of colorFiles) replaceInFile(f, "indigo-", `${accentColor}-`);
  }
  console.log(`✓  Accent color: ${accentColor}`);

  return { type: TYPE, features: { accentColor }, sections: {} };
}

module.exports = { type: TYPE, setup, recolor, COLOR_MAP, COLOR_LABELS };
