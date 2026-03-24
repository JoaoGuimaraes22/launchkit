import type { Metadata, Viewport } from "next";
import { type Locale } from "../../i18n-config";
import { getDictionary } from "../../get-dictionary";
import { MotionConfig } from "motion";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://YOUR_DOMAIN.vercel.app";

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const dict = await getDictionary(locale);

  const title = dict.meta.title;
  const description = dict.meta.description;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}`,
      type: "website",
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
  const { locale: _locale } = (await params) as { locale: Locale };
  void _locale; // available for components that need it

  return (
    <MotionConfig reducedMotion="user">
      {children}
    </MotionConfig>
  );
}
