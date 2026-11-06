import { describe, expect, it } from "vitest";

import type { MySubscription } from "#/lib/api/types";
import { cvOutOfReach, offerWriterOutOfReach, packCredits, packUnits, planShare, readPackDescription } from "../packs";

type E = MySubscription["entitlements"];
const e = (over: Partial<E>): E => over as E;

describe("packs", () => {
  it("says what a pack brings as the invoice and the bell do", () => {
    expect(packUnits("CV", 50)).toBe("50 CV à analyser");
    expect(packUnits("OFFER", 1)).toBe("1 offre à publier");
    expect(packUnits("CONTACT", 10)).toBe("10 contacts à obtenir");
    expect(packUnits("OFFER_DRAFT", 5)).toBe("5 offres rédigées par l’IA");
  });

  it("tells a pack's payment from a plan's", () => {
    expect(readPackDescription("Pack Rabotka Business — 100 CV à analyser")).toBe("100 CV à analyser");
    expect(readPackDescription("Abonnement Rabotka Business Pro — mensuel")).toBeNull();
    expect(readPackDescription(null)).toBeNull();
  });

  it("reads the credits left, none from a backend before packs", () => {
    expect(packCredits(e({ credits: { cv: 45, offers: 0, contacts: 3, offerDrafts: 0 } }), "CONTACT")).toBe(3);
    expect(packCredits(e({}), "CV")).toBe(0);
  });

  it("opens CV analysis to a pack the plan leaves out, not to a trial without it", () => {
    expect(cvOutOfReach(e({ cvQuota: 0, cvRemaining: 0 }))).toBe(true);
    expect(cvOutOfReach(e({ cvQuota: 0, cvRemaining: 50 }))).toBe(false);
    expect(cvOutOfReach(e({ cvQuota: 10, cvRemaining: 0 }))).toBe(false);
    expect(offerWriterOutOfReach(e({ offerDraftsQuota: 0, offerDraftsRemaining: 5 }))).toBe(false);
    expect(offerWriterOutOfReach(undefined)).toBe(true);
  });

  it("keeps the plan's share apart from the packs'", () => {
    expect(planShare(48, 45)).toBe(3);
    expect(planShare(45, 45)).toBe(0);
    expect(planShare(null, 10)).toBeNull();
  });
});
