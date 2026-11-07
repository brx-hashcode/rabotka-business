import { describe, expect, it } from "vitest";

import type { MySubscription } from "#/lib/api/types";
import { trialLocks } from "../trial-lock";

const e = (trialLocked?: MySubscription["entitlements"]["trialLocked"]) =>
  ({ trialLocked }) as MySubscription["entitlements"];

describe("trialLocks", () => {
  it("is true only for a feature the running trial leaves out", () => {
    expect(trialLocks(e(["cvAnalysis", "cvChat"]), "cvChat")).toBe(true);
    expect(trialLocks(e(["cvAnalysis"]), "offerWriter")).toBe(false);
  });

  it("is false without entitlements, or from a backend without the field", () => {
    expect(trialLocks(undefined, "cvAnalysis")).toBe(false);
    expect(trialLocks(e(undefined), "cvAnalysis")).toBe(false);
  });
});
