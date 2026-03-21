#!/usr/bin/env node
// launchkit — Setup Script
// Run: node scripts/setup.js --output ../my-project
// Selects a template type, copies base scaffold + template into the output directory,
// applies feature toggles, and runs npm install.

const readline = require("readline");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { TOOL_ROOT, setTarget, target, askChoice, writeLaunchkit, copyBaseScaffold } = require("./lib");

const TEMPLATES = {
  portfolio: require("./templates/portfolio"),
  business:  require("./templates/business"),
  blank:     require("./templates/blank"),
};

// ── Parse --output from argv ─────────────────────────────────────────────────

function parseOutputFlag() {
  const idx = process.argv.indexOf("--output");
  if (idx !== -1 && process.argv[idx + 1]) {
    return process.argv[idx + 1];
  }
  return null;
}

// ── .env.example generation ───────────────────────────────────────────────────

function generateEnvExample(type, features) {
  let env = `# ── Required ──────────────────────────────────────────────────────────────\nNEXT_PUBLIC_SITE_URL=https://YOUR_DOMAIN\n\n`;
  if (features.contactForm) {
    env += `# ── Contact Form (Resend) ─────────────────────────────────────────────────\n# Sign up at https://resend.com — get your API key from the dashboard\nRESEND_API_KEY=re_...\n\n`;
  }
  if (type === "portfolio" && features.chatbot) {
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

  // ── Resolve output directory ────────────────────────────────────────────────
  let outputPath = parseOutputFlag();
  if (!outputPath) {
    outputPath = await new Promise((resolve) => {
      rl.question("Output directory (e.g. ../my-project): ", (answer) => {
        resolve(answer.trim());
      });
    });
  }

  if (!outputPath) {
    console.error("\n  Error: output directory is required.\n  Usage: node scripts/setup.js --output ../my-project\n");
    rl.close();
    process.exit(1);
  }

  const absOutput = path.resolve(outputPath);
  setTarget(absOutput);

  if (fs.existsSync(path.join(absOutput, ".launchkit"))) {
    console.error(`\n  Error: ${outputPath} already contains a .launchkit file.`);
    console.error("  Run reset first, or choose a different directory.\n");
    rl.close();
    process.exit(1);
  }

  fs.mkdirSync(absOutput, { recursive: true });
  console.log(`▸  Output: ${absOutput}\n`);

  // ── Resolve template type from argv or prompt ──────────────────────────────
  const typeFlags = ["--portfolio", "--business", "--blank"];
  const typeArg = process.argv.find((a) => typeFlags.includes(a));
  let templateKey;
  if (typeArg === "--portfolio") {
    console.log("▸  Type: Portfolio (from argument)\n");
    templateKey = "portfolio";
  } else if (typeArg === "--business") {
    console.log("▸  Type: Business Site (from argument)\n");
    templateKey = "business";
  } else if (typeArg === "--blank") {
    console.log("▸  Type: Blank (from argument)\n");
    templateKey = "blank";
  } else {
    const choice = await askChoice(rl, "[0] Project type?", [
      "Portfolio     — personal showcase (WebGL hero, sidebar, chatbot, project gallery)",
      "Business Site — local business (services, reviews, FAQ, contact, footer)",
      "Blank         — minimal scaffold, no components (clean starting point)",
    ]);
    const keys = ["portfolio", "business", "blank"];
    templateKey = keys[(choice ?? 1) - 1];
  }

  // ── Copy base scaffold ─────────────────────────────────────────────────────
  console.log("\n─── Copying base scaffold ──────────────────────────────────────\n");
  copyBaseScaffold();

  // ── Run template setup ─────────────────────────────────────────────────────
  const tmpl = TEMPLATES[templateKey];
  const result = await tmpl.setup(rl);
  rl.close();

  console.log("\n─── Generating .env.example ────────────────────────────────────\n");
  generateEnvExample(result.type, result.features);

  console.log("\n─── Running npm install ─────────────────────────────────────────\n");
  try {
    execSync("npm install", { stdio: "inherit", cwd: absOutput });
  } catch {
    console.warn("  npm install encountered warnings — check output above.");
  }

  writeLaunchkit({ type: result.type, features: result.features });
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
  console.log(`  To toggle features later:`);
  console.log(`    node scripts/toggle.js --project ${relOutput}\n`);

  // Warn about steps that still require Claude to finish
  const f = result.features;
  const hasTodos =
    !f.i18n ||
    (result.type === "portfolio" && (!f.contactForm || !f.sidebar));
  if (hasTodos) {
    console.log("⚠  Some steps require Claude to finish:");
    if (!f.i18n) console.log("   • Collapse app/[locale]/ routing (i18n disabled)");
    if (result.type === "portfolio" && !f.contactForm) console.log("   • Remove form JSX from Contact.tsx");
    if (result.type === "portfolio" && !f.sidebar) console.log("   • Simplify page.tsx sidebar layout");
    console.log(`   → Paste ${relBootstrap} into Claude Code to handle these.\n`);
  }
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
