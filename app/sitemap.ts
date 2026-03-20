import type { MetadataRoute } from "next";
import { getDictionary } from "../get-dictionary";

const SITE_URL = "https://your-domain.vercel.app";
const locales = ["en", "pt"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dict = await getDictionary("en");
  const slugs = dict.work.projects.map((p) => p.slug);

  const homePaths = locales.map((locale) => ({
    url: `${SITE_URL}/${locale}`,
    lastModified: new Date(),
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `${SITE_URL}/${l}`])),
    },
  }));

  const workPaths = slugs.flatMap((slug) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}/work/${slug}`,
      lastModified: new Date(),
    })),
  );

  return [...homePaths, ...workPaths];
}
