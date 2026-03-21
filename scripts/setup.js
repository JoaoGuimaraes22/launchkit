#!/usr/bin/env node
// launchkit — Setup Script
// Run: node scripts/setup.js
// Selects a template type (Portfolio or Business Site), copies it into app/,
// then applies optional feature toggles.

const readline = require("readline");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const {
  ROOT,
  deleteIfExists,
  copyDir,
  removeLineContaining,
  replaceInFile,
  addDependency,
} = require("./lib");

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
      resolve(n >= 1 && n <= choices.length ? n : 1);
    });
  });
}

// ─── Copy Template → app/ ────────────────────────────────────────────────────

function copyTemplateToProject(type) {
  console.log(`\n─── Copying ${type} template ────────────────────────────────────\n`);
  // Copy app/ subtree (merges into root app/, which already has layout.tsx/globals.css/page.tsx)
  copyDir(`templates/${type}/app`, "app");
  // Copy dictionaries
  copyDir(`templates/${type}/dictionaries`, "dictionaries");
  // Copy public assets (hero.jpg, etc.)
  copyDir(`templates/${type}/public`, "public");
  // Portfolio: copy dialogflow agent
  if (type === "portfolio") {
    copyDir("templates/portfolio/dialogflow", "dialogflow");
  }
}

// ─── Portfolio Setup ──────────────────────────────────────────────────────────

async function setupPortfolio(rl) {
  console.log("\n─── Portfolio — Feature Selection ─────────────────────────────\n");

  const features = {
    i18n: await ask(rl, "[1/7] Include i18n (multi-language /en /pt routing)?"),
    webglHero: await ask(rl, "[2/7] Include WebGL shader hero (vs. simple static hero)?"),
    chatbot: await ask(rl, "[3/7] Include Dialogflow chatbot (ChatWidget + /api/chat)?"),
    contactForm: await ask(rl, "[4/7] Include Resend contact form (email on submit)?"),
    testimonials: await ask(rl, "[5/7] Include Testimonials section?"),
    work: await ask(rl, "[6/7] Include Work section (project gallery + detail pages)?"),
    sidebar: await ask(rl, "[7/7] Include ProfileSidebar (sticky desktop sidebar)?"),
  };

  copyTemplateToProject("portfolio");

  console.log("\n─── Applying portfolio feature selections ───────────────────────\n");

  if (features.i18n) {
    console.log("✓  i18n: enabled");
    copyDir("templates/portfolio/root", ".");
  } else {
    console.log("⚙  i18n: disabled");
    deleteIfExists("app/[locale]/components/LanguageSwitcher.tsx");
    deleteIfExists("app/[locale]/components/LangSetter.tsx");
    // Write a minimal sitemap (collapseI18n will upgrade it if work is enabled)
    fs.writeFileSync(
      path.join(ROOT, "app/sitemap.ts"),
      `import type { MetadataRoute } from "next";\n\nconst SITE_URL = "https://YOUR_DOMAIN";\n\nexport default function sitemap(): MetadataRoute.Sitemap {\n  return [{ url: SITE_URL, lastModified: new Date() }];\n}\n`,
      "utf8"
    );
    console.log("  [patched] sitemap.ts — simplified (no i18n)");
  }

  if (!features.webglHero) {
    console.log("⚙  WebGL Hero: disabled");
    deleteIfExists("app/[locale]/components/HeroFull.tsx");
    replaceInFile(
      "app/[locale]/page.tsx",
      'import HeroFull from "./components/HeroFull";',
      'import Hero from "./components/Hero";'
    );
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
    const contactPath = path.join(ROOT, "app/[locale]/components/Contact.tsx");
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
    console.log("⚙  Testimonials: disabled");
    deleteIfExists("app/[locale]/components/Testimonials.tsx");
    removeLineContaining("app/[locale]/page.tsx", 'import Testimonials from "./components/Testimonials"');
    removeLineContaining("app/[locale]/page.tsx", "<Testimonials");
    const navbarPath = path.join(ROOT, "app/[locale]/components/Navbar.tsx");
    if (fs.existsSync(navbarPath)) {
      const content = fs.readFileSync(navbarPath, "utf8");
      const updated = content.split("\n").filter((l) => !l.includes('"testimonials"') && !l.includes("nav.reviews")).join("\n");
      if (updated !== content) fs.writeFileSync(navbarPath, updated, "utf8");
      console.log("  [patched] Navbar.tsx — removed testimonials entry");
    }
  } else {
    console.log("✓  Testimonials: enabled");
  }

  if (!features.work) {
    console.log("⚙  Work section: disabled");
    deleteIfExists("app/[locale]/components/Work.tsx");
    deleteIfExists("app/[locale]/work");
    deleteIfExists("public/projects");
    removeLineContaining("app/[locale]/page.tsx", 'import Work from "./components/Work"');
    removeLineContaining("app/[locale]/page.tsx", "<Work");
    const navbarPath = path.join(ROOT, "app/[locale]/components/Navbar.tsx");
    if (fs.existsSync(navbarPath)) {
      const content = fs.readFileSync(navbarPath, "utf8");
      const updated = content.split("\n").filter((l) => !(l.includes('"work"') && l.includes("nav.work"))).join("\n");
      if (updated !== content) fs.writeFileSync(navbarPath, updated, "utf8");
      console.log("  [patched] Navbar.tsx — removed work entry");
    }
    if (features.i18n) {
      // Rewrite sitemap without work paths
      const locales = '["en", "pt"] as const';
      fs.writeFileSync(
        path.join(ROOT, "app/sitemap.ts"),
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
    const pagePath = path.join(ROOT, "app/[locale]/page.tsx");
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

  if (!features.i18n) collapseI18n("portfolio", features);

  return { type: "portfolio", features };
}

// ─── Business Site Setup ──────────────────────────────────────────────────────

async function setupBusiness(rl) {
  console.log("\n─── Business Site — Feature Selection ─────────────────────────\n");

  const features = {
    i18n: await ask(rl, "[1/5] Include i18n (bilingual /en /pt routing)?"),
    contactForm: await ask(rl, "[2/5] Include contact form (Resend email on submit)?"),
    floatingCTA: await ask(rl, "[3/5] Include FloatingCTA bar (sticky mobile bottom bar)?"),
    whatsapp: await ask(rl, "[4/5] Include WhatsApp button in contact section?"),
  };

  const colorChoice = await askChoice(rl, "[5/5] Brand accent color?", [
    "Indigo   (default)",
    "Blue",
    "Violet",
    "Rose",
    "Amber",
    "Emerald",
    "Cyan",
    "Orange",
  ]);
  const COLOR_MAP = ["indigo", "blue", "violet", "rose", "amber", "emerald", "cyan", "orange"];
  const accentColor = COLOR_MAP[colorChoice - 1];

  copyTemplateToProject("business");

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
      path.join(ROOT, "app/sitemap.ts"),
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
    for (const dictFile of ["dictionaries/en.json", "dictionaries/pt.json"]) {
      const dictPath = path.join(ROOT, dictFile);
      if (fs.existsSync(dictPath)) {
        const dict = JSON.parse(fs.readFileSync(dictPath, "utf8"));
        delete dict.cta;
        fs.writeFileSync(dictPath, JSON.stringify(dict, null, 2) + "\n", "utf8");
        console.log("  [patched]", dictFile, "— removed cta section");
      }
    }
  } else {
    console.log("✓  FloatingCTA: enabled");
  }

  // ── Accent color replacement ──────────────────────────────────────────────
  if (accentColor !== "indigo") {
    console.log(`\n─── Replacing accent color: indigo → ${accentColor} ──────────────────\n`);
    const colorFiles = [
      "app/[locale]/layout.tsx",
      "app/[locale]/components/About.tsx",
      "app/[locale]/components/Contact.tsx",
      "app/[locale]/components/FAQ.tsx",
      "app/[locale]/components/FloatingCTA.tsx",
      "app/[locale]/components/HeroContent.tsx",
      "app/[locale]/components/LanguageSwitcher.tsx",
      "app/[locale]/components/Navbar.tsx",
      "app/[locale]/components/Reviews.tsx",
      "app/[locale]/components/ScrollProgress.tsx",
      "app/[locale]/components/Services.tsx",
    ];
    for (const f of colorFiles) {
      replaceInFile(f, "indigo-", `${accentColor}-`);
    }
  }
  console.log(`✓  Accent color: ${accentColor}`);

  if (!features.i18n) collapseI18n("business", features);

  return { type: "business", features: { ...features, accentColor } };
}

// ─── i18n Routing Collapse ────────────────────────────────────────────────────
// Called at the end of setupPortfolio / setupBusiness when i18n is disabled.
// Moves app/[locale]/ → app/ and rewrites all locale-specific TypeScript.

function collapseI18n(type, features) {
  console.log("\n─── Collapsing i18n routing (app/[locale]/ → app/) ─────────────\n");

  // ── 1. Move files ──────────────────────────────────────────────────────────
  copyDir("app/[locale]/components", "app/components");
  if (type === "portfolio" && features.work) {
    copyDir("app/[locale]/work", "app/work");
  }
  const localeBase = path.join(ROOT, "app/[locale]");
  fs.copyFileSync(path.join(localeBase, "layout.tsx"), path.join(ROOT, "app/layout.tsx"));
  console.log("  [moved]  app/[locale]/layout.tsx → app/layout.tsx");
  fs.copyFileSync(path.join(localeBase, "page.tsx"), path.join(ROOT, "app/page.tsx"));
  console.log("  [moved]  app/[locale]/page.tsx → app/page.tsx");
  deleteIfExists("app/[locale]");

  // ── 2. Patch app/layout.tsx ────────────────────────────────────────────────
  // Static dict import replaces getDictionary
  replaceInFile(
    "app/layout.tsx",
    'import { getDictionary } from "../../get-dictionary";',
    'import dict from "../dictionaries/en.json";'
  );
  removeLineContaining("app/layout.tsx", "import { type Locale }");
  // generateMetadata: strip params from signature
  replaceInFile(
    "app/layout.tsx",
    'export async function generateMetadata({\n  params,\n}: {\n  params: Promise<{ locale: string }>;\n}): Promise<Metadata> {',
    "export async function generateMetadata(): Promise<Metadata> {"
  );
  // Remove locale extraction + getDictionary calls (applies to both functions)
  removeLineContaining("app/layout.tsx", "const { locale } = (await params)");
  removeLineContaining("app/layout.tsx", "const dict = await getDictionary");
  // Replace locale-conditional description (portfolio)
  replaceInFile(
    "app/layout.tsx",
    '  const description =\n    locale === "pt"\n      ? "Descrição curta do seu perfil em português. Disponível para freelance."\n      : "Short description of your profile in English. Available for freelance.";',
    '  const description = "Short description of your profile in English. Available for freelance.";'
  );
  // Replace locale-conditional description (business)
  replaceInFile(
    "app/layout.tsx",
    '  const description =\n    locale === "pt"\n      ? "Descrição curta do seu negócio em português."\n      : "Short description of your business in English.";',
    '  const description = "Short description of your business in English.";'
  );
  // Simplify alternates to canonical-only
  replaceInFile(
    "app/layout.tsx",
    "    alternates: {\n      canonical: `${SITE_URL}/${locale}`,\n      languages: {\n        en: `${SITE_URL}/en`,\n        pt: `${SITE_URL}/pt`,\n      },\n    },",
    "    alternates: { canonical: SITE_URL },"
  );
  // Fix locale-suffixed URL strings (openGraph.url + jsonLd.url)
  replaceInFile("app/layout.tsx", "`${SITE_URL}/${locale}`", "SITE_URL");
  // Remove OG locale field
  removeLineContaining("app/layout.tsx", 'locale: locale === "pt"');
  // LocaleLayout: strip params from signature
  replaceInFile(
    "app/layout.tsx",
    "export default async function LocaleLayout({\n  children,\n  params,\n}: {\n  children: React.ReactNode;\n  params: Promise<{ locale: string }>;\n}) {",
    "export default async function LocaleLayout({\n  children,\n}: {\n  children: React.ReactNode;\n}) {"
  );
  // Fix component props that accepted locale
  replaceInFile("app/layout.tsx", "<Navbar locale={locale} nav={", "<Navbar nav={");
  replaceInFile("app/layout.tsx", "<ChatWidget locale={locale} />", "<ChatWidget />");

  // ── 3. Patch app/page.tsx ──────────────────────────────────────────────────
  replaceInFile(
    "app/page.tsx",
    'import { getDictionary } from "../../get-dictionary";',
    'import dict from "../dictionaries/en.json";'
  );
  removeLineContaining("app/page.tsx", "import { type Locale }");
  // Portfolio page function signature
  replaceInFile(
    "app/page.tsx",
    "export default async function LocalePage({\n  params,\n}: {\n  params: Promise<{ locale: string }>;\n}) {",
    "export default async function LocalePage() {"
  );
  // Business page function signature
  replaceInFile(
    "app/page.tsx",
    "export default async function BusinessPage({\n  params,\n}: {\n  params: Promise<{ locale: string }>;\n}) {",
    "export default async function BusinessPage() {"
  );
  removeLineContaining("app/page.tsx", "const { locale } = (await params)");
  removeLineContaining("app/page.tsx", "const dict = await getDictionary");
  // Remove locale props from JSX (portfolio: ProfileSidebar, Work)
  replaceInFile("app/page.tsx", " locale={locale}", "");

  // ── 4. Patch app/components/Navbar.tsx ────────────────────────────────────
  removeLineContaining("app/components/Navbar.tsx", "import { type Locale }");
  removeLineContaining("app/components/Navbar.tsx", "locale: Locale;");
  replaceInFile("app/components/Navbar.tsx", "{ locale, nav }", "{ nav }");

  // ── 5. Portfolio-specific component patches ────────────────────────────────
  if (type === "portfolio") {
    // ProfileSidebar (if sidebar was enabled)
    if (features.sidebar) {
      removeLineContaining("app/components/ProfileSidebar.tsx", "import { type Locale }");
      removeLineContaining("app/components/ProfileSidebar.tsx", "locale: Locale;");
      replaceInFile("app/components/ProfileSidebar.tsx", "{ hero, locale, mobile }", "{ hero, mobile }");
      replaceInFile("app/components/ProfileSidebar.tsx", "<CtaButton locale={locale} />", "<CtaButton />");
      replaceInFile("app/components/ProfileSidebar.tsx", "<ChatNudge locale={locale} />", "<ChatNudge />");
      replaceInFile(
        "app/components/ProfileSidebar.tsx",
        "function CtaButton({ locale }: { locale: Locale })",
        "function CtaButton()"
      );
      replaceInFile("app/components/ProfileSidebar.tsx", "href={`/${locale}#contact`}", 'href="/#contact"');
    }

    // Work.tsx (if work was enabled)
    if (features.work) {
      removeLineContaining("app/components/Work.tsx", "import { type Locale }");
      removeLineContaining("app/components/Work.tsx", "locale: Locale;");
      replaceInFile("app/components/Work.tsx", "{ work, locale }", "{ work }");
      replaceInFile("app/components/Work.tsx", "`/${locale}/work/${project.slug}`", "`/work/${project.slug}`");
    }

    // ChatNudge.tsx (present only when sidebar + chatbot both enabled)
    if (features.sidebar && features.chatbot) {
      replaceInFile(
        "app/components/ChatNudge.tsx",
        'import { type Locale } from "../../../i18n-config";\n\nconst nudgeText: Record<Locale, string> = {\n  en: "Have questions? Chat with me",\n  pt: "Tens dúvidas? Fala comigo",\n};\n\nexport default function ChatNudge({ locale }: { locale: Locale }) {',
        "export default function ChatNudge() {"
      );
      replaceInFile(
        "app/components/ChatNudge.tsx",
        "{nudgeText[locale] ?? nudgeText.en}",
        '"Have questions? Chat with me"'
      );
    }

    // ChatWidget.tsx (present only when chatbot was enabled)
    if (features.chatbot) {
      removeLineContaining("app/components/ChatWidget.tsx", "import { type Locale }");
      // Collapse bilingual strings object → flat English-only const
      replaceInFile(
        "app/components/ChatWidget.tsx",
        "const strings = {\n  en: {\n    title: \"Chat with me\",\n    subtitle: \"Typically replies instantly\",\n    placeholder: \"Type a message...\",\n    greeting: \"Hi! I'm YOUR_NAME's assistant. Ask me anything about their work, services, or availability.\",\n    ariaLabel: \"Open chat\",\n    bubble: \"Ask me anything\",\n    chips: [\"What services do you offer?\", \"What's your pricing?\", \"Are you available?\", \"Show me your work\"],\n  },\n  pt: {\n    title: \"Fala comigo\",\n    subtitle: \"Responde quase instantaneamente\",\n    placeholder: \"Escreve uma mensagem...\",\n    greeting: \"Olá! Sou o assistente de YOUR_NAME. Pergunta-me sobre o seu trabalho, serviços ou disponibilidade.\",\n    ariaLabel: \"Abrir chat\",\n    bubble: \"Pergunta-me algo\",\n    chips: [\"Que serviços ofereces?\", \"Qual é o teu preço?\", \"Estás disponível?\", \"Mostra o teu trabalho\"],\n  },\n};\n\nexport default function ChatWidget({ locale }: { locale: Locale }) {",
        "const s = {\n  title: \"Chat with me\",\n  subtitle: \"Typically replies instantly\",\n  placeholder: \"Type a message...\",\n  greeting: \"Hi! I'm YOUR_NAME's assistant. Ask me anything about their work, services, or availability.\",\n  ariaLabel: \"Open chat\",\n  bubble: \"Ask me anything\",\n  chips: [\"What services do you offer?\", \"What's your pricing?\", \"Are you available?\", \"Show me your work\"],\n};\n\nexport default function ChatWidget() {"
      );
      removeLineContaining("app/components/ChatWidget.tsx", "const s = strings[locale]");
    }

    // app/work/[slug]/page.tsx (present only when work was enabled)
    if (features.work) {
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

      // Upgrade sitemap to include work paths now that dict is statically importable
      fs.writeFileSync(
        path.join(ROOT, "app/sitemap.ts"),
        `import type { MetadataRoute } from "next";\nimport dict from "../dictionaries/en.json";\n\nconst SITE_URL = "https://YOUR_DOMAIN";\n\nexport default function sitemap(): MetadataRoute.Sitemap {\n  const slugs = dict.work.projects.map((p) => p.slug);\n  return [\n    { url: SITE_URL, lastModified: new Date() },\n    ...slugs.map((slug) => ({ url: \`\${SITE_URL}/work/\${slug}\`, lastModified: new Date() })),\n  ];\n}\n`,
        "utf8"
      );
      console.log("  [patched] sitemap.ts — updated with work paths");
    }
  }

  // ── 6. Remove pt.json (no longer served) ──────────────────────────────────
  deleteIfExists("dictionaries/pt.json");

  console.log("\n✓  i18n routing collapsed — app/ is now locale-free");
}

// ─── .env.example ─────────────────────────────────────────────────────────────

function generateEnvExample(type, features) {
  let env = `# ── Required ──────────────────────────────────────────────────────────────\nNEXT_PUBLIC_SITE_URL=https://YOUR_DOMAIN\n\n`;
  if (features.contactForm) {
    env += `# ── Contact Form (Resend) ─────────────────────────────────────────────────\n# Sign up at https://resend.com — get your API key from the dashboard\nRESEND_API_KEY=re_...\n\n`;
  }
  if (type === "portfolio" && features.chatbot) {
    env += `# ── Chatbot (Dialogflow ES) ───────────────────────────────────────────────\n# Create a Google Cloud service account with "Dialogflow API Client" role\n# Download the JSON key, stringify it, and paste as a single line below\nGOOGLE_CREDENTIALS={"type":"service_account","project_id":"..."}\nDIALOGFLOW_PROJECT_ID=your-dialogflow-project-id\n\n`;
  }
  fs.writeFileSync(path.join(ROOT, ".env.example"), env, "utf8");
  console.log("  [created] .env.example");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║          launchkit — Setup               ║");
  console.log("╚══════════════════════════════════════════╝\n");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const typeArg = process.argv[2];
  let typeChoice;
  if (typeArg === "--portfolio") {
    console.log("▸  Type: Portfolio (from argument)\n");
    typeChoice = 1;
  } else if (typeArg === "--business") {
    console.log("▸  Type: Business Site (from argument)\n");
    typeChoice = 2;
  } else {
    typeChoice = await askChoice(rl, "[0] Project type?", [
      "Portfolio    — personal showcase (WebGL hero, sidebar, chatbot, project gallery)",
      "Business Site — local business (services, reviews, FAQ, contact, footer)",
    ]);
  }

  let result;
  if (typeChoice === 1) {
    result = await setupPortfolio(rl);
  } else {
    result = await setupBusiness(rl);
  }

  rl.close();

  console.log("\n─── Generating .env.example ────────────────────────────────────\n");
  generateEnvExample(result.type, result.features);

  console.log("\n─── Running npm install ─────────────────────────────────────────\n");
  try {
    execSync("npm install", { stdio: "inherit", cwd: ROOT });
  } catch {
    console.warn("  npm install encountered warnings — check output above.");
  }

  // ─── Write .launchkit ──────────────────────────────────────────────────────
  fs.writeFileSync(
    path.join(ROOT, ".launchkit"),
    JSON.stringify({ type: result.type, features: result.features }, null, 2) + "\n",
    "utf8"
  );
  console.log("  [created] .launchkit");

  const bootstrapFile = `templates/${result.type}/BOOTSTRAP.md`;

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║  Setup complete!                                             ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log("║  Next steps:                                                 ║");
  console.log("║  1. Copy .env.example → .env.local and fill in values        ║");
  console.log(`║  2. Paste ${bootstrapFile.padEnd(49)}║`);
  console.log("║     into a new Claude Code conversation                      ║");
  console.log("║  3. Replace placeholder images in public/                    ║");
  console.log("║  4. npm run dev  →  preview your site                        ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const hasTodos =
    !result.features.i18n ||
    (result.type === "portfolio" && (!result.features.contactForm || !result.features.sidebar));
  if (hasTodos) {
    console.log("⚠  Some steps require Claude to finish:");
    if (!result.features.i18n) console.log("   • Collapse app/[locale]/ routing (i18n disabled)");
    if (result.type === "portfolio" && !result.features.contactForm) console.log("   • Remove form JSX from Contact.tsx");
    if (result.type === "portfolio" && !result.features.sidebar) console.log("   • Simplify page.tsx sidebar layout");
    console.log(`   → Paste ${bootstrapFile} into Claude Code to handle these.\n`);
  }
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
