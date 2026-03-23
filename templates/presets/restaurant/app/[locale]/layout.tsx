import type { Metadata, Viewport } from "next";
import { type Locale } from "../../i18n-config";
import { getDictionary } from "../../get-dictionary";
import ScrollProgress from "./components/ScrollProgress";
import Navbar from "./components/Navbar";
import LangSetter from "./components/LangSetter";
import { MotionConfig } from "framer-motion";

const SITE_URL = "https://YOUR_DOMAIN.vercel.app";

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const dict = await getDictionary(locale);

  const title = "YOUR_BUSINESS — Your Short Descriptor";
  const descriptions: Record<string, string> = {
    pt: "Descrição curta do seu restaurante em português.",
    en: "Short description of your restaurant in English.",
  };
  const description = descriptions[locale] ?? descriptions.en;
  const ogLocales: Record<string, string> = { pt: "pt_PT", en: "en_US" };

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
      siteName: dict.navbar.logo,
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
      locale: ogLocales[locale] ?? "en_US",
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
    "@type": "Restaurant",
    name: "YOUR_BUSINESS",
    description: "Short description of your restaurant.",
    url: `${SITE_URL}/${locale}`,
    email: "YOUR_EMAIL",
    telephone: "YOUR_PHONE",
    address: {
      "@type": "PostalAddress",
      streetAddress: "YOUR_ADDRESS",
    },
    servesCuisine: "YOUR_CUISINE",
  };

  return (
    <MotionConfig reducedMotion="user">
      <LangSetter locale={locale} />
      <a
        href="#menu"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-lg focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ScrollProgress />
      <Navbar locale={locale} nav={dict.navbar} />
      {children}
    </MotionConfig>
  );
}
