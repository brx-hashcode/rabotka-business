/**
 * The site's languages. French is the source: every key is written in French
 * first, and anything not resolved falls back to it.
 */
export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";

/** The visitor's choice, set by the proxy when a URL carries `?lang=`. */
export const LOCALE_COOKIE = "rb_lang";

/** Set by src/proxy.ts on every page request; read by src/i18n/request.ts. */
export const LOCALE_HEADER = "x-rb-locale";

/** The query parameter that switches language: `?lang=en` on any URL. */
export const LOCALE_PARAM = "lang";

/**
 * The languages visitors are offered. English joins once its copy is
 * written: until then no browser is sent to it, /en pages do not exist and
 * the switchers stay hidden. NEXT_PUBLIC_OFFER_ENGLISH=1 previews it.
 */
export const OFFERED_LOCALES: readonly Locale[] =
  process.env.NEXT_PUBLIC_OFFER_ENGLISH === "1" ? LOCALES : [DEFAULT_LOCALE];

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function isOffered(value: unknown, offered: readonly Locale[] = OFFERED_LOCALES): value is Locale {
  return isLocale(value) && offered.includes(value);
}

/** BCP 47 tag for Intl and toLocale*: British English, as English-speaking Africa writes dates. */
export const INTL_LOCALE: Record<Locale, string> = { fr: "fr-FR", en: "en-GB" };

/** Open Graph's `og:locale`. */
export const OG_LOCALE: Record<Locale, string> = { fr: "fr_FR", en: "en_GB" };
