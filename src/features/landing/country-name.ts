import type { Locale } from "#/i18n/config";

/**
 * A country's name in the reader's language. The catalog names countries in
 * French; another language asks Intl, by code, and keeps the catalog's name
 * if the engine does not know it.
 */
export function countryName(country: { code: string; name: string }, locale: Locale): string {
  if (locale === "fr") return country.name;
  try {
    return new Intl.DisplayNames(locale, { type: "region" }).of(country.code.toUpperCase()) ?? country.name;
  } catch {
    return country.name;
  }
}
