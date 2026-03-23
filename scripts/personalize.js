#!/usr/bin/env node
// launchkit — Personalize
// Replaces YOUR_* placeholders with real client content.
// Run: node scripts/personalize.js --project ../my-site
//      node scripts/personalize.js --project ../my-site --profile client.json

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { execSync } = require("child_process");
const {
  target, setTarget, parseProjectFlag, readLaunchkit, checkHelp, replaceInFile, LOCALES,
} = require("./lib");

checkHelp(`
launchkit — Personalize

  Replaces YOUR_* placeholders with real client content.
  Supports interactive prompts or batch injection from a JSON profile.

Usage:
  node scripts/personalize.js [--project <path>]
  node scripts/personalize.js [--project <path>] --profile <client.json>

Options:
  --project <path>    Path to the generated project (default: cwd)
  --profile <path>    Path to a JSON profile for batch replacement
  -h, --help          Show this help message

Profile format:
  {
    "BUSINESS": "Joe's HVAC",
    "PHONE": "+971-50-123-4567",
    "EMAIL": "joe@joeshvac.ae",
    "ADDRESS": "Dubai, UAE",
    "WHATSAPP_NUMBER": "971501234567",
    "DOMAIN": "joeshvac.ae"
  }

  Keys match YOUR_* placeholder names (without YOUR_).
  Partial profiles are accepted — only matching keys are replaced.
  Apify envelope format ({ "result": { ... } }) is also accepted.

Examples:
  node scripts/personalize.js --project ../my-site
  node scripts/personalize.js --project ../my-site --profile scraped.json
`);

// ── Resolve target project ───────────────────────────────────────────────────
setTarget(parseProjectFlag());

function getFlag(name) {
  const idx = process.argv.indexOf(name);
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : null;
}

// ── Placeholder maps (template-aware) ────────────────────────────────────────

// Each entry: { key, label, description?, targets(ctx) }
// targets(ctx) returns array of relative file paths to apply replacement in.

const PLACEHOLDER_MAP = {
  business: [
    {
      key: "BUSINESS",
      label: "Business name",
      description: "Used in navbar logo, page title, footer, and JSON-LD structured data",
      targets: (ctx) => [...ctx.dictFiles, ctx.layoutFile],
    },
    {
      key: "PHONE",
      label: "Phone number",
      description: "E.g. +971-50-123-4567  (contact section, footer, floating-cta)",
      targets: (ctx) => [...ctx.dictFiles, ctx.layoutFile],
    },
    {
      key: "EMAIL",
      label: "Email address",
      targets: (ctx) => [...ctx.dictFiles, ctx.layoutFile, ...ctx.apiFiles],
    },
    {
      key: "ADDRESS",
      label: "Street address",
      description: "Used in contact section, footer, and JSON-LD structured data",
      targets: (ctx) => [...ctx.dictFiles, ctx.layoutFile],
    },
    {
      key: "WHATSAPP_NUMBER",
      label: "WhatsApp number (digits only, no + or spaces)",
      description: "E.g. 971501234567",
      targets: (ctx) => ctx.dictFiles,
    },
    {
      key: "DOMAIN",
      label: "Domain (without https://)",
      description: "E.g. joeshvac.ae — used in SITE_URL, sitemap, and robots",
      targets: (ctx) => [ctx.layoutFile, "app/robots.ts", "app/sitemap.ts"],
      // Special: also replace YOUR_DOMAIN.vercel.app (SITE_URL default)
      special: "domain",
    },
    {
      key: "CUISINE",
      label: "Cuisine type",
      description: "E.g. Italian, Burgers, Sushi — used in page title and JSON-LD",
      condition: (state) => state.type === "restaurant",
      targets: (ctx) => [ctx.layoutFile],
    },
    {
      key: "CITY",
      label: "City name",
      description: "E.g. Lisbon, Dubai — used in page title and JSON-LD address",
      condition: (state) => state.type === "restaurant",
      targets: (ctx) => [ctx.layoutFile],
    },
    {
      key: "COUNTRY_CODE",
      label: "Country code (ISO 3166-1 alpha-2)",
      description: "E.g. PT, AE, US — used in JSON-LD address",
      condition: (state) => state.type === "restaurant",
      targets: (ctx) => [ctx.layoutFile],
    },
    // ── Section-specific (only prompted when section is installed) ────────────
    {
      key: "ORDER_URL",
      label: "Online ordering / reservation URL",
      description: "reserve-bar: link to TheFork, OpenTable, or takeaway platform",
      condition: (state) => !!state.sections?.["reserve-bar"],
      targets: (ctx) => ctx.dictFiles,
    },
    {
      key: "MAPS_EMBED_URL",
      label: "Google Maps embed URL",
      description: "contact/map: Maps → Share → Embed a map → copy iframe src attribute",
      condition: (state) => !!state.sections?.["contact"],
      targets: (ctx) => ctx.dictFiles,
    },
    {
      key: "MAPS_DIRECTIONS_URL",
      label: "Google Maps directions URL",
      description: "contact/map: google.com/maps?q=... link for 'Get directions' button",
      condition: (state) => !!state.sections?.["contact"],
      targets: (ctx) => ctx.dictFiles,
    },
    {
      key: "GOOGLE_REVIEW_URL",
      label: "Google Review URL",
      description: "google-reviews: your Google Business review link (Maps → Get more reviews)",
      condition: (state) => !!state.sections?.["google-reviews"],
      targets: (ctx) => ctx.componentFiles,
    },
    {
      key: "CALENDLY_URL",
      label: "Calendly scheduling URL",
      description: "booking/calendly: your Calendly link (e.g. calendly.com/yourname)",
      condition: (state) => !!state.sections?.["booking"],
      targets: (ctx) => ctx.componentFiles,
    },
    {
      key: "FORMSPREE_ID",
      label: "Formspree form ID",
      description: "reservation/formspree: get at formspree.io (e.g. xabcdefg)",
      condition: (state) => !!state.sections?.["reservation"],
      targets: (ctx) => ctx.componentFiles,
    },
  ],
  portfolio: [
    {
      key: "NAME",
      label: "Full name",
      description: "Used in navbar, hero, JSON-LD, sidebar, and chatbot greeting",
      targets: (ctx) => [...ctx.dictFiles, ctx.layoutFile, ...ctx.componentFiles],
    },
    {
      key: "EMAIL",
      label: "Email address",
      targets: (ctx) => [...ctx.dictFiles, ctx.layoutFile, ...ctx.componentFiles],
    },
    {
      key: "GITHUB",
      label: "GitHub username (without github.com/)",
      description: "E.g. johndoe",
      targets: (ctx) => [...ctx.dictFiles, ctx.layoutFile, ...ctx.componentFiles],
    },
    {
      key: "LINKEDIN",
      label: "LinkedIn slug (without linkedin.com/in/)",
      description: "E.g. john-doe",
      targets: (ctx) => [...ctx.dictFiles, ctx.layoutFile, ...ctx.componentFiles],
    },
    {
      key: "DOMAIN",
      label: "Domain (without https://)",
      description: "E.g. johndoe.dev — used in SITE_URL, sitemap, and robots",
      targets: (ctx) => [ctx.layoutFile, "app/robots.ts", "app/sitemap.ts"],
      special: "domain",
    },
    {
      key: "CITY",
      label: "City",
      description: "Shown in ProfileSidebar location line",
      targets: (ctx) => ctx.componentFiles,
    },
    {
      key: "TIMEZONE",
      label: "Timezone",
      description: "E.g. UTC+4  — shown next to city in sidebar",
      targets: (ctx) => ctx.componentFiles,
    },
    // ── Section-specific ──────────────────────────────────────────────────────
    {
      key: "GOOGLE_REVIEW_URL",
      label: "Google Review URL",
      description: "google-reviews: your Google Business review link (Maps → Get more reviews)",
      condition: (state) => !!state.sections?.["google-reviews"],
      targets: (ctx) => ctx.componentFiles,
    },
    {
      key: "CALENDLY_URL",
      label: "Calendly scheduling URL",
      description: "booking/calendly: your Calendly link (e.g. calendly.com/yourname)",
      condition: (state) => !!state.sections?.["booking"],
      targets: (ctx) => ctx.componentFiles,
    },
  ],
};

// ── Build ctx ─────────────────────────────────────────────────────────────────

function buildCtx(state) {
  const i18nActive = fs.existsSync(path.join(target(), "i18n-config.ts"));
  const compDir = i18nActive ? "app/[locale]/components" : "app/components";
  const layoutFile = i18nActive ? "app/[locale]/layout.tsx" : "app/layout.tsx";

  // Only include locale dict files that actually exist on disk
  const dictFiles = LOCALES
    .map((l) => `dictionaries/${l}.json`)
    .filter((f) => fs.existsSync(path.join(target(), f)));

  // Scan compDir for .tsx files that still contain any YOUR_ token
  function findComponentFiles() {
    const dir = path.join(target(), compDir);
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter((f) => f.endsWith(".tsx"))
      .filter((f) => {
        const content = fs.readFileSync(path.join(dir, f), "utf8");
        return /YOUR_[A-Z_]+/.test(content);
      })
      .map((f) => `${compDir}/${f}`);
  }

  // Scan app/api/**/route.ts for YOUR_ tokens (e.g. contact-form injects YOUR_EMAIL)
  function findApiFiles() {
    const apiDir = path.join(target(), "app/api");
    if (!fs.existsSync(apiDir)) return [];
    const results = [];
    function walk(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) { walk(full); continue; }
        if (!entry.name.endsWith(".ts") && !entry.name.endsWith(".tsx")) continue;
        const content = fs.readFileSync(full, "utf8");
        if (/YOUR_[A-Z_]+/.test(content)) {
          results.push(path.relative(target(), full).replace(/\\/g, "/"));
        }
      }
    }
    walk(apiDir);
    return results;
  }

  return {
    i18nActive,
    compDir,
    layoutFile,
    dictFiles,
    componentFiles: findComponentFiles(),
    apiFiles: findApiFiles(),
    languages: state.features?.languages ?? "en",
  };
}

// ── Template type detection (mirrors validate.js) ─────────────────────────────

function detectTemplateType() {
  const i18nActive = fs.existsSync(path.join(target(), "i18n-config.ts"));
  const compDir = i18nActive ? "app/[locale]/components" : "app/components";
  const isPortfolio = fs.existsSync(path.join(target(), compDir, "ProfileSidebar.tsx"));
  const isBusiness  = fs.existsSync(path.join(target(), compDir, "Footer.tsx"));
  return isPortfolio ? "portfolio" : isBusiness ? "business" : null;
}

// ── Replacement ───────────────────────────────────────────────────────────────

function applyReplacement(placeholder, value, ctx) {
  const token = `YOUR_${placeholder.key}`;
  const files = placeholder.targets(ctx);
  const filesHit = [];
  const filesMissed = [];

  for (const relPath of files) {
    // Special handling for DOMAIN: replace YOUR_DOMAIN.vercel.app first (SITE_URL default).
    // If found, skip bare token replacement to avoid false "not found" warnings.
    if (placeholder.special === "domain") {
      const full = path.join(target(), relPath);
      if (fs.existsSync(full)) {
        const content = fs.readFileSync(full, "utf8");
        if (content.includes(`${token}.vercel.app`)) {
          const hit = replaceInFile(relPath, `${token}.vercel.app`, value);
          (hit ? filesHit : filesMissed).push(relPath);
          continue;
        }
      }
    }
    const hit = replaceInFile(relPath, token, value);
    (hit ? filesHit : filesMissed).push(relPath);
  }

  return { key: placeholder.key, value, token, filesHit, filesMissed };
}

// ── Profile file ──────────────────────────────────────────────────────────────

function saveProfile(data) {
  const profileFile = path.join(target(), "client-profile.json");
  const tmp = profileFile + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, profileFile);
  console.log("\n  [saved] client-profile.json");
}

function loadExistingProfile() {
  const profileFile = path.join(target(), "client-profile.json");
  if (!fs.existsSync(profileFile)) return {};
  try {
    return JSON.parse(fs.readFileSync(profileFile, "utf8"));
  } catch {
    return {};
  }
}

// ── Summary + validate ────────────────────────────────────────────────────────

function printSummary(results) {
  console.log("\n─── Summary ──────────────────────────────────────────────────────\n");
  let replaced = 0, skipped = 0;
  for (const r of results) {
    if (r.filesHit.length > 0) {
      console.log(`  [ok]     ${r.key} → "${r.value}" in ${r.filesHit.length} file(s)`);
      replaced++;
    } else {
      console.log(`  [skip]   ${r.key} — token not found (already replaced or not applicable)`);
      skipped++;
    }
  }
  console.log(`\n  ${replaced} field(s) applied, ${skipped} skipped.`);
}

function runValidate() {
  console.log("\n─── Remaining placeholders ───────────────────────────────────────\n");
  try {
    execSync(
      `node "${path.join(__dirname, "validate.js")}" --project "${target()}"`,
      { stdio: "inherit" }
    );
  } catch {
    // validate.js exits non-zero when issues remain — output already printed above
  }
}

// ── Profile mode ──────────────────────────────────────────────────────────────

function profileMode(profilePath, placeholderList, ctx, state) {
  let raw;
  try {
    raw = fs.readFileSync(path.resolve(profilePath), "utf8");
  } catch {
    console.error(`  [error] Cannot read profile: ${profilePath}`);
    process.exit(1);
  }
  let data = JSON.parse(raw);

  // Unwrap Apify envelope: { "result": { ... } }
  if (data.result && typeof data.result === "object" && typeof data.result !== "string") {
    const hasTopLevelKey = placeholderList.some((p) => data[p.key] !== undefined);
    if (!hasTopLevelKey) data = data.result;
  }

  // Normalize all keys to uppercase
  const profile = {};
  for (const [k, v] of Object.entries(data)) {
    profile[k.toUpperCase().replace(/-/g, "_")] = v;
  }

  const results = [];
  console.log(`\n─── Applying profile (${Object.keys(profile).length} keys found) ──────────────────────\n`);

  for (const placeholder of placeholderList) {
    if (placeholder.condition && !placeholder.condition(state)) continue;
    const value = profile[placeholder.key];
    if (!value) continue;
    console.log(`  ${placeholder.key}: ${value}`);
    results.push(applyReplacement(placeholder, value, ctx));
  }

  // Merge with existing profile and save
  const existing = loadExistingProfile();
  saveProfile({ ...existing, ...profile });

  printSummary(results);
  runValidate();
}

// ── Interactive mode ──────────────────────────────────────────────────────────

function tokenStillPresent(placeholder, ctx) {
  const token = `YOUR_${placeholder.key}`;
  const files = placeholder.targets(ctx);
  return files.some((f) => {
    const full = path.join(target(), f);
    return fs.existsSync(full) && fs.readFileSync(full, "utf8").includes(token);
  });
}

async function interactiveMode(placeholderList, ctx, state) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const ask = (question) => new Promise((resolve) => rl.question(question, resolve));

  const existingProfile = loadExistingProfile();
  const collectedProfile = { ...existingProfile };
  const results = [];

  console.log("\n─── Business details ─────────────────────────────────────────────\n");

  try {
    for (const placeholder of placeholderList) {
      // Skip section-specific placeholders when the section is not installed
      if (placeholder.condition && !placeholder.condition(state)) continue;

      const present = tokenStillPresent(placeholder, ctx);
      const saved = existingProfile[placeholder.key];

      if (placeholder.description) {
        console.log(`  ${placeholder.description}`);
      }

      let hint = "";
      if (saved) hint = ` (saved: ${saved})`;
      else if (!present) hint = " (already set — press Enter to skip)";

      const answer = (await ask(`  ${placeholder.label}${hint}: `)).trim();
      const value = answer || saved || null;

      if (!value) {
        console.log();
        continue;
      }

      collectedProfile[placeholder.key] = value;
      results.push(applyReplacement(placeholder, value, ctx));
      console.log();
    }
  } finally {
    rl.close();
  }

  saveProfile(collectedProfile);
  printSummary(results);
  runValidate();
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║      launchkit — Personalize             ║");
  console.log("╚══════════════════════════════════════════╝");

  // Read state — fall back gracefully if .launchkit is missing
  let state = {};
  try { state = readLaunchkit(); } catch { /* new project, no .launchkit yet */ }

  // Detect template type from files (authoritative), fall back to .launchkit type
  const templateType = detectTemplateType() ?? state.type ?? "business";

  const i18nActive = fs.existsSync(path.join(target(), "i18n-config.ts"));
  const languages = state.features?.languages ?? "en";

  console.log(`\n  Template : ${templateType.charAt(0).toUpperCase() + templateType.slice(1)}`);
  console.log(`  Project  : ${target()}`);
  console.log(`  i18n     : ${i18nActive ? `enabled (${languages})` : "disabled"}`);

  const placeholderList = PLACEHOLDER_MAP[templateType];
  if (!placeholderList) {
    console.error(`\n  [error] No placeholder map for template type: ${templateType}`);
    process.exit(1);
  }

  const ctx = buildCtx(state);

  const profilePath = getFlag("--profile");
  if (profilePath) {
    profileMode(profilePath, placeholderList, ctx, state);
  } else {
    await interactiveMode(placeholderList, ctx, state);
  }
}

main().catch((err) => {
  console.error("\n  [error]", err.message);
  process.exit(1);
});
