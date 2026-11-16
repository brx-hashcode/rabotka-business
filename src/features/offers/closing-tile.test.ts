import { describe, expect, it } from "vitest";

import { labelsIn } from "#/i18n/test-translators";
import { closingTile as tile } from "./offer-labels";

const fr = labelsIn("fr");
const closingTile = (o: Parameters<typeof tile>[0], left: number | null) => tile(o, left, fr, "fr");

const offer = (over: Partial<Parameters<typeof closingTile>[0]> = {}) => ({
  employmentType: "CDI" as const,
  status: "ACTIVE" as const,
  closedAt: null,
  ...over,
});

describe("closingTile", () => {
  it("an open offer with no date stays open until the business closes it", () => {
    expect(closingTile(offer(), null)).toEqual({
      label: "Clôture",
      value: "Sans date limite",
      hint: "jusqu'à ce que vous la fermiez",
    });
  });

  it("an ended one says how, in the words of its chip — never « Par vous »", () => {
    expect(closingTile(offer({ status: "COMPLETED" }), null).value).toBe("Terminée");
    expect(closingTile(offer({ status: "FILLED" }), null).value).toBe("Pourvue");
    expect(closingTile(offer({ status: "EXPIRED" }), null).value).toBe("Expirée");
  });

  it("one the business closed says « Fermée », and when", () => {
    const tile = closingTile(offer({ status: "EXPIRED", closedAt: "2026-11-06T10:00:00Z" }), null);
    expect(tile.value).toBe("Fermée");
    expect(tile.hint).toBe("le 6 novembre");
  });

  it("a dated one counts the days", () => {
    expect(closingTile(offer({ employmentType: "MISSION" }), 3)).toEqual({ label: "Mission", value: "J-3" });
    expect(closingTile(offer({ employmentType: "MISSION" }), 0).value).toBe("Aujourd'hui");
    expect(closingTile(offer(), 5).value).toBe("J-5");
  });

  it("speaks English", () => {
    const en = labelsIn("en");
    expect(tile(offer(), null, en, "en")).toEqual({ label: "Closing", value: "No deadline", hint: "until you close it" });
    expect(tile(offer({ status: "EXPIRED", closedAt: "2026-11-06T10:00:00Z" }), null, en, "en").hint).toBe("on 6 November");
  });
});
