import type { Metadata, Viewport } from "next";
import { type Locale } from "../../i18n-config";
import { getDictionary } from "../../get-dictionary";

const SITE_URL = "https://YOUR_DOMAIN";

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const dict = await getDictionary(locale);

  const title = dict.site.title;
  const description = dict.site.description;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        en: `${SITE_URL}/en`,
        pt: `${SITE_URL}/pt`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}`,
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
      locale: locale === "pt" ? "pt_PT" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}/og-image.png`],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const dict = await getDictionary(locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: dict.site.title,
    url: `${SITE_URL}/${locale}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
