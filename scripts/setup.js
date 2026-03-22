#!/usr/bin/env node
// launchkit — Setup Script
// Run: node scripts/setup.js --output ../ --name my-project
// Selects a template type, creates <output>/<name>/ with base scaffold + template,
// applies feature toggles, and runs npm install.

const readline = require("readline");
const fs = require("fs");
const path = require("path");
const { execSync, spawnSync } = require("child_process");
const { TOOL_ROOT, setTarget, target, ask, askChoice, writeLaunchkit, copyBaseScaffold, checkHelp, loadTemplates, loadPresets, loadSetupConfigs } = require("./lib");

checkHelp(`
launchkit — Setup

  Creates a new project from a template, then optionally applies a preset
  (an ordered bundle of sections — contact form, chatbot, sidebar, etc.).

Usage:
  node scripts/setup.js --name <name> --output <dir> [--<template>] [--preset <name|none>]

Options:
  --name <name>       Project folder name (required)
  --output <dir>      Parent directory for the project (required)
  --<template>        Use a specific template (skip type prompt)
                      Templates are auto-discovered from scripts/templates/
  --preset <name>     Apply a named preset non-interactively (use "none" to skip)
  -h, --help          Show this help message

Examples:
  node scripts/setup.js --name my-site --output ../
  node scripts/setup.js --name my-site --output ../ --portfolio
  node scripts/setup.js --name my-site --output ../ --portfolio --preset portfolio
  node scripts/setup.js --name my-site --output ../ --business --preset none
`);

const TEMPLATES = loadTemplates();

// ── Parse flags from argv ────────────────────────────────────────────────────

function parseFlag(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && process.argv[idx + 1] && !process.argv[idx + 1].startsWith("--")) {
    return process.argv[idx + 1];
  }
  return null;
}

// ── .env.example generation ───────────────────────────────────────────────────

function generateEnvExample(type, sections) {
  let env = `# ── Required ──────────────────────────────────────────────────────────────\nNEXT_PUBLIC_SITE_URL=https://YOUR_DOMAIN\n\n`;
  if (sections["contact-form"]) {
    env += `# ── Contact Form (Resend) ─────────────────────────────────────────────────\n# Sign up at https://resend.com — get your API key from the dashboard\nRESEND_API_KEY=re_...\n\n`;
  }
  if (type === "portfolio" && sections["chatbot"]) {
    env += `# ── Chatbot (Dialogflow ES) ───────────────────────────────────────────────\n# Create a Google Cloud service account with "Dialogflow API Client" role\n# Download the JSON key, stringify it, and paste as a single line below\nGOOGLE_CREDENTIALS={"type":"service_account","project_id":"..."}\nDIALOGFLOW_PROJECT_ID=your-dialogflow-project-id\n\n`;
  }
  fs.writeFileSync(path.join(target(), ".env.example"), env, "utf8");
  console.log("  [created] .env.example");
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║          launchkit — Setup               ║");
  console.log("╚══════════════════════════════════════════╝\n");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  // ── Resolve project name ───────────────────────────────────────────────────
  let projectName = parseFlag("--name");
  if (!projectName) {
    projectName = await new Promise((resolve) => {
      rl.question("Project name (e.g. my-project): ", (answer) => {
        resolve(answer.trim());
      });
    });
  }

  if (!projectName) {
    console.error("\n  Error: project name is required.\n  Usage: node scripts/setup.js --name my-project\n");
    rl.close();
    process.exit(1);
  }

  // Validate project name: no reserved Windows names, no special characters
  const RESERVED = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;
  const INVALID_CHARS = /[<>:"/\\|?*\x00-\x1f]/;
  if (RESERVED.test(projectName)) {
    console.error(`\n  Error: "${projectName}" is a reserved system name. Choose a different project name.\n`);
    rl.close();
    process.exit(1);
  }
  if (INVALID_CHARS.test(projectName)) {
    console.error(`\n  Error: project name contains invalid characters. Avoid: < > : " / \\ | ? *\n`);
    rl.close();
    process.exit(1);
  }
  if (projectName.startsWith(".") || projectName.startsWith("-")) {
    console.error(`\n  Error: project name cannot start with "." or "-".\n`);
    rl.close();
    process.exit(1);
  }

  // ── Resolve output directory ────────────────────────────────────────────────
  let outputDir = parseFlag("--output");
  if (!outputDir) {
    outputDir = await new Promise((resolve) => {
      rl.question("Output directory (e.g. ../): ", (answer) => {
        resolve(answer.trim());
      });
    });
  }

  if (!outputDir) {
    console.error("\n  Error: output directory is required.\n  Usage: node scripts/setup.js --output ../ --name my-project\n");
    rl.close();
    process.exit(1);
  }

  // Validate that the parent output directory exists
  const absParent = path.resolve(outputDir);
  if (!fs.existsSync(absParent)) {
    console.error(`\n  Error: output directory does not exist: ${absParent}\n`);
    rl.close();
    process.exit(1);
  }

  const absOutput = path.resolve(outputDir, projectName);
  setTarget(absOutput);

  if (fs.existsSync(path.join(absOutput, ".launchkit"))) {
    console.error(`\n  Error: ${absOutput} already contains a .launchkit file.`);
    console.error("  Run reset first, or choose a different directory.\n");
    rl.close();
    process.exit(1);
  }

  // If the directory already exists, check that it's empty (or contains only .git/)
  if (fs.existsSync(absOutput)) {
    const entries = fs.readdirSync(absOutput).filter((e) => e !== ".git");
    if (entries.length > 0) {
      console.error(`\n  Error: ${absOutput} is not empty.`);
      console.error("  Choose a different directory or clean it first.\n");
      rl.close();
      process.exit(1);
    }
  }

  fs.mkdirSync(absOutput, { recursive: true });
  console.log(`▸  Project: ${projectName}`);
  console.log(`▸  Output:  ${absOutput}\n`);

  // ── Resolve template type from argv or prompt ──────────────────────────────
  const templateKeys = Object.keys(TEMPLATES);
  const typeArg = templateKeys.find((k) => process.argv.includes(`--${k}`));
  let templateKey;
  if (typeArg) {
    console.log(`▸  Type: ${typeArg.charAt(0).toUpperCase() + typeArg.slice(1)} (from argument)\n`);
    templateKey = typeArg;
  } else {
    const descriptions = {
      portfolio: "Portfolio     — personal showcase (WebGL hero, sidebar, chatbot, project gallery)",
      business:  "Business Site — local business (services, reviews, FAQ, contact, footer)",
      blank:     "Blank         — minimal scaffold, no components (clean starting point)",
    };
    const choices = templateKeys.map((k) => descriptions[k] || k.charAt(0).toUpperCase() + k.slice(1));
    const choice = await askChoice(rl, "[0] Project type?", choices);
    templateKey = templateKeys[(choice ?? 1) - 1];
  }

  // ── Copy base scaffold ─────────────────────────────────────────────────────
  console.log("\n─── Copying base scaffold ──────────────────────────────────────\n");
  copyBaseScaffold();

  // ── Prompt for setup configs ───────────────────────────────────────────────
  const tmpl = TEMPLATES[templateKey];
  const setupConfigs = loadSetupConfigs().filter(
    (c) => !c.templates || c.templates.includes(tmpl.type)
  );
  const configAnswers = {};
  if (setupConfigs.length > 0) {
    console.log("\n─── Project configuration ──────────────────────────────────────\n");
  }
  for (const config of setupConfigs) {
    if (config.type === "boolean") {
      configAnswers[config.key] = await ask(rl, config.prompt);
    } else if (config.type === "select") {
      const choice = await askChoice(rl, config.prompt, config.labels ?? config.options);
      configAnswers[config.key] = config.options[(choice ?? 1) - 1];
    }
  }

  // ── Run template setup (copies template files + template-specific prompts) ─
  const result = await tmpl.setup(rl);

  // ── Apply setup config hooks ───────────────────────────────────────────────
  const lib = require("./lib");
  const ctx = { projectType: result.type, tmpl, lib };
  for (const config of setupConfigs) {
    if (config.hooks?.apply) {
      await config.hooks.apply({ ...ctx, enabled: configAnswers[config.key], value: configAnswers[config.key] });
    }
  }

  // ── Build features + write .launchkit ─────────────────────────────────────
  const features = { ...configAnswers, ...(result.features || {}) };

  // Write initial .launchkit now so preset sections.js child processes can read/update it
  writeLaunchkit({ name: projectName, type: result.type, features, sections: {} });
  console.log("  [created] .launchkit");

  // ── Preset selection ───────────────────────────────────────────────────────
  const matchingPresets = loadPresets().filter((p) => p.base === result.type);
  let chosenPreset = null;

  if (matchingPresets.length > 0) {
    const presetArg = parseFlag("--preset");
    if (presetArg) {
      if (presetArg !== "none") {
        chosenPreset = matchingPresets.find((p) => p.name === presetArg) || null;
        if (!chosenPreset) console.warn(`  [warn] preset "${presetArg}" not found — skipping`);
      }
    } else {
      console.log("\n─── Preset sections ────────────────────────────────────────────\n");
      const labels = [
        ...matchingPresets.map((p) => `${p.name} — ${p.description}`),
        "None (bare template, add sections later)",
      ];
      const choice = await askChoice(rl, "[?] Apply a preset?", labels);
      const idx = (choice ?? labels.length) - 1;
      chosenPreset = idx < matchingPresets.length ? matchingPresets[idx] : null;
    }
  }

  rl.close();

  // ── Apply preset sections (each runs sections.js with --no-install) ────────
  if (chosenPreset) {
    console.log(`\n─── Applying preset: ${chosenPreset.name} ─────────────────────────────\n`);
    for (const s of chosenPreset.sections) {
      const res = spawnSync(
        process.execPath,
        [
          path.join(TOOL_ROOT, "scripts/sections.js"),
          "--project", absOutput,
          "--add", s.name,
          "--variant", s.variant,
          "--yes",
          "--no-install",
        ],
        { stdio: "inherit" }
      );
      if (res.status !== 0) {
        console.error(`\n  [warn] Failed to add section "${s.name}" — continuing.\n`);
      }
    }
  }

  // ── npm install (single pass after all sections are applied) ──────────────
  console.log("\n─── Running npm install ─────────────────────────────────────────\n");
  try {
    execSync("npm install", { stdio: "inherit", cwd: absOutput });
  } catch (err) {
    console.error("\n  Error: npm install failed. Check the output above for details.");
    console.error("  You can retry manually: cd", absOutput, "&& npm install\n");
    process.exit(1);
  }

  // ── Read final .launchkit (sections updated by child processes) ────────────
  const finalState = JSON.parse(fs.readFileSync(path.join(absOutput, ".launchkit"), "utf8"));

  console.log("\n─── Generating .env.example ────────────────────────────────────\n");
  generateEnvExample(result.type, finalState.sections || {});

  const relOutput = path.relative(process.cwd(), absOutput);
  const bootstrapFile = path.join(TOOL_ROOT, `templates/presets/${result.type}/BOOTSTRAP.md`);
  const relBootstrap = path.relative(process.cwd(), bootstrapFile);

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║  Setup complete!                                             ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log("║  Next steps:                                                 ║");
  console.log(`║  1. cd ${relOutput.padEnd(53)}║`);
  console.log("║  2. Copy .env.example → .env.local and fill in values        ║");
  console.log(`║  3. Paste ${relBootstrap.padEnd(49)}║`);
  console.log("║     into a new Claude Code conversation                      ║");
  console.log("║  4. Replace placeholder images in public/                    ║");
  console.log("║  5. npm run dev  →  preview your site                        ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");
  console.log(`  To manage sections:    node scripts/sections.js --project ${relOutput}`);
  console.log(`  To manage components:  node scripts/components.js --project ${relOutput}`);
  console.log(`  To change config:      node scripts/config.js --project ${relOutput}\n`);
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
