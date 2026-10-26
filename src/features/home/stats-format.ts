/** Formatting of the dashboard's figures; pure, so it is tested on its own. */

const nf = (n: number, digits = 1) => n.toLocaleString("fr-FR", { maximumFractionDigits: digits });

/** A delay in hours, said the way people say it: « 5 h », « 2,5 j ». */
export function formatDelay(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 1) return "< 1 h";
  if (hours < 48) return `${nf(Math.round(hours), 0)} h`;
  return `${nf(hours / 24)} j`;
}

export type Trend = { label: string; direction: "up" | "down" | "flat"; good: boolean | null };

/**
 * This period against the previous one. `lowerIsBetter` for delays: a drop is
 * the good news there. No previous value: nothing to compare, no trend.
 */
export function trend(current: number | null, previous: number | null, lowerIsBetter = false): Trend | null {
  if (current === null || previous === null) return null;
  if (current === previous) return { label: "stable", direction: "flat", good: null };
  const direction = current > previous ? "up" : "down";
  const good = (direction === "up") !== lowerIsBetter;
  if (previous === 0) return { label: `+${nf(current, 0)}`, direction, good };
  const pct = Math.round(((current - previous) / previous) * 100);
  return { label: `${pct > 0 ? "+" : ""}${pct} %`, direction, good };
}

/** `yyyy-mm-dd` → « 12 oct. ». */
export const shortDay = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
