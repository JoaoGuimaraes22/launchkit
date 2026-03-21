#!/usr/bin/env node
// launchkit — Validate Script
// Checks for unreplaced YOUR_* placeholders, TODO: TEMPLATE comments,
// default placeholder images, and a missing .env.local.
// Run: node scripts/validate.js --project ../my-project

const fs = require("fs");
const path = require("path");
const { TOOL_ROOT, target, setTarget, parseProjectFlag } = require("./lib");

// ── Resolve target project ───────────────────────────────────────────────────
setTarget(parseProjectFlag());

const ROOT = target();

// Directories to scan for placeholders and TODO comments
const SCAN_DIRS = ["app", "dictionaries"];

// Dirs/files to skip while walking
const SKIP = new Set([".next", "node_modules", ".git", "scripts"]);

// ── Feature detection ────────────────────────────────────────────────────────

const i18nActive = fs.existsSync(path.join(ROOT, "i18n-config.ts"));
const localeSeg = i18nActive ? "[locale]" : "";
const componentsDir = ["app", localeSeg, "components"].filter(Boolean).join("/");

function componentExists(name) {
  return fs.existsSync(path.join(ROOT, componentsDir, name));
}

const isPortfolio = componentExists("ProfileSidebar.tsx");
const isBusiness  = componentExists("Footer.tsx");
const templateType = isPortfolio ? "portfolio" : "business";
const templateName = isPortfolio ? "portfolio" : isBusiness ? "business site" : "unknown";

// ── File walker ──────────────────────────────────────────────────────────────

function walkFiles(dir, results = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, results);
    } else {
      results.push(full);
    }
  }
  return results;
}

// ── Scan: placeholders + TODOs ───────────────────────────────────────────────

const placeholderHits = []; // { rel, line, match }
const todoHits = [];        // { rel, line, match }

const PLACEHOLDER_RE = /YOUR_[A-Z_]+/g;
const TODO_RE = /\/\/\s*TODO:\s*TEMPLATE/;

for (const scanDir of SCAN_DIRS) {
  const absDir = path.join(ROOT, scanDir);
  if (!fs.existsSync(absDir)) continue;

  for (const filePath of walkFiles(absDir)) {
    let content;
    try {
      content = fs.readFileSync(filePath, "utf8");
    } catch {
      continue;
    }
    const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
    const lines = content.split("\n");

    lines.forEach((lineText, idx) => {
      const lineNum = idx + 1;

      PLACEHOLDER_RE.lastIndex = 0;
      let m;
      while ((m = PLACEHOLDER_RE.exec(lineText)) !== null) {
        placeholderHits.push({ rel, line: lineNum, match: m[0] });
      }

      if (TODO_RE.test(lineText)) {
        todoHits.push({ rel, line: lineNum, match: lineText.trim() });
      }
    });
  }
}

// ── Scan: placeholder images ─────────────────────────────────────────────────

// Returns true if the file exists and matches the shipped template size (never replaced).
function isDefaultImage(relPath, templateRelPath) {
  const full = path.join(ROOT, relPath);
  const tmpl = path.join(TOOL_ROOT, templateRelPath);
  if (!fs.existsSync(full) || !fs.existsSync(tmpl)) return false;
  return fs.statSync(full).size === fs.statSync(tmpl).size;
}

const imageWarnings = []; // { rel, reason }

const imagesToCheck = [
  { rel: "public/hero.jpg",     tmpl: `templates/${templateType}/public/hero.jpg` },
  { rel: "public/og-image.png", tmpl: null }, // not shipped — just check existence
];
if (isPortfolio) {
  imagesToCheck.push({ rel: "public/profile.jpg", tmpl: "templates/portfolio/public/profile.jpg" });
}
if (isBusiness) {
  imagesToCheck.push({ rel: "public/about.jpg", tmpl: null });
}

for (const { rel, tmpl } of imagesToCheck) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) {
    imageWarnings.push({ rel, reason: "missing" });
  } else if (tmpl && isDefaultImage(rel, tmpl)) {
    imageWarnings.push({ rel, reason: "still the shipped default — replace before deploying" });
  }
}

// ── Scan: env ────────────────────────────────────────────────────────────────

const envExists = fs.existsSync(path.join(ROOT, ".env.local"));

// ── Report ───────────────────────────────────────────────────────────────────

const div = (label) => console.log(`  ─── ${label} ${"─".repeat(Math.max(0, 44 - label.length))}`);

console.log();
console.log(`  launchkit validate — ${templateName}, i18n ${i18nActive ? "on" : "off"}`);
console.log(`  Project: ${ROOT}`);
console.log();

let failed = false;

// ── Placeholders ──────────────────────────────────────────────────────────────
div("Placeholders");
if (placeholderHits.length === 0) {
  console.log("  [ok]    No unreplaced YOUR_* placeholders");
} else {
  failed = true;
  console.log(`  [error] ${placeholderHits.length} unreplaced placeholder(s):`);
  for (const { rel, line, match } of placeholderHits) {
    console.log(`            ${`${rel}:${line}`.padEnd(60)} ${match}`);
  }
}

console.log();

// ── TODOs ─────────────────────────────────────────────────────────────────────
div("TODOs");
if (todoHits.length === 0) {
  console.log("  [ok]    No TODO: TEMPLATE comments");
} else {
  failed = true;
  console.log(`  [warn]  ${todoHits.length} TODO: TEMPLATE comment(s):`);
  for (const { rel, line, match } of todoHits) {
    console.log(`            ${`${rel}:${line}`.padEnd(60)} ${match}`);
  }
}

console.log();

// ── Images ────────────────────────────────────────────────────────────────────
div("Images");
if (imageWarnings.length === 0) {
  console.log("  [ok]    All placeholder images have been replaced");
} else {
  console.log(`  [warn]  ${imageWarnings.length} image(s) need attention:`);
  for (const { rel, reason } of imageWarnings) {
    console.log(`            ${rel.padEnd(40)} ${reason}`);
  }
}

console.log();

// ── Env ───────────────────────────────────────────────────────────────────────
div("Env");
if (envExists) {
  console.log("  [ok]    .env.local exists");
} else {
  console.log("  [warn]  .env.local not found — create it from .env.example before deploying");
}

console.log();

// ── Result ────────────────────────────────────────────────────────────────────
if (failed) {
  console.log("  ✗  Validation failed — fix errors above before deploying.\n");
  process.exit(1);
} else {
  console.log("  ✓  All checks passed.\n");
}
