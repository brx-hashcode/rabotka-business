import { describe, expect, it } from "vitest";

import { applicationStage, pillStatus } from "./offer-labels";

describe("applicationStage", () => {
  it("puts a waiting, shortlisted application in « Présélectionnées »", () => {
    expect(applicationStage("PENDING", "2026-11-10T10:00:00Z")).toBe("shortlisted");
    expect(applicationStage("VIEWED", "2026-11-10T10:00:00Z")).toBe("shortlisted");
  });

  it("lets the decision win over the shortlist date it keeps as history", () => {
    expect(applicationStage("WAITING_PAYMENT", "2026-11-10T10:00:00Z")).toBe("hired");
    expect(applicationStage("REJECTED", "2026-11-10T10:00:00Z")).toBe("closed");
  });

  it("reads by status where the date is not carried", () => {
    expect(applicationStage("PENDING")).toBe("new");
    expect(applicationStage("VIEWED", null)).toBe("viewed");
  });
});

describe("pillStatus", () => {
  it("shows « Présélectionnée » only while shortlisted and waiting", () => {
    expect(pillStatus("VIEWED", "2026-11-10T10:00:00Z")).toBe("SHORTLISTED");
    expect(pillStatus("ACCEPTED", "2026-11-10T10:00:00Z")).toBe("ACCEPTED");
    expect(pillStatus("PENDING")).toBe("PENDING");
  });
});
