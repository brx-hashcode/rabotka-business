import { describe, expect, it } from "vitest";

import { candidateSource, sourceLabel } from "./candidate-source";

describe("candidateSource", () => {
  it("trusts a clean ?source= first", () => {
    expect(candidateSource("jooble", "https://www.google.com/", "business.rabotka.work")).toBe("jooble");
  });

  it("names the site that sent the visitor", () => {
    expect(candidateSource(null, "https://www.google.cg/search?q=emploi", "x")).toBe("google");
    expect(candidateSource(null, "https://l.facebook.com/", "x")).toBe("facebook");
    expect(candidateSource(null, "https://lnkd.in/abc", "x")).toBe("linkedin");
  });

  it("falls back on direct, and ignores its own pages and odd values", () => {
    expect(candidateSource(null, "", "x")).toBe("direct");
    expect(candidateSource(null, "https://business.rabotka.work/carrieres", "business.rabotka.work")).toBe("direct");
    expect(candidateSource("<b>", "", "x")).toBe("direct");
  });
});

describe("sourceLabel", () => {
  it("says it in words, even for a site it does not know", () => {
    expect(sourceLabel("qr")).toBe("Affiche (QR code)");
    expect(sourceLabel("emploicg")).toBe("Emploicg");
  });
});
