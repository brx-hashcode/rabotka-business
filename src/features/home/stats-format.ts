/** Formatting of the dashboard's figures; pure, so it is tested on its own. */
import { INTL_LOCALE, type Locale } from "#/i18n/config";
import { formatPercent } from "#/i18n/format";
import type { Translator } from "#/i18n/translator";

const nf = (n: number, locale: Locale, digits = 1) =>
  n.toLocaleString(INTL_LOCALE[locale], { maximumFractionDigits: digits });

/** A delay in hours, said the way people say it: « 5 h », « 2,5 jours » (home.delays.*). */
export function formatDelay(hours: number | null, t: Translator<"home.delays">, locale: Locale): string {
  if (hours === null) return "—";
  if (hours < 1) return t("underHour");
  if (hours < 48) return t("hours", { n: nf(Math.round(hours), locale, 0) });
  // ICU's « # » writes the figure the language's way (« 2,5 »), one decimal at most.
  return t("days", { n: Math.round((hours / 24) * 10) / 10 });
}

/** `label`: the change in figures (« +50 % »), empty when flat — the caller words that. */
export type Trend = { label: string; direction: "up" | "down" | "flat"; good: boolean | null };

/**
 * This period against the previous one. `lowerIsBetter` for delays: a drop is
 * the good news there. No previous value: nothing to compare, no trend.
 */
export function trend(
  current: number | null,
  previous: number | null,
  lowerIsBetter = false,
  locale: Locale = "fr",
): Trend | null {
  if (current === null || previous === null) return null;
  if (current === previous) return { label: "", direction: "flat", good: null };
  const direction = current > previous ? "up" : "down";
  const good = (direction === "up") !== lowerIsBetter;
  if (previous === 0) return { label: `+${nf(current, locale, 0)}`, direction, good };
  const pct = Math.round(((current - previous) / previous) * 100);
  return { label: formatPercent(pct, locale, { signed: true }), direction, good };
}

/** `yyyy-mm-dd` → « 12 oct. » / « 12 Oct ». */
export const shortDay = (day: string, locale: Locale = "fr") =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString(INTL_LOCALE[locale], { day: "numeric", month: "short" });
