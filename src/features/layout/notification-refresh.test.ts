import { describe, expect, it, vi } from "vitest";

import { createProgressRefresh, refreshFor, refreshKeysFor } from "./notification-refresh";

const keys = (type: string, metadata: Record<string, unknown> = {}) =>
  refreshKeysFor({ type, metadata }).map((k) => JSON.stringify(k));

describe("refreshKeysFor", () => {
  it("a new application refreshes that offer, the lists, the inbox, the counts and its opinions", () => {
    const k = keys("NEW_APPLICATION", { applicationId: "a1", jobOfferId: "o1" });
    for (const key of [
      ["notifications"],
      ["offers", "o1"],
      ["offers", "list"],
      ["offers", "received"],
      ["external-applications"],
      ["business", "me", "stats"],
      ["offer-opinions", "o1"],
    ]) {
      expect(k).toContain(JSON.stringify(key));
    }
    // Not every offer, nor the whole business (member, team, plan…).
    expect(k).not.toContain(JSON.stringify(["offers"]));
    expect(k).not.toContain(JSON.stringify(["business", "me"]));
  });

  it("without an offer id, it falls back to all the offers", () => {
    const k = keys("NEW_APPLICATION", { applicationId: "a1" });
    expect(k).toContain(JSON.stringify(["offers"]));
    expect(k).toContain(JSON.stringify(["offer-opinions"]));
  });

  it("a finished screening refreshes that screening and the plan's counters", () => {
    const k = keys("CV_SCREENING_DONE", { screeningId: "s1" });
    expect(k).toContain(JSON.stringify(["cv-screenings", "s1"]));
    expect(k).toContain(JSON.stringify(["cv-screenings", "list"]));
    expect(k).toContain(JSON.stringify(["business", "me", "subscription"]));
  });

  it("a LinkedIn post refreshes that offer's posts", () => {
    expect(keys("LINKEDIN_POST", { jobOfferId: "o1" })).toContain(JSON.stringify(["business", "me", "linkedin", "posts", "o1"]));
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

describe("createProgressRefresh", () => {
  it("refreshes the screening at once and the rest once per window, all of it at the end", () => {
    vi.useFakeTimers();
    const seen: string[] = [];
    const progress = createProgressRefresh((k) => seen.push(JSON.stringify(k)), 2000);
    for (let done = 1; done <= 5; done++) progress({ screeningId: "s1", done, total: 10 });
    expect(seen.filter((k) => k === JSON.stringify(["cv-screenings", "s1"]))).toHaveLength(5);
    expect(seen).not.toContain(JSON.stringify(["offers"]));
    vi.advanceTimersByTime(2000);
    expect(seen.filter((k) => k === JSON.stringify(["offers"]))).toHaveLength(1);
    progress({ screeningId: "s1", offerId: "o1", done: 10, total: 10 });
    expect(seen).toContain(JSON.stringify(["offers", "o1"]));
    expect(seen).toContain(JSON.stringify(["business", "me", "subscription"]));
    vi.advanceTimersByTime(5000);
    expect(seen.filter((k) => k === JSON.stringify(["offers"]))).toHaveLength(1);
    vi.useRealTimers();
  });
});

describe("the keys it names", () => {
  it("are the controllers' own, so a renamed key cannot quietly stop refreshing", async () => {
    const [{ offersKey }, { externalApplicationsKey }, { myBusinessKey }, { interviewsKey }, { notificationsKey }, { claimsKey }, { invoicesKey }, { cvScreeningsKey }, { mySubscriptionKey }] =
      await Promise.all([
        import("#/lib/api/offer-controller"),
        import("#/lib/api/careers-controller"),
        import("#/lib/api/business-controller"),
        import("#/lib/api/interview-controller"),
        import("#/lib/api/notification-controller"),
        import("#/lib/api/claim-controller"),
        import("#/lib/api/invoice-controller"),
        import("#/lib/api/cv-screening-controller"),
        import("#/lib/api/business-controller"),
      ]);
    const named = new Set(refreshKeysFor({}).concat(refreshKeysFor({ type: "PAYMENT_SUCCEEDED" }), refreshKeysFor({ type: "CLAIM_STATUS_CHANGED" }), refreshKeysFor({ type: "CV_SCREENING_DONE" }), refreshKeysFor({ type: "CONTACT_UNLOCKED" })).map((k) => JSON.stringify(k)));
    for (const key of [offersKey, externalApplicationsKey, myBusinessKey, interviewsKey, notificationsKey, claimsKey, invoicesKey, cvScreeningsKey, mySubscriptionKey]) {
      expect(named).toContain(JSON.stringify(key));
    }
  });
});
