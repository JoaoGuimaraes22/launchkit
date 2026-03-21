#!/usr/bin/env node
// launchkit — Feature Toggle
// Run: node scripts/toggle.js
// Shows current feature state and lets you enable/disable individual features
// without a full reset + re-setup.

const readline = require("readline");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const {
  ROOT,
  deleteIfExists,
  copyDir,
  copyFile,
  removeLineContaining,
  replaceInFile,
  addDependency,
  removeDependency,
} = require("./lib");

const LAUNCHKIT_PATH = path.join(ROOT, ".launchkit");

function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question + " [y/n] ", (answer) => {
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

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

// ─── .launchkit State ────────────────────────────────────────────────────────

function readLaunchkit() {
  if (!fs.existsSync(LAUNCHKIT_PATH)) {
    console.error("\n  Error: .launchkit not found.\n  Run node scripts/setup.js first.\n");
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(LAUNCHKIT_PATH, "utf8"));
}

function writeLaunchkit(state) {
  fs.writeFileSync(LAUNCHKIT_PATH, JSON.stringify(state, null, 2) + "\n", "utf8");
}

// ─── Feature detection ───────────────────────────────────────────────────────

function detectCurrentState(type, compDir) {
  const exists = (rel) => fs.existsSync(path.join(ROOT, rel));
  if (type === "portfolio") {
    return {
      i18n: exists("i18n-config.ts"),
      webglHero: exists(`${compDir}/HeroFull.tsx`),
      chatbot: exists("app/api/chat/route.ts"),
      contactForm: exists("app/api/contact/route.ts"),
      testimonials: exists(`${compDir}/Testimonials.tsx`),
      work: exists(`${compDir}/Work.tsx`),
      sidebar: exists(`${compDir}/ProfileSidebar.tsx`),
    };
  } else {
    return {
      i18n: exists("i18n-config.ts"),
      contactForm: exists("app/api/contact/route.ts"),
      floatingCTA: exists(`${compDir}/FloatingCTA.tsx`),
    };
  }
}

// ─── Sitemap Regeneration ────────────────────────────────────────────────────

function regenerateSitemap(i18nActive, workEnabled) {
  let content;
  if (i18nActive && workEnabled) {
    content = `import type { MetadataRoute } from "next";
import { getDictionary } from "../get-dictionary";

const SITE_URL = "https://your-domain.vercel.app";
const locales = ["en", "pt"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dict = await getDictionary("en");
  const slugs = dict.work.projects.map((p) => p.slug);

  const homePaths = locales.map((locale) => ({
    url: \`\${SITE_URL}/\${locale}\`,
    lastModified: new Date(),
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, \`\${SITE_URL}/\${l}\`])),
    },
  }));

  const workPaths = slugs.flatMap((slug) =>
    locales.map((locale) => ({
      url: \`\${SITE_URL}/\${locale}/work/\${slug}\`,
      lastModified: new Date(),
    })),
  );

  return [...homePaths, ...workPaths];
}
`;
  } else if (i18nActive && !workEnabled) {
    content = `import type { MetadataRoute } from "next";

const SITE_URL = "https://YOUR_DOMAIN";
const locales = ["en", "pt"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: \`\${SITE_URL}/\${locale}\`,
    lastModified: new Date(),
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, \`\${SITE_URL}/\${l}\`])),
    },
  }));
}
`;
  } else if (!i18nActive && workEnabled) {
    content = `import type { MetadataRoute } from "next";
import dict from "../dictionaries/en.json";

const SITE_URL = "https://YOUR_DOMAIN";

export default function sitemap(): MetadataRoute.Sitemap {
  const slugs = dict.work.projects.map((p) => p.slug);
  return [
    { url: SITE_URL, lastModified: new Date() },
    ...slugs.map((slug) => ({ url: \`\${SITE_URL}/work/\${slug}\`, lastModified: new Date() })),
  ];
}
`;
  } else {
    content = `import type { MetadataRoute } from "next";

const SITE_URL = "https://YOUR_DOMAIN";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE_URL, lastModified: new Date() }];
}
`;
  }
  fs.writeFileSync(path.join(ROOT, "app/sitemap.ts"), content, "utf8");
  console.log("  [patched] app/sitemap.ts");
}

// ─── i18n-Collapse Patches (applied to newly copied files when i18n disabled) ──

function collapseWorkTsx(compDir) {
  removeLineContaining(`${compDir}/Work.tsx`, "import { type Locale }");
  removeLineContaining(`${compDir}/Work.tsx`, "locale: Locale;");
  replaceInFile(`${compDir}/Work.tsx`, "{ work, locale }", "{ work }");
  replaceInFile(`${compDir}/Work.tsx`, "`/${locale}/work/${project.slug}`", "`/work/${project.slug}`");
}

function collapseSidebarTsx(compDir) {
  removeLineContaining(`${compDir}/ProfileSidebar.tsx`, "import { type Locale }");
  removeLineContaining(`${compDir}/ProfileSidebar.tsx`, "locale: Locale;");
  replaceInFile(`${compDir}/ProfileSidebar.tsx`, "{ hero, locale, mobile }", "{ hero, mobile }");
  replaceInFile(`${compDir}/ProfileSidebar.tsx`, "<CtaButton locale={locale} />", "<CtaButton />");
  replaceInFile(`${compDir}/ProfileSidebar.tsx`, "<ChatNudge locale={locale} />", "<ChatNudge />");
  replaceInFile(
    `${compDir}/ProfileSidebar.tsx`,
    "function CtaButton({ locale }: { locale: Locale })",
    "function CtaButton()"
  );
  replaceInFile(`${compDir}/ProfileSidebar.tsx`, 'href={`/${locale}#contact`}', 'href="/#contact"');
}

function collapseChatNudgeTsx(compDir) {
  replaceInFile(
    `${compDir}/ChatNudge.tsx`,
    'import { type Locale } from "../../../i18n-config";\n\nconst nudgeText: Record<Locale, string> = {\n  en: "Have questions? Chat with me",\n  pt: "Tens dúvidas? Fala comigo",\n};\n\nexport default function ChatNudge({ locale }: { locale: Locale }) {',
    'export default function ChatNudge() {'
  );
  replaceInFile(`${compDir}/ChatNudge.tsx`, "{nudgeText[locale] ?? nudgeText.en}", '"Have questions? Chat with me"');
}

function collapseChatWidgetTsx(compDir) {
  removeLineContaining(`${compDir}/ChatWidget.tsx`, "import { type Locale }");
  replaceInFile(
    `${compDir}/ChatWidget.tsx`,
    'const strings = {\n  en: {\n    title: "Chat with me",\n    subtitle: "Typically replies instantly",\n    placeholder: "Type a message...",\n    greeting: "Hi! I\'m YOUR_NAME\'s assistant. Ask me anything about their work, services, or availability.",\n    ariaLabel: "Open chat",\n    bubble: "Ask me anything",\n    chips: ["What services do you offer?", "What\'s your pricing?", "Are you available?", "Show me your work"],\n  },\n  pt: {\n    title: "Fala comigo",\n    subtitle: "Responde quase instantaneamente",\n    placeholder: "Escreve uma mensagem...",\n    greeting: "Olá! Sou o assistente de YOUR_NAME. Pergunta-me sobre o seu trabalho, serviços ou disponibilidade.",\n    ariaLabel: "Abrir chat",\n    bubble: "Pergunta-me algo",\n    chips: ["Que serviços ofereces?", "Qual é o teu preço?", "Estás disponível?", "Mostra o teu trabalho"],\n  },\n};\n\nexport default function ChatWidget({ locale }: { locale: Locale }) {',
    'const s = {\n  title: "Chat with me",\n  subtitle: "Typically replies instantly",\n  placeholder: "Type a message...",\n  greeting: "Hi! I\'m YOUR_NAME\'s assistant. Ask me anything about their work, services, or availability.",\n  ariaLabel: "Open chat",\n  bubble: "Ask me anything",\n  chips: ["What services do you offer?", "What\'s your pricing?", "Are you available?", "Show me your work"],\n};\n\nexport default function ChatWidget() {'
  );
  removeLineContaining(`${compDir}/ChatWidget.tsx`, "const s = strings[locale]");
}

// ─── Portfolio: Enable/Disable ────────────────────────────────────────────────

function enableContactForm(type) {
  copyDir(`templates/${type}/app/api/contact`, "app/api/contact");
  addDependency("resend", "^6.9.4");
}

function disableContactForm() {
  deleteIfExists("app/api/contact");
  removeDependency("resend");
}

function enableWebglHero(compDir, pageFile, i18nActive) {
  copyFile(
    `templates/portfolio/app/[locale]/components/HeroFull.tsx`,
    `${compDir}/HeroFull.tsx`
  );
  // HeroFull has no locale refs — no collapse patches needed
  replaceInFile(pageFile, 'import Hero from "./components/Hero";', 'import HeroFull from "./components/HeroFull";');
  replaceInFile(pageFile, "<Hero hero={dict.hero} />", "<HeroFull hero={dict.hero} />");
  void i18nActive; // HeroFull.tsx is locale-agnostic
}

function disableWebglHero(compDir, pageFile) {
  copyFile(`templates/portfolio/app/[locale]/components/Hero.tsx`, `${compDir}/Hero.tsx`);
  // Hero.tsx is locale-agnostic — no collapse patches needed
  deleteIfExists(`${compDir}/HeroFull.tsx`);
  replaceInFile(pageFile, 'import HeroFull from "./components/HeroFull";', 'import Hero from "./components/Hero";');
  replaceInFile(pageFile, "<HeroFull hero={dict.hero} />", "<Hero hero={dict.hero} />");
}

function enableChatbot(compDir, layoutFile, i18nActive, sidebarActive) {
  copyFile(`templates/portfolio/app/[locale]/components/ChatWidget.tsx`, `${compDir}/ChatWidget.tsx`);
  copyDir("templates/portfolio/app/api/chat", "app/api/chat");
  copyDir("templates/portfolio/dialogflow", "dialogflow");

  if (!i18nActive) collapseChatWidgetTsx(compDir);

  if (sidebarActive) {
    copyFile(`templates/portfolio/app/[locale]/components/ChatNudge.tsx`, `${compDir}/ChatNudge.tsx`);
    if (!i18nActive) collapseChatNudgeTsx(compDir);
    // Re-add ChatNudge import + usage to ProfileSidebar if it was cleaned up
    const sidebarPath = `${compDir}/ProfileSidebar.tsx`;
    const sidebarContent = fs.readFileSync(path.join(ROOT, sidebarPath), "utf8");
    if (!sidebarContent.includes("ChatNudge")) {
      if (i18nActive) {
        replaceInFile(sidebarPath, 'import { useRef }', 'import ChatNudge from "./ChatNudge";\nimport { useRef }');
      } else {
        replaceInFile(sidebarPath, 'import { useRef }', 'import ChatNudge from "./ChatNudge";\nimport { useRef }');
      }
      // Re-add ChatNudge JSX at both render sites (mobile + desktop)
      replaceInFile(
        sidebarPath,
        i18nActive ? "<CtaButton locale={locale} />\n        </motion.div>\n        <motion.div {...fadeUp(inView, 0.45)}" : "<CtaButton />\n        </motion.div>\n        <motion.div {...fadeUp(inView, 0.45)}",
        i18nActive
          ? "<CtaButton locale={locale} />\n        </motion.div>\n        <motion.div {...fadeUp(inView, 0.4)}><ChatNudge locale={locale} /></motion.div>\n        <motion.div {...fadeUp(inView, 0.45)}"
          : "<CtaButton />\n        </motion.div>\n        <motion.div {...fadeUp(inView, 0.4)}><ChatNudge /></motion.div>\n        <motion.div {...fadeUp(inView, 0.45)}"
      );
      replaceInFile(
        sidebarPath,
        i18nActive ? "<CtaButton locale={locale} /></motion.div>\n      <motion.div className=\"flex gap-5\"" : "<CtaButton /></motion.div>\n      <motion.div className=\"flex gap-5\"",
        i18nActive
          ? "<CtaButton locale={locale} /></motion.div>\n      <motion.div {...fadeUp(inView, 0.44)}><ChatNudge locale={locale} /></motion.div>\n\n      <motion.div className=\"flex gap-5\""
          : "<CtaButton /></motion.div>\n      <motion.div {...fadeUp(inView, 0.44)}><ChatNudge /></motion.div>\n\n      <motion.div className=\"flex gap-5\""
      );
    }
  }

  // Add ChatWidget import + JSX to layout
  const chatWidgetJSX = i18nActive ? "      <ChatWidget locale={locale} />" : "      <ChatWidget />";
  replaceInFile(layoutFile, 'import Navbar from "./components/Navbar";', 'import ChatWidget from "./components/ChatWidget";\nimport Navbar from "./components/Navbar";');
  replaceInFile(layoutFile, "      {children}", `      {children}\n${chatWidgetJSX}`);

  addDependency("google-auth-library", "^10.6.2");
  addDependency("adm-zip", "^0.5.16");
}

function disableChatbot(compDir, layoutFile, sidebarActive) {
  deleteIfExists(`${compDir}/ChatWidget.tsx`);
  deleteIfExists("app/api/chat");
  deleteIfExists("dialogflow");
  removeLineContaining(layoutFile, 'import ChatWidget from "./components/ChatWidget"');
  removeLineContaining(layoutFile, "<ChatWidget");
  if (sidebarActive) {
    deleteIfExists(`${compDir}/ChatNudge.tsx`);
    removeLineContaining(`${compDir}/ProfileSidebar.tsx`, 'import ChatNudge from "./ChatNudge"');
    removeLineContaining(`${compDir}/ProfileSidebar.tsx`, "<ChatNudge");
  }
  removeDependency("google-auth-library");
  removeDependency("adm-zip");
}

function enableTestimonials(compDir, pageFile) {
  copyFile(`templates/portfolio/app/[locale]/components/Testimonials.tsx`, `${compDir}/Testimonials.tsx`);
  // Testimonials.tsx has no locale refs — no collapse patches needed

  // Add import before Services (always present)
  replaceInFile(pageFile,
    'import Services from "./components/Services";',
    'import Testimonials from "./components/Testimonials";\nimport Services from "./components/Services";'
  );
  // Add JSX before Services (always present)
  replaceInFile(pageFile,
    "            <Services services={dict.services} />",
    "            <Testimonials testimonials={dict.testimonials} />\n            <Services services={dict.services} />"
  );
  // Add Navbar entry before services entry (always present)
  replaceInFile(`${compDir}/Navbar.tsx`,
    '    { id: "services", label: nav.services },',
    '    { id: "testimonials", label: nav.reviews },\n    { id: "services", label: nav.services },'
  );
}

function disableTestimonials(compDir, pageFile) {
  deleteIfExists(`${compDir}/Testimonials.tsx`);
  removeLineContaining(pageFile, 'import Testimonials from "./components/Testimonials"');
  removeLineContaining(pageFile, "<Testimonials");
  const navbarPath = path.join(ROOT, `${compDir}/Navbar.tsx`);
  if (fs.existsSync(navbarPath)) {
    const content = fs.readFileSync(navbarPath, "utf8");
    const updated = content
      .split("\n")
      .filter((l) => !l.includes('"testimonials"') && !l.includes("nav.reviews"))
      .join("\n");
    if (updated !== content) {
      fs.writeFileSync(navbarPath, updated, "utf8");
      console.log("  [patched]", `${compDir}/Navbar.tsx`, "— removed testimonials nav entry");
    }
  }
}

function enableWork(compDir, pageFile, i18nActive) {
  copyFile(`templates/portfolio/app/[locale]/components/Work.tsx`, `${compDir}/Work.tsx`);
  copyDir(
    `templates/portfolio/app/[locale]/work`,
    i18nActive ? "app/[locale]/work" : "app/work"
  );
  if (!i18nActive) collapseWorkTsx(compDir);

  // Add import — insert after hero import (HeroFull or Hero)
  const pageContent = fs.readFileSync(path.join(ROOT, pageFile), "utf8");
  const heroImportAnchor = pageContent.includes("HeroFull")
    ? 'import HeroFull from "./components/HeroFull";'
    : 'import Hero from "./components/Hero";';
  replaceInFile(pageFile, heroImportAnchor, heroImportAnchor + '\nimport Work from "./components/Work";');

  // Add JSX — before Testimonials if present, else before Services
  const workJSX = i18nActive
    ? "            <Work work={dict.work} locale={locale} />"
    : "            <Work work={dict.work} />";
  if (fs.readFileSync(path.join(ROOT, pageFile), "utf8").includes("<Testimonials testimonials")) {
    replaceInFile(pageFile,
      "            <Testimonials testimonials={dict.testimonials} />",
      workJSX + "\n            <Testimonials testimonials={dict.testimonials} />"
    );
  } else {
    replaceInFile(pageFile,
      "            <Services services={dict.services} />",
      workJSX + "\n            <Services services={dict.services} />"
    );
  }

  // Add Navbar entry after home (always present)
  replaceInFile(`${compDir}/Navbar.tsx`,
    '    { id: "home", label: nav.home },',
    '    { id: "home", label: nav.home },\n    { id: "work", label: nav.work },'
  );

  regenerateSitemap(i18nActive, true);
}

function disableWork(compDir, pageFile, i18nActive) {
  deleteIfExists(`${compDir}/Work.tsx`);
  deleteIfExists(i18nActive ? "app/[locale]/work" : "app/work");
  deleteIfExists("public/projects");
  removeLineContaining(pageFile, 'import Work from "./components/Work"');
  removeLineContaining(pageFile, "<Work");
  const navbarPath = path.join(ROOT, `${compDir}/Navbar.tsx`);
  if (fs.existsSync(navbarPath)) {
    const content = fs.readFileSync(navbarPath, "utf8");
    const updated = content
      .split("\n")
      .filter((l) => !(l.includes('"work"') && l.includes("nav.work")))
      .join("\n");
    if (updated !== content) {
      fs.writeFileSync(navbarPath, updated, "utf8");
      console.log("  [patched]", `${compDir}/Navbar.tsx`, "— removed work nav entry");
    }
  }
  regenerateSitemap(i18nActive, false);
}

function enableSidebar(compDir, pageFile, i18nActive, chatbotActive) {
  copyFile(`templates/portfolio/app/[locale]/components/ProfileSidebar.tsx`, `${compDir}/ProfileSidebar.tsx`);
  if (!i18nActive) collapseSidebarTsx(compDir);

  if (!chatbotActive) {
    // Remove ChatNudge refs from the copied ProfileSidebar
    removeLineContaining(`${compDir}/ProfileSidebar.tsx`, 'import ChatNudge from "./ChatNudge"');
    removeLineContaining(`${compDir}/ProfileSidebar.tsx`, "<ChatNudge");
  } else {
    // ChatNudge.tsx should also be copied
    copyFile(`templates/portfolio/app/[locale]/components/ChatNudge.tsx`, `${compDir}/ChatNudge.tsx`);
    if (!i18nActive) collapseChatNudgeTsx(compDir);
  }

  // Add import to page.tsx (insert before hero import)
  const pageContent = fs.readFileSync(path.join(ROOT, pageFile), "utf8");
  const heroImportAnchor = pageContent.includes("HeroFull")
    ? 'import HeroFull from "./components/HeroFull";'
    : 'import Hero from "./components/Hero";';
  replaceInFile(pageFile,
    heroImportAnchor,
    `import ProfileSidebar from "./components/ProfileSidebar";\n${heroImportAnchor}`
  );

  // Remove TODO comment if present
  removeLineContaining(pageFile, "TODO: TEMPLATE — ProfileSidebar removed");
}

function disableSidebar(compDir, pageFile) {
  deleteIfExists(`${compDir}/ProfileSidebar.tsx`);
  deleteIfExists(`${compDir}/ChatNudge.tsx`);
  removeLineContaining(pageFile, 'import ProfileSidebar from "./components/ProfileSidebar"');
  const pagePath = path.join(ROOT, pageFile);
  if (fs.existsSync(pagePath)) {
    const content = fs.readFileSync(pagePath, "utf8");
    if (!content.includes("TODO: TEMPLATE")) {
      fs.writeFileSync(
        pagePath,
        "// TODO: TEMPLATE — ProfileSidebar removed. Replace the md:flex sidebar layout with a single-column <main> wrapper. Remove <aside> block and any ProfileSidebar JSX.\n" + content,
        "utf8"
      );
      console.log("  [patched]", pageFile, "— added TODO comment for Claude");
    }
  }
}

// ─── Business: Enable/Disable ─────────────────────────────────────────────────

function enableFloatingCTA(compDir, pageFile) {
  copyFile(`templates/business/app/[locale]/components/FloatingCTA.tsx`, `${compDir}/FloatingCTA.tsx`);
  // FloatingCTA uses no locale refs directly — check if i18n collapsed (but business
  // FloatingCTA doesn't have locale props so no collapse patches needed)

  // Add import to page.tsx (before Footer, always present)
  replaceInFile(pageFile, 'import Footer from "./components/Footer";', 'import FloatingCTA from "./components/FloatingCTA";\nimport Footer from "./components/Footer";');

  // Add JSX at end of page (after Footer, before closing fragment)
  replaceInFile(pageFile,
    "      <Footer footer={dict.footer} logo={dict.navbar.logo} />",
    "      <Footer footer={dict.footer} logo={dict.navbar.logo} />\n      <FloatingCTA cta={dict.cta} />"
  );

  // Restore dict.cta from template in both dictionaries
  for (const dictFile of ["dictionaries/en.json", "dictionaries/pt.json"]) {
    const dictPath = path.join(ROOT, dictFile);
    const templateDictPath = path.join(ROOT, `templates/business/${dictFile}`);
    if (fs.existsSync(dictPath) && fs.existsSync(templateDictPath)) {
      const dict = JSON.parse(fs.readFileSync(dictPath, "utf8"));
      const templateDict = JSON.parse(fs.readFileSync(templateDictPath, "utf8"));
      if (!dict.cta && templateDict.cta) {
        dict.cta = templateDict.cta;
        fs.writeFileSync(dictPath, JSON.stringify(dict, null, 2) + "\n", "utf8");
        console.log("  [patched]", dictFile, "— restored cta section");
      }
    }
  }
}

function disableFloatingCTA(compDir, pageFile) {
  deleteIfExists(`${compDir}/FloatingCTA.tsx`);
  removeLineContaining(pageFile, 'import FloatingCTA from "./components/FloatingCTA"');
  removeLineContaining(pageFile, "<FloatingCTA");
  for (const dictFile of ["dictionaries/en.json", "dictionaries/pt.json"]) {
    const dictPath = path.join(ROOT, dictFile);
    if (fs.existsSync(dictPath)) {
      const dict = JSON.parse(fs.readFileSync(dictPath, "utf8"));
      delete dict.cta;
      fs.writeFileSync(dictPath, JSON.stringify(dict, null, 2) + "\n", "utf8");
      console.log("  [patched]", dictFile, "— removed cta section");
    }
  }
}

// ─── Feature List ─────────────────────────────────────────────────────────────

function getFeatureList(type) {
  if (type === "portfolio") {
    return [
      { key: "webglHero", label: "WebGL Hero (shader + parallax)" },
      { key: "chatbot", label: "Chatbot (Dialogflow ES)" },
      { key: "contactForm", label: "Contact Form (Resend API)" },
      { key: "testimonials", label: "Testimonials section" },
      { key: "work", label: "Work section (project gallery)" },
      { key: "sidebar", label: "ProfileSidebar (sticky desktop)" },
      { key: "i18n", label: "i18n routing", unsupported: true },
    ];
  } else {
    return [
      { key: "contactForm", label: "Contact Form (Resend API)" },
      { key: "floatingCTA", label: "FloatingCTA bar (mobile)" },
      { key: "i18n", label: "i18n routing", unsupported: true },
    ];
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

// Runs one toggle interaction. Returns true if a toggle was performed, false otherwise.
async function runToggle(rl) {
  const state = readLaunchkit();
  const { type } = state;
  const i18nActive = fs.existsSync(path.join(ROOT, "i18n-config.ts"));
  const compDir = i18nActive ? "app/[locale]/components" : "app/components";
  const pageFile = i18nActive ? "app/[locale]/page.tsx" : "app/page.tsx";
  const layoutFile = i18nActive ? "app/[locale]/layout.tsx" : "app/layout.tsx";

  const current = detectCurrentState(type, compDir);
  const features = getFeatureList(type);

  console.log(`\n  Template : ${type.charAt(0).toUpperCase() + type.slice(1)}`);
  console.log(`  i18n     : ${i18nActive ? "enabled" : "disabled (collapsed)"}\n`);

  features.forEach((f, i) => {
    const icon = f.unsupported ? "⚠ " : current[f.key] ? "✓ " : "✗ ";
    const suffix = f.unsupported ? " (requires reset + setup)" : "";
    console.log(`  [${i + 1}] ${icon} ${f.label}${suffix}`);
  });

  const choice = await askChoice(rl, "\nSelect feature to toggle", features.map((f) => `${f.label}`));

  if (choice === null) {
    console.log("\n  Invalid choice. Exiting.\n");
    return false;
  }

  const selected = features[choice - 1];

  if (selected.unsupported) {
    console.log(`\n  ⚠  i18n routing cannot be toggled in-place.\n  Run npm run reset + node scripts/setup.js to change this setting.\n`);
    return false;
  }

  const isCurrentlyEnabled = current[selected.key];
  const action = isCurrentlyEnabled ? "disable" : "enable";
  const confirmed = await ask(rl, `\n  ${action.charAt(0).toUpperCase() + action.slice(1)} "${selected.label}"?`);

  if (!confirmed) {
    console.log("\n  Cancelled.\n");
    return false;
  }

  console.log(`\n─── ${action.charAt(0).toUpperCase() + action.slice(1)}ing: ${selected.label} ────────────────────────────────────\n`);

  try {
    if (action === "enable") {
      switch (selected.key) {
        case "webglHero":   enableWebglHero(compDir, pageFile, i18nActive); break;
        case "chatbot":     enableChatbot(compDir, layoutFile, i18nActive, current.sidebar); break;
        case "contactForm": enableContactForm(type); break;
        case "testimonials": enableTestimonials(compDir, pageFile); break;
        case "work":        enableWork(compDir, pageFile, i18nActive); break;
        case "sidebar":     enableSidebar(compDir, pageFile, i18nActive, current.chatbot); break;
        case "floatingCTA": enableFloatingCTA(compDir, pageFile); break;
      }
    } else {
      switch (selected.key) {
        case "webglHero":   disableWebglHero(compDir, pageFile); break;
        case "chatbot":     disableChatbot(compDir, layoutFile, current.sidebar); break;
        case "contactForm": disableContactForm(); break;
        case "testimonials": disableTestimonials(compDir, pageFile); break;
        case "work":        disableWork(compDir, pageFile, i18nActive); break;
        case "sidebar":     disableSidebar(compDir, pageFile); break;
        case "floatingCTA": disableFloatingCTA(compDir, pageFile); break;
      }
    }
  } catch (err) {
    console.error("\n  Error during toggle:", err.message);
    console.error("  Some changes may be partial. Check the files above and fix manually if needed.\n");
    process.exit(1);
  }

  // Update .launchkit
  state.features[selected.key] = action === "enable";
  writeLaunchkit(state);

  // Run npm install if deps changed
  if (["chatbot", "contactForm"].includes(selected.key)) {
    console.log("\n─── Running npm install ─────────────────────────────────────────\n");
    try {
      execSync("npm install", { stdio: "inherit", cwd: ROOT });
    } catch {
      console.warn("  npm install encountered warnings — check output above.");
    }
  }

  console.log(`\n✓  ${selected.label} ${action}d.`);
  if (selected.key === "sidebar" && action === "enable") {
    console.log("  ⚠  page.tsx may still have the old single-column layout.");
    console.log("     Run Bootstrap or manually restore the md:flex sidebar wrapper.");
  }
  if (selected.key === "sidebar" && action === "disable") {
    console.log("  ⚠  page.tsx still has the sidebar layout JSX — Bootstrap or");
    console.log("     Claude Code will clean it up (look for the TODO comment).");
  }

  return true;
}

async function main() {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║      launchkit — Toggle Features         ║");
  console.log("╚══════════════════════════════════════════╝");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    while (true) {
      const toggled = await runToggle(rl);
      if (!toggled) break;
      const again = await ask(rl, "  Toggle another feature?");
      if (!again) break;
    }
  } finally {
    rl.close();
  }

  console.log("  Run npm run dev to preview.\n");
}

main().catch((err) => {
  console.error("Toggle failed:", err);
  process.exit(1);
});
