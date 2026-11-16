import { DEFAULT_LOCALE, isOffered, OFFERED_LOCALES, type Locale } from "./config";

/**
 * Which language a page request is in, decided in src/proxy.ts. Pure, so it
 * is tested on its own (routing.test.ts).
 *
 * - The public site (landing and marketing pages) has one URL per language:
 *   `/fonctionnalites` is French, `/en/fonctionnalites` English. Search
 *   engines index both (hreflang); a visitor whose language is English is
 *   sent to the /en one.
 * - The space and sign-in keep their URLs; the language comes from the
 *   cookie, then the browser.
 * - Careers pages, interview invitations and video calls are in the
 *   business's language, not the visitor's (French until that setting exists).
 */

const PREFIX = "/en";

/** `/en/contact` → `/contact`, `/en` → `/`; null when the path has no prefix. */
export function stripLocalePrefix(pathname: string): string | null {
  if (pathname === PREFIX) return "/";
  if (pathname.startsWith(`${PREFIX}/`)) return pathname.slice(PREFIX.length);
  return null;
}

/** The public URL of a marketing path in `locale`. */
export function localizedPath(pathname: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE) return pathname;
  return pathname === "/" ? PREFIX : `${PREFIX}${pathname}`;
}

/** The best offered language in an Accept-Language header, by its q-values. */
export function pickFromAcceptLanguage(
  header: string | null,
  offered: readonly Locale[] = OFFERED_LOCALES,
): Locale | null {
  if (!header) return null;
  const ranked = header
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const weight = q ? Number(q.slice(2)) : 1;
      return { lang: tag.trim().toLowerCase().split("-")[0], weight: Number.isFinite(weight) ? weight : 0, index };
    })
    .filter((r) => r.weight > 0)
    .sort((a, b) => b.weight - a.weight || a.index - b.index);
  return ranked.map((r) => r.lang).find((lang): lang is Locale => isOffered(lang, offered)) ?? null;
}

/** The visitor's language: their choice (cookie), else their browser's, else French. */
export function preferredLocale(
  cookie: string | undefined,
  acceptLanguage: string | null,
  offered: readonly Locale[] = OFFERED_LOCALES,
): Locale {
  if (isOffered(cookie, offered)) return cookie;
  return pickFromAcceptLanguage(acceptLanguage, offered) ?? DEFAULT_LOCALE;
}

/** The public site beyond the landing: features, resources, about, contact, demo. */
const MARKETING_PREFIXES = ["/fonctionnalites", "/ressources", "/a-propos", "/contact", "/demo"];

export function isMarketingPath(pathname: string): boolean {
  return MARKETING_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** The landing and the marketing pages: one URL per language. */
export function isPublicSitePath(pathname: string): boolean {
  return pathname === "/" || isMarketingPath(pathname);
}

/** A link of the site in `locale`: `/contact#form` → `/en/contact#form`; other paths as they are. */
export function localHref(href: string, locale: Locale): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const cut = href.search(/[?#]/);
  const path = cut === -1 ? href : href.slice(0, cut);
  const rest = cut === -1 ? "" : href.slice(cut);
  return isPublicSitePath(path) ? localizedPath(path, locale) + rest : href;
}
