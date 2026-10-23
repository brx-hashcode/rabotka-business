/** Dialling codes of the countries Rabotka works in; a number typed without one gets the default country's. */
export const DIAL_CODES: Record<string, string> = {
  CG: "242",
  CD: "243",
  GA: "241",
  CM: "237",
  CF: "236",
  TD: "235",
  GQ: "240",
  AO: "244",
  CI: "225",
  SN: "221",
};

/**
 * What the agent typed, as the international number the backend matches.
 * `+…` and `00…` are kept as given; a local number gets the job country's
 * code — keeping Congo's leading 0, which is part of the number there, and
 * dropping the trunk 0 elsewhere.
 */
export function toInternational(raw: string, countryCode: string | null): string {
  const value = raw.replace(/[^\d+]/g, "");
  if (value.startsWith("+")) return `+${value.slice(1).replace(/\+/g, "")}`;
  if (value.startsWith("00")) return `+${value.slice(2)}`;
  const dial = dialCode(countryCode);
  const local = dial !== DIAL_CODES.CG && value.startsWith("0") ? value.slice(1) : value;
  return `+${dial}${local}`;
}

/** The job country's dialling code, Congo's when unknown. */
export function dialCode(countryCode: string | null): string {
  return DIAL_CODES[countryCode?.toUpperCase() ?? "CG"] ?? DIAL_CODES.CG;
}

/**
 * The Congo Mobile Money network a number is on, from its prefix: 06 is MTN,
 * 05 and 04 are Airtel. Null for anything else, so the agent picks.
 */
export function guessMomoOperator(e164: string | null | undefined): "MTN" | "AIRTEL" | null {
  const digits = e164?.replace(/\D/g, "") ?? "";
  if (!digits.startsWith("242")) return null;
  const prefix = digits.slice(3, 5);
  if (prefix === "06") return "MTN";
  if (prefix === "05" || prefix === "04") return "AIRTEL";
  return null;
}
