import { describe, expect, it, vi } from "vitest";

import { refreshFor, refreshKeysFor } from "./notification-refresh";

const keys = (type: string, metadata: Record<string, unknown> = {}) =>
  refreshKeysFor({ type, metadata }).map((k) => JSON.stringify(k));

describe("refreshKeysFor", () => {
  it("a new application refreshes both candidate lists, the counts and the opinions", () => {
    const k = keys("NEW_APPLICATION", { applicationId: "a1", jobOfferId: "o1" });
    for (const key of [["notifications"], ["offers"], ["external-applications"], ["business", "me"], ["offer-opinions"]]) {
      expect(k).toContain(JSON.stringify(key));
    }
  });

  it("an unlock or a payment refreshes the application it is about", () => {
    expect(keys("CONTACT_UNLOCKED", { applicationId: "a1" })).toContain(JSON.stringify(["application", "a1"]));
    expect(keys("PAYMENT_SUCCEEDED", {})).toContain(JSON.stringify(["invoices"]));
  });

  it("an interview answer refreshes the agenda and the candidate lines", () => {
    const k = keys("INTERVIEW_ANSWERED", { interviewId: "i1" });
    expect(k).toContain(JSON.stringify(["interviews"]));
    expect(k).toContain(JSON.stringify(["offers"]));
  });

  it("a message refreshes the discussions, a claim the claims", () => {
    expect(keys("NEW_MESSAGE", { conversationId: "c1" })).toContain(JSON.stringify(["discussions"]));
    expect(keys("CLAIM_STATUS_CHANGED", { claimId: "x" })).toContain(JSON.stringify(["claims"]));
  });

  it("a plan or organisation event refreshes the business", () => {
    expect(keys("BUSINESS_SUBSCRIPTION_GRANTED")).toContain(JSON.stringify(["business", "me"]));
  });

  it("an unknown or empty one refreshes the broad set, as before", () => {
    for (const k of [keys("SOMETHING_NEW"), refreshKeysFor({}).map((x) => JSON.stringify(x))]) {
      for (const key of [["offers"], ["external-applications"], ["business", "me"], ["interviews"]]) {
        expect(k).toContain(JSON.stringify(key));
      }
    }
  });
});

describe("refreshFor", () => {
  it("invalidates each key", () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);
    refreshFor({ invalidateQueries } as never, { type: "NEW_MESSAGE" });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["discussions"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["notifications"] });
  });
});

describe("the keys it names", () => {
  it("are the controllers' own, so a renamed key cannot quietly stop refreshing", async () => {
    const [{ offersKey }, { externalApplicationsKey }, { myBusinessKey }, { interviewsKey }, { notificationsKey }, { claimsKey }, { invoicesKey }, { cvScreeningsKey }] =
      await Promise.all([
        import("#/lib/api/offer-controller"),
        import("#/lib/api/careers-controller"),
        import("#/lib/api/business-controller"),
        import("#/lib/api/interview-controller"),
        import("#/lib/api/notification-controller"),
        import("#/lib/api/claim-controller"),
        import("#/lib/api/invoice-controller"),
        import("#/lib/api/cv-screening-controller"),
      ]);
    const named = new Set(refreshKeysFor({}).concat(refreshKeysFor({ type: "PAYMENT_SUCCEEDED" }), refreshKeysFor({ type: "CLAIM_STATUS_CHANGED" }), refreshKeysFor({ type: "CV_SCREENING_DONE" })).map((k) => JSON.stringify(k)));
    for (const key of [offersKey, externalApplicationsKey, myBusinessKey, interviewsKey, notificationsKey, claimsKey, invoicesKey, cvScreeningsKey]) {
      expect(named).toContain(JSON.stringify(key));
    }
  });
});
