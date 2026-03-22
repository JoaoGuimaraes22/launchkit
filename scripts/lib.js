#!/usr/bin/env node
// launchkit — Shared script helpers
// Used by setup.js, config.js, sections.js, reset.js, validate.js, status.js

const fs = require("fs");
const path = require("path");

// Absolute path to the launchkit tool root (one level above scripts/)
const TOOL_ROOT = path.resolve(__dirname, "..");

// Schema version for .launchkit files. Bump when the format changes.
const LAUNCHKIT_VERSION = 1;

// Supported locales — single source of truth. First entry is the default/fallback.
const LOCALES = ["en", "pt"];
const DEFAULT_LOCALE = LOCALES[0];

// Dictionary file paths derived from LOCALES.
const DICT_FILES = LOCALES.map((l) => `dictionaries/${l}.json`);

// Returns locale file paths excluding the default (for deletion during i18n collapse).
const SECONDARY_DICT_FILES = DICT_FILES.slice(1);

// TypeScript literal for generated sitemap files.
const LOCALES_TS_LITERAL = `[${LOCALES.map((l) => `"${l}"`).join(", ")}] as const`;

// Target project directory — defaults to TOOL_ROOT, set via setTarget()
let _target = TOOL_ROOT;

function setTarget(absPath) {
  _target = absPath;
}

function target() {
  return _target;
}

// ── File operations (all resolve against _target for project paths) ──────────

// Deletes a file or directory (recursively) if it exists. No-op otherwise.
function deleteIfExists(relPath) {
  const full = path.join(_target, relPath);
  if (fs.existsSync(full)) {
    fs.rmSync(full, { recursive: true, force: true });
    console.log("  [removed]", relPath);
  }
}

// Recursively copies srcRel (from TOOL_ROOT) → destRel (in _target), logging each file.
// Throws if source is missing unless { optional: true } is passed.
function copyDir(srcRel, destRel, { optional = false } = {}) {
  const src = path.join(TOOL_ROOT, srcRel);
  const dest = path.join(_target, destRel);
  if (!fs.existsSync(src)) {
    if (optional) return;
    throw new Error(`copyDir: source directory not found: ${srcRel}`);
  }
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const srcEntry = path.join(src, entry);
    const destEntry = path.join(dest, entry);
    if (fs.statSync(srcEntry).isDirectory()) {
      copyDir(path.join(srcRel, entry), path.join(destRel, entry));
    } else {
      fs.copyFileSync(srcEntry, destEntry);
      console.log("  [copied]", path.join(srcRel, entry), "→", path.join(destRel, entry));
    }
  }
}

// Copies a single file from TOOL_ROOT/srcRel → _target/destRel.
// Creates parent directories as needed. Throws if source is missing unless { optional: true }.
function copyFile(srcRel, destRel, { optional = false } = {}) {
  const src = path.join(TOOL_ROOT, srcRel);
  const dest = path.join(_target, destRel);
  if (!fs.existsSync(src)) {
    if (optional) { console.warn("  [warn] source not found:", srcRel); return; }
    throw new Error(`copyFile: source not found: ${srcRel}`);
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log("  [copied]", srcRel, "→", destRel);
}

// Copies a file within the target project (both paths relative to _target).
function copyFileInProject(srcRel, destRel) {
  const src = path.join(_target, srcRel);
  const dest = path.join(_target, destRel);
  if (!fs.existsSync(src)) {
    console.warn("  [warn] source not found:", srcRel);
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log("  [moved] ", srcRel, "→", destRel);
}

// Copies a directory within the target project (both paths relative to _target).
function copyDirInProject(srcRel, destRel) {
  const src = path.join(_target, srcRel);
  const dest = path.join(_target, destRel);
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const srcEntry = path.join(src, entry);
    const destEntry = path.join(dest, entry);
    if (fs.statSync(srcEntry).isDirectory()) {
      copyDirInProject(path.join(srcRel, entry), path.join(destRel, entry));
    } else {
      fs.copyFileSync(srcEntry, destEntry);
      console.log("  [moved] ", path.join(srcRel, entry), "→", path.join(destRel, entry));
    }
  }
}

// Verifies that a file or directory exists at relPath (in _target). Throws if missing.
// Used after copy operations to confirm the copy succeeded before deleting the source.
function assertExists(relPath) {
  const full = path.join(_target, relPath);
  if (!fs.existsSync(full)) {
    throw new Error(`Expected ${relPath} to exist after copy, but it was not found. Aborting to prevent data loss.`);
  }
}

// ── Marker-based content utilities ───────────────────────────────────────────

// Extracts content between two marker strings in `content` (startMarker inclusive,
// endMarker exclusive). Returns null if either marker is absent or start >= end.
function extractBetweenMarkers(content, startMarker, endMarker) {
  const s = content.indexOf(startMarker);
  const e = content.indexOf(endMarker);
  if (s === -1 || e === -1 || s >= e) return null;
  return content.slice(s, e);
}

// In a file at relPath (relative to _target), removes all content from startMarker
// up to (but not including) endMarker. Also trims the preceding newline to avoid
// leaving a blank line. Returns true if the block was removed, false otherwise.
function removeMarkerBlock(relPath, startMarker, endMarker) {
  const full = path.join(_target, relPath);
  if (!fs.existsSync(full)) return false;
  let content = fs.readFileSync(full, "utf8");
  const s = content.indexOf(startMarker);
  const e = content.indexOf(endMarker);
  if (s === -1 || e === -1 || s >= e) return false;
  // Trim a preceding newline so we don't leave a blank line
  const trimFrom = s > 0 && content[s - 1] === "\n" ? s - 1 : s;
  content = content.slice(0, trimFrom) + content.slice(e);
  fs.writeFileSync(full, content, "utf8");
  console.log("  [patched]", relPath, "— removed marker block:", startMarker.trim());
  return true;
}

// Removes every line that contains `substring` from a file. No-op if file is missing.
function removeLineContaining(relPath, substring) {
  const full = path.join(_target, relPath);
  if (!fs.existsSync(full)) return;
  const original = fs.readFileSync(full, "utf8");
  const filtered = original
    .split("\n")
    .filter((line) => !line.includes(substring))
    .join("\n");
  if (filtered !== original) {
    fs.writeFileSync(full, filtered, "utf8");
    console.log("  [patched]", relPath, "— removed line containing:", substring.trim());
  }
}

// Replaces all occurrences of searchStr with replaceStr in a file. No-op if file is missing.
// Returns true if a replacement was made, false otherwise. Warns when the search string wasn't found.
function replaceInFile(relPath, searchStr, replaceStr) {
  const full = path.join(_target, relPath);
  if (!fs.existsSync(full)) return false;
  const original = fs.readFileSync(full, "utf8");
  const updated = original.split(searchStr).join(replaceStr);
  if (updated !== original) {
    fs.writeFileSync(full, updated, "utf8");
    console.log("  [patched]", relPath);
    return true;
  }
  console.warn("  [warn] replaceInFile: search string not found in", relPath);
  return false;
}

// Adds depName@version to package.json dependencies if not already present.
function addDependency(depName, version) {
  const pkgPath = path.join(_target, "package.json");
  const pkg = safeJsonParse(fs.readFileSync(pkgPath, "utf8"), "package.json");
  if (!pkg.dependencies) pkg.dependencies = {};
  if (!pkg.dependencies[depName]) {
    pkg.dependencies[depName] = version;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
    console.log("  [patched] package.json — added dependency:", depName, version);
  }
}

// Removes depName from package.json dependencies if present.
function removeDependency(depName) {
  const pkgPath = path.join(_target, "package.json");
  const pkg = safeJsonParse(fs.readFileSync(pkgPath, "utf8"), "package.json");
  if (pkg.dependencies && pkg.dependencies[depName]) {
    delete pkg.dependencies[depName];
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
    console.log("  [patched] package.json — removed dependency:", depName);
  }
}

// ── navbar.links[] helpers (dict-based nav patching) ─────────────────────────

// Inserts a nav link into navbar.links[] in a dict JSON file, after the entry with afterId.
// If afterId is null, prepends to the array.
function addNavLink(dictRelPath, link, afterId) {
  const full = path.join(_target, dictRelPath);
  if (!fs.existsSync(full)) return;
  const dict = safeJsonParse(fs.readFileSync(full, "utf8"), dictRelPath);
  if (!dict.navbar || !Array.isArray(dict.navbar.links)) return;
  if (dict.navbar.links.some((l) => l.id === link.id)) return; // already present
  if (afterId === null) {
    dict.navbar.links.unshift(link);
  } else {
    const idx = dict.navbar.links.findIndex((l) => l.id === afterId);
    if (idx !== -1) {
      dict.navbar.links.splice(idx + 1, 0, link);
    } else {
      dict.navbar.links.push(link);
    }
  }
  fs.writeFileSync(full, JSON.stringify(dict, null, 2) + "\n", "utf8");
  console.log("  [patched]", dictRelPath, `— added nav link: ${link.id}`);
}

// Removes a nav link by id from navbar.links[] in a dict JSON file.
function removeNavLink(dictRelPath, sectionId) {
  const full = path.join(_target, dictRelPath);
  if (!fs.existsSync(full)) return;
  const dict = safeJsonParse(fs.readFileSync(full, "utf8"), dictRelPath);
  if (!dict.navbar || !Array.isArray(dict.navbar.links)) return;
  const before = dict.navbar.links.length;
  dict.navbar.links = dict.navbar.links.filter((l) => l.id !== sectionId);
  if (dict.navbar.links.length !== before) {
    fs.writeFileSync(full, JSON.stringify(dict, null, 2) + "\n", "utf8");
    console.log("  [patched]", dictRelPath, `— removed nav link: ${sectionId}`);
  }
}

// ── readline helpers ──────────────────────────────────────────────────────────

// Prompts a y/n question. Returns true for "y".
function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question + " [y/n] ", (answer) => {
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

// Displays a numbered list and returns the 1-based choice index, or null for invalid input.
function askChoice(rl, question, choices) {
  return new Promise((resolve) => {
    console.log(question);
    choices.forEach((c, i) => console.log(`  [${i + 1}] ${c}`));
    rl.question("Enter choice: ", (answer) => {
      const n = parseInt(answer.trim(), 10);
      resolve(n >= 1 && n <= choices.length ? n : null);
    });
  });
}

// ── Safe JSON parse ──────────────────────────────────────────────────────────

// Parses JSON with an actionable error message on failure.
// `label` describes the file for the error message (e.g. "dictionaries/en.json").
function safeJsonParse(raw, label) {
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse ${label}: ${err.message}`);
  }
}

// Reads and parses a JSON file relative to _target. Throws with a clear message on failure.
function readJsonFile(relPath) {
  const full = path.join(_target, relPath);
  const raw = fs.readFileSync(full, "utf8");
  return safeJsonParse(raw, relPath);
}

// ── .launchkit I/O ────────────────────────────────────────────────────────────

function readLaunchkit() {
  const p = path.join(_target, ".launchkit");
  if (!fs.existsSync(p)) {
    console.error("\n  Error: .launchkit not found at", _target);
    console.error("  Run node scripts/setup.js first.\n");
    process.exit(1);
  }
  const state = safeJsonParse(fs.readFileSync(p, "utf8"), ".launchkit");
  // Validate required fields
  if (!state.type) {
    console.error("\n  Error: .launchkit is missing required field (type).");
    console.error("  The file may be corrupted. Run reset + setup to regenerate.\n");
    process.exit(1);
  }
  // Ensure features, sections, and components exist (backward compat)
  if (!state.features) state.features = {};
  if (!state.sections) state.sections = {};
  if (!state.components) state.components = {};
  if (!state.features.palette) state.features.palette = "default";
  // Version migration: stamp version if missing (pre-v1 files), warn if newer
  if (state.version === undefined) {
    state.version = LAUNCHKIT_VERSION;
    writeLaunchkit(state);
    console.log("  [migrated] .launchkit — added version field (v1)");
  } else if (state.version > LAUNCHKIT_VERSION) {
    console.error(`\n  Error: .launchkit version ${state.version} is newer than this tool (v${LAUNCHKIT_VERSION}).`);
    console.error("  Update launchkit to the latest version.\n");
    process.exit(1);
  }
  return state;
}

// Writes .launchkit atomically: write to a temp file, then rename.
// Automatically stamps the current LAUNCHKIT_VERSION.
function writeLaunchkit(state) {
  state.version = LAUNCHKIT_VERSION;
  const dest = path.join(_target, ".launchkit");
  const tmp = dest + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, dest);
}

// ── Shared i18n collapse (app/[locale]/ → app/) ─────────────────────────────

// Core i18n collapse logic shared by all templates.
// Moves components + layout + page from app/[locale]/ → app/, patches locale
// references out, removes pt.json. Calls opts.beforePatchLayout / opts.afterMove
// / opts.afterCollapse for template-specific patches.
//
// opts:
//   extraDirs     — additional app/[locale]/ subdirs to move (e.g. ["work"])
//   description   — single-line English description for generateMetadata fallback
//   pageFnName    — export function name in page.tsx (e.g. "LocalePage", "BusinessPage")
//   beforePatchLayout(features)  — called after move, before layout patches
//   afterCollapse(features)      — called after all shared patches are done
function collapseI18nBase(features, opts = {}) {
  console.log("\n─── Collapsing i18n routing (app/[locale]/ → app/) ─────────────\n");

  const {
    extraDirs = [],
    pageFnName = "LocalePage",
    beforePatchLayout,
    afterCollapse,
  } = opts;

  // ── 1. Move files (copy-all, verify, then delete source) ─────────────────────
  copyDirInProject("app/[locale]/components", "app/components");
  for (const dir of extraDirs) {
    copyDirInProject(`app/[locale]/${dir}`, `app/${dir}`);
  }
  copyFileInProject("app/[locale]/layout.tsx", "app/layout.tsx");
  copyFileInProject("app/[locale]/page.tsx", "app/page.tsx");
  // Verify copies before deleting source
  assertExists("app/components");
  assertExists("app/layout.tsx");
  assertExists("app/page.tsx");
  for (const dir of extraDirs) assertExists(`app/${dir}`);
  deleteIfExists("app/[locale]");

  if (beforePatchLayout) beforePatchLayout(features);

  // ── 2. Patch app/layout.tsx ──────────────────────────────────────────────────
  replaceInFile(
    "app/layout.tsx",
    'import { getDictionary } from "../../get-dictionary";',
    'import dict from "../dictionaries/en.json";'
  );
  removeLineContaining("app/layout.tsx", "import { type Locale }");
  replaceInFile(
    "app/layout.tsx",
    'export async function generateMetadata({\n  params,\n}: {\n  params: Promise<{ locale: string }>;\n}): Promise<Metadata> {',
    "export async function generateMetadata(): Promise<Metadata> {"
  );
  removeLineContaining("app/layout.tsx", "const { locale } = (await params)");
  removeLineContaining("app/layout.tsx", "const dict = await getDictionary");
  replaceInFile(
    "app/layout.tsx",
    "    alternates: {\n      canonical: `${SITE_URL}/${locale}`,\n      languages: {\n        en: `${SITE_URL}/en`,\n        pt: `${SITE_URL}/pt`,\n      },\n    },",
    "    alternates: { canonical: SITE_URL },"
  );
  replaceInFile("app/layout.tsx", "`${SITE_URL}/${locale}`", "SITE_URL");
  removeLineContaining("app/layout.tsx", 'locale: locale === "pt"');
  replaceInFile(
    "app/layout.tsx",
    "export default async function LocaleLayout({\n  children,\n  params,\n}: {\n  children: React.ReactNode;\n  params: Promise<{ locale: string }>;\n}) {",
    "export default async function LocaleLayout({\n  children,\n}: {\n  children: React.ReactNode;\n}) {"
  );
  replaceInFile("app/layout.tsx", "<Navbar locale={locale} nav={", "<Navbar nav={");

  // ── 3. Patch app/page.tsx ────────────────────────────────────────────────────
  replaceInFile(
    "app/page.tsx",
    'import { getDictionary } from "../../get-dictionary";',
    'import dict from "../dictionaries/en.json";'
  );
  removeLineContaining("app/page.tsx", "import { type Locale }");
  replaceInFile(
    "app/page.tsx",
    `export default async function ${pageFnName}({\n  params,\n}: {\n  params: Promise<{ locale: string }>;\n}) {`,
    `export default async function ${pageFnName}() {`
  );
  removeLineContaining("app/page.tsx", "const { locale } = (await params)");
  removeLineContaining("app/page.tsx", "const dict = await getDictionary");

  // ── 4. Patch app/components/Navbar.tsx ──────────────────────────────────────
  removeLineContaining("app/components/Navbar.tsx", "import { type Locale }");
  removeLineContaining("app/components/Navbar.tsx", "locale: Locale;");
  replaceInFile("app/components/Navbar.tsx", "{ locale, nav }", "{ nav }");

  // ── 5. Remove secondary locale dictionaries ─────────────────────────────────
  for (const f of SECONDARY_DICT_FILES) deleteIfExists(f);

  if (afterCollapse) afterCollapse(features);

  console.log("\n✓  i18n routing collapsed — app/ is now locale-free");
}

// ── Template file copy ────────────────────────────────────────────────────────

// Copies app/, dictionaries/, public/ from a template into the target project.
// Dialogflow (portfolio-only) must be copied separately by the template module.
function copyTemplateFiles(type) {
  copyDir(`templates/${type}/app`, "app");
  copyDir(`templates/${type}/dictionaries`, "dictionaries");
  copyDir(`templates/${type}/public`, "public");
}

// Copies base scaffold (package.json, tsconfig, configs, base app/) into the target project.
function copyBaseScaffold() {
  copyDir("templates/presets/base", ".");
}

// ── --help flag ──────────────────────────────────────────────────────────────

// Prints usage text and exits if --help or -h is present in argv.
function checkHelp(usage) {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(usage);
    process.exit(0);
  }
}

// ── Template autodiscovery ────────────────────────────────────────────────────

// Scans scripts/templates/ at runtime and returns { key: module } for each .js
// file that exports the required interface (type, setup).
// Caches after first call. Replaces the hardcoded TEMPLATES maps in setup/toggle/status.
let _templateCache = null;
let _presetCache = null;

function loadTemplates() {
  if (_templateCache) return _templateCache;
  const templatesDir = path.join(__dirname, "templates");
  const entries = fs.readdirSync(templatesDir).filter((f) => f.endsWith(".js"));
  _templateCache = {};
  for (const file of entries) {
    const mod = require(path.join(templatesDir, file));
    const key = path.basename(file, ".js");
    // Validate required interface
    const missing = ["type", "setup"]
      .filter((fn) => mod[fn] === undefined);
    if (missing.length > 0) {
      console.warn(`  [warn] templates/${file} missing exports: ${missing.join(", ")} — skipped`);
      continue;
    }
    _templateCache[key] = mod;
  }
  return _templateCache;
}

function loadPresets() {
  if (_presetCache) return _presetCache;
  const presetsDir = path.join(__dirname, "presets");
  if (!fs.existsSync(presetsDir)) { _presetCache = []; return _presetCache; }
  const entries = fs.readdirSync(presetsDir).filter((f) => f.endsWith(".js"));
  _presetCache = [];
  for (const file of entries) {
    const mod = require(path.join(presetsDir, file));
    const missing = ["name", "base", "sections"].filter((k) => mod[k] === undefined);
    if (missing.length > 0) {
      console.warn(`  [warn] presets/${file} missing fields: ${missing.join(", ")} — skipped`);
      continue;
    }
    _presetCache.push(mod);
  }
  return _presetCache;
}

// ── Palette discovery ─────────────────────────────────────────────────────────

let _paletteCache = null;

// Scans configs/palettes/[name]/meta.json and returns an array of palette objects.
function loadPalettes() {
  if (_paletteCache) return _paletteCache;
  const root = path.join(TOOL_ROOT, "configs", "palettes");
  if (!fs.existsSync(root)) return (_paletteCache = []);
  const palettes = [];
  for (const name of fs.readdirSync(root)) {
    const dir = path.join(root, name);
    if (!fs.statSync(dir).isDirectory()) continue;
    const metaPath = path.join(dir, "meta.json");
    if (!fs.existsSync(metaPath)) continue;
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    if (!meta.name) {
      console.warn(`  [warn] configs/palettes/${name}/meta.json missing "name" field — skipped`);
      continue;
    }
    palettes.push(meta);
  }
  return (_paletteCache = palettes);
}

// ── Component discovery ───────────────────────────────────────────────────────

let _componentCache = null;

// Scans templates/components/[name]/[variant]/ and returns an array of
// { name, variants: [{ name, dir, meta }] }.
function discoverComponents() {
  if (_componentCache) return _componentCache;
  const root = path.join(TOOL_ROOT, "templates", "components");
  if (!fs.existsSync(root)) return (_componentCache = []);
  const components = [];
  for (const name of fs.readdirSync(root)) {
    const dir = path.join(root, name);
    if (!fs.statSync(dir).isDirectory()) continue;
    const variants = [];
    for (const variantName of fs.readdirSync(dir)) {
      const variantDir = path.join(dir, variantName);
      if (!fs.statSync(variantDir).isDirectory()) continue;
      const metaPath = path.join(variantDir, "meta.json");
      if (!fs.existsSync(metaPath)) continue;
      variants.push({ name: variantName, dir: variantDir,
        meta: JSON.parse(fs.readFileSync(metaPath, "utf8")) });
    }
    if (variants.length > 0) components.push({ name, variants });
  }
  return (_componentCache = components);
}

// Checks which components from the library are present in compDir/ui/.
// Uses .launchkit.components to resolve the recorded variant.
function detectInstalledComponents(compDir, launchkitComponents) {
  const components = discoverComponents();
  const installed = {};
  for (const comp of components) {
    const anyMeta = comp.variants[0].meta;
    if (!anyMeta.componentName) continue;
    const detected = fs.existsSync(
      path.join(_target, compDir, "ui", `${anyMeta.componentName}.tsx`)
    );
    if (!detected) continue;
    const recorded = launchkitComponents && launchkitComponents[comp.name];
    const variant = recorded
      ? comp.variants.find((v) => v.name === recorded.variant) || comp.variants[0]
      : comp.variants[0];
    installed[comp.name] = { variant: variant.name, meta: variant.meta, variantDir: variant.dir };
  }
  return installed;
}

// ── --project flag parser ─────────────────────────────────────────────────────

// Call from scripts that operate on an existing project.
// Reads --project <path> from argv. Falls back to cwd.
function parseProjectFlag() {
  const idx = process.argv.indexOf("--project");
  if (idx !== -1 && process.argv[idx + 1]) {
    return path.resolve(process.argv[idx + 1]);
  }
  return process.cwd();
}

// ── Section discovery ─────────────────────────────────────────────────────────

// Structural components excluded from page section parsing.
// These are layout-level elements, not toggleable content sections.
const STRUCTURAL_COMPONENTS = [
  "HeroFull", "Hero", "ProfileSidebar", "Footer", "FloatingCTA",
];

let _sectionCache = null;

// Scans templates/sections/ for section definitions.
// Returns [{ name, variants: [{ name, dir, meta, hooks? }] }].
function discoverSections() {
  if (_sectionCache) return _sectionCache;
  const sectionsRoot = path.join(TOOL_ROOT, "templates", "sections");
  if (!fs.existsSync(sectionsRoot)) return (_sectionCache = []);
  const sections = [];
  for (const sectionName of fs.readdirSync(sectionsRoot)) {
    const sectionDir = path.join(sectionsRoot, sectionName);
    if (!fs.statSync(sectionDir).isDirectory()) continue;
    const variants = [];
    for (const variantName of fs.readdirSync(sectionDir)) {
      const variantDir = path.join(sectionDir, variantName);
      if (!fs.statSync(variantDir).isDirectory()) continue;
      const metaPath = path.join(variantDir, "meta.json");
      if (!fs.existsSync(metaPath)) continue;
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
      const variant = { name: variantName, dir: variantDir, meta };
      const hooksPath = path.join(variantDir, "hooks.js");
      if (fs.existsSync(hooksPath)) variant.hooks = require(hooksPath);
      variants.push(variant);
    }
    if (variants.length > 0) {
      sections.push({ name: sectionName, variants });
    }
  }
  return (_sectionCache = sections);
}

// Parses page.tsx for <ComponentName lines. Returns [{ name, line, indent }].
// Excludes structural components (Hero, Footer, etc.).
function parseSectionsFromPage(pageFile) {
  const full = path.join(_target, pageFile);
  if (!fs.existsSync(full)) return [];
  const lines = fs.readFileSync(full, "utf8").split("\n");
  const results = [];
  const re = /^(\s*)<([A-Z][A-Za-z0-9]*)\s/;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(re);
    if (!m) continue;
    const name = m[2];
    if (STRUCTURAL_COMPONENTS.includes(name)) continue;
    results.push({ name, line: i + 1, indent: m[1].length });
  }
  return results;
}

// Cross-references discoverSections() with component files in compDir.
// Returns { [sectionName]: { variant, meta, variantDir } } for installed sections.
// If launchkitSections is provided, uses its recorded variant name to disambiguate
// when multiple variants share the same componentName.
// If templateType is provided, prefers variants compatible with the template when
// no .launchkit record exists.
// Detection: uses meta.detectFile if set, otherwise checks {compDir}/{componentName}.tsx.
// Sections with neither detectFile nor componentName cannot be auto-detected.
function detectInstalledSections(compDir, launchkitSections, templateType) {
  const sections = discoverSections();
  const installed = {};
  for (const section of sections) {
    // Skip sections not compatible with this template type
    if (templateType) {
      const compatible = section.variants.some((v) => v.meta.templates.includes(templateType));
      if (!compatible) continue;
    }

    const anyMeta = section.variants[0].meta;

    // Determine if the section is installed
    let detected = false;
    if (anyMeta.detectFile) {
      const filePath = anyMeta.detectFile.replace("{compDir}", compDir);
      detected = fs.existsSync(path.join(_target, filePath));
    } else if (anyMeta.componentName) {
      detected = fs.existsSync(path.join(_target, compDir, `${anyMeta.componentName}.tsx`));
    }
    // Fallback: check hooks.detect on compatible variants
    if (!detected) {
      for (const v of section.variants) {
        if (v.hooks && v.hooks.detect) {
          detected = v.hooks.detect({ compDir, projectDir: _target });
          if (detected) break;
        }
      }
    }
    if (!detected) continue;

    // Prefer the variant recorded in .launchkit if available
    const recorded = launchkitSections && launchkitSections[section.name];
    let variant;
    if (recorded) {
      variant = section.variants.find((v) => v.name === recorded.variant) || section.variants[0];
    } else if (templateType) {
      variant = section.variants.find((v) => v.meta.templates.includes(templateType)) || section.variants[0];
    } else {
      variant = section.variants[0];
    }

    installed[section.name] = {
      variant: variant.name,
      meta: variant.meta,
      variantDir: variant.dir,
    };
  }
  return installed;
}

module.exports = {
  TOOL_ROOT,
  LAUNCHKIT_VERSION,
  LOCALES,
  DEFAULT_LOCALE,
  DICT_FILES,
  SECONDARY_DICT_FILES,
  LOCALES_TS_LITERAL,
  STRUCTURAL_COMPONENTS,
  setTarget,
  target,
  deleteIfExists,
  copyDir,
  copyFile,
  copyFileInProject,
  copyDirInProject,
  extractBetweenMarkers,
  removeMarkerBlock,
  removeLineContaining,
  replaceInFile,
  addDependency,
  removeDependency,
  safeJsonParse,
  readJsonFile,
  assertExists,
  ask,
  askChoice,
  readLaunchkit,
  writeLaunchkit,
  copyTemplateFiles,
  copyBaseScaffold,
  parseProjectFlag,
  checkHelp,
  collapseI18nBase,
  addNavLink,
  removeNavLink,
  loadTemplates,
  loadPresets,
  loadPalettes,
  discoverComponents,
  detectInstalledComponents,
  discoverSections,
  parseSectionsFromPage,
  detectInstalledSections,
};
