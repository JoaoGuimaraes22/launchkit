#!/usr/bin/env node
// launchkit — Setup Script
// Run: node scripts/setup.js --output ../ --name my-project
// Selects a template type, creates <output>/<name>/ with base scaffold + template,
// applies feature toggles, and runs npm install.

const readline = require("readline");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { TOOL_ROOT, setTarget, target, askChoice, writeLaunchkit, copyBaseScaffold, checkHelp, loadTemplates } = require("./lib");

checkHelp(`
launchkit — Setup

  Creates a new project from a template with optional features.

Usage:
  node scripts/setup.js --name <name> --output <dir> [--<template>]

Options:
  --name <name>       Project folder name (required)
  --output <dir>      Parent directory for the project (required)
  --<template>        Use a specific template (skip type prompt)
                      Templates are auto-discovered from scripts/templates/
  -h, --help          Show this help message

Examples:
  node scripts/setup.js --name my-site --output ../
  node scripts/setup.js --name my-site --output ../ --portfolio
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

  // ── Run template setup ─────────────────────────────────────────────────────
  const tmpl = TEMPLATES[templateKey];
  const result = await tmpl.setup(rl);
  rl.close();

  console.log("\n─── Generating .env.example ────────────────────────────────────\n");
  generateEnvExample(result.type, result.sections || {});

  console.log("\n─── Running npm install ─────────────────────────────────────────\n");
  try {
    execSync("npm install", { stdio: "inherit", cwd: absOutput });
  } catch (err) {
    console.error("\n  Error: npm install failed. Check the output above for details.");
    console.error("  You can retry manually: cd", absOutput, "&& npm install\n");
    process.exit(1);
  }

  writeLaunchkit({ name: projectName, type: result.type, features: result.features, sections: result.sections || {} });
  console.log("  [created] .launchkit");

  const relOutput = path.relative(process.cwd(), absOutput);
  const bootstrapFile = path.join(TOOL_ROOT, `templates/${result.type}/BOOTSTRAP.md`);
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
  console.log(`  To manage sections later:`);
  console.log(`    node scripts/sections.js --project ${relOutput}`);
  console.log(`  To change project config (i18n, accent color):`);
  console.log(`    node scripts/config.js --project ${relOutput}\n`);

  // Warn about steps that still require Claude to finish
  const s = result.sections || {};
  const hasTodos =
    !result.features.i18n ||
    (result.type === "portfolio" && (!s["contact-form"] || !s["sidebar"]));
  if (hasTodos) {
    console.log("⚠  Some steps require Claude to finish:");
    if (!result.features.i18n) console.log("   • Collapse app/[locale]/ routing (i18n disabled)");
    if (result.type === "portfolio" && !s["contact-form"]) console.log("   • Remove form JSX from Contact.tsx");
    if (result.type === "portfolio" && !s["sidebar"]) console.log("   • Simplify page.tsx sidebar layout");
    console.log(`   → Paste ${relBootstrap} into Claude Code to handle these.\n`);
  }
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
