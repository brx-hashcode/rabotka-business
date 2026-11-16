import { describe, expect, it } from "vitest";

import { createTranslator } from "next-intl";

import { MESSAGES } from "#/i18n/messages";
import { formatDelay as format, trend } from "./stats-format";

const fr = createTranslator({ locale: "fr", messages: MESSAGES.fr, namespace: "home.delays" });
const en = createTranslator({ locale: "en", messages: MESSAGES.en, namespace: "home.delays" });
const formatDelay = (hours: number | null) => format(hours, fr, "fr");

describe("formatDelay", () => {
  it("speaks in hours, then days", () => {
    expect(formatDelay(null)).toBe("—");
    expect(formatDelay(0.4)).toBe("< 1 h");
    expect(formatDelay(5.4)).toBe("5 h");
    expect(formatDelay(60)).toBe("2,5 jours");
  });

  it("speaks English", () => {
    expect(format(60, en, "en")).toBe("2.5 days");
    expect(trend(30, 20, false, "en")?.label).toBe("+50%");
  });
});

describe("trend", () => {
  it("compares with the previous period", () => {
    // Intl puts a narrow no-break space before « % » and a real minus sign.
    const plain = (t: ReturnType<typeof trend>) => t && { ...t, label: t.label.replace(/\s/g, " ").replace("\u2212", "-") };
    expect(plain(trend(30, 20))).toEqual({ label: "+50 %", direction: "up", good: true });
    expect(plain(trend(10, 20))).toEqual({ label: "-50 %", direction: "down", good: false });
    expect(trend(5, 5)).toEqual({ label: "", direction: "flat", good: null });
  });

  it("treats a shorter delay as good news", () => {
    expect(trend(5, 10, true)?.good).toBe(true);
    expect(trend(12, 10, true)?.good).toBe(false);
  });

  it("says nothing without a previous value, and counts from zero", () => {
    expect(trend(4, null)).toBeNull();
    expect(trend(3, 0)).toEqual({ label: "+3", direction: "up", good: true });
  });
});

describe("home.greeting", () => {
  const values = { named: "yes", firstName: "Awa", hasBusiness: "yes", business: "Essentiel", elision: "vowel", days: 30 };
  it("elides in French and names the business in English", () => {
    const frHome = createTranslator({ locale: "fr", messages: MESSAGES.fr, namespace: "home" });
    const enHome = createTranslator({ locale: "en", messages: MESSAGES.en, namespace: "home" });
    expect(frHome("greeting", values)).toBe("Bonjour Awa, voici le recrutement d'Essentiel sur les 30 derniers jours.");
    expect(frHome("greeting", { ...values, named: "no", business: "Pro", elision: "other" })).toBe(
      "Voici le recrutement de Pro sur les 30 derniers jours.",
    );
    expect(enHome("greeting", values)).toBe("Hello Awa, here is the hiring at Essentiel over the last 30 days.");
  });
});
