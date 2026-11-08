import { describe, expect, it } from "vitest";

import { featuredPlanId } from "./featured-plan";

describe("featuredPlanId", () => {
  it("puts forward the second plan of the catalog", () => {
    expect(featuredPlanId([{ id: "essentiel" }, { id: "pro" }, { id: "entreprise" }])).toBe("pro");
  });

  it("skips custom plans, which come first when cheaper", () => {
    expect(featuredPlanId([{ id: "mine", custom: true }, { id: "essentiel" }, { id: "pro" }])).toBe("pro");
  });

  it("puts nothing forward with a single public plan", () => {
    expect(featuredPlanId([{ id: "essentiel" }, { id: "mine", custom: true }])).toBeNull();
    expect(featuredPlanId([])).toBeNull();
  });
});
