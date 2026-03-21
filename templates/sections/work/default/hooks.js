// Work section hooks — dynamic routes, example images, sitemap regeneration
const fs = require("fs");
const path = require("path");

function regenerateSitemap(ctx, workEnabled) {
  const { i18nActive, projectDir, lib } = ctx;
  const sitemapPath = path.join(projectDir, "app/sitemap.ts");

  let content;
  if (i18nActive && workEnabled) {
    content = `import type { MetadataRoute } from "next";
import { getDictionary } from "../get-dictionary";

const SITE_URL = "https://your-domain.vercel.app";
const locales = ${lib.LOCALES_TS_LITERAL};

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
const locales = ${lib.LOCALES_TS_LITERAL};

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
  fs.writeFileSync(sitemapPath, content, "utf8");
  console.log("  [patched] app/sitemap.ts");
}

function collapseWorkSlugPage(ctx) {
  const { lib } = ctx;
  const slugPage = ctx.i18nActive ? "app/[locale]/work/[slug]/page.tsx" : "app/work/[slug]/page.tsx";

  lib.replaceInFile(
    slugPage,
    'import { getDictionary } from "../../../../get-dictionary";',
    'import dict from "../../../dictionaries/en.json";'
  );
  lib.removeLineContaining(slugPage, "import { type Locale }");
  lib.removeLineContaining(slugPage, "  locale: string;");
  lib.replaceInFile(
    slugPage,
    "export async function generateStaticParams() {\n  const enDict = await getDictionary(\"en\");\n  return enDict.work.projects.flatMap((project) =>\n    [\"en\", \"pt\"].map((locale) => ({ locale, slug: project.slug })),\n  );\n}",
    "export function generateStaticParams() {\n  return dict.work.projects.map((project) => ({ slug: project.slug }));\n}"
  );
  lib.replaceInFile(
    slugPage,
    "export async function generateMetadata({\n  params,\n}: {\n  params: Promise<{ locale: string; slug: string }>;\n}) {\n  const { locale, slug } = (await params) as Params & { locale: Locale };\n  const dict = await getDictionary(locale);",
    "export async function generateMetadata({\n  params,\n}: {\n  params: Promise<{ slug: string }>;\n}) {\n  const { slug } = await params;"
  );
  lib.replaceInFile(
    slugPage,
    "export default async function WorkPage({\n  params,\n}: {\n  params: Promise<{ locale: string; slug: string }>;\n}) {\n  const { locale, slug } = (await params) as Params & { locale: Locale };\n  const dict = await getDictionary(locale);",
    "export default async function WorkPage({\n  params,\n}: {\n  params: Promise<{ slug: string }>;\n}) {\n  const { slug } = await params;"
  );
  lib.replaceInFile(slugPage, "href={`/${locale}#work`}", 'href="/#work"');
}

function afterEnable(ctx) {
  const { i18nActive, lib } = ctx;
  const workDest = i18nActive ? "app/[locale]/work" : "app/work";

  // Copy work/ directory (slug pages + ScreenshotGallery)
  lib.copyDir("templates/portfolio/app/[locale]/work", workDest);

  // Copy example project images
  lib.copyDir("templates/portfolio/public/projects", "public/projects");

  // Collapse slug page if i18n disabled
  if (!i18nActive) collapseWorkSlugPage(ctx);

  // Regenerate sitemap with work paths
  regenerateSitemap(ctx, true);
}

function afterDisable(ctx) {
  const { i18nActive, lib } = ctx;
  const workDir = i18nActive ? "app/[locale]/work" : "app/work";

  // Delete work directory and example images
  lib.deleteIfExists(workDir);
  lib.deleteIfExists("public/projects");

  // Regenerate sitemap without work paths
  regenerateSitemap(ctx, false);
}

module.exports = { afterEnable, afterDisable };
