/**
 * An example number for the network picked, as people write it there: in
 * Congo each network has its own prefix (MTN 06, Airtel 05), so the example
 * shows the one the payer's number should start with. Keyed by the
 * gateway's operator code (`MTN_MOMO_COG`, `AIRTEL_COG`).
 */
const EXAMPLES: { match: RegExp; example: string }[] = [
  { match: /^MTN.*_COG$/, example: "06 123 45 67" },
  { match: /^AIRTEL.*_COG$/, example: "05 123 45 67" },
];

export function phonePlaceholder(operatorCode: string | null | undefined, dialCode: string): string {
  const known = operatorCode && EXAMPLES.find((e) => e.match.test(operatorCode));
  if (known) return known.example;
  return dialCode === "242" ? "06 123 45 67" : "Numéro";
}
