import { describe, expect, it } from "vitest";

import { LOCALES } from "./config";
import { localHref, localizedPath, pickFromAcceptLanguage, preferredLocale, stripLocalePrefix } from "./routing";

const BOTH = LOCALES;
const FRENCH_ONLY = ["fr"] as const;

describe("stripLocalePrefix", () => {
  it("removes /en", () => {
    expect(stripLocalePrefix("/en")).toBe("/");
    expect(stripLocalePrefix("/en/fonctionnalites/analyse-cv")).toBe("/fonctionnalites/analyse-cv");
  });

  it("leaves other paths alone", () => {
    for (const path of ["/", "/espace", "/entretien/abc", "/english", "/enquete"]) expect(stripLocalePrefix(path)).toBeNull();
  });
});

describe("localizedPath", () => {
  it("prefixes English only", () => {
    expect(localizedPath("/", "en")).toBe("/en");
    expect(localizedPath("/contact", "en")).toBe("/en/contact");
    expect(localizedPath("/contact", "fr")).toBe("/contact");
  });
});

describe("pickFromAcceptLanguage", () => {
  it("follows the q-values among offered languages", () => {
    expect(pickFromAcceptLanguage("en-US,en;q=0.9,fr;q=0.8", BOTH)).toBe("en");
    expect(pickFromAcceptLanguage("fr-FR,fr;q=0.9,en;q=0.8", BOTH)).toBe("fr");
    expect(pickFromAcceptLanguage("de;q=1,en;q=0.5", BOTH)).toBe("en");
    expect(pickFromAcceptLanguage("en;q=0.3,fr;q=0.7", BOTH)).toBe("fr");
  });

  it("skips what is not offered or refused", () => {
    expect(pickFromAcceptLanguage("en-US,en;q=0.9", FRENCH_ONLY)).toBeNull();
    expect(pickFromAcceptLanguage("en;q=0,de", BOTH)).toBeNull();
    expect(pickFromAcceptLanguage(null, BOTH)).toBeNull();
    expect(pickFromAcceptLanguage("*", BOTH)).toBeNull();
  });
});

describe("preferredLocale", () => {
  it("puts the visitor's choice before their browser", () => {
    expect(preferredLocale("fr", "en-US", BOTH)).toBe("fr");
    expect(preferredLocale("en", "fr-FR", BOTH)).toBe("en");
    expect(preferredLocale(undefined, "en-US", BOTH)).toBe("en");
  });

  it("falls back to French", () => {
    expect(preferredLocale("de", "de-DE", BOTH)).toBe("fr");
    expect(preferredLocale(undefined, null, BOTH)).toBe("fr");
  });

  it("offers no English while it is not live", () => {
    expect(preferredLocale("en", "en-US", FRENCH_ONLY)).toBe("fr");
  });
});

describe("localHref", () => {
  it("puts the public site's links at their English URL", () => {
    expect(localHref("/contact", "en")).toBe("/en/contact");
    expect(localHref("/#faq", "en")).toBe("/en#faq");
    expect(localHref("/fonctionnalites/analyse-cv?x=1", "en")).toBe("/en/fonctionnalites/analyse-cv?x=1");
  });

  it("leaves the rest alone", () => {
    expect(localHref("/auth/sign-in", "en")).toBe("/auth/sign-in");
    expect(localHref("https://www.rabotka.work", "en")).toBe("https://www.rabotka.work");
    expect(localHref("/contact", "fr")).toBe("/contact");
  });
});
