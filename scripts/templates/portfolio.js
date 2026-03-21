#!/usr/bin/env node
// launchkit — Portfolio template module
// Owns: setup flow, feature detection, enable/disable handlers, i18n collapse.

const fs = require("fs");
const path = require("path");
const {
  target,
  ask,
  copyDir,
  copyFile,
  copyTemplateFiles,
  deleteIfExists,
  removeLineContaining,
  replaceInFile,
  addDependency,
  removeDependency,
  addNavLink,
  removeNavLink,
  collapseI18nBase,
  DICT_FILES,
  LOCALES_TS_LITERAL,
  detectStateFromRegistry,
} = require("../lib");

const TYPE = "portfolio";

// ── Feature list (used by toggle UI) ─────────────────────────────────────────

const featureList = [
  { key: "webglHero",    label: "WebGL Hero (shader + parallax)", deps: [], detectFile: "{compDir}/HeroFull.tsx" },
  { key: "chatbot",      label: "Chatbot (Dialogflow ES)",        deps: [], detectFile: "app/api/chat/route.ts" },
  { key: "contactForm",  label: "Contact Form (Resend API)",      deps: [], detectFile: "app/api/contact/route.ts" },
  { key: "testimonials", label: "Testimonials section",           deps: [], detectFile: "{compDir}/Reviews.tsx" },
  { key: "work",         label: "Work section (project gallery)", deps: [], detectFile: "{compDir}/Work.tsx" },
  { key: "sidebar",      label: "ProfileSidebar (sticky desktop)", deps: [], detectFile: "{compDir}/ProfileSidebar.tsx" },
  { key: "i18n",         label: "i18n routing", unsupported: true, deps: [], detectFile: "i18n-config.ts" },
];

// ── Feature detection ─────────────────────────────────────────────────────────

function detectState(compDir) {
  return detectStateFromRegistry(featureList, compDir);
}

// ── i18n-collapse helpers (patch locale refs out of individual components) ────
// Used both by collapseI18n (full setup collapse) and by enable() when copying
// fresh template files into an already-collapsed (non-i18n) project.

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
    "export default function ChatNudge() {"
  );
  replaceInFile(
    `${compDir}/ChatNudge.tsx`,
    "{nudgeText[locale] ?? nudgeText.en}",
    '"Have questions? Chat with me"'
  );
}

function collapseChatWidgetTsx(compDir) {
  removeLineContaining(`${compDir}/ChatWidget.tsx`, "import { type Locale }");
  replaceInFile(
    `${compDir}/ChatWidget.tsx`,
    "const strings = {\n  en: {\n    title: \"Chat with me\",\n    subtitle: \"Typically replies instantly\",\n    placeholder: \"Type a message...\",\n    greeting: \"Hi! I'm YOUR_NAME's assistant. Ask me anything about their work, services, or availability.\",\n    ariaLabel: \"Open chat\",\n    bubble: \"Ask me anything\",\n    chips: [\"What services do you offer?\", \"What's your pricing?\", \"Are you available?\", \"Show me your work\"],\n  },\n  pt: {\n    title: \"Fala comigo\",\n    subtitle: \"Responde quase instantaneamente\",\n    placeholder: \"Escreve uma mensagem...\",\n    greeting: \"Olá! Sou o assistente de YOUR_NAME. Pergunta-me sobre o seu trabalho, serviços ou disponibilidade.\",\n    ariaLabel: \"Abrir chat\",\n    bubble: \"Pergunta-me algo\",\n    chips: [\"Que serviços ofereces?\", \"Qual é o teu preço?\", \"Estás disponível?\", \"Mostra o teu trabalho\"],\n  },\n};\n\nexport default function ChatWidget({ locale }: { locale: Locale }) {",
    "const s = {\n  title: \"Chat with me\",\n  subtitle: \"Typically replies instantly\",\n  placeholder: \"Type a message...\",\n  greeting: \"Hi! I'm YOUR_NAME's assistant. Ask me anything about their work, services, or availability.\",\n  ariaLabel: \"Open chat\",\n  bubble: \"Ask me anything\",\n  chips: [\"What services do you offer?\", \"What's your pricing?\", \"Are you available?\", \"Show me your work\"],\n};\n\nexport default function ChatWidget() {"
  );
  removeLineContaining(`${compDir}/ChatWidget.tsx`, "const s = strings[locale]");
  replaceInFile(`${compDir}/ChatWidget.tsx`, "message: text, sessionId, locale", 'message: text, sessionId, locale: "en"');
  replaceInFile(
    `${compDir}/ChatWidget.tsx`,
    'locale === "pt" ? "Erro de ligação. Tenta novamente." : "Connection error. Please try again."',
    '"Connection error. Please try again."'
  );
}

// ── Sitemap regeneration (portfolio: i18n × work matrix) ─────────────────────

function regenerateSitemap(i18nActive, workEnabled) {
  let content;
  if (i18nActive && workEnabled) {
    content = `import type { MetadataRoute } from "next";
import { getDictionary } from "../get-dictionary";

const SITE_URL = "https://your-domain.vercel.app";
const locales = ${LOCALES_TS_LITERAL};

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
const locales = ${LOCALES_TS_LITERAL};

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
  fs.writeFileSync(path.join(target(), "app/sitemap.ts"), content, "utf8");
  console.log("  [patched] app/sitemap.ts");
}

// ── Full i18n collapse (app/[locale]/ → app/) ─────────────────────────────────

function collapseI18n(features) {
  collapseI18nBase(features, {
    extraDirs: features.work ? ["work"] : [],
    pageFnName: "LocalePage",
    beforePatchLayout() {
      // Portfolio-specific: description collapse
      replaceInFile(
        "app/layout.tsx",
        '  const description =\n    locale === "pt"\n      ? "Descrição curta do seu perfil em português. Disponível para freelance."\n      : "Short description of your profile in English. Available for freelance.";',
        '  const description = "Short description of your profile in English. Available for freelance.";'
      );
    },
    afterCollapse(f) {
      // Portfolio-specific layout patches
      replaceInFile("app/layout.tsx", "<ChatWidget locale={locale} />", "<ChatWidget />");
      removeLineContaining("app/layout.tsx", "import LangSetter");
      removeLineContaining("app/layout.tsx", "<LangSetter");

      // Portfolio-specific page patches
      replaceInFile("app/page.tsx", " locale={locale}", "");

      // Portfolio-specific Navbar patches
      removeLineContaining("app/components/Navbar.tsx", "import LanguageSwitcher");
      replaceInFile("app/components/Navbar.tsx", "href={`/${locale}`}", 'href="/"');
      removeLineContaining("app/components/Navbar.tsx", "<LanguageSwitcher");
      deleteIfExists("app/components/LanguageSwitcher.tsx");
      deleteIfExists("app/components/LangSetter.tsx");

      // Portfolio-specific component patches
      if (f.sidebar)                     collapseSidebarTsx("app/components");
      if (f.work)                        collapseWorkTsx("app/components");
      if (f.sidebar && f.chatbot)        collapseChatNudgeTsx("app/components");
      if (f.chatbot)                     collapseChatWidgetTsx("app/components");

      if (f.work) {
        replaceInFile(
          "app/work/[slug]/page.tsx",
          'import { getDictionary } from "../../../../get-dictionary";',
          'import dict from "../../../dictionaries/en.json";'
        );
        removeLineContaining("app/work/[slug]/page.tsx", "import { type Locale }");
        removeLineContaining("app/work/[slug]/page.tsx", "  locale: string;");
        replaceInFile(
          "app/work/[slug]/page.tsx",
          "export async function generateStaticParams() {\n  const enDict = await getDictionary(\"en\");\n  return enDict.work.projects.flatMap((project) =>\n    [\"en\", \"pt\"].map((locale) => ({ locale, slug: project.slug })),\n  );\n}",
          "export function generateStaticParams() {\n  return dict.work.projects.map((project) => ({ slug: project.slug }));\n}"
        );
        replaceInFile(
          "app/work/[slug]/page.tsx",
          "export async function generateMetadata({\n  params,\n}: {\n  params: Promise<{ locale: string; slug: string }>;\n}) {\n  const { locale, slug } = (await params) as Params & { locale: Locale };\n  const dict = await getDictionary(locale);",
          "export async function generateMetadata({\n  params,\n}: {\n  params: Promise<{ slug: string }>;\n}) {\n  const { slug } = await params;"
        );
        replaceInFile(
          "app/work/[slug]/page.tsx",
          "export default async function WorkPage({\n  params,\n}: {\n  params: Promise<{ locale: string; slug: string }>;\n}) {\n  const { locale, slug } = (await params) as Params & { locale: Locale };\n  const dict = await getDictionary(locale);",
          "export default async function WorkPage({\n  params,\n}: {\n  params: Promise<{ slug: string }>;\n}) {\n  const { slug } = await params;"
        );
        replaceInFile("app/work/[slug]/page.tsx", "href={`/${locale}#work`}", 'href="/#work"');
        fs.writeFileSync(
          path.join(target(), "app/sitemap.ts"),
          `import type { MetadataRoute } from "next";\nimport dict from "../dictionaries/en.json";\n\nconst SITE_URL = "https://YOUR_DOMAIN";\n\nexport default function sitemap(): MetadataRoute.Sitemap {\n  const slugs = dict.work.projects.map((p) => p.slug);\n  return [\n    { url: SITE_URL, lastModified: new Date() },\n    ...slugs.map((slug) => ({ url: \`\${SITE_URL}/work/\${slug}\`, lastModified: new Date() })),\n  ];\n}\n`,
          "utf8"
        );
        console.log("  [patched] sitemap.ts — updated with work paths");
      }
    },
  });
}

// ── Enable feature ────────────────────────────────────────────────────────────

function enable(key, { compDir, pageFile, layoutFile, i18nActive, current }) {
  switch (key) {
    case "webglHero": {
      copyFile("templates/portfolio/app/[locale]/components/HeroFull.tsx", `${compDir}/HeroFull.tsx`);
      replaceInFile(pageFile, 'import Hero from "./components/Hero";', 'import HeroFull from "./components/HeroFull";');
      replaceInFile(pageFile, "<Hero hero={dict.hero} />", "<HeroFull hero={dict.hero} />");
      break;
    }
    case "chatbot": {
      copyFile("templates/portfolio/app/[locale]/components/ChatWidget.tsx", `${compDir}/ChatWidget.tsx`);
      copyDir("templates/portfolio/app/api/chat", "app/api/chat");
      copyDir("templates/portfolio/dialogflow", "dialogflow");
      if (!i18nActive) collapseChatWidgetTsx(compDir);
      if (current.sidebar) {
        copyFile("templates/portfolio/app/[locale]/components/ChatNudge.tsx", `${compDir}/ChatNudge.tsx`);
        if (!i18nActive) collapseChatNudgeTsx(compDir);
        const sidebarPath = `${compDir}/ProfileSidebar.tsx`;
        const sidebarContent = fs.readFileSync(path.join(target(), sidebarPath), "utf8");
        if (!sidebarContent.includes("ChatNudge")) {
          replaceInFile(sidebarPath, "import { useRef }", 'import ChatNudge from "./ChatNudge";\nimport { useRef }');
          const ctaRef = i18nActive ? "<CtaButton locale={locale} />" : "<CtaButton />";
          const nudgeJSX = i18nActive ? "<ChatNudge locale={locale} />" : "<ChatNudge />";
          replaceInFile(
            sidebarPath,
            `${ctaRef}\n        </motion.div>\n        <motion.div {...fadeUp(inView, 0.45)}`,
            `${ctaRef}\n        </motion.div>\n        <motion.div {...fadeUp(inView, 0.4)}>${nudgeJSX}</motion.div>\n        <motion.div {...fadeUp(inView, 0.45)}`
          );
          replaceInFile(
            sidebarPath,
            `${ctaRef}</motion.div>\n      <motion.div className="flex gap-5"`,
            `${ctaRef}</motion.div>\n      <motion.div {...fadeUp(inView, 0.44)}>${nudgeJSX}</motion.div>\n\n      <motion.div className="flex gap-5"`
          );
          const afterInject = fs.readFileSync(path.join(target(), sidebarPath), "utf8");
          if (!afterInject.includes("<ChatNudge")) {
            console.warn("  [warn] ChatNudge could not be auto-injected into ProfileSidebar.tsx.");
            console.warn("         The expected JSX anchor was not found — the file may have been customized.");
            console.warn("         Add <ChatNudge /> manually below <CtaButton /> in both render blocks.");
          }
        }
      }
      const chatWidgetJSX = i18nActive ? "      <ChatWidget locale={locale} />" : "      <ChatWidget />";
      replaceInFile(layoutFile, 'import Navbar from "./components/Navbar";', 'import ChatWidget from "./components/ChatWidget";\nimport Navbar from "./components/Navbar";');
      replaceInFile(layoutFile, "      {children}", `      {children}\n${chatWidgetJSX}`);
      addDependency("google-auth-library", "^10.6.2");
      addDependency("adm-zip", "^0.5.16");
      break;
    }
    case "contactForm": {
      copyDir("templates/portfolio/app/api/contact", "app/api/contact");
      addDependency("resend", "^6.9.4");
      break;
    }
    case "testimonials": {
      copyFile("templates/portfolio/app/[locale]/components/Reviews.tsx", `${compDir}/Reviews.tsx`);
      replaceInFile(pageFile,
        'import Services from "./components/Services";',
        'import Reviews from "./components/Reviews";\nimport Services from "./components/Services";'
      );
      replaceInFile(pageFile,
        "            <Services services={dict.services} />",
        "            <Reviews reviews={dict.reviews} />\n            <Services services={dict.services} />"
      );
      for (const dictFile of DICT_FILES) {
        addNavLink(dictFile, { id: "testimonials", label: dictFile.includes("pt") ? "Avaliações" : "Reviews" }, "work");
      }
      break;
    }
    case "work": {
      copyFile("templates/portfolio/app/[locale]/components/Work.tsx", `${compDir}/Work.tsx`);
      copyDir("templates/portfolio/app/[locale]/work", i18nActive ? "app/[locale]/work" : "app/work");
      if (!i18nActive) collapseWorkTsx(compDir);
      const pageContent = fs.readFileSync(path.join(target(), pageFile), "utf8");
      const heroAnchor = pageContent.includes("HeroFull")
        ? 'import HeroFull from "./components/HeroFull";'
        : 'import Hero from "./components/Hero";';
      replaceInFile(pageFile, heroAnchor, heroAnchor + '\nimport Work from "./components/Work";');
      const workJSX = i18nActive
        ? "            <Work work={dict.work} locale={locale} />"
        : "            <Work work={dict.work} />";
      if (fs.readFileSync(path.join(target(), pageFile), "utf8").includes("<Reviews reviews")) {
        replaceInFile(pageFile,
          "            <Reviews reviews={dict.reviews} />",
          workJSX + "\n            <Reviews reviews={dict.reviews} />"
        );
      } else {
        replaceInFile(pageFile,
          "            <Services services={dict.services} />",
          workJSX + "\n            <Services services={dict.services} />"
        );
      }
      for (const dictFile of DICT_FILES) {
        addNavLink(dictFile, { id: "work", label: dictFile.includes("pt") ? "Projectos" : "Projects" }, "home");
      }
      regenerateSitemap(i18nActive, true);
      break;
    }
    case "sidebar": {
      copyFile("templates/portfolio/app/[locale]/components/ProfileSidebar.tsx", `${compDir}/ProfileSidebar.tsx`);
      if (!i18nActive) collapseSidebarTsx(compDir);
      if (!current.chatbot) {
        removeLineContaining(`${compDir}/ProfileSidebar.tsx`, 'import ChatNudge from "./ChatNudge"');
        removeLineContaining(`${compDir}/ProfileSidebar.tsx`, "<ChatNudge");
      } else {
        copyFile("templates/portfolio/app/[locale]/components/ChatNudge.tsx", `${compDir}/ChatNudge.tsx`);
        if (!i18nActive) collapseChatNudgeTsx(compDir);
      }
      const pageContent2 = fs.readFileSync(path.join(target(), pageFile), "utf8");
      const heroAnchor2 = pageContent2.includes("HeroFull")
        ? 'import HeroFull from "./components/HeroFull";'
        : 'import Hero from "./components/Hero";';
      replaceInFile(pageFile, heroAnchor2, `import ProfileSidebar from "./components/ProfileSidebar";\n${heroAnchor2}`);
      removeLineContaining(pageFile, "TODO: TEMPLATE — ProfileSidebar removed");
      break;
    }
  }
}

// ── Disable feature ───────────────────────────────────────────────────────────

function disable(key, { compDir, pageFile, layoutFile, i18nActive, current }) {
  switch (key) {
    case "webglHero": {
      copyFile("templates/portfolio/app/[locale]/components/Hero.tsx", `${compDir}/Hero.tsx`);
      deleteIfExists(`${compDir}/HeroFull.tsx`);
      replaceInFile(pageFile, 'import HeroFull from "./components/HeroFull";', 'import Hero from "./components/Hero";');
      replaceInFile(pageFile, "<HeroFull hero={dict.hero} />", "<Hero hero={dict.hero} />");
      break;
    }
    case "chatbot": {
      deleteIfExists(`${compDir}/ChatWidget.tsx`);
      deleteIfExists("app/api/chat");
      deleteIfExists("dialogflow");
      removeLineContaining(layoutFile, 'import ChatWidget from "./components/ChatWidget"');
      removeLineContaining(layoutFile, "<ChatWidget");
      if (current.sidebar) {
        deleteIfExists(`${compDir}/ChatNudge.tsx`);
        removeLineContaining(`${compDir}/ProfileSidebar.tsx`, 'import ChatNudge from "./ChatNudge"');
        removeLineContaining(`${compDir}/ProfileSidebar.tsx`, "<ChatNudge");
      }
      removeDependency("google-auth-library");
      removeDependency("adm-zip");
      break;
    }
    case "contactForm": {
      deleteIfExists("app/api/contact");
      removeDependency("resend");
      break;
    }
    case "testimonials": {
      deleteIfExists(`${compDir}/Reviews.tsx`);
      removeLineContaining(pageFile, 'import Reviews from "./components/Reviews"');
      removeLineContaining(pageFile, "<Reviews");
      for (const dictFile of DICT_FILES) {
        removeNavLink(dictFile, "testimonials");
      }
      break;
    }
    case "work": {
      deleteIfExists(`${compDir}/Work.tsx`);
      deleteIfExists(i18nActive ? "app/[locale]/work" : "app/work");
      deleteIfExists("public/projects");
      removeLineContaining(pageFile, 'import Work from "./components/Work"');
      removeLineContaining(pageFile, "<Work");
      for (const dictFile of DICT_FILES) {
        removeNavLink(dictFile, "work");
      }
      regenerateSitemap(i18nActive, false);
      break;
    }
    case "sidebar": {
      deleteIfExists(`${compDir}/ProfileSidebar.tsx`);
      deleteIfExists(`${compDir}/ChatNudge.tsx`);
      removeLineContaining(pageFile, 'import ProfileSidebar from "./components/ProfileSidebar"');
      const pagePath = path.join(target(), pageFile);
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
      break;
    }
  }
}

// ── Interactive setup ─────────────────────────────────────────────────────────

async function setup(rl) {
  console.log("\n─── Portfolio — Feature Selection ─────────────────────────────\n");

  const features = {
    i18n:         await ask(rl, "[1/7] Include i18n (multi-language /en /pt routing)?"),
    webglHero:    await ask(rl, "[2/7] Include WebGL shader hero (vs. simple static hero)?"),
    chatbot:      await ask(rl, "[3/7] Include Dialogflow chatbot (ChatWidget + /api/chat)?"),
    contactForm:  await ask(rl, "[4/7] Include Resend contact form (email on submit)?"),
    testimonials: await ask(rl, "[5/7] Include Testimonials section?"),
    work:         await ask(rl, "[6/7] Include Work section (project gallery + detail pages)?"),
    sidebar:      await ask(rl, "[7/7] Include ProfileSidebar (sticky desktop sidebar)?"),
  };

  console.log(`\n─── Copying portfolio template ────────────────────────────────────\n`);
  copyTemplateFiles(TYPE);
  copyDir("templates/portfolio/dialogflow", "dialogflow");

  console.log("\n─── Applying portfolio feature selections ───────────────────────\n");

  if (features.i18n) {
    console.log("✓  i18n: enabled");
    copyDir("templates/portfolio/root", ".");
  } else {
    console.log("⚙  i18n: disabled");
    deleteIfExists("app/[locale]/components/LanguageSwitcher.tsx");
    deleteIfExists("app/[locale]/components/LangSetter.tsx");
    fs.writeFileSync(
      path.join(target(), "app/sitemap.ts"),
      `import type { MetadataRoute } from "next";\n\nconst SITE_URL = "https://YOUR_DOMAIN";\n\nexport default function sitemap(): MetadataRoute.Sitemap {\n  return [{ url: SITE_URL, lastModified: new Date() }];\n}\n`,
      "utf8"
    );
    console.log("  [patched] sitemap.ts — simplified (no i18n)");
  }

  if (!features.webglHero) {
    console.log("⚙  WebGL Hero: disabled");
    deleteIfExists("app/[locale]/components/HeroFull.tsx");
    replaceInFile("app/[locale]/page.tsx", 'import HeroFull from "./components/HeroFull";', 'import Hero from "./components/Hero";');
    replaceInFile("app/[locale]/page.tsx", "<HeroFull hero={dict.hero} />", "<Hero hero={dict.hero} />");
  } else {
    console.log("✓  WebGL Hero: enabled");
  }

  if (!features.chatbot) {
    console.log("⚙  Chatbot: disabled");
    deleteIfExists("app/[locale]/components/ChatWidget.tsx");
    deleteIfExists("app/api/chat");
    deleteIfExists("dialogflow");
    removeLineContaining("app/[locale]/layout.tsx", 'import ChatWidget from "./components/ChatWidget"');
    removeLineContaining("app/[locale]/layout.tsx", "<ChatWidget");
    if (features.sidebar) {
      deleteIfExists("app/[locale]/components/ChatNudge.tsx");
      removeLineContaining("app/[locale]/components/ProfileSidebar.tsx", 'import ChatNudge from "./ChatNudge"');
      removeLineContaining("app/[locale]/components/ProfileSidebar.tsx", "<ChatNudge");
    }
  } else {
    console.log("✓  Chatbot: enabled");
    addDependency("google-auth-library", "^10.6.2");
    addDependency("adm-zip", "^0.5.16");
  }

  if (!features.contactForm) {
    console.log("⚙  Contact Form: disabled");
    deleteIfExists("app/api/contact");
    const contactPath = path.join(target(), "app/[locale]/components/Contact.tsx");
    if (fs.existsSync(contactPath)) {
      const content = fs.readFileSync(contactPath, "utf8");
      if (!content.includes("TODO: TEMPLATE")) {
        fs.writeFileSync(
          contactPath,
          "// TODO: TEMPLATE — contact form removed. Keep social links section; remove form JSX and useState for name/email/message/loading/submitted/error.\n" + content,
          "utf8"
        );
        console.log("  [patched] Contact.tsx — added TODO comment for Claude");
      }
    }
  } else {
    console.log("✓  Contact Form: enabled");
    addDependency("resend", "^6.9.4");
  }

  if (!features.testimonials) {
    console.log("⚙  Reviews: disabled");
    deleteIfExists("app/[locale]/components/Reviews.tsx");
    removeLineContaining("app/[locale]/page.tsx", 'import Reviews from "./components/Reviews"');
    removeLineContaining("app/[locale]/page.tsx", "<Reviews");
    for (const dictFile of DICT_FILES) {
      removeNavLink(dictFile, "testimonials");
    }
  } else {
    console.log("✓  Reviews: enabled");
  }

  if (!features.work) {
    console.log("⚙  Work section: disabled");
    deleteIfExists("app/[locale]/components/Work.tsx");
    deleteIfExists("app/[locale]/work");
    deleteIfExists("public/projects");
    removeLineContaining("app/[locale]/page.tsx", 'import Work from "./components/Work"');
    removeLineContaining("app/[locale]/page.tsx", "<Work");
    for (const dictFile of DICT_FILES) {
      removeNavLink(dictFile, "work");
    }
    if (features.i18n) {
      const locales = LOCALES_TS_LITERAL;
      fs.writeFileSync(
        path.join(target(), "app/sitemap.ts"),
        `import type { MetadataRoute } from "next";\n\nconst SITE_URL = "https://YOUR_DOMAIN";\nconst locales = ${locales};\n\nexport default function sitemap(): MetadataRoute.Sitemap {\n  return locales.map((locale) => ({\n    url: \`\${SITE_URL}/\${locale}\`,\n    lastModified: new Date(),\n    alternates: {\n      languages: Object.fromEntries(locales.map((l) => [l, \`\${SITE_URL}/\${l}\`])),\n    },\n  }));\n}\n`,
        "utf8"
      );
      console.log("  [patched] sitemap.ts — simplified (no work paths)");
    }
  } else {
    console.log("✓  Work section: enabled");
  }

  if (!features.sidebar) {
    console.log("⚙  ProfileSidebar: disabled");
    deleteIfExists("app/[locale]/components/ProfileSidebar.tsx");
    deleteIfExists("app/[locale]/components/ChatNudge.tsx");
    removeLineContaining("app/[locale]/page.tsx", 'import ProfileSidebar from "./components/ProfileSidebar"');
    const pagePath = path.join(target(), "app/[locale]/page.tsx");
    if (fs.existsSync(pagePath)) {
      const content = fs.readFileSync(pagePath, "utf8");
      if (!content.includes("TODO: TEMPLATE")) {
        fs.writeFileSync(
          pagePath,
          "// TODO: TEMPLATE — ProfileSidebar removed. Replace the md:flex sidebar layout with a single-column <main> wrapper. Remove <aside> block and any ProfileSidebar JSX.\n" + content,
          "utf8"
        );
        console.log("  [patched] page.tsx — added TODO comment for Claude");
      }
    }
  } else {
    console.log("✓  ProfileSidebar: enabled");
  }

  if (!features.i18n) collapseI18n(features);

  return { type: TYPE, features };
}

module.exports = { type: TYPE, featureList, detectState, setup, enable, disable };
