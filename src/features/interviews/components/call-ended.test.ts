import { describe, expect, it } from "vitest";

import type { InterviewReport } from "#/lib/api/types";
import { reportStage, untilText, waitProgress } from "./call-ended";

const report = (over: Partial<InterviewReport> = {}): InterviewReport => ({
  notes: "",
  report: null,
  writing: false,
  writingError: null,
  scheduledFor: null,
  generatedAt: null,
  sentAt: null,
  updatedAt: null,
  ...over,
});

describe("the end of the call", () => {
  it("tells where the report stands", () => {
    expect(reportStage(report({ writing: true, scheduledFor: "2026-11-15T10:02:00Z" }), true)).toBe("waiting");
    expect(reportStage(report({ writing: true }), true)).toBe("writing");
    expect(reportStage(report({ report: { resume: "x" } as InterviewReport["report"], generatedAt: "2026-11-15T10:03:00Z" }), true)).toBe("ready");
    expect(reportStage(report({ writingError: "Échec" }), true)).toBe("failed");
    expect(reportStage(report(), true)).toBe("none");
    // Without the plan's visio: notes only, no AI report to wait for.
    expect(reportStage(report(), false)).toBe("locked");
    expect(reportStage(undefined, false)).toBe("locked");
  });

  it("counts down to the report", () => {
    const now = new Date("2026-11-15T10:00:00Z").getTime();
    expect(untilText("2026-11-15T10:01:30Z", now)).toBe("dans 1 min 30");
    expect(untilText("2026-11-15T10:02:00Z", now)).toBe("dans 2 min");
    expect(untilText("2026-11-15T10:00:20Z", now)).toBe("dans 20 s");
    expect(untilText("2026-11-15T09:59:00Z", now)).toBe("dans 0 s");
  });

  it("fills the bar as the wait runs out", () => {
    const now = new Date("2026-11-15T10:00:00Z").getTime();
    expect(waitProgress("2026-11-15T10:02:00Z", now)).toBe(0);
    expect(waitProgress("2026-11-15T10:01:00Z", now)).toBe(0.5);
    expect(waitProgress("2026-11-15T09:59:00Z", now)).toBe(1);
  });
});
