#!/usr/bin/env node
// launchkit — Status
// Read-only: prints .launchkit type + current feature state. No prompts, no changes.
// Run: npm run status

const fs = require("fs");
const path = require("path");
const { ROOT } = require("./lib");

const LAUNCHKIT_PATH = path.join(ROOT, ".launchkit");

function readLaunchkit() {
  if (!fs.existsSync(LAUNCHKIT_PATH)) {
    console.error("\n  Error: .launchkit not found.\n  Run node scripts/setup.js first.\n");
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(LAUNCHKIT_PATH, "utf8"));
}

function detectCurrentState(type, compDir) {
  const exists = (rel) => fs.existsSync(path.join(ROOT, rel));
  if (type === "portfolio") {
    return [
      { key: "i18n",        label: "i18n routing",                   active: exists("i18n-config.ts") },
      { key: "webglHero",   label: "WebGL Hero (shader + parallax)", active: exists(`${compDir}/HeroFull.tsx`) },
      { key: "chatbot",     label: "Chatbot (Dialogflow ES)",         active: exists("app/api/chat/route.ts") },
      { key: "contactForm", label: "Contact Form (Resend API)",       active: exists("app/api/contact/route.ts") },
      { key: "testimonials",label: "Testimonials section",            active: exists(`${compDir}/Testimonials.tsx`) },
      { key: "work",        label: "Work section (project gallery)",  active: exists(`${compDir}/Work.tsx`) },
      { key: "sidebar",     label: "ProfileSidebar (sticky desktop)", active: exists(`${compDir}/ProfileSidebar.tsx`) },
    ];
  } else {
    return [
      { key: "i18n",        label: "i18n routing",              active: exists("i18n-config.ts") },
      { key: "contactForm", label: "Contact Form (Resend API)", active: exists("app/api/contact/route.ts") },
      { key: "floatingCTA", label: "FloatingCTA bar (mobile)",  active: exists(`${compDir}/FloatingCTA.tsx`) },
    ];
  }
}

const state = readLaunchkit();
const { type } = state;
const i18nActive = fs.existsSync(path.join(ROOT, "i18n-config.ts"));
const compDir = i18nActive ? "app/[locale]/components" : "app/components";

console.log("\n╔══════════════════════════════════════════╗");
console.log("║        launchkit — Status                ║");
console.log("╚══════════════════════════════════════════╝\n");

console.log(`  Template : ${type.charAt(0).toUpperCase() + type.slice(1)}`);
console.log(`  i18n     : ${i18nActive ? "enabled" : "disabled (collapsed)"}\n`);

const features = detectCurrentState(type, compDir);
for (const f of features) {
  const recorded = state.features?.[f.key];
  const drift = recorded !== undefined && recorded !== f.active ? " ⚠ drift" : "";
  console.log(`  ${f.active ? "✓" : "✗"}  ${f.label}${drift}`);
}

// Warn if any drift detected
if (features.some((f) => state.features?.[f.key] !== undefined && state.features[f.key] !== f.active)) {
  console.log("\n  ⚠  .launchkit is out of sync with actual file state.");
  console.log("     Run npm run toggle to reconcile, or npm run reset + setup.\n");
} else {
  console.log();
}
