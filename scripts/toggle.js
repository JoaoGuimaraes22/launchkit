#!/usr/bin/env node
// launchkit — Feature Toggle
// Run: node scripts/toggle.js --project ../my-project
// Shows current feature state and lets you enable/disable individual features
// without a full reset + re-setup.

const readline = require("readline");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { target, setTarget, parseProjectFlag, ask, askChoice, readLaunchkit, writeLaunchkit } = require("./lib");

// ── Resolve target project ───────────────────────────────────────────────────
setTarget(parseProjectFlag());

const TEMPLATES = {
  portfolio: require("./templates/portfolio"),
  business:  require("./templates/business"),
  blank:     require("./templates/blank"),
};

// ── Main toggle loop ──────────────────────────────────────────────────────────

async function runToggle(rl) {
  const state = readLaunchkit();
  const { type } = state;
  const tmpl = TEMPLATES[type] ?? TEMPLATES.blank;

  const i18nActive  = fs.existsSync(path.join(target(), "i18n-config.ts"));
  const compDir     = i18nActive ? "app/[locale]/components" : "app/components";
  const pageFile    = i18nActive ? "app/[locale]/page.tsx"   : "app/page.tsx";
  const layoutFile  = i18nActive ? "app/[locale]/layout.tsx" : "app/layout.tsx";

  const current  = tmpl.detectState(compDir);
  const features = tmpl.featureList;

  // Warn if .launchkit recorded state diverges from actual files
  const drifted = features.filter(
    (f) => !f.unsupported && !f.recolor &&
           state.features?.[f.key] !== undefined &&
           state.features[f.key] !== current[f.key]
  );
  if (drifted.length > 0) {
    console.log("\n  ⚠  Feature state mismatch (.launchkit vs actual files):");
    for (const f of drifted) {
      const recorded = state.features[f.key] ? "enabled" : "disabled";
      const actual   = current[f.key]         ? "enabled" : "disabled";
      console.log(`     ${f.label}: recorded=${recorded}, actual=${actual}`);
    }
    console.log("     Proceeding with actual file state.\n");
  }

  console.log(`\n  Template : ${type.charAt(0).toUpperCase() + type.slice(1)}`);
  console.log(`  Project  : ${target()}`);
  console.log(`  i18n     : ${i18nActive ? "enabled" : "disabled (collapsed)"}\n`);

  features.forEach((f, i) => {
    let icon, suffix;
    if (f.unsupported) {
      icon = "⚠ "; suffix = " (requires reset + setup)";
    } else if (f.recolor) {
      const cur = state.features?.accentColor ?? "indigo";
      icon = "● "; suffix = ` (current: ${cur})`;
    } else {
      icon = current[f.key] ? "✓ " : "✗ "; suffix = "";
    }
    console.log(`  [${i + 1}] ${icon} ${f.label}${suffix}`);
  });

  const choice = await askChoice(rl, "\nSelect feature to toggle", features.map((f) => f.label));

  if (choice === null) {
    console.log("\n  Invalid choice. Exiting.\n");
    return false;
  }

  const selected = features[choice - 1];

  if (selected.unsupported) {
    console.log(`\n  ⚠  i18n routing cannot be toggled in-place.\n  Run reset + setup to change this setting.\n`);
    return false;
  }

  // ── Recolor (business accent color) ──────────────────────────────────────────
  if (selected.recolor) {
    const fromColor = state.features?.accentColor ?? "indigo";
    const colorChoice = await askChoice(rl, `\n  Current color: ${fromColor}\n  Select new accent color`, tmpl.COLOR_LABELS);
    const toColor = tmpl.COLOR_MAP[(colorChoice ?? 1) - 1];
    if (toColor === fromColor) {
      console.log("\n  No change — same color selected.\n");
      return false;
    }
    console.log(`\n─── Recoloring: ${fromColor} → ${toColor} ────────────────────────────────────\n`);
    tmpl.recolor(fromColor, toColor, compDir, layoutFile);
    state.features.accentColor = toColor;
    writeLaunchkit(state);
    console.log(`\n✓  Accent color updated: ${fromColor} → ${toColor}.`);
    return true;
  }

  // ── Enable / disable ──────────────────────────────────────────────────────────
  const isCurrentlyEnabled = current[selected.key];
  const action = isCurrentlyEnabled ? "disable" : "enable";
  const confirmed = await ask(rl, `\n  ${action.charAt(0).toUpperCase() + action.slice(1)} "${selected.label}"?`);

  if (!confirmed) {
    console.log("\n  Cancelled.\n");
    return false;
  }

  console.log(`\n─── ${action.charAt(0).toUpperCase() + action.slice(1)}ing: ${selected.label} ────────────────────────────────────\n`);

  const ctx = { compDir, pageFile, layoutFile, i18nActive, current, state };

  try {
    if (action === "enable") {
      tmpl.enable(selected.key, ctx);
    } else {
      tmpl.disable(selected.key, ctx);
    }
  } catch (err) {
    console.error("\n  Error during toggle:", err.message);
    console.error("  Some changes may be partial. Check the files above and fix manually if needed.\n");
    process.exit(1);
  }

  state.features[selected.key] = action === "enable";
  writeLaunchkit(state);

  // Run npm install if deps may have changed
  if (["chatbot", "contactForm"].includes(selected.key)) {
    console.log("\n─── Running npm install ─────────────────────────────────────────\n");
    try {
      execSync("npm install", { stdio: "inherit", cwd: target() });
    } catch {
      console.warn("  npm install encountered warnings — check output above.");
    }
  }

  console.log(`\n✓  ${selected.label} ${action}d.`);
  if (selected.key === "sidebar" && action === "enable") {
    console.log("  ⚠  page.tsx may still have the old single-column layout.");
    console.log("     Run Bootstrap or manually restore the md:flex sidebar wrapper.");
  }
  if (selected.key === "sidebar" && action === "disable") {
    console.log("  ⚠  page.tsx still has the sidebar layout JSX — Bootstrap or");
    console.log("     Claude Code will clean it up (look for the TODO comment).");
  }

  return true;
}

async function main() {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║      launchkit — Toggle Features         ║");
  console.log("╚══════════════════════════════════════════╝");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    while (true) {
      const toggled = await runToggle(rl);
      if (!toggled) break;
      const again = await ask(rl, "  Toggle another feature?");
      if (!again) break;
    }
  } finally {
    rl.close();
  }

  console.log("  Run npm run dev to preview.\n");
}

main().catch((err) => {
  console.error("Toggle failed:", err);
  process.exit(1);
});
