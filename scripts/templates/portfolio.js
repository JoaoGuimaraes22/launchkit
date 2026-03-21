#!/usr/bin/env node
// launchkit — Portfolio template module
// Owns: setup flow, i18n collapse.

const fs = require("fs");
const path = require("path");
const {
  target,
  ask,
  copyDir,
  copyTemplateFiles,
  deleteIfExists,
  removeLineContaining,
  replaceInFile,
  addDependency,
  removeNavLink,
  collapseI18nBase,
  DICT_FILES,
  LOCALES_TS_LITERAL,
} = require("../lib");

const TYPE = "portfolio";

// ── i18n-collapse helpers (patch locale refs out of individual components) ────
// Used by collapseI18n (full setup collapse) when i18n is disabled.

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

  // Build sections map for .launchkit (only enabled sections)
  const sections = {};
  const now = new Date().toISOString();
  if (features.webglHero)    sections["webgl-hero"]    = { variant: "default", addedAt: now };
  if (features.chatbot)      sections["chatbot"]       = { variant: "default", addedAt: now };
  if (features.contactForm)  sections["contact-form"]  = { variant: "portfolio", addedAt: now };
  if (features.testimonials) sections["testimonials"]  = { variant: "scrolling", addedAt: now };
  if (features.work)         sections["work"]          = { variant: "default", addedAt: now };
  if (features.sidebar)      sections["sidebar"]       = { variant: "default", addedAt: now };

  return { type: TYPE, features: { i18n: features.i18n }, sections };
}

module.exports = { type: TYPE, setup };
