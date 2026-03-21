#!/usr/bin/env node
// launchkit — Status
// Read-only: prints .launchkit type, project config, and installed sections.
// Run: node scripts/status.js --project ../my-project

const fs = require("fs");
const path = require("path");
const { target, setTarget, parseProjectFlag, readLaunchkit, checkHelp, discoverSections, detectInstalledSections } = require("./lib");

checkHelp(`
launchkit — Status

  Read-only display of template type, project config, and installed sections.

Usage:
  node scripts/status.js [--project <path>]

Options:
  --project <path>    Path to the generated project (default: cwd)
  -h, --help          Show this help message

Examples:
  node scripts/status.js --project ../my-site
`);

// ── Resolve target project ───────────────────────────────────────────────────
setTarget(parseProjectFlag());

const state       = readLaunchkit();
const { type }    = state;
const i18nActive  = fs.existsSync(path.join(target(), "i18n-config.ts"));
const compDir     = i18nActive ? "app/[locale]/components" : "app/components";

console.log("\n╔══════════════════════════════════════════╗");
console.log("║        launchkit — Status                ║");
console.log("╚══════════════════════════════════════════╝\n");

console.log(`  Template : ${type.charAt(0).toUpperCase() + type.slice(1)}`);
console.log(`  Project  : ${target()}`);
console.log(`  i18n     : ${i18nActive ? "enabled" : "disabled (collapsed)"}`);
if (state.features?.accentColor) {
  console.log(`  Accent   : ${state.features.accentColor}`);
}

// ── Sections ─────────────────────────────────────────────────────────────────

const allSections = discoverSections();
const installed = detectInstalledSections(compDir, state.sections, type);

const compatible = allSections.filter((s) =>
  s.variants.some((v) => v.meta.templates.includes(type))
);

if (compatible.length > 0) {
  console.log("\n  Sections:");
  for (const section of compatible) {
    const inst = installed[section.name];
    const icon = inst ? "✓" : "✗";
    const variant = inst ? ` (${inst.variant})` : "";
    const variantNames = section.variants
      .filter((v) => v.meta.templates.includes(type))
      .map((v) => v.name)
      .join(", ");
    console.log(`  ${icon}  ${section.name}${variant}  [${variantNames}]`);
  }

  // Check for drift between .launchkit sections and actual files
  const recordedNames = Object.keys(state.sections || {});
  const installedNames = Object.keys(installed);
  const drifted = recordedNames.filter((n) => !installedNames.includes(n))
    .concat(installedNames.filter((n) => !recordedNames.includes(n)));
  if (drifted.length > 0) {
    console.log("\n  ⚠  .launchkit sections out of sync with actual files.");
    console.log("     Use sections.js --status for detailed view.\n");
  } else {
    console.log();
  }
} else {
  console.log("\n  No sections available for this template type.\n");
}
