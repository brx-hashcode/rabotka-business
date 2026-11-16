import { INTL_LOCALE, type Locale } from "./config";

/**
 * A whole percentage in the reader's language: « 50 % » in French, « 50% »
 * in English. `signed`: « +50 % » / « -12 % », zero unsigned.
 */
export function formatPercent(value: number, locale: Locale, { signed = false } = {}): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale], {
    style: "percent",
    maximumFractionDigits: 0,
    signDisplay: signed ? "exceptZero" : "auto",
  }).format(value / 100);
}

/** A rating out of five, one decimal: « 4,5 » in French, « 4.5 » in English. */
export function formatRating(value: number | string, locale: Locale): string {
  return Number(value).toLocaleString(INTL_LOCALE[locale], { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
