import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";

import { MESSAGES } from "#/i18n/messages";

import { timelineLabel } from "./timeline-labels";

const awa = { id: "m", name: "Awa", role: "RECRUITER" as const };

const t = createTranslator({ locale: "fr", messages: MESSAGES.fr, namespace: "team.timeline" });
const en = createTranslator({ locale: "en", messages: MESSAGES.en, namespace: "team.timeline" });
const label = (e: Parameters<typeof timelineLabel>[0]) => timelineLabel(e, t, "fr");

describe("timelineLabel", () => {
  it("says who decided when it is known", () => {
    expect(label({ at: "", kind: "RETAINED", member: awa })).toBe("Retenu par Awa");
    expect(label({ at: "", kind: "REFUSED", member: null })).toBe("Refusé");
  });

  it("words notes, opinions and interviews", () => {
    expect(label({ at: "", kind: "OPINION", member: awa, verdict: "MAYBE" })).toBe("Avis de Awa : peut-être");
    expect(label({ at: "", kind: "NOTE", member: null })).toBe("Note d'un ancien membre");
    expect(
      label({ at: "", kind: "INTERVIEW", interview: { startsAt: "2026-11-04T10:00:00Z", status: "PENDING" } }),
    ).toMatch(/^Entretien proposé pour le 4 novembre à/);
  });

  it("words them in English too", () => {
    expect(timelineLabel({ at: "", kind: "OPINION", member: awa, verdict: "YES" }, en, "en")).toBe("Opinion of Awa: yes");
    expect(timelineLabel({ at: "", kind: "RETAINED", member: awa }, en, "en")).toBe("Shortlisted by Awa");
  });
});
