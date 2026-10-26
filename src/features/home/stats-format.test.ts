import { describe, expect, it } from "vitest";

import { formatDelay, trend } from "./stats-format";

describe("formatDelay", () => {
  it("speaks in hours, then days", () => {
    expect(formatDelay(null)).toBe("—");
    expect(formatDelay(0.4)).toBe("< 1 h");
    expect(formatDelay(5.4)).toBe("5 h");
    expect(formatDelay(60)).toBe("2,5 jours");
  });
});

describe("trend", () => {
  it("compares with the previous period", () => {
    expect(trend(30, 20)).toEqual({ label: "+50 %", direction: "up", good: true });
    expect(trend(10, 20)).toEqual({ label: "-50 %", direction: "down", good: false });
    expect(trend(5, 5)).toEqual({ label: "stable", direction: "flat", good: null });
  });

  it("treats a shorter delay as good news", () => {
    expect(trend(5, 10, true)?.good).toBe(true);
    expect(trend(12, 10, true)?.good).toBe(false);
  });

  it("says nothing without a previous value, and counts from zero", () => {
    expect(trend(4, null)).toBeNull();
    expect(trend(3, 0)).toEqual({ label: "+3", direction: "up", good: true });
  });
});
