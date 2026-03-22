import { NextRequest, NextResponse } from "next/server";
import { i18n } from "./i18n-config";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathnameHasLocale = i18n.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (pathnameHasLocale) return;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/img") ||
    pathname.includes(".")
  ) {
    return;
  }

  // Single locale: rewrite internally so the URL stays clean (/ not /en/)
  // Multiple locales: redirect to the locale detected from accept-language
  if (i18n.locales.length === 1) {
    return NextResponse.rewrite(
      new URL(`/${i18n.defaultLocale}${pathname === "/" ? "" : pathname}`, request.url),
    );
  }

  const acceptLanguage = request.headers.get("accept-language") || "";
  const prefersPt =
    acceptLanguage.includes("pt") &&
    (!acceptLanguage.includes("en") ||
      acceptLanguage.indexOf("pt") < acceptLanguage.indexOf("en"));

  const locale = prefersPt ? "pt" : i18n.defaultLocale;

  return NextResponse.redirect(
    new URL(`/${locale}${pathname === "/" ? "" : pathname}`, request.url),
  );
}

export const config = {
  matcher: ["/((?!_next|api|img|favicon.ico|icon.png|apple-icon.png).*)"],
};
