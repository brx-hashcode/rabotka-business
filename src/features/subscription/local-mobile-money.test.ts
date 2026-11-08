import { describe, expect, it } from "vitest";

import type { PaymentOperator } from "#/lib/api/types";
import { localMobileMoney } from "./local-mobile-money";

const op = (country: string, countryName: string, currency: string): PaymentOperator => ({
  code: `X_${country}`,
  label: "X",
  country,
  countryName,
  currency,
});
const ops = [op("KEN", "Kenya", "KES"), op("COG", "Congo", "XAF"), op("CMR", "Cameroun", "XAF"), op("COG", "Congo", "XAF")];

describe("localMobileMoney", () => {
  it("says a country with a network is covered", () => {
    expect(localMobileMoney("CG", ops)).toEqual({ covered: true });
  });

  it("lists where to pay instead, FCFA countries first", () => {
    expect(localMobileMoney("TD", ops)).toEqual({ covered: false, elsewhere: ["Cameroun", "Congo", "Kenya"] });
  });

  it("does not answer for an unknown country or a gateway without countries", () => {
    expect(localMobileMoney("FR", ops)).toBeNull();
    expect(localMobileMoney(null, ops)).toBeNull();
    expect(localMobileMoney("TD", [])).toBeNull();
    expect(localMobileMoney("TD", [{ code: "A", label: "A" }])).toBeNull();
  });
});
