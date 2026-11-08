import { describe, expect, it } from "vitest";

import { formatMoney, formatPrice, toLocalAmount, XAF, type DisplayCurrency } from "./money";

const usd: DisplayCurrency = { currency: "USD", perXaf: 0.001701, decimals: 2, significantDigits: 2, marginPercent: 0 };

describe("local prices", () => {
  // The same cases as rabotka-backend's local-price.spec.ts: shown = charged.
  it("rounds exactly as the backend charges", () => {
    expect(toLocalAmount(1000, usd)).toBe(1.7);
    expect(toLocalAmount(5000, usd)).toBe(8.5);
    expect(toLocalAmount(1000, { ...usd, currency: "CDF", perXaf: 3.974701, decimals: 0 })).toBe(4000);
    expect(toLocalAmount(1000, { ...usd, currency: "KES", perXaf: 0.221684, decimals: 0 })).toBe(220);
    expect(toLocalAmount(1000, { ...usd, significantDigits: 1 })).toBe(2);
    expect(toLocalAmount(1000, { ...usd, marginPercent: 10 })).toBe(1.9);
    expect(toLocalAmount(1, usd)).toBe(0.01);
  });

  it("keeps a CFA price as set", () => {
    expect(toLocalAmount(1250, XAF)).toBe(1250);
    expect(formatPrice(1250, XAF)).toBe("1 250 FCFA");
  });

  it("says dollars with cents only when there are some", () => {
    expect(formatMoney(1.7, "USD")).toBe("1,70 $");
    expect(formatMoney(43, "USD")).toBe("43 $");
  });
});
