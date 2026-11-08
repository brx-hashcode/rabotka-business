/**
 * Rabotka's prices are set in XAF. A business outside the CFA zone sees and
 * pays them in its own country's currency — the DRC in dollars — converted at
 * the day's rate and rounded exactly as the backend charges them
 * (`toLocalAmount` in rabotka-backend's common/services/fx/local-price.ts).
 * Change one, change the other: what is shown here must be what the phone
 * asks for.
 */
export type DisplayCurrency = {
  currency: string;
  /** Units of `currency` for 1 XAF; 1 in the CFA zone. */
  perXaf: number;
  /** Decimals the currency takes on its networks (0 or 2). */
  decimals: number;
  significantDigits: number;
  marginPercent: number;
};

export const XAF: DisplayCurrency = {
  currency: "XAF",
  perXaf: 1,
  decimals: 0,
  significantDigits: 2,
  marginPercent: 0,
};

export function isCfa(currency: string): boolean {
  return currency === "XAF" || currency === "XOF";
}

/** An XAF price in `c`'s currency, rounded as checkout will charge it. */
export function toLocalAmount(xaf: number, c: DisplayCurrency): number {
  if (!Number.isFinite(xaf) || xaf <= 0) return 0;
  if (isCfa(c.currency)) return Math.round(xaf);

  const raw = xaf * c.perXaf * (1 + Math.max(0, c.marginPercent) / 100);
  if (!Number.isFinite(raw) || raw <= 0) return 0;

  const digits = Math.max(1, Math.floor(c.significantDigits));
  const decimals = Math.max(0, Math.floor(c.decimals));
  const magnitude = Math.floor(Math.log10(raw));
  const step = Math.max(10 ** (magnitude - digits + 1), 10 ** -decimals);
  const rounded = Math.max(Math.round(raw / step) * step, step);
  return Number(rounded.toFixed(decimals));
}

/** « 1 000 FCFA », « 1,70 $ », « 220 Ksh » — an amount already in `currency`. */
export function formatMoney(amount: number, currency: string): string {
  if (isCfa(currency)) return `${Math.round(amount).toLocaleString("fr-FR")} FCFA`;
  const whole = Number.isInteger(amount);
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // A code Intl does not know: the figure and the code.
    return `${amount.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} ${currency}`;
  }
}

/** An XAF price, said in `c`'s currency. */
export function formatPrice(xaf: number, c: DisplayCurrency): string {
  return formatMoney(toLocalAmount(xaf, c), c.currency);
}
