import { describe, expect, it } from "vitest";

import { isCrossSiteWrite, isMarketingPath } from "./proxy";

const req = (method: string, headers: Record<string, string>) => ({ method, headers: new Headers(headers) });

describe("isCrossSiteWrite", () => {
  it("refuses a write from another site", () => {
    expect(isCrossSiteWrite(req("POST", { origin: "https://evil.example", host: "business.rabotka.work" }))).toBe(true);
    expect(isCrossSiteWrite(req("DELETE", { origin: "null", host: "business.rabotka.work" }))).toBe(true);
  });

  it("lets same-origin writes, reads and Origin-less calls through", () => {
    expect(isCrossSiteWrite(req("POST", { origin: "https://business.rabotka.work", host: "business.rabotka.work" }))).toBe(false);
    expect(
      isCrossSiteWrite(req("PATCH", { origin: "https://business.rabotka.work", host: "internal:3000", "x-forwarded-host": "business.rabotka.work" })),
    ).toBe(false);
    expect(isCrossSiteWrite(req("GET", { origin: "https://evil.example", host: "business.rabotka.work" }))).toBe(false);
    expect(isCrossSiteWrite(req("POST", { host: "business.rabotka.work" }))).toBe(false);
  });
});

describe("isMarketingPath", () => {
  it("opens the public site's pages", () => {
    for (const path of [
      "/fonctionnalites",
      "/fonctionnalites/analyse-cv",
      "/ressources",
      "/ressources/organiser-ses-entretiens",
      "/a-propos",
      "/contact",
      "/demo",
    ]) {
      expect(isMarketingPath(path)).toBe(true);
    }
  });

  it("keeps the space and look-alike paths behind the session", () => {
    for (const path of ["/espace", "/espace/offres", "/demonstration", "/contacts", "/ressources-humaines"]) {
      expect(isMarketingPath(path)).toBe(false);
    }
  });
});
