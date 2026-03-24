#!/usr/bin/env node
// launchkit — Build Showcase Site
// Generates a Next.js app in site/ that serves each extracted template as a live sub-route.
// Auto-discovers templates from templates/presets/ (skips "base").
// Re-run after extracting or updating templates to rebuild.
//
// Usage: node scripts/build-showcase.js

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { checkHelp } = require("./lib");

checkHelp(`
launchkit — Build Showcase Site

  Generates a Next.js app in site/ that serves each extracted template
  as a live sub-route. Auto-discovers templates from templates/presets/.

Usage:
  node scripts/build-showcase.js

Options:
  -h, --help    Show this help message

Prerequisites:
  Extract at least one template first:
    node scripts/extract.js --source ../my-site --name my-template
`);

const TOOL_ROOT = path.resolve(__dirname, "..");
const SITE_DIR = path.join(TOOL_ROOT, "site");
const BASE_DIR = path.join(TOOL_ROOT, "templates/presets/base");
const PRESETS_DIR = path.join(TOOL_ROOT, "templates/presets");

// ── Auto-discover templates ─────────────────────────────────────────────────

function discoverTemplates() {
  if (!fs.existsSync(PRESETS_DIR)) return [];
  return fs.readdirSync(PRESETS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "base")
    .filter((d) => {
      // Must have at least app/[locale]/page.tsx or app/[locale]/components/
      const presetDir = path.join(PRESETS_DIR, d.name);
      return (
        fs.existsSync(path.join(presetDir, "app/[locale]/page.tsx")) ||
        fs.existsSync(path.join(presetDir, "app/[locale]/components"))
      );
    })
    .map((d) => d.name);
}

// Read accent color from the template module if available
function getTemplateAccentColor(tmpl) {
  const modulePath = path.join(TOOL_ROOT, "scripts/templates", `${tmpl}.js`);
  if (fs.existsSync(modulePath)) {
    try {
      const mod = require(modulePath);
      // Read DETECTED_COLOR from module source (it's not exported)
      const src = fs.readFileSync(modulePath, "utf8");
      const match = src.match(/DETECTED_COLOR\s*=\s*["']([^"']+)["']/);
      if (match) return match[1];
    } catch { /* ignore */ }
  }
  return "indigo";
}

// Collect extra dependencies from template module
function getTemplateDeps(tmpl) {
  const modulePath = path.join(TOOL_ROOT, "scripts/templates", `${tmpl}.js`);
  if (fs.existsSync(modulePath)) {
    const src = fs.readFileSync(modulePath, "utf8");
    const match = src.match(/EXTRA_DEPS\s*=\s*(\{[^}]+\})/s);
    if (match) {
      try { return JSON.parse(match[1]); } catch { /* ignore */ }
    }
  }
  return {};
}

const TEMPLATES = discoverTemplates();

if (TEMPLATES.length === 0) {
  console.error("\n  Error: no templates found in templates/presets/.");
  console.error("  Extract a template first: node scripts/extract.js --source <path> --name <name>\n");
  process.exit(1);
}

console.log(`\n  Found ${TEMPLATES.length} template(s): ${TEMPLATES.join(", ")}\n`);

// ── Helpers ──────────────────────────────────────────────────────────────────

function cpDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) cpDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function cpFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function writeFile(rel, content) {
  const abs = path.join(SITE_DIR, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, "utf8");
  console.log(`  [write] ${rel}`);
}

function readTemplate(tmpl, rel) {
  return fs.readFileSync(path.join(PRESETS_DIR, tmpl, rel), "utf8");
}

// ── Clean & init ─────────────────────────────────────────────────────────────

console.log("╔══════════════════════════════════════════╗");
console.log("║     launchkit — Build Showcase Site      ║");
console.log("╚══════════════════════════════════════════╝\n");

// Clean site/ but preserve node_modules and .next for faster rebuilds
if (fs.existsSync(SITE_DIR)) {
  console.log("  Cleaning site/ (preserving node_modules, .next)...\n");
  for (const entry of fs.readdirSync(SITE_DIR)) {
    if (entry === "node_modules" || entry === ".next") continue;
    const p = path.join(SITE_DIR, entry);
    fs.rmSync(p, { recursive: true, force: true });
  }
} else {
  fs.mkdirSync(SITE_DIR, { recursive: true });
}

// ── Copy base scaffold ───────────────────────────────────────────────────────

console.log("─── Copying base scaffold ──────────────────────────────────────\n");

const baseFiles = [
  "eslint.config.mjs",
  "next.config.ts",
  "postcss.config.mjs",
  "tsconfig.json",
  "app/globals.css",
  "app/favicon.ico",
];

for (const f of baseFiles) {
  cpFile(path.join(BASE_DIR, f), path.join(SITE_DIR, f));
  console.log(`  [copy] ${f}`);
}

// ── package.json (merge extra deps from all templates) ──────────────────────

const allExtraDeps = {};
for (const tmpl of TEMPLATES) {
  Object.assign(allExtraDeps, getTemplateDeps(tmpl));
}

writeFile("package.json", JSON.stringify({
  name: "launchkit-showcase",
  version: "0.1.0",
  private: true,
  scripts: {
    dev: "next dev",
    build: "next build",
    start: "next start",
    lint: "eslint",
  },
  dependencies: {
    "motion": "^12.38.0",
    "next": "16.1.6",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    ...allExtraDeps,
  },
  devDependencies: {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.1.6",
    "tailwindcss": "^4",
    "typescript": "^5",
  },
}, null, 2) + "\n");

// ── i18n-config.ts (en only) ────────────────────────────────────────────────

// Include all locales that any template might reference
const { LOCALES } = require("./lib");
const localesLiteral = LOCALES.map((l) => `"${l}"`).join(", ");

writeFile("i18n-config.ts", `export const i18n = {
  defaultLocale: "en",
  locales: [${localesLiteral}],
} as const;

export type Locale = (typeof i18n)["locales"][number];
`);

// ── proxy.ts ─────────────────────────────────────────────────────────────────

writeFile("proxy.ts", readTemplate("base", "proxy.ts"));

// ── get-dictionary.ts (auto-generated from discovered templates) ─────────────

const templateDictEntries = TEMPLATES.map((t) =>
  `  "${t}": {\n    en: () => import("./dictionaries/${t}/en.json").then((m) => m.default),\n  },`
).join("\n");

writeFile("get-dictionary.ts", `import type { Locale } from "./i18n-config";

/* eslint-disable @typescript-eslint/no-explicit-any */
const homeDicts: Record<string, () => Promise<any>> = {
  en: () => import("./dictionaries/en.json").then((m) => m.default),
};

const templateDicts: Record<string, Record<string, () => Promise<any>>> = {
${templateDictEntries}
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function getDictionary(locale: Locale, template?: string) {
  if (template && templateDicts[template]) {
    return templateDicts[template][locale]?.() ?? templateDicts[template].en();
  }
  return homeDicts[locale]?.() ?? homeDicts.en();
}
`);

// ── Root layout ──────────────────────────────────────────────────────────────

writeFile("app/layout.tsx", `import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "launchkit — Template Showcase",
  description: "Browse and preview launchkit templates live.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={\`\${geistSans.variable} \${geistMono.variable} antialiased bg-[#fafafa] text-zinc-900\`}>
        {children}
      </body>
    </html>
  );
}
`);

// ── Root page (redirect to /en) ──────────────────────────────────────────────

writeFile("app/page.tsx", `import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/en");
}
`);

// ── Locale layout (minimal — homepage has no navbar) ─────────────────────────

writeFile("app/[locale]/layout.tsx", `export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
`);

// ── Homepage dict ────────────────────────────────────────────────────────────

writeFile("dictionaries/en.json", JSON.stringify({
  site: {
    title: "launchkit",
    tagline: "Template Showcase",
    description: "Browse and preview launchkit templates live.",
  },
}, null, 2) + "\n");

// ── Homepage (auto-generated cards from discovered templates) ────────────────

// Tailwind color cycle for cards
const CARD_COLORS = ["indigo", "amber", "emerald", "violet", "rose", "cyan", "orange", "teal"];

const cardBlocks = TEMPLATES.map((t, i) => {
  const color = getTemplateAccentColor(t);
  const title = t.charAt(0).toUpperCase() + t.slice(1);
  // Count components for description (check both locations, handle subdirs)
  let compDir = path.join(PRESETS_DIR, t, "app/[locale]/components");
  if (!fs.existsSync(compDir)) compDir = path.join(PRESETS_DIR, t, "app/components");
  let compCount = 0;
  if (fs.existsSync(compDir)) {
    const entries = fs.readdirSync(compDir, { withFileTypes: true });
    const flatTsx = entries.filter((e) => !e.isDirectory() && e.name.endsWith(".tsx")).length;
    compCount = flatTsx > 0 ? flatTsx : entries.filter((e) => e.isDirectory()).length;
  }
  const desc = `Extracted template with ${compCount} components.`;

  return `        <a
          href={\`/\${locale}/${t}\`}
          className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
        >
          <div className="aspect-[16/9] bg-linear-to-br from-${color}-50 to-${color}-100 flex items-center justify-center">
            <span className="text-4xl font-bold text-${color}-600/30">${title}</span>
          </div>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-zinc-900 group-hover:text-${color}-600 transition-colors">
              ${title}
            </h2>
            <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
              ${desc}
            </p>
            <div className="mt-4 inline-flex items-center text-sm font-medium text-${color}-600">
              View template
              <svg className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </a>`;
}).join("\n");

writeFile("app/[locale]/page.tsx", `import { type Locale } from "../../i18n-config";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            launchkit
          </h1>
          <p className="mt-4 text-lg text-zinc-500">
            Browse and preview templates live.
          </p>
        </div>
      </div>

      {/* Template grid */}
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-2">
${cardBlocks}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-8 text-center text-sm text-zinc-400">
          Built with launchkit
        </div>
      </div>
    </main>
  );
}
`);

// ── Copy each template ───────────────────────────────────────────────────────

for (const tmpl of TEMPLATES) {
  console.log(`\n─── Copying template: ${tmpl} ──────────────────────────────────────\n`);

  const presetDir = path.join(PRESETS_DIR, tmpl);

  // 1. Components — copy and fix import paths
  // Check both app/[locale]/components/ and app/components/
  let compSrc = path.join(presetDir, "app/[locale]/components");
  let compIsOutsideLocale = false;
  if (!fs.existsSync(compSrc)) {
    compSrc = path.join(presetDir, "app/components");
    compIsOutsideLocale = true;
  }
  // For showcase, components go into app/[locale]/<template>/components/ (or app/<template>/components/)
  const compDest = compIsOutsideLocale
    ? path.join(SITE_DIR, `app/${tmpl}/components`)
    : path.join(SITE_DIR, `app/[locale]/${tmpl}/components`);
  if (fs.existsSync(compSrc)) {
    cpDir(compSrc, compDest);
    // Fix relative imports in all .tsx/.ts files (recursive for subdirectory components)
    function fixImports(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const filePath = path.join(dir, entry.name);
        if (entry.isDirectory()) { fixImports(filePath); continue; }
        if (!entry.name.endsWith(".tsx") && !entry.name.endsWith(".ts")) continue;
        let content = fs.readFileSync(filePath, "utf8");
        content = content.replace(
          /from\s+["'](?:\.\.\/)+(i18n-config|get-dictionary)["']/g,
          'from "@/$1"'
        );
        fs.writeFileSync(filePath, content, "utf8");
      }
    }
    fixImports(compDest);
    console.log(`  [copy] components/ (imports fixed)`);
  }

  // 2. Page — use @/ alias for root imports, fix component paths, add template arg to getDictionary
  const pagePath = path.join(presetDir, "app/[locale]/page.tsx");
  if (fs.existsSync(pagePath)) {
    let pageSrc = fs.readFileSync(pagePath, "utf8");
    pageSrc = pageSrc.replace(
      /from\s+["'](?:\.\.\/)+get-dictionary["']/g,
      'from "@/get-dictionary"'
    );
    pageSrc = pageSrc.replace(
      /from\s+["'](?:\.\.\/)+i18n-config["']/g,
      'from "@/i18n-config"'
    );
    // Fix component imports for templates with app/components/ (outside locale)
    if (compIsOutsideLocale) {
      pageSrc = pageSrc.replace(
        /from\s+["']\.\.\/components\//g,
        `from "@/app/${tmpl}/components/`
      );
    }
    pageSrc = pageSrc.replace(
      /getDictionary\(locale\)/,
      `getDictionary(locale, "${tmpl}")`
    );
    writeFile(`app/[locale]/${tmpl}/page.tsx`, pageSrc);
  }

  // 3. Layout — use @/ alias for root imports, fix component paths, add template arg to getDictionary
  const layoutPath = path.join(presetDir, "app/[locale]/layout.tsx");
  if (fs.existsSync(layoutPath)) {
    let layoutSrc = fs.readFileSync(layoutPath, "utf8");
    layoutSrc = layoutSrc.replace(
      /from\s+["'](?:\.\.\/)+get-dictionary["']/g,
      'from "@/get-dictionary"'
    );
    layoutSrc = layoutSrc.replace(
      /from\s+["'](?:\.\.\/)+i18n-config["']/g,
      'from "@/i18n-config"'
    );
    if (compIsOutsideLocale) {
      layoutSrc = layoutSrc.replace(
        /from\s+["']\.\.\/components\//g,
        `from "@/app/${tmpl}/components/`
      );
    }
    layoutSrc = layoutSrc.replace(
      /getDictionary\(locale\)/g,
      `getDictionary(locale, "${tmpl}")`
    );
    writeFile(`app/[locale]/${tmpl}/layout.tsx`, layoutSrc);
  }

  // 4. Dictionaries (en.json only for showcase)
  const dictSrc = path.join(presetDir, "dictionaries");
  if (fs.existsSync(dictSrc)) {
    const enSrc = path.join(dictSrc, "en.json");
    if (fs.existsSync(enSrc)) {
      cpFile(enSrc, path.join(SITE_DIR, `dictionaries/${tmpl}/en.json`));
      console.log(`  [copy] dictionaries/${tmpl}/en.json`);
    }
  }

  // 5. Public assets (merge into public/ with template prefix to avoid conflicts)
  const pubSrc = path.join(presetDir, "public");
  if (fs.existsSync(pubSrc)) {
    for (const entry of fs.readdirSync(pubSrc, { withFileTypes: true })) {
      const destName = `${tmpl}-${entry.name}`;
      if (entry.isDirectory()) {
        cpDir(path.join(pubSrc, entry.name), path.join(SITE_DIR, `public/${destName}`));
        console.log(`  [copy] public/${destName}/ (directory)`);
      } else {
        cpFile(path.join(pubSrc, entry.name), path.join(SITE_DIR, `public/${destName}`));
        console.log(`  [copy] public/${destName}`);
      }
    }
  }
}

// ── Fix public asset references ──────────────────────────────────────────────
// Templates reference /hero.jpg, /about.jpg, /gallery/*, /menu/* etc.
// We renamed them to <template>-hero.jpg, <template>-gallery/*, etc.
for (const tmpl of TEMPLATES) {
  const presetDir = path.join(PRESETS_DIR, tmpl);
  const pubSrc = path.join(presetDir, "public");
  if (!fs.existsSync(pubSrc)) continue;

  const pubEntries = fs.readdirSync(pubSrc, { withFileTypes: true });

  // Files to rewrite: all .tsx in components/ (recursive), plus page.tsx and layout.tsx
  const filesToFix = [];
  // Check both possible component locations
  for (const candidateDir of [`app/[locale]/${tmpl}/components`, `app/${tmpl}/components`]) {
    const absDir = path.join(SITE_DIR, candidateDir);
    if (!fs.existsSync(absDir)) continue;
    function collectTsx(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) collectTsx(path.join(dir, entry.name));
        else if (entry.name.endsWith(".tsx")) filesToFix.push(path.join(dir, entry.name));
      }
    }
    collectTsx(absDir);
  }
  const pageFile = path.join(SITE_DIR, `app/[locale]/${tmpl}/page.tsx`);
  const layoutFile = path.join(SITE_DIR, `app/[locale]/${tmpl}/layout.tsx`);
  if (fs.existsSync(pageFile)) filesToFix.push(pageFile);
  if (fs.existsSync(layoutFile)) filesToFix.push(layoutFile);

  for (const filePath of filesToFix) {
    let content = fs.readFileSync(filePath, "utf8");
    let changed = false;
    for (const entry of pubEntries) {
      const pattern = entry.isDirectory()
        ? new RegExp(`(["'])\\/` + entry.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + `\\/`, "g")
        : new RegExp(`(["'])\\/` + entry.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + `(["'])`, "g");
      const replacement = entry.isDirectory()
        ? `$1/${tmpl}-${entry.name}/`
        : `$1/${tmpl}-${entry.name}$2`;
      const updated = content.replace(pattern, replacement);
      if (updated !== content) { content = updated; changed = true; }
    }
    if (changed) {
      fs.writeFileSync(filePath, content, "utf8");
      console.log(`  [fix] ${path.relative(SITE_DIR, filePath)} — public asset paths prefixed`);
    }
  }

  // Also fix dictionary references to public assets
  const dictDir = path.join(SITE_DIR, `dictionaries/${tmpl}`);
  if (fs.existsSync(dictDir)) {
    for (const dictFile of fs.readdirSync(dictDir)) {
      if (!dictFile.endsWith(".json")) continue;
      const dictPath = path.join(dictDir, dictFile);
      let content = fs.readFileSync(dictPath, "utf8");
      let changed = false;
      for (const entry of pubEntries) {
        if (entry.isDirectory()) {
          const pattern = new RegExp(`\\/` + entry.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + `\\/`, "g");
          const updated = content.replace(pattern, `/${tmpl}-${entry.name}/`);
          if (updated !== content) { content = updated; changed = true; }
        }
      }
      if (changed) {
        fs.writeFileSync(dictPath, content, "utf8");
        console.log(`  [fix] dictionaries/${tmpl}/${dictFile} — public asset paths prefixed`);
      }
    }
  }
}

// ── npm install ──────────────────────────────────────────────────────────────

console.log("\n─── Running npm install ─────────────────────────────────────────\n");
execSync("npm install", { stdio: "inherit", cwd: SITE_DIR });

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║  Showcase site built!                                        ║");
console.log("╠══════════════════════════════════════════════════════════════╣");
console.log(`║  Templates: ${TEMPLATES.join(", ").padEnd(47)}║`);
console.log("║                                                              ║");
console.log("║  Next steps:                                                 ║");
console.log("║  1. cd site                                                  ║");
console.log("║  2. npm run dev                                              ║");
console.log("║  3. Open http://localhost:3000                               ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");
