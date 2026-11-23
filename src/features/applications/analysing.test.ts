import { describe, expect, it } from "vitest";

import { isAnalysing } from "./analysing";

describe("isAnalysing", () => {
  it("is true while queued before any analysis shows", () => {
    expect(isAnalysing({ analysis: null, analysisQueued: true })).toBe(true);
  });

  it("is true while the analysis is under way", () => {
    expect(isAnalysing({ analysis: { status: "QUEUED" } as never, analysisQueued: false })).toBe(true);
  });

  it("is false once scored, failed, or never queued", () => {
    expect(isAnalysing({ analysis: { status: "SCORED" } as never })).toBe(false);
    expect(isAnalysing({ analysis: { status: "FAILED" } as never })).toBe(false);
    expect(isAnalysing({ analysis: null })).toBe(false);
  });
});
