import { describe, expect, it } from "vitest";

import { runningBillingPeriod } from "./running-period";

const NOW = Date.parse("2026-11-08T12:00:00Z");
const period = (billingPeriod: "MONTHLY" | "ANNUAL" | "TRIAL", startsAt: string, endsAt: string, status = "ACTIVE" as const) => ({
  status,
  billingPeriod,
  startsAt,
  endsAt,
});

describe("runningBillingPeriod", () => {
  it("reads how the period covering now is billed", () => {
    const history = [
      period("ANNUAL", "2026-12-05T00:00:00Z", "2027-12-05T00:00:00Z"),
      period("MONTHLY", "2026-11-05T00:00:00Z", "2026-12-05T00:00:00Z"),
    ];
    expect(runningBillingPeriod(history, NOW)).toBe("MONTHLY");
  });

  it("says nothing on a trial or without a running period", () => {
    expect(runningBillingPeriod([period("TRIAL", "2026-11-01T00:00:00Z", "2026-11-15T00:00:00Z")], NOW)).toBeNull();
    expect(runningBillingPeriod([period("ANNUAL", "2025-01-01T00:00:00Z", "2026-01-01T00:00:00Z")], NOW)).toBeNull();
    expect(runningBillingPeriod([], NOW)).toBeNull();
  });
});
