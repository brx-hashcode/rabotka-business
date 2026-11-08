import type { PaymentOperator } from "#/lib/api/types";

/** The business countries (ISO2) as the gateway names them (ISO3). Unknown: no answer. */
const ALPHA3: Record<string, string> = {
  CG: "COG",
  CD: "COD",
  CM: "CMR",
  GA: "GAB",
  TD: "TCD",
  CF: "CAF",
  GQ: "GNQ",
};

/**
 * Whether the organisation's country has a mobile money network the gateway
 * charges, and if not, where one can pay instead (same currency first). Null
 * while unknown: a country missing above, or a gateway without countries.
 */
export function localMobileMoney(
  countryCode: string | null | undefined,
  operators: readonly PaymentOperator[],
): { covered: true } | { covered: false; elsewhere: string[] } | null {
  const alpha3 = countryCode ? ALPHA3[countryCode] : undefined;
  if (!alpha3 || operators.length === 0 || operators.some((o) => !o.country)) return null;
  if (operators.some((o) => o.country === alpha3)) return { covered: true };
  const names = new Map<string, { name: string; xaf: boolean }>();
  for (const o of operators) {
    if (o.country && o.countryName && !names.has(o.country)) names.set(o.country, { name: o.countryName, xaf: o.currency === "XAF" });
  }
  const elsewhere = [...names.values()]
    .sort((a, b) => Number(b.xaf) - Number(a.xaf) || a.name.localeCompare(b.name, "fr"))
    .map((c) => c.name);
  return { covered: false, elsewhere };
}
