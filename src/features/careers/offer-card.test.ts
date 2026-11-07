import { describe, expect, it } from "vitest";

import { offerCardFacts, offerCardTitleSize } from "./offer-card";

const offer = {
  isRemote: false,
  city: "Brazzaville",
  employmentType: "MISSION" as const,
  amount: 1000,
  paymentFlow: "HOURLY" as const,
  closesAt: "2026-11-30T23:00:00.000Z",
};

describe("offerCardFacts", () => {
  it("says where, what and how much", () => {
    expect(offerCardFacts(offer)).toEqual({
      chips: [
        { icon: "place", text: "Brazzaville" },
        { icon: "type", text: "Mission" },
        { icon: "pay", text: "1 000 FCFA / heure" },
      ],
    });
  });

  it("leaves out what the offer does not say", () => {
    const facts = offerCardFacts({ ...offer, city: null, amount: null });
    expect(facts.chips).toEqual([{ icon: "type", text: "Mission" }]);
    expect(offerCardFacts({ ...offer, isRemote: true }).chips[0].text).toBe("Télétravail");
  });

  it("spaces thousands with a plain space", () => {
    expect(offerCardFacts({ ...offer, amount: 1250000, paymentFlow: "MONTHLY" }).chips[2].text).toBe("1 250 000 FCFA / mois");
  });
});

describe("offerCardTitleSize", () => {
  it("shrinks a long title to keep it on two lines", () => {
    expect(offerCardTitleSize("Comptable")).toBe(88);
    expect(offerCardTitleSize("Agent d'entretien de bureaux")).toBe(76);
    expect(offerCardTitleSize("x".repeat(80))).toBe(54);
  });
});
