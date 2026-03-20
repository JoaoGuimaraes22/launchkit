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
