/**
 * A chart the assistant put in its answer: the server writes it, from the
 * analyses' own numbers, as a ```rabotka-chart fenced block of JSON. The
 * portal draws it; the PDF prints it.
 */
export const CHART_FENCE = "rabotka-chart";

export type ChartSpec = {
  v: 1;
  kind: "bar";
  /** Bars across (one per candidate, a score) or up (grouped by category). */
  layout: "horizontal" | "vertical";
  title: string;
  /** After each value: « /100 », « ans »… */
  unit: string;
  /** Along the axis, in order. */
  categories: string[];
  /** One colour each; a value per category, null when there is none. */
  series: { name: string; values: (number | null)[] }[];
};

const isText = (x: unknown): x is string => typeof x === "string";

/**
 * The spec in a fenced block, or null when it is not one this portal can draw
 * (an answer still being written, a later version, anything malformed).
 */
export function parseChartSpec(raw: string): ChartSpec | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (d.v !== 1 || d.kind !== "bar") return null;
  if (d.layout !== "horizontal" && d.layout !== "vertical") return null;
  if (!isText(d.title) || !isText(d.unit)) return null;
  if (!Array.isArray(d.categories) || !d.categories.length || !d.categories.every(isText)) return null;
  const count = d.categories.length;
  if (!Array.isArray(d.series) || !d.series.length) return null;
  const seriesOk = d.series.every(
    (s: unknown) =>
      !!s &&
      typeof s === "object" &&
      isText((s as { name?: unknown }).name) &&
      Array.isArray((s as { values?: unknown }).values) &&
      (s as { values: unknown[] }).values.length === count &&
      (s as { values: unknown[] }).values.every((v) => v === null || (typeof v === "number" && Number.isFinite(v))),
  );
  if (!seriesOk) return null;
  return d as unknown as ChartSpec;
}
