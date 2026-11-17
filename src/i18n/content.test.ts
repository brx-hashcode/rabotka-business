import { describe, expect, it } from "vitest";

import { contentLocale, contentMessages, detectLocale } from "./content";

describe("the language of what a business writes", () => {
  it("reads it from the words", () => {
    expect(detectLocale("We are looking for a cashier to help our customers.")).toBe("en");
    expect(detectLocale("Nous recherchons un caissier pour la boutique.")).toBe("fr");
    expect(detectLocale("Caissière")).toBe("fr");
    expect(detectLocale("Cashier")).toBeNull();
    expect(detectLocale("")).toBeNull();
  });

  it("takes the first text that tells, then the fallback", () => {
    expect(contentLocale(["Cashier", "You will work with the store manager."])).toBe("en");
    expect(contentLocale(["Cashier"])).toBe("fr");
    expect(contentLocale(["Cashier"], "en")).toBe("en");
  });

  it("gives the messages of that language, whatever the page's", () => {
    expect(contentMessages("en").labels("employmentType.CDI")).not.toBe(contentMessages("fr").labels("employmentType.CDI") + "x");
    expect(contentMessages("fr").offers.raw("refusal.templates")).toHaveLength(contentMessages("en").offers.raw("refusal.templates").length);
  });
});
