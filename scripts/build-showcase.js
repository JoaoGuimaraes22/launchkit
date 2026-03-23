#!/usr/bin/env node
// launchkit — Build Showcase Site
// Generates a Next.js app in site/ that serves each template as a live sub-route.
// Re-run after template changes to rebuild.
//
// Usage: node scripts/build-showcase.js

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const TOOL_ROOT = path.resolve(__dirname, "..");
const SITE_DIR = path.join(TOOL_ROOT, "site");
const BASE_DIR = path.join(TOOL_ROOT, "templates/presets/base");

// Templates to showcase (skip blank — nothing to show)
const TEMPLATES = ["business", "restaurant"];

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
  return fs.readFileSync(path.join(TOOL_ROOT, "templates/presets", tmpl, rel), "utf8");
}

// ── Clean & init ─────────────────────────────────────────────────────────────

console.log("\n╔══════════════════════════════════════════╗");
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

// ── package.json ─────────────────────────────────────────────────────────────

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
    "framer-motion": "^12.35.1",
    "next": "16.1.6",
    "react": "19.2.3",
    "react-dom": "19.2.3",
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

writeFile("i18n-config.ts", `export const i18n = {
  defaultLocale: "en",
  locales: ["en"],
} as const;

export type Locale = (typeof i18n)["locales"][number];
`);

// ── proxy.ts ─────────────────────────────────────────────────────────────────

writeFile("proxy.ts", readTemplate("base", "proxy.ts"));

// ── get-dictionary.ts (template-aware) ───────────────────────────────────────

writeFile("get-dictionary.ts", `import type { Locale } from "./i18n-config";

/* eslint-disable @typescript-eslint/no-explicit-any */
const homeDicts: Record<string, () => Promise<any>> = {
  en: () => import("./dictionaries/en.json").then((m) => m.default),
};

const templateDicts: Record<string, Record<string, () => Promise<any>>> = {
  business: {
    en: () => import("./dictionaries/business/en.json").then((m) => m.default),
  },
  restaurant: {
    en: () => import("./dictionaries/restaurant/en.json").then((m) => m.default),
  },
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

// ── Homepage ─────────────────────────────────────────────────────────────────

const templateMeta = {
  business: {
    title: "Business Site",
    description: "Local business template with hero, services, reviews, FAQ, and contact sections.",
    color: "indigo",
  },
  restaurant: {
    title: "Restaurant",
    description: "Dining venue template with dark hero, tabbed menu, scrolling reviews, and map contact.",
    color: "amber",
  },
};

const cardBlocks = TEMPLATES.map((t) => {
  const m = templateMeta[t];
  return `        <a
          href={\`/\${locale}/${t}\`}
          className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
        >
          <div className="aspect-[16/9] bg-linear-to-br from-${m.color}-50 to-${m.color}-100 flex items-center justify-center">
            <span className="text-4xl font-bold text-${m.color}-600/30">${m.title}</span>
          </div>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-zinc-900 group-hover:text-${m.color}-600 transition-colors">
              ${m.title}
            </h2>
            <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
              ${m.description}
            </p>
            <div className="mt-4 inline-flex items-center text-sm font-medium text-${m.color}-600">
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

  const presetDir = path.join(TOOL_ROOT, "templates/presets", tmpl);

  // 1. Components — copy and fix import paths (one level deeper than original)
  const compSrc = path.join(presetDir, "app/[locale]/components");
  const compDest = path.join(SITE_DIR, `app/[locale]/${tmpl}/components`);
  cpDir(compSrc, compDest);
  // Fix relative imports in components: use @/ alias for root-level files
  // Components originally at app/[locale]/components/ use ../../../i18n-config
  // Now at app/[locale]/<template>/components/ — one level deeper, so use @/ alias
  for (const file of fs.readdirSync(compDest)) {
    if (!file.endsWith(".tsx") && !file.endsWith(".ts")) continue;
    const filePath = path.join(compDest, file);
    let content = fs.readFileSync(filePath, "utf8");
    content = content.replace(
      /from\s+["']\.\.\/(?:\.\.\/){2,}(i18n-config|get-dictionary)["']/g,
      'from "@/$1"'
    );
    fs.writeFileSync(filePath, content, "utf8");
  }
  console.log(`  [copy] components/ (${fs.readdirSync(compSrc).length} files, imports fixed)`);

  // 2. Page — use @/ alias for root imports, add template arg to getDictionary
  let pageSrc = readTemplate(tmpl, "app/[locale]/page.tsx");
  pageSrc = pageSrc.replace(
    /from\s+["']\.\.\/(?:\.\.\/)*get-dictionary["']/,
    'from "@/get-dictionary"'
  );
  pageSrc = pageSrc.replace(
    /from\s+["']\.\.\/(?:\.\.\/)*i18n-config["']/,
    'from "@/i18n-config"'
  );
  // Add template arg to getDictionary call
  pageSrc = pageSrc.replace(
    /getDictionary\(locale\)/,
    `getDictionary(locale, "${tmpl}")`
  );
  writeFile(`app/[locale]/${tmpl}/page.tsx`, pageSrc);

  // 3. Layout — use @/ alias for root imports, add template arg to getDictionary
  let layoutSrc = readTemplate(tmpl, "app/[locale]/layout.tsx");
  layoutSrc = layoutSrc.replace(
    /from\s+["']\.\.\/(?:\.\.\/)*get-dictionary["']/,
    'from "@/get-dictionary"'
  );
  layoutSrc = layoutSrc.replace(
    /from\s+["']\.\.\/(?:\.\.\/)*i18n-config["']/,
    'from "@/i18n-config"'
  );
  // Add template arg to all getDictionary calls
  layoutSrc = layoutSrc.replace(
    /getDictionary\(locale\)/g,
    `getDictionary(locale, "${tmpl}")`
  );
  writeFile(`app/[locale]/${tmpl}/layout.tsx`, layoutSrc);

  // 4. Dictionaries
  const dictSrc = path.join(presetDir, "dictionaries");
  if (fs.existsSync(dictSrc)) {
    // Only copy en.json for showcase
    const enSrc = path.join(dictSrc, "en.json");
    if (fs.existsSync(enSrc)) {
      cpFile(enSrc, path.join(SITE_DIR, `dictionaries/${tmpl}/en.json`));
      console.log(`  [copy] dictionaries/${tmpl}/en.json`);
    }
  }

  // 5. Public assets (merge into public/ with template prefix to avoid conflicts)
  const pubSrc = path.join(presetDir, "public");
  if (fs.existsSync(pubSrc)) {
    for (const file of fs.readdirSync(pubSrc)) {
      // Use template-prefixed name to avoid collisions
      cpFile(path.join(pubSrc, file), path.join(SITE_DIR, `public/${tmpl}-${file}`));
      console.log(`  [copy] public/${tmpl}-${file}`);
    }
  }
}

// ── Fix hero image references ────────────────────────────────────────────────
// Templates reference /hero.jpg, but we renamed to <template>-hero.jpg
for (const tmpl of TEMPLATES) {
  const compDir = path.join(SITE_DIR, `app/[locale]/${tmpl}/components`);
  for (const file of fs.readdirSync(compDir)) {
    if (!file.endsWith(".tsx")) continue;
    const filePath = path.join(compDir, file);
    let content = fs.readFileSync(filePath, "utf8");
    if (content.includes('"/hero.jpg"') || content.includes("'/hero.jpg'")) {
      content = content.replace(/["']\/hero\.jpg["']/g, `"/${tmpl}-hero.jpg"`);
      fs.writeFileSync(filePath, content, "utf8");
      console.log(`  [fix] ${tmpl}/components/${file} — hero.jpg → ${tmpl}-hero.jpg`);
    }
  }
  // Also check page.tsx and layout.tsx
  for (const f of [`app/[locale]/${tmpl}/page.tsx`, `app/[locale]/${tmpl}/layout.tsx`]) {
    const filePath = path.join(SITE_DIR, f);
    let content = fs.readFileSync(filePath, "utf8");
    if (content.includes('"/hero.jpg"') || content.includes("'/hero.jpg'")) {
      content = content.replace(/["']\/hero\.jpg["']/g, `"/${tmpl}-hero.jpg"`);
      fs.writeFileSync(filePath, content, "utf8");
      console.log(`  [fix] ${f} — hero.jpg → ${tmpl}-hero.jpg`);
    }
  }
}

// ── npm install ──────────────────────────────────────────────────────────────

console.log("\n─── Running npm install ─────────────────────────────────────────\n");
execSync("npm install", { stdio: "inherit", cwd: SITE_DIR });

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║  Showcase site built!                                        ║");
console.log("╠══════════════════════════════════════════════════════════════╣");
console.log("║  Next steps:                                                 ║");
console.log("║  1. cd site                                                  ║");
console.log("║  2. npm run dev                                              ║");
console.log("║  3. Open http://localhost:3000                               ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");
