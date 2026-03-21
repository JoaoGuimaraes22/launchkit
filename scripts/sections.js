#!/usr/bin/env node
// launchkit — Unified section management (add / remove / status)
//
// Usage:
//   node scripts/sections.js --project <path>              # interactive add
//   node scripts/sections.js --project <path> --remove     # interactive remove
//   node scripts/sections.js --project <path> --status     # list sections

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const {
  TOOL_ROOT,
  LOCALES,
  LOCALES_TS_LITERAL,
  DICT_FILES,
  setTarget,
  target,
  readLaunchkit,
  writeLaunchkit,
  replaceInFile,
  removeLineContaining,
  addDependency,
  removeDependency,
  addNavLink,
  removeNavLink,
  copyDir,
  copyFile,
  deleteIfExists,
  safeJsonParse,
  parseProjectFlag,
  checkHelp,
  ask,
  askChoice,
  discoverSections,
  parseSectionsFromPage,
  detectInstalledSections,
} = require("./lib");

const USAGE = `
  Usage:
    node scripts/sections.js --project <path>             Add a section (interactive)
    node scripts/sections.js --project <path> --remove    Remove a section
    node scripts/sections.js --project <path> --status    List installed & available sections

  If --project is omitted, falls back to the current directory.
`;

checkHelp(USAGE);

// ── Resolve project context ──────────────────────────────────────────────────

const projectDir = parseProjectFlag();
setTarget(projectDir);

const state = readLaunchkit();
const templateType = state.type;

const i18nActive = fs.existsSync(path.join(projectDir, "i18n-config.ts"));
const compDir = i18nActive ? "app/[locale]/components" : "app/components";
const pageFile = i18nActive ? "app/[locale]/page.tsx" : "app/page.tsx";
const layoutFile = i18nActive ? "app/[locale]/layout.tsx" : "app/layout.tsx";

// Accent color from .launchkit (business template)
const accentColor = (state.features && state.features.accentColor) || "indigo";

// Ensure sections key exists
if (!state.sections) state.sections = {};

// ── Mode dispatch ─────────────────────────────────────────────────────────────

const isRemove = process.argv.includes("--remove");
const isStatus = process.argv.includes("--status");

if (isStatus) {
  showStatus();
} else {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  (isRemove ? removeFlow(rl) : addFlow(rl))
    .catch((err) => { console.error("\n  Error:", err.message); process.exit(1); })
    .finally(() => rl.close());
}

// ── Status ────────────────────────────────────────────────────────────────────

function showStatus() {
  const allSections = discoverSections();
  const installed = detectInstalledSections(compDir, state.sections, templateType);

  console.log(`\n  Section status for ${state.name} (${templateType}):\n`);

  const compatible = allSections.filter((s) =>
    s.variants.some((v) => v.meta.templates.includes(templateType))
  );

  if (compatible.length === 0) {
    console.log("  No sections available for this template type.\n");
    return;
  }

  for (const section of compatible) {
    const inst = installed[section.name];
    const status = inst ? `✓ installed (${inst.variant})` : "  available";
    const variantNames = section.variants
      .filter((v) => v.meta.templates.includes(templateType))
      .map((v) => v.name)
      .join(", ");
    console.log(`  ${status}  ${section.name}  [${variantNames}]`);
  }
  console.log();
}

// ── Add flow ──────────────────────────────────────────────────────────────────

async function addFlow(rl) {
  const allSections = discoverSections();
  const installed = detectInstalledSections(compDir, state.sections, templateType);

  // Filter to compatible, not-yet-installed sections
  const available = allSections.filter((s) => {
    if (installed[s.name]) return false;
    return s.variants.some((v) => v.meta.templates.includes(templateType));
  });

  if (available.length === 0) {
    console.log("\n  No sections available to add.\n");
    return;
  }

  // 1. Pick section
  const sectionChoice = await askChoice(
    rl,
    "\n  Which section would you like to add?",
    available.map((s) => s.name)
  );
  if (!sectionChoice) { console.log("  Cancelled."); return; }
  const section = available[sectionChoice - 1];

  // 2. Pick variant (if multiple)
  const compatibleVariants = section.variants.filter((v) =>
    v.meta.templates.includes(templateType)
  );
  let variant;
  if (compatibleVariants.length === 1) {
    variant = compatibleVariants[0];
    console.log(`  Using variant: ${variant.name}`);
  } else {
    const variantChoice = await askChoice(
      rl,
      "\n  Which variant?",
      compatibleVariants.map((v) => v.name)
    );
    if (!variantChoice) { console.log("  Cancelled."); return; }
    variant = compatibleVariants[variantChoice - 1];
  }

  const { meta } = variant;
  const isPageSection = meta.pageSection !== false;

  // 3. Pick insertion position (skip for non-page sections)
  let afterSection = null;
  let pageSections = [];
  if (isPageSection) {
    pageSections = parseSectionsFromPage(pageFile);
    if (pageSections.length === 0) {
      console.log("  Warning: could not parse any content sections from page.tsx.");
      console.log("  The section will be added but you may need to position it manually.\n");
    }

    if (pageSections.length > 0) {
      // Find default position
      let defaultChoice = null;
      if (meta.defaultAfter) {
        const defaultIdx = pageSections.findIndex(
          (s) => s.name.toLowerCase() === (meta.defaultAfter || "").toLowerCase()
        );
        if (defaultIdx !== -1) defaultChoice = defaultIdx + 1;
      }

      const posChoices = pageSections.map((s) => s.name);
      console.log(`\n  Insert after which section?${defaultChoice ? ` (default: ${defaultChoice})` : ""}`);
      posChoices.forEach((c, i) => console.log(`  [${i + 1}] ${c}`));

      const posAnswer = await new Promise((resolve) => {
        rl.question(`Enter choice${defaultChoice ? ` [${defaultChoice}]` : ""}: `, (answer) => {
          const trimmed = answer.trim();
          if (trimmed === "" && defaultChoice) return resolve(defaultChoice);
          const n = parseInt(trimmed, 10);
          resolve(n >= 1 && n <= posChoices.length ? n : null);
        });
      });

      if (!posAnswer) { console.log("  Cancelled."); return; }
      afterSection = pageSections[posAnswer - 1];
    }
  }

  // 4. Confirm
  const posMsg = afterSection ? ` after ${afterSection.name}` : "";
  const confirmed = await ask(
    rl,
    `\n  Add ${section.name} (${variant.name})${posMsg}?`
  );
  if (!confirmed) { console.log("  Cancelled."); return; }

  // 5. Execute standard enable
  console.log(`\n─── Adding ${section.name} (${variant.name}) ──────────────────────────\n`);
  standardEnable(section.name, variant, afterSection, pageSections);

  // 6. Run hooks
  if (variant.hooks && variant.hooks.afterEnable) {
    variant.hooks.afterEnable(buildCtx(section.name, variant));
  }

  // 7. Update .launchkit
  state.sections[section.name] = {
    variant: variant.name,
    addedAt: new Date().toISOString(),
  };
  writeLaunchkit(state);

  // 8. npm install if deps added
  if (meta.dependencies && meta.dependencies.length > 0) {
    console.log("\n  Running npm install...");
    require("child_process").execSync("npm install", { cwd: projectDir, stdio: "inherit" });
  }

  // 9. Summary
  console.log(`\n✓  ${meta.componentName || section.name} added${meta.componentName ? ` to ${pageFile}` : ""}`);
  if (meta.dictKey) console.log(`   Dict key: "${meta.dictKey}" added to ${DICT_FILES.join(", ")}`);
  if (meta.navLink) console.log(`   Nav link: "${meta.navLink.id}" added`);
  console.log(`\n   Run: node scripts/validate.js --project ${projectDir}\n`);
}

// ── Remove flow ───────────────────────────────────────────────────────────────

async function removeFlow(rl) {
  const installed = detectInstalledSections(compDir, state.sections, templateType);
  const installedNames = Object.keys(installed);

  if (installedNames.length === 0) {
    console.log("\n  No library sections installed.\n");
    return;
  }

  // 1. Pick section to remove
  const choice = await askChoice(
    rl,
    "\n  Which section would you like to remove?",
    installedNames.map((name) => `${name} (${installed[name].variant})`)
  );
  if (!choice) { console.log("  Cancelled."); return; }
  const sectionName = installedNames[choice - 1];
  const { variant: variantName, meta, variantDir } = installed[sectionName];

  // Resolve the full variant object for hooks
  const allSections = discoverSections();
  const sectionDef = allSections.find((s) => s.name === sectionName);
  const variantDef = sectionDef ? sectionDef.variants.find((v) => v.name === variantName) : null;

  // 2. Confirm
  const confirmed = await ask(rl, `\n  Remove ${sectionName} (${variantName})?`);
  if (!confirmed) { console.log("  Cancelled."); return; }

  console.log(`\n─── Removing ${sectionName} ──────────────────────────────────────\n`);

  // 3. Run beforeDisable hook
  if (variantDef && variantDef.hooks && variantDef.hooks.beforeDisable) {
    variantDef.hooks.beforeDisable(buildCtx(sectionName, variantDef));
  }

  // 4. Standard disable
  standardDisable(sectionName, meta);

  // 5. Run afterDisable hook
  if (variantDef && variantDef.hooks && variantDef.hooks.afterDisable) {
    variantDef.hooks.afterDisable(buildCtx(sectionName, variantDef));
  }

  // 6. Update .launchkit
  delete state.sections[sectionName];
  writeLaunchkit(state);

  // 7. npm install if deps removed
  if (meta.dependencies && meta.dependencies.length > 0) {
    console.log("\n  Running npm install...");
    require("child_process").execSync("npm install", { cwd: projectDir, stdio: "inherit" });
  }

  console.log(`\n✓  ${meta.componentName || sectionName} removed.\n`);
}

// ── Standard enable (meta.json-driven) ───────────────────────────────────────

function standardEnable(sectionName, variant, afterSection, pageSections) {
  const { meta, dir: variantDir } = variant;
  const isPageSection = meta.pageSection !== false;

  // a. Copy component (skip if no componentName)
  if (meta.componentName) {
    const srcComponent = path.join(variantDir, "component.tsx");
    const destComponent = path.join(target(), compDir, `${meta.componentName}.tsx`);
    fs.mkdirSync(path.dirname(destComponent), { recursive: true });
    fs.copyFileSync(srcComponent, destComponent);
    console.log(`  [copied] component.tsx → ${compDir}/${meta.componentName}.tsx`);
  }

  // b. Copy extra files
  if (meta.extraFiles) {
    for (const ef of meta.extraFiles) {
      const src = path.join(variantDir, ef.src);
      const destRel = (!i18nActive && ef.destCollapsed) ? ef.destCollapsed : ef.dest;
      const dest = path.join(target(), destRel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
      console.log(`  [copied] ${ef.src} → ${destRel}`);
    }
  }

  // c. Apply accent color swap (skip if no component)
  if (meta.componentName && meta.accentColorToken && accentColor !== meta.accentColorToken) {
    const compPath = path.join(compDir, `${meta.componentName}.tsx`);
    replaceInFile(compPath, new RegExp(meta.accentColorToken, "g"), accentColor);
  }

  // d. Apply collapse patches if i18n disabled (skip if no component)
  if (meta.componentName && !i18nActive && meta.collapsePatches && meta.collapsePatches.length > 0) {
    const compPath = `${compDir}/${meta.componentName}.tsx`;
    for (const patch of meta.collapsePatches) {
      if (patch.action === "removeLine") {
        removeLineContaining(compPath, patch.search);
      } else if (patch.action === "replace") {
        replaceInFile(compPath, patch.search, patch.replace);
      }
    }
  }

  // e. Add import to page.tsx (skip for non-page sections — hooks handle placement)
  if (isPageSection && meta.componentName) {
    const importLine = `import ${meta.componentName} from "./components/${meta.componentName}";`;
    const fullPage = path.join(target(), pageFile);
    let pageContent = fs.readFileSync(fullPage, "utf8");

    // Insert import after the last component import
    const importLines = pageContent.split("\n");
    let lastImportIdx = -1;
    for (let i = 0; i < importLines.length; i++) {
      if (importLines[i].startsWith("import ")) lastImportIdx = i;
    }
    if (lastImportIdx !== -1) {
      importLines.splice(lastImportIdx + 1, 0, importLine);
      pageContent = importLines.join("\n");
      fs.writeFileSync(fullPage, pageContent, "utf8");
      console.log(`  [patched] ${pageFile} — added import: ${meta.componentName}`);
    }

    // f. Add JSX to page.tsx after chosen anchor
    const propsKey = i18nActive ? "i18n" : "collapsed";
    const jsxProps = meta.props[propsKey] || `${meta.dictKey}={dict.${meta.dictKey}}`;
    if (afterSection) {
      // Re-read after import patch
      pageContent = fs.readFileSync(fullPage, "utf8");
      const pageLines = pageContent.split("\n");

      // Find the JSX line for the anchor component
      const anchorPattern = new RegExp(`^(\\s*)<${afterSection.name}\\s`);
      let anchorLineIdx = -1;
      for (let i = 0; i < pageLines.length; i++) {
        if (anchorPattern.test(pageLines[i])) { anchorLineIdx = i; break; }
      }

      if (anchorLineIdx !== -1) {
        const indent = pageLines[anchorLineIdx].match(/^(\s*)/)[1];
        const jsxLine = `${indent}<${meta.componentName} ${jsxProps} />`;
        pageLines.splice(anchorLineIdx + 1, 0, jsxLine);
        fs.writeFileSync(fullPage, pageLines.join("\n"), "utf8");
        console.log(`  [patched] ${pageFile} — added <${meta.componentName} /> after <${afterSection.name}>`);
      }
    }
  }

  // g. Merge dict fragments (skip if no dictKey)
  if (meta.dictKey) {
    for (const locale of LOCALES) {
      const dictFragPath = path.join(variantDir, `${locale}.json`);
      if (!fs.existsSync(dictFragPath)) continue;
      const fragment = JSON.parse(fs.readFileSync(dictFragPath, "utf8"));
      const dictRelPath = `dictionaries/${locale}.json`;
      const dictFull = path.join(target(), dictRelPath);
      if (!fs.existsSync(dictFull)) continue;
      const dict = safeJsonParse(fs.readFileSync(dictFull, "utf8"), dictRelPath);
      dict[meta.dictKey] = fragment;
      fs.writeFileSync(dictFull, JSON.stringify(dict, null, 2) + "\n", "utf8");
      console.log(`  [patched] ${dictRelPath} — added key: ${meta.dictKey}`);
    }
  }

  // h. Add nav link
  if (meta.navLink) {
    const afterId = afterSection
      ? findNavIdForComponent(afterSection.name)
      : null;
    for (const locale of LOCALES) {
      const dictRelPath = `dictionaries/${locale}.json`;
      const label = (meta.navLink.label && meta.navLink.label[locale]) || meta.navLink.id;
      addNavLink(dictRelPath, { id: meta.navLink.id, label }, afterId);
    }
  }

  // i. Add npm dependencies
  if (meta.dependencies) {
    for (const [pkg, version] of meta.dependencies) {
      addDependency(pkg, version);
    }
  }
}

// ── Standard disable (meta.json-driven) ──────────────────────────────────────

function standardDisable(sectionName, meta) {
  // a. Delete component (skip if no componentName)
  if (meta.componentName) {
    const compFile = path.join(target(), compDir, `${meta.componentName}.tsx`);
    if (fs.existsSync(compFile)) {
      fs.rmSync(compFile);
      console.log(`  [removed] ${compDir}/${meta.componentName}.tsx`);
    }
  }

  // b. Delete extra files (with cleanupDir support)
  if (meta.extraFiles) {
    for (const ef of meta.extraFiles) {
      if (ef.cleanupDir) {
        // Delete the entire directory (e.g. app/api/contact/)
        const dirPath = path.join(target(), ef.cleanupDir);
        if (fs.existsSync(dirPath)) {
          fs.rmSync(dirPath, { recursive: true, force: true });
          console.log(`  [removed] ${ef.cleanupDir}`);
        }
      } else {
        const destRel = (!i18nActive && ef.destCollapsed) ? ef.destCollapsed : ef.dest;
        const dest = path.join(target(), destRel);
        if (fs.existsSync(dest)) {
          fs.rmSync(dest, { recursive: true, force: true });
          console.log(`  [removed] ${destRel}`);
        }
      }
    }
  }

  // c. Remove import from page.tsx (skip if no componentName)
  if (meta.componentName) {
    removeLineContaining(pageFile, `import ${meta.componentName} from`);
  }

  // d. Remove JSX from page.tsx (skip if no componentName)
  if (meta.componentName) {
    removeLineContaining(pageFile, `<${meta.componentName}`);
  }

  // e. Remove nav link
  if (meta.navLink) {
    for (const dictFile of DICT_FILES) {
      removeNavLink(dictFile, meta.navLink.id);
    }
  }

  // f. Remove dictKey from dicts (skip if no dictKey)
  if (meta.dictKey) {
    for (const locale of LOCALES) {
      const dictRelPath = `dictionaries/${locale}.json`;
      const dictFull = path.join(target(), dictRelPath);
      if (!fs.existsSync(dictFull)) continue;
      const dict = safeJsonParse(fs.readFileSync(dictFull, "utf8"), dictRelPath);
      if (dict[meta.dictKey] !== undefined) {
        delete dict[meta.dictKey];
        fs.writeFileSync(dictFull, JSON.stringify(dict, null, 2) + "\n", "utf8");
        console.log(`  [patched] ${dictRelPath} — removed key: ${meta.dictKey}`);
      }
    }
  }

  // g. Remove npm dependencies
  if (meta.dependencies) {
    for (const [pkg] of meta.dependencies) {
      removeDependency(pkg);
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Maps a component name to its likely nav link id.
// Convention: component name → lowercase (Services → services, About → about).
function findNavIdForComponent(componentName) {
  const map = {
    Work: "work",
    Reviews: "testimonials",
    Services: "services",
    Process: "process",
    About: "about",
    Contact: "contact",
    FAQ: "faq",
    Skills: "skills",
    HeroFull: "home",
    Hero: "home",
    ProfileSidebar: "home",
  };
  return map[componentName] || componentName.toLowerCase();
}

// Builds the ctx object passed to hooks.
function buildCtx(sectionName, variant) {
  return {
    projectDir,
    compDir,
    pageFile,
    layoutFile,
    i18nActive,
    accentColor,
    state,
    sections: state.sections,
    features: state.features,
    meta: variant.meta,
    variantDir: variant.dir,
    lib: { replaceInFile, removeLineContaining, addDependency, removeDependency, addNavLink, removeNavLink, copyDir, copyFile, deleteIfExists, safeJsonParse, TOOL_ROOT, LOCALES, LOCALES_TS_LITERAL, DICT_FILES },
  };
}
