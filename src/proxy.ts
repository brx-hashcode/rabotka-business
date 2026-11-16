import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE } from "#/lib/auth/cookies";
import { safeRedirectPath } from "#/lib/safe-redirect";
import { appConfig } from "#/config";
import { DEFAULT_LOCALE, isOffered, LOCALE_COOKIE, LOCALE_HEADER, LOCALE_PARAM, type Locale } from "#/i18n/config";
import { localizedPath, preferredLocale, stripLocalePrefix } from "#/i18n/routing";

const HOME = appConfig.homePath;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale = preferredLocale(request.cookies.get(LOCALE_COOKIE)?.value, request.headers.get("accept-language"));
  if (pathname.startsWith("/api/")) return forwardApi(request, locale);
  // Socket.IO's long-polling transport is plain HTTP: it goes the same way,
  // so the socket is authenticated by the same cookie-to-bearer swap. Next
  // redirects away a trailing slash, so it arrives without the one the
  // server's path has (see use-notifications-socket).
  if (pathname === "/socket.io") return forwardApi(request, locale, "/socket.io/");
  // A language switch: `?lang=en` on any page (src/components/language-switch).
  if (request.nextUrl.searchParams.has(LOCALE_PARAM)) return switchLocale(request);
  // The public site in English: /en/… is the French page's route.
  const unprefixed = stripLocalePrefix(pathname);
  if (unprefixed !== null) return englishPublicPage(request, unprefixed);
  if (pathname.startsWith("/auth/")) return redirectSignedIn(request) ?? page(request, locale);
  if (pathname === "/") return landing(request) ?? publicPage(request, locale);
  // A candidate's interview invitation: answered from the e-mail, signed out.
  // An interview's video call: the candidate joins by its link, signed out.
  // A business's public careers page: for candidates who are not on Rabotka.
  // All three speak the business's language, not the visitor's: French
  // until businesses can choose.
  if (isCandidatePath(pathname)) return page(request, DEFAULT_LOCALE);
  // The public site's other pages: open to everyone, signed in or not.
  if (isMarketingPath(pathname)) return publicPage(request, locale);
  return requireSession(request) ?? page(request, locale);
}

function isCandidatePath(pathname: string): boolean {
  return (
    pathname.startsWith("/entretien/") ||
    pathname.startsWith("/visio/") ||
    pathname === "/carrieres" ||
    pathname.startsWith("/carrieres/")
  );
}

/** The landing and the marketing pages: one URL per language. */
export function isPublicSitePath(pathname: string): boolean {
  return pathname === "/" || isMarketingPath(pathname);
}

/** The public site beyond the landing: features, resources, about, contact, demo. */
const MARKETING_PREFIXES = ["/fonctionnalites", "/ressources", "/a-propos", "/contact", "/demo"];

export function isMarketingPath(pathname: string): boolean {
  return MARKETING_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function forwardApi(request: NextRequest, locale: Locale, path = request.nextUrl.pathname) {
  // The session cookie becomes a bearer token below, so a write from another
  // site must not ride on it. SameSite=Lax already keeps the cookie off
  // cross-site writes; this refuses them outright (a browser always sends
  // Origin on one). Same-origin calls and calls with no Origin pass.
  if (isCrossSiteWrite(request)) {
    return NextResponse.json({ message: "Requête refusée." }, { status: 403 });
  }
  const backend = process.env.BACKEND_URL;
  if (!backend) {
    return NextResponse.json(
      { message: "BACKEND_URL is not configured" },
      { status: 502 },
    );
  }

  // The session lives in httpOnly cookies on this origin; the backend only
  // understands a bearer token, and never needs to see our cookies.
  //
  // Origin and Referer go too. The backend refuses a cookie-less POST whose
  // Origin is not in its ALLOW_ORIGINS — a CSRF check on ITS session cookie,
  // which never travels from here. Without this the anonymous sign-up calls
  // (send-otp, uploads) would need this site listed there; with it, the
  // request is what it is, a server-to-server call.
  const headers = new Headers(request.headers);
  headers.delete("cookie");
  headers.delete("origin");
  headers.delete("referer");
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (token) headers.set("authorization", `Bearer ${token}`);
  // The backend answers in the page's language (nestjs-i18n reads this).
  headers.set("accept-language", locale);

  const target = new URL(path + request.nextUrl.search, backend);
  return NextResponse.rewrite(target, { request: { headers } });
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function isCrossSiteWrite(request: Pick<NextRequest, "method" | "headers">): boolean {
  if (SAFE_METHODS.has(request.method)) return false;
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}

/** A page, told its language (src/i18n/request.ts reads the header). */
function page(request: NextRequest, locale: Locale, rewriteTo?: string) {
  // Always overwritten: a visitor cannot pick the language by sending it.
  const headers = new Headers(request.headers);
  headers.set(LOCALE_HEADER, locale);
  if (rewriteTo === undefined) return NextResponse.next({ request: { headers } });
  const url = new URL(rewriteTo + request.nextUrl.search, request.url);
  return NextResponse.rewrite(url, { request: { headers } });
}

/**
 * A French URL of the public site. Its language is the URL's, so search
 * engines see one language per URL; a visitor who reads English is sent to
 * the /en one.
 */
function publicPage(request: NextRequest, locale: Locale) {
  if (locale !== DEFAULT_LOCALE) return redirectTo(request, localizedPath(request.nextUrl.pathname, locale));
  return page(request, DEFAULT_LOCALE);
}

/**
 * /en/… : the French page's route, in English, and English becomes the
 * visitor's choice. Anything that is not the public site — or English while
 * it is not offered — has no /en URL: Next answers 404.
 */
function englishPublicPage(request: NextRequest, pathname: string) {
  if (!isOffered("en") || !isPublicSitePath(pathname)) return NextResponse.next();
  const res = (pathname === "/" && landing(request)) || page(request, "en", pathname);
  return remember(request, res, "en");
}

/**
 * `?lang=xx`: saves the choice and reloads the same page without the
 * parameter — on the public site, at its URL in that language.
 */
function switchLocale(request: NextRequest) {
  const asked = request.nextUrl.searchParams.get(LOCALE_PARAM);
  const pathname = stripLocalePrefix(request.nextUrl.pathname) ?? request.nextUrl.pathname;
  if (!isOffered(asked)) return redirectTo(request, request.nextUrl.pathname, true);
  const target = isPublicSitePath(pathname) ? localizedPath(pathname, asked) : pathname;
  return remember(request, redirectTo(request, target, true), asked);
}

function redirectTo(request: NextRequest, pathname: string, dropLangParam = false) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  if (dropLangParam) url.searchParams.delete(LOCALE_PARAM);
  return NextResponse.redirect(url);
}

const YEAR = 60 * 60 * 24 * 365;

function remember(request: NextRequest, res: NextResponse, locale: Locale) {
  if (request.cookies.get(LOCALE_COOKIE)?.value === locale) return res;
  res.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: YEAR,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}

function redirectSignedIn(request: NextRequest) {
  if (!request.cookies.has(REFRESH_COOKIE)) return null;
  const next = safeRedirectPath(request.nextUrl.searchParams.get("next")) ?? HOME;
  return NextResponse.redirect(new URL(next, request.url));
}

/** The public landing page; a signed-in business goes straight to its space. */
function landing(request: NextRequest) {
  if (!request.cookies.has(REFRESH_COOKIE)) return null;
  return NextResponse.redirect(new URL(HOME, request.url));
}

/**
 * Every page but the landing is for a signed-in business. Without a session the visitor goes
 * to sign-in, and `next` brings them back. Whether the account really is a
 * business is the backend's answer (BusinessProfileGuard), not this cookie's.
 */
function requireSession(request: NextRequest) {
  if (request.cookies.has(REFRESH_COOKIE)) return null;
  const { pathname, search } = request.nextUrl;
  const url = new URL("/auth/sign-in", request.url);
  if (pathname !== HOME) url.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(url);
}

export const config = {
  // Pages and the API; never Next's assets, the session routes or files in public/.
  matcher: [
    "/((?!_next/|session/|favicon.ico|icon|apple-icon|opengraph-image|twitter-image|manifest.json|robots.txt|sitemap.xml|fonts/|media/|illustrations/|rabotka-).*)",
  ],
};
