// @vitest-environment node
// Pure date formatting — no DOM, no React runtime.
import { describe, expect, it } from "vitest";

import { listTime } from "./list-time";

// A fixed "now" so the suite does not change its mind at midnight.
const NOW = new Date(2026, 8, 22, 15, 0); // mardi 22 septembre 2026, 15h00

describe("listTime", () => {
  it("shows the hour for a message from today", () => {
    expect(listTime(new Date(2026, 8, 22, 9, 5).toISOString(), NOW)).toBe("09:05");
  });

  it("says Hier for yesterday, even late the night before", () => {
    expect(listTime(new Date(2026, 8, 21, 23, 59).toISOString(), NOW)).toBe("Hier");
  });

  it("uses the weekday within the last week", () => {
    expect(listTime(new Date(2026, 8, 17, 12, 0).toISOString(), NOW)).toBe("jeudi");
  });

  it("falls back to a date beyond a week", () => {
    expect(listTime(new Date(2026, 7, 1, 12, 0).toISOString(), NOW)).toBe("01/08/2026");
  });

  it("is empty for a conversation with no message yet", () => {
    expect(listTime(null, NOW)).toBe("");
  });
});
