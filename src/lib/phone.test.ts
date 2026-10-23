import { describe, expect, it } from "vitest";

import { guessMomoOperator, toInternational } from "./phone";

describe("toInternational", () => {
  it("keeps a number typed with its country code", () => {
    expect(toInternational("+242 06 123 45 67", "CD")).toBe("+242061234567");
    expect(toInternational("00242-06-123-45-67", null)).toBe("+242061234567");
  });

  it("gives a local Congo number its code, keeping the leading 0", () => {
    expect(toInternational("06 123 45 67", "CG")).toBe("+242061234567");
    expect(toInternational("061234567", null)).toBe("+242061234567");
  });

  it("drops the trunk 0 elsewhere", () => {
    expect(toInternational("0812 345 678", "CD")).toBe("+243812345678");
  });

  it("falls back to Congo for a country it does not know", () => {
    expect(toInternational("061234567", "ZZ")).toBe("+242061234567");
  });
});

describe("guessMomoOperator", () => {
  it("reads the network from a Congo prefix", () => {
    expect(guessMomoOperator("+242061234567")).toBe("MTN");
    expect(guessMomoOperator("+242051234567")).toBe("AIRTEL");
    expect(guessMomoOperator("+242041234567")).toBe("AIRTEL");
  });

  it("leaves the choice to the agent otherwise", () => {
    expect(guessMomoOperator("+242221234567")).toBeNull();
    expect(guessMomoOperator("+243811234567")).toBeNull();
    expect(guessMomoOperator(null)).toBeNull();
  });
});
