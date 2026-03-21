#!/usr/bin/env node
// launchkit — Project Config
// Manages project-wide settings: i18n status display, accent color recolor.
// Run: node scripts/config.js --project ../my-project

const readline = require("readline");
const fs = require("fs");
const path = require("path");
const { target, setTarget, parseProjectFlag, readLaunchkit, writeLaunchkit, askChoice, checkHelp, loadTemplates } = require("./lib");

checkHelp(`
launchkit — Config

  View and update project-wide settings (i18n, accent color).

Usage:
  node scripts/config.js [--project <path>]

Options:
  --project <path>    Path to the generated project (default: cwd)
  -h, --help          Show this help message

Examples:
  node scripts/config.js --project ../my-site
  cd ../my-site && node ../launchkit/scripts/config.js
`);

// ── Resolve target project ───────────────────────────────────────────────────
setTarget(parseProjectFlag());

const TEMPLATES = loadTemplates();

async function main() {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║        launchkit — Config                ║");
  console.log("╚══════════════════════════════════════════╝");

  const state = readLaunchkit();
  const { type } = state;
  const tmpl = TEMPLATES[type] ?? TEMPLATES.blank;

  const i18nActive = fs.existsSync(path.join(target(), "i18n-config.ts"));
  const compDir = i18nActive ? "app/[locale]/components" : "app/components";
  const layoutFile = i18nActive ? "app/[locale]/layout.tsx" : "app/layout.tsx";

  console.log(`\n  Template : ${type.charAt(0).toUpperCase() + type.slice(1)}`);
  console.log(`  Project  : ${target()}`);
  console.log(`  i18n     : ${i18nActive ? "enabled" : "disabled (collapsed)"}`);

  // Build menu options
  const options = [
    { key: "i18n", label: `i18n routing — ${i18nActive ? "enabled" : "disabled"} (requires reset + setup to change)` },
  ];

  if (tmpl.recolor) {
    const currentColor = state.features?.accentColor ?? "indigo";
    options.push({ key: "accentColor", label: `Brand accent color — current: ${currentColor}` });
  }

  if (options.length === 1 && !tmpl.recolor) {
    console.log("\n  No configurable settings for this template.");
    console.log("  i18n routing can only be changed via reset + setup.\n");
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    const choice = await askChoice(rl, "\n  Select setting to configure:", options.map((o) => o.label));
    if (!choice) { console.log("\n  Cancelled.\n"); return; }

    const selected = options[choice - 1];

    if (selected.key === "i18n") {
      console.log("\n  i18n routing cannot be toggled in-place.");
      console.log("  Run reset + setup to change this setting.\n");
      return;
    }

    if (selected.key === "accentColor") {
      const fromColor = state.features?.accentColor ?? "indigo";
      const colorChoice = await askChoice(rl, `\n  Current color: ${fromColor}\n  Select new accent color:`, tmpl.COLOR_LABELS);
      if (!colorChoice) { console.log("\n  Cancelled.\n"); return; }
      const toColor = tmpl.COLOR_MAP[colorChoice - 1];
      if (toColor === fromColor) {
        console.log("\n  No change — same color selected.\n");
        return;
      }
      console.log(`\n─── Recoloring: ${fromColor} → ${toColor} ────────────────────────────────────\n`);
      tmpl.recolor(fromColor, toColor, compDir, layoutFile);
      if (!state.features) state.features = {};
      state.features.accentColor = toColor;
      writeLaunchkit(state);
      console.log(`\n  Accent color updated: ${fromColor} → ${toColor}.`);
      console.log("  Run npm run dev to preview.\n");
    }
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error("Config failed:", err);
  process.exit(1);
});
