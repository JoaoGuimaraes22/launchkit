#!/usr/bin/env node
// launchkit — Business Site template module
// Owns: setup flow, feature detection, enable/disable handlers, i18n collapse, accent recolor.

const fs = require("fs");
const path = require("path");
const {
  TOOL_ROOT,
  target,
  ask,
  askChoice,
  copyDir,
  copyFile,
  copyTemplateFiles,
  deleteIfExists,
  removeLineContaining,
  replaceInFile,
  addDependency,
  removeDependency,
  safeJsonParse,
  collapseI18nBase,
  LOCALES,
  DICT_FILES,
  detectStateFromRegistry,
} = require("../lib");

const TYPE = "business";

const COLOR_MAP    = ["indigo", "blue", "violet", "rose", "amber", "emerald", "cyan", "orange"];
const COLOR_LABELS = ["Indigo (default)", "Blue", "Violet", "Rose", "Amber", "Emerald", "Cyan", "Orange"];

// ── Feature list (used by toggle UI) ─────────────────────────────────────────

const featureList = [
  { key: "contactForm", label: "Contact Form (Resend API)",                deps: [], detectFile: "app/api/contact/route.ts" },
  { key: "floatingCTA", label: "FloatingCTA bar (mobile)",                 deps: [], detectFile: "{compDir}/FloatingCTA.tsx" },
  { key: "whatsapp",    label: "WhatsApp button (contact + FloatingCTA)",  deps: ["contactForm", "floatingCTA"], detect: "custom" },
  { key: "accentColor", label: "Brand accent color", recolor: true,        deps: [] },
  { key: "i18n",        label: "i18n routing", unsupported: true,          deps: [], detectFile: "i18n-config.ts" },
];

// ── Feature detection ─────────────────────────────────────────────────────────

function detectState(compDir) {
  const state = detectStateFromRegistry(featureList, compDir);
  // WhatsApp is content-based detection (not just file existence)
  const contactFile = path.join(target(), `${compDir}/Contact.tsx`);
  state.whatsapp = fs.existsSync(contactFile) && fs.readFileSync(contactFile, "utf8").includes("wa.me/");
  return state;
}

// ── Accent color replacement ──────────────────────────────────────────────────

function recolor(fromColor, toColor, compDir, layoutFile) {
  const files = [
    layoutFile,
    `${compDir}/About.tsx`,
    `${compDir}/Contact.tsx`,
    `${compDir}/FAQ.tsx`,
    `${compDir}/FloatingCTA.tsx`,
    `${compDir}/Hero.tsx`,
    `${compDir}/LanguageSwitcher.tsx`,
    `${compDir}/Navbar.tsx`,
    `${compDir}/Reviews.tsx`,
    `${compDir}/ScrollProgress.tsx`,
    `${compDir}/Services.tsx`,
  ];
  for (const f of files) {
    replaceInFile(f, `${fromColor}-`, `${toColor}-`);
  }
}

// ── Full i18n collapse (app/[locale]/ → app/) ─────────────────────────────────

function collapseI18n() {
  collapseI18nBase(null, {
    pageFnName: "BusinessPage",
    beforePatchLayout() {
      // Business-specific: description collapse
      replaceInFile(
        "app/layout.tsx",
        '  const description =\n    locale === "pt"\n      ? "Descrição curta do seu negócio em português."\n      : "Short description of your business in English.";',
        '  const description = "Short description of your business in English.";'
      );
    },
  });
}

// ── Enable feature ────────────────────────────────────────────────────────────

function enable(key, { compDir, pageFile }) {
  switch (key) {
    case "contactForm": {
      copyDir("templates/business/app/api/contact", "app/api/contact");
      addDependency("resend", "^6.9.4");
      break;
    }
    case "floatingCTA": {
      copyFile("templates/business/app/[locale]/components/FloatingCTA.tsx", `${compDir}/FloatingCTA.tsx`);
      replaceInFile(pageFile,
        'import Footer from "./components/Footer";',
        'import FloatingCTA from "./components/FloatingCTA";\nimport Footer from "./components/Footer";'
      );
      replaceInFile(pageFile,
        "      <Footer footer={dict.footer} logo={dict.navbar.logo} />",
        "      <Footer footer={dict.footer} logo={dict.navbar.logo} />\n      <FloatingCTA cta={dict.cta} />"
      );
      for (const dictFile of DICT_FILES) {
        const dictPath = path.join(target(), dictFile);
        const templateDictPath = path.join(TOOL_ROOT, `templates/business/${dictFile}`);
        if (fs.existsSync(dictPath) && fs.existsSync(templateDictPath)) {
          const dict = safeJsonParse(fs.readFileSync(dictPath, "utf8"), dictFile);
          const templateDict = safeJsonParse(fs.readFileSync(templateDictPath, "utf8"), `templates/business/${dictFile}`);
          if (!dict.cta && templateDict.cta) {
            dict.cta = templateDict.cta;
            fs.writeFileSync(dictPath, JSON.stringify(dict, null, 2) + "\n", "utf8");
            console.log("  [patched]", dictFile, "— restored cta section");
          }
        }
      }
      break;
    }
    case "whatsapp": {
      // Contact.tsx: re-insert WhatsApp block from template
      const contactFile = `${compDir}/Contact.tsx`;
      const contactFull = path.join(target(), contactFile);
      const templateContact = path.join(TOOL_ROOT, "templates/business/app/[locale]/components/Contact.tsx");
      if (fs.existsSync(contactFull) && fs.existsSync(templateContact)) {
        let live = fs.readFileSync(contactFull, "utf8");
        if (!live.includes("wa.me/")) {
          const tmpl = fs.readFileSync(templateContact, "utf8");
          const s = tmpl.indexOf("{/* WhatsApp */}");
          const e = tmpl.indexOf("{/* Email */}");
          if (s !== -1 && e !== -1) {
            live = live.replace("{/* Email */}", tmpl.slice(s, e) + "{/* Email */}");
            fs.writeFileSync(contactFull, live, "utf8");
            console.log("  [patched]", contactFile, "— added WhatsApp block");
          }
        }
      }
      // FloatingCTA.tsx: re-insert WhatsApp button from template
      const ctaFile = `${compDir}/FloatingCTA.tsx`;
      const ctaFull = path.join(target(), ctaFile);
      const templateCta = path.join(TOOL_ROOT, "templates/business/app/[locale]/components/FloatingCTA.tsx");
      if (fs.existsSync(ctaFull) && fs.existsSync(templateCta)) {
        let live = fs.readFileSync(ctaFull, "utf8");
        if (!live.includes("wa.me/")) {
          replaceInFile(ctaFile, "  book_label: string;", "  whatsapp_label: string;\n  whatsapp: string;\n  book_label: string;");
          const tmpl = fs.readFileSync(templateCta, "utf8");
          const waIdx = tmpl.indexOf("wa.me/");
          const sepIdx = tmpl.lastIndexOf("<div", waIdx);
          const endIdx = tmpl.indexOf("</a>", waIdx) + "</a>".length;
          const waBlock = tmpl.slice(sepIdx, endIdx);
          live = fs.readFileSync(ctaFull, "utf8");
          const lastSep = live.lastIndexOf('<div className="w-px bg-zinc-200" />');
          if (lastSep !== -1) {
            live = live.slice(0, lastSep) + waBlock + "\n\n      " + live.slice(lastSep);
            fs.writeFileSync(ctaFull, live, "utf8");
            console.log("  [patched]", ctaFile, "— added WhatsApp button");
          }
        }
      }
      // Dictionaries: restore whatsapp fields
      for (const lang of LOCALES) {
        const dictFile = `dictionaries/${lang}.json`;
        const dictFull = path.join(target(), dictFile);
        const tmplDictFull = path.join(TOOL_ROOT, `templates/business/dictionaries/${lang}.json`);
        if (fs.existsSync(dictFull) && fs.existsSync(tmplDictFull)) {
          const dict = safeJsonParse(fs.readFileSync(dictFull, "utf8"), dictFile);
          const tmpl = safeJsonParse(fs.readFileSync(tmplDictFull, "utf8"), `templates/business/dictionaries/${lang}.json`);
          let changed = false;
          if (dict.contact && !dict.contact.whatsapp && tmpl.contact?.whatsapp) {
            dict.contact.whatsapp = tmpl.contact.whatsapp; changed = true;
          }
          if (dict.cta && !dict.cta.whatsapp && tmpl.cta?.whatsapp) {
            dict.cta.whatsapp = tmpl.cta.whatsapp;
            dict.cta.whatsapp_label = tmpl.cta.whatsapp_label;
            changed = true;
          }
          if (changed) {
            fs.writeFileSync(dictFull, JSON.stringify(dict, null, 2) + "\n", "utf8");
            console.log("  [patched]", dictFile, "— restored whatsapp fields");
          }
        }
      }
      break;
    }
  }
}

// ── Disable feature ───────────────────────────────────────────────────────────

function disable(key, { compDir, pageFile }) {
  switch (key) {
    case "contactForm": {
      deleteIfExists("app/api/contact");
      removeDependency("resend");
      break;
    }
    case "floatingCTA": {
      deleteIfExists(`${compDir}/FloatingCTA.tsx`);
      removeLineContaining(pageFile, 'import FloatingCTA from "./components/FloatingCTA"');
      removeLineContaining(pageFile, "<FloatingCTA");
      for (const dictFile of DICT_FILES) {
        const dictPath = path.join(target(), dictFile);
        if (fs.existsSync(dictPath)) {
          const dict = safeJsonParse(fs.readFileSync(dictPath, "utf8"), dictFile);
          delete dict.cta;
          fs.writeFileSync(dictPath, JSON.stringify(dict, null, 2) + "\n", "utf8");
          console.log("  [patched]", dictFile, "— removed cta section");
        }
      }
      break;
    }
    case "whatsapp": {
      // Contact.tsx: remove WhatsApp block
      const contactFile = `${compDir}/Contact.tsx`;
      const contactFull = path.join(target(), contactFile);
      if (fs.existsSync(contactFull)) {
        let content = fs.readFileSync(contactFull, "utf8");
        const s = content.indexOf("{/* WhatsApp */}");
        const e = content.indexOf("{/* Email */}");
        if (s !== -1 && e !== -1 && s < e) {
          const trimFrom = content[s - 2] === "\n" ? s - 1 : s;
          content = content.slice(0, trimFrom) + content.slice(e);
          fs.writeFileSync(contactFull, content, "utf8");
          console.log("  [patched]", contactFile, "— removed WhatsApp block");
        }
      }
      // FloatingCTA.tsx: remove separator + WhatsApp button
      const ctaFile = `${compDir}/FloatingCTA.tsx`;
      const ctaFull = path.join(target(), ctaFile);
      if (fs.existsSync(ctaFull)) {
        let content = fs.readFileSync(ctaFull, "utf8");
        if (content.includes("wa.me/")) {
          const waIdx = content.indexOf("wa.me/");
          const sepIdx = content.lastIndexOf("<div", waIdx);
          const endIdx = content.indexOf("</a>", waIdx) + "</a>".length;
          content = content.slice(0, sepIdx) + content.slice(endIdx);
          fs.writeFileSync(ctaFull, content, "utf8");
          console.log("  [patched]", ctaFile, "— removed WhatsApp button");
          removeLineContaining(ctaFile, "whatsapp_label: string;");
          removeLineContaining(ctaFile, "  whatsapp: string;");
        }
      }
      // Dictionaries: remove whatsapp fields
      for (const lang of LOCALES) {
        const dictFile = `dictionaries/${lang}.json`;
        const dictFull = path.join(target(), dictFile);
        if (fs.existsSync(dictFull)) {
          const dict = safeJsonParse(fs.readFileSync(dictFull, "utf8"), dictFile);
          let changed = false;
          if (dict.contact?.whatsapp !== undefined) { delete dict.contact.whatsapp; changed = true; }
          if (dict.cta?.whatsapp !== undefined)      { delete dict.cta.whatsapp; changed = true; }
          if (dict.cta?.whatsapp_label !== undefined){ delete dict.cta.whatsapp_label; changed = true; }
          if (changed) {
            fs.writeFileSync(dictFull, JSON.stringify(dict, null, 2) + "\n", "utf8");
            console.log("  [patched]", dictFile, "— removed whatsapp fields");
          }
        }
      }
      break;
    }
  }
}

// ── Interactive setup ─────────────────────────────────────────────────────────

async function setup(rl) {
  console.log("\n─── Business Site — Feature Selection ─────────────────────────\n");

  const features = {
    i18n:         await ask(rl, "[1/5] Include i18n (bilingual /en /pt routing)?"),
    contactForm:  await ask(rl, "[2/5] Include contact form (Resend email on submit)?"),
    floatingCTA:  await ask(rl, "[3/5] Include FloatingCTA bar (sticky mobile bottom bar)?"),
    whatsapp:     await ask(rl, "[4/5] Include WhatsApp button in contact section?"),
  };

  const colorChoice = await askChoice(rl, "[5/5] Brand accent color?", COLOR_LABELS);
  const accentColor = COLOR_MAP[(colorChoice ?? 1) - 1];

  console.log(`\n─── Copying business template ──────────────────────────────────────\n`);
  copyTemplateFiles(TYPE);

  console.log("\n─── Applying business site feature selections ───────────────────\n");

  if (features.i18n) {
    console.log("✓  i18n: enabled");
    copyDir("templates/business/root", ".");
  } else {
    console.log("⚙  i18n: disabled");
    deleteIfExists("app/[locale]/components/LanguageSwitcher.tsx");
    deleteIfExists("app/[locale]/components/LangSetter.tsx");
    removeLineContaining("app/[locale]/layout.tsx", 'import LangSetter from "./components/LangSetter"');
    removeLineContaining("app/[locale]/layout.tsx", "<LangSetter");
    removeLineContaining("app/[locale]/components/Navbar.tsx", 'import LanguageSwitcher from "./LanguageSwitcher"');
    removeLineContaining("app/[locale]/components/Navbar.tsx", "<LanguageSwitcher");
    fs.writeFileSync(
      path.join(target(), "app/sitemap.ts"),
      `import type { MetadataRoute } from "next";\n\nconst SITE_URL = "https://YOUR_DOMAIN";\n\nexport default function sitemap(): MetadataRoute.Sitemap {\n  return [{ url: SITE_URL, lastModified: new Date() }];\n}\n`,
      "utf8"
    );
    console.log("  [patched] sitemap.ts — simplified (no i18n)");
  }

  if (!features.contactForm) {
    console.log("⚙  Contact Form: disabled");
    deleteIfExists("app/api/contact");
  } else {
    console.log("✓  Contact Form: enabled");
    addDependency("resend", "^6.9.4");
  }

  if (!features.floatingCTA) {
    console.log("⚙  FloatingCTA: disabled");
    deleteIfExists("app/[locale]/components/FloatingCTA.tsx");
    removeLineContaining("app/[locale]/page.tsx", 'import FloatingCTA from "./components/FloatingCTA"');
    removeLineContaining("app/[locale]/page.tsx", "<FloatingCTA");
    for (const dictFile of DICT_FILES) {
      const dictPath = path.join(target(), dictFile);
      if (fs.existsSync(dictPath)) {
        const dict = safeJsonParse(fs.readFileSync(dictPath, "utf8"), dictFile);
        delete dict.cta;
        fs.writeFileSync(dictPath, JSON.stringify(dict, null, 2) + "\n", "utf8");
        console.log("  [patched]", dictFile, "— removed cta section");
      }
    }
  } else {
    console.log("✓  FloatingCTA: enabled");
  }

  if (accentColor !== "indigo") {
    console.log(`\n─── Replacing accent color: indigo → ${accentColor} ──────────────────\n`);
    const colorFiles = [
      "app/[locale]/layout.tsx",
      "app/[locale]/components/About.tsx",
      "app/[locale]/components/Contact.tsx",
      "app/[locale]/components/FAQ.tsx",
      "app/[locale]/components/FloatingCTA.tsx",
      "app/[locale]/components/Hero.tsx",
      "app/[locale]/components/LanguageSwitcher.tsx",
      "app/[locale]/components/Navbar.tsx",
      "app/[locale]/components/Reviews.tsx",
      "app/[locale]/components/ScrollProgress.tsx",
      "app/[locale]/components/Services.tsx",
    ];
    for (const f of colorFiles) replaceInFile(f, "indigo-", `${accentColor}-`);
  }
  console.log(`✓  Accent color: ${accentColor}`);

  if (!features.i18n) collapseI18n();

  return { type: TYPE, features: { ...features, accentColor } };
}

module.exports = { type: TYPE, featureList, detectState, setup, enable, disable, recolor, COLOR_MAP, COLOR_LABELS };
