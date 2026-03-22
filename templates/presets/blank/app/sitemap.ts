import type { MetadataRoute } from "next";

const SITE_URL = "https://YOUR_DOMAIN";
const locales = ["en", "pt"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: `${SITE_URL}/${locale}`,
    lastModified: new Date(),
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `${SITE_URL}/${l}`])),
    },
  }));
}
