#!/usr/bin/env node
// launchkit — Component management (add / remove / status)
//
// Usage:
//   node scripts/components.js [--project <path>]
//   node scripts/components.js [--project <path>] --add <name> [--variant <v>] [--yes] [--no-install]
//   node scripts/components.js [--project <path>] --remove
//   node scripts/components.js [--project <path>] --status

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const {
  setTarget,
  target,
  readLaunchkit,
  writeLaunchkit,
  replaceInFile,
  addDependency,
  removeDependency,
  deleteIfExists,
  parseProjectFlag,
  checkHelp,
  ask,
  askChoice,
  discoverComponents,
  detectInstalledComponents,
} = require("./lib");

checkHelp(`
launchkit — Components

  Add and remove reusable UI atoms (Button, Card, Modal, etc.) to/from a project.
  Components are copied to {compDir}/ui/ and are ready to import anywhere.

Usage:
  node scripts/components.js [--project <path>]
  node scripts/components.js [--project <path>] --add <name> [--variant <v>] [--yes] [--no-install]
  node scripts/components.js [--project <path>] --remove
  node scripts/components.js [--project <path>] --status

Options:
  --project <path>    Path to the generated project (default: cwd)
  --add <name>        Add a component non-interactively
  --variant <v>       Variant to use (default: first available)
  --yes               Skip confirmation prompt
  --no-install        Skip npm install (useful when batching multiple adds)
  --remove            Interactive remove flow
  --status            List installed and available components
  -h, --help          Show this help message

Examples:
  node scripts/components.js --project ../my-site
  node scripts/components.js --project ../my-site --status
  node scripts/components.js --project ../my-site --add button --variant primary --yes
  node scripts/components.js --project ../my-site --remove
`);

// ── Resolve project context ───────────────────────────────────────────────────

const projectDir = parseProjectFlag();
setTarget(projectDir);

const state = readLaunchkit();
const i18nActive = fs.existsSync(path.join(projectDir, "i18n-config.ts"));
const compDir = i18nActive ? "app/[locale]/components" : "app/components";
const accentColor = (state.features && state.features.accentColor) || "indigo";

// ── Mode dispatch ─────────────────────────────────────────────────────────────

const isRemove    = process.argv.includes("--remove");
const isStatus    = process.argv.includes("--status");

function getFlag(name) {
  const idx = process.argv.indexOf(name);
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : null;
}
const addName      = getFlag("--add");
const addVariant   = getFlag("--variant");
const addYes       = process.argv.includes("--yes");
const addNoInstall = process.argv.includes("--no-install");

if (isStatus) {
  showStatus();
} else if (addName) {
  addNonInteractive(addName, addVariant, addYes, addNoInstall)
    .catch((err) => { console.error("\n  Error:", err.message); process.exit(1); });
} else {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  (isRemove ? removeFlow(rl) : addFlow(rl))
    .catch((err) => { console.error("\n  Error:", err.message); process.exit(1); })
    .finally(() => rl.close());
}

// ── Status ────────────────────────────────────────────────────────────────────

function showStatus() {
  const allComponents = discoverComponents();
  const installed = detectInstalledComponents(compDir, state.components);

  console.log(`\n  Component status for ${state.name}:\n`);

  if (allComponents.length === 0) {
    console.log("  No components found in templates/components/.\n");
    return;
  }

  for (const comp of allComponents) {
    const inst = installed[comp.name];
    const status = inst ? `✓ installed (${inst.variant})` : "  available";
    const allVariantNames = comp.variants.map((v) => v.name).join(", ");
    console.log(`  ${status}  ${comp.name}  [${allVariantNames}]`);
  }
  console.log();
}

// ── Non-interactive add ───────────────────────────────────────────────────────

async function addNonInteractive(componentName, variantName, skipConfirm, noInstall = false) {
  const allComponents = discoverComponents();
  const installed = detectInstalledComponents(compDir, state.components);

  const comp = allComponents.find((c) => c.name === componentName);
  if (!comp) {
    console.error(`\n  Error: component "${componentName}" not found.`);
    console.error(`  Available: ${allComponents.map((c) => c.name).join(", ")}\n`);
    process.exit(1);
  }

  if (installed[componentName]) {
    console.error(`\n  Error: component "${componentName}" is already installed.\n`);
    process.exit(1);
  }

  let variant;
  if (variantName) {
    variant = comp.variants.find((v) => v.name === variantName);
    if (!variant) {
      console.error(`\n  Error: variant "${variantName}" not found for component "${componentName}".`);
      console.error(`  Available: ${comp.variants.map((v) => v.name).join(", ")}\n`);
      process.exit(1);
    }
  } else {
    variant = comp.variants[0];
    if (comp.variants.length > 1) {
      console.log(`  Using default variant: ${variant.name} (pass --variant to override)`);
    }
  }

  if (!skipConfirm) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const confirmed = await ask(rl, `\n  Add ${componentName} (${variant.name})?`);
    rl.close();
    if (!confirmed) { console.log("  Cancelled."); return; }
  }

  console.log(`\n─── Adding ${componentName} (${variant.name}) ──────────────────────────\n`);
  standardEnable(componentName, variant);

  state.components[componentName] = { variant: variant.name, addedAt: new Date().toISOString() };
  writeLaunchkit(state);

  if (variant.meta.dependencies && variant.meta.dependencies.length > 0 && !noInstall) {
    console.log("\n  Running npm install...");
    require("child_process").execSync("npm install", { cwd: projectDir, stdio: "inherit" });
  }

  const destPath = `${compDir}/ui/${variant.meta.componentName}.tsx`;
  console.log(`\n✓  ${variant.meta.componentName} added → ${destPath}\n`);
}

// ── Interactive add flow ──────────────────────────────────────────────────────

async function addFlow(rl) {
  const allComponents = discoverComponents();
  const installed = detectInstalledComponents(compDir, state.components);
  const available = allComponents.filter((c) => !installed[c.name]);

  if (available.length === 0) {
    console.log("\n  No components available to add.\n");
    return;
  }

  // 1. Pick component
  const compChoice = await askChoice(
    rl,
    "\n  Which component would you like to add?",
    available.map((c) => {
      const desc = c.variants[0].meta.description || c.name;
      return `${c.name} — ${desc}`;
    })
  );
  if (!compChoice) { console.log("  Cancelled."); return; }
  const comp = available[compChoice - 1];

  // 2. Pick variant (if multiple)
  let variant;
  if (comp.variants.length === 1) {
    variant = comp.variants[0];
    console.log(`  Using variant: ${variant.name}`);
  } else {
    const variantChoice = await askChoice(
      rl,
      "\n  Which variant?",
      comp.variants.map((v) => v.name)
    );
    if (!variantChoice) { console.log("  Cancelled."); return; }
    variant = comp.variants[variantChoice - 1];
  }

  // 3. Confirm
  const confirmed = await ask(rl, `\n  Add ${comp.name} (${variant.name})?`);
  if (!confirmed) { console.log("  Cancelled."); return; }

  // 4. Execute
  console.log(`\n─── Adding ${comp.name} (${variant.name}) ──────────────────────────\n`);
  standardEnable(comp.name, variant);

  state.components[comp.name] = { variant: variant.name, addedAt: new Date().toISOString() };
  writeLaunchkit(state);

  if (variant.meta.dependencies && variant.meta.dependencies.length > 0) {
    console.log("\n  Running npm install...");
    require("child_process").execSync("npm install", { cwd: projectDir, stdio: "inherit" });
  }

  const destPath = `${compDir}/ui/${variant.meta.componentName}.tsx`;
  console.log(`\n✓  ${variant.meta.componentName} added → ${destPath}\n`);
}

// ── Remove flow ───────────────────────────────────────────────────────────────

async function removeFlow(rl) {
  const installed = detectInstalledComponents(compDir, state.components);
  const installedNames = Object.keys(installed);

  if (installedNames.length === 0) {
    console.log("\n  No components installed.\n");
    return;
  }

  const choice = await askChoice(
    rl,
    "\n  Which component would you like to remove?",
    installedNames.map((name) => `${name} (${installed[name].variant})`)
  );
  if (!choice) { console.log("  Cancelled."); return; }
  const componentName = installedNames[choice - 1];
  const { meta } = installed[componentName];

  const confirmed = await ask(rl, `\n  Remove ${componentName}?`);
  if (!confirmed) { console.log("  Cancelled."); return; }

  console.log(`\n─── Removing ${componentName} ──────────────────────────────────────\n`);
  standardDisable(componentName, meta);

  delete state.components[componentName];
  writeLaunchkit(state);

  if (meta.dependencies && meta.dependencies.length > 0) {
    console.log("\n  Running npm install...");
    require("child_process").execSync("npm install", { cwd: projectDir, stdio: "inherit" });
  }

  console.log(`\n✓  ${meta.componentName} removed.\n`);
}

// ── Standard enable ───────────────────────────────────────────────────────────

function standardEnable(componentName, variant) {
  const { meta, dir: variantDir } = variant;

  // a. Ensure ui/ subdir exists in compDir
  const uiDir = path.join(target(), compDir, "ui");
  fs.mkdirSync(uiDir, { recursive: true });

  // b. Copy component.tsx → compDir/ui/ComponentName.tsx
  const src = path.join(variantDir, "component.tsx");
  const dest = path.join(uiDir, `${meta.componentName}.tsx`);
  fs.copyFileSync(src, dest);
  console.log(`  [copied] component.tsx → ${compDir}/ui/${meta.componentName}.tsx`);

  // c. Apply accent color swap if the component uses a different token
  if (meta.accentColorToken && accentColor !== meta.accentColorToken) {
    replaceInFile(
      path.join(compDir, "ui", `${meta.componentName}.tsx`),
      meta.accentColorToken + "-",
      accentColor + "-"
    );
  }

  // d. Add npm dependencies to package.json
  if (meta.dependencies) {
    for (const [pkg, version] of meta.dependencies) {
      addDependency(pkg, version);
    }
  }
}

// ── Standard disable ──────────────────────────────────────────────────────────

function standardDisable(componentName, meta) {
  // a. Delete component file
  const compFile = `${compDir}/ui/${meta.componentName}.tsx`;
  deleteIfExists(compFile);
  console.log(`  [deleted] ${compFile}`);

  // b. Remove npm dependencies
  if (meta.dependencies) {
    for (const [pkg] of meta.dependencies) {
      removeDependency(pkg);
    }
  }
}
