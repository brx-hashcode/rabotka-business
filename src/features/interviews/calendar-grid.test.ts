import { describe, expect, it } from "vitest";

import type { Interview } from "#/lib/api/types";
import { blockPosition, lanes, periodTitle, toEntries, visibleDays, visibleRange } from "./calendar-grid";

const interview = (over: Partial<Interview> = {}): Interview => ({
  id: "i1",
  cvResumeId: null,
  applicationId: "a1",
  offerId: null,
  jobTitle: "Caissier",
  candidateName: "Grâce",
  candidateEmail: null,
  startsAt: new Date(2026, 10, 16, 10, 0).toISOString(),
  durationMinutes: 30,
  mode: "VIDEO",
  location: null,
  message: null,
  status: "CONFIRMED",
  responseNote: null,
  respondedAt: null,
  createdAt: new Date(2026, 10, 1).toISOString(),
  ...over,
});

describe("the interviews calendar", () => {
  it("shows six weeks from the Monday before the 1st, and loads exactly those days", () => {
    const days = visibleDays("mois", new Date(2026, 10, 15));
    expect(days).toHaveLength(42);
    expect(days[0]).toEqual(new Date(2026, 9, 26)); // lundi 26 octobre
    const { from, to } = visibleRange("mois", new Date(2026, 10, 15));
    expect(from).toEqual(new Date(2026, 9, 26));
    expect(to).toEqual(new Date(2026, 11, 7));
  });

  it("starts a week on Monday, and names it", () => {
    const days = visibleDays("semaine", new Date(2026, 10, 15)); // a Sunday
    expect(days[0]).toEqual(new Date(2026, 10, 9));
    expect(days).toHaveLength(7);
    expect(periodTitle("semaine", new Date(2026, 10, 18))).toBe("16 – 22 nov. 2026");
    expect(periodTitle("mois", new Date(2026, 10, 18))).toBe("novembre 2026");
  });

  it("places a pending interview at each time offered, and a decided one at its time", () => {
    const offered = interview({
      id: "i2",
      status: "PENDING",
      options: [
        { id: "s1", startsAt: new Date(2026, 10, 17, 9).toISOString() },
        { id: "s2", startsAt: new Date(2026, 10, 18, 14).toISOString() },
      ],
    });
    const entries = toEntries([offered, interview()]);
    expect(entries.map((e) => [e.key, e.offered])).toEqual([
      ["i1", false],
      ["i2:s1", true],
      ["i2:s2", true],
    ]);
  });

  it("sizes a block in the 7 h–21 h column, and leaves out what falls outside", () => {
    expect(blockPosition(new Date(2026, 10, 16, 7, 0), 60)).toEqual({ top: 0, height: (60 / 840) * 100 });
    expect(blockPosition(new Date(2026, 10, 16, 22, 0), 30)).toBeNull();
    expect(blockPosition(new Date(2026, 10, 16, 6, 0), 30)).toBeNull();
  });

  it("puts overlapping interviews side by side, the others full width", () => {
    const entries = toEntries([
      interview({ id: "a", startsAt: new Date(2026, 10, 16, 10, 0).toISOString(), durationMinutes: 60 }),
      interview({ id: "b", startsAt: new Date(2026, 10, 16, 10, 30).toISOString(), durationMinutes: 30 }),
      interview({ id: "c", startsAt: new Date(2026, 10, 16, 14, 0).toISOString(), durationMinutes: 30 }),
    ]);
    const l = lanes(entries);
    expect(l.get("a")).toEqual({ lane: 0, of: 2 });
    expect(l.get("b")).toEqual({ lane: 1, of: 2 });
    expect(l.get("c")).toEqual({ lane: 0, of: 1 });
  });
});
