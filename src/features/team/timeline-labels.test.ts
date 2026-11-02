import { describe, expect, it } from "vitest";

import { timelineLabel } from "./timeline-labels";

const awa = { id: "m", name: "Awa", role: "RECRUITER" as const };

describe("timelineLabel", () => {
  it("says who decided when it is known", () => {
    expect(timelineLabel({ at: "", kind: "RETAINED", member: awa })).toBe("Retenu par Awa");
    expect(timelineLabel({ at: "", kind: "REFUSED", member: null })).toBe("Refusé");
  });

  it("words notes, opinions and interviews", () => {
    expect(timelineLabel({ at: "", kind: "OPINION", member: awa, verdict: "MAYBE" })).toBe("Avis de Awa : peut-être");
    expect(timelineLabel({ at: "", kind: "NOTE", member: null })).toBe("Note d'un ancien membre");
    expect(
      timelineLabel({ at: "", kind: "INTERVIEW", interview: { startsAt: "2026-11-04T10:00:00Z", status: "PENDING" } }),
    ).toMatch(/^Entretien proposé pour le 4 novembre à/);
  });
});
