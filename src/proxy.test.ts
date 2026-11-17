import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

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

describe("languages", () => {
  // OFFERED_LOCALES is read when the module loads: each case loads it afresh.
  async function load(english: boolean) {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_OFFER_ENGLISH", english ? "1" : "");
    vi.stubEnv("BACKEND_URL", "http://backend.test");
    const { proxy } = await import("./proxy");
    return (path: string, { cookie = "", lang = "" } = {}) =>
      proxy(new NextRequest(`https://business.rabotka.work${path}`, { headers: { cookie, "accept-language": lang } }));
  }
  const locale = (res: Response) => res.headers.get("x-middleware-request-x-rb-locale");
  const location = (res: Response) => res.headers.get("location")?.replace("https://business.rabotka.work", "");

  afterEach(() => vi.unstubAllEnvs());

  it("stays French, with no /en pages, while English is not offered", async () => {
    const get = await load(false);
    expect(locale(get("/fonctionnalites", { lang: "en-US" }))).toBe("fr");
    expect(locale(get("/auth/sign-in", { cookie: "rb_lang=en" }))).toBe("fr");
    expect(locale(get("/en/fonctionnalites"))).toBeNull();
    expect(location(get("/contact?lang=en"))).toBe("/contact");
  });

  it("sends an English reader of the public site to its /en URL", async () => {
    const get = await load(true);
    expect(location(get("/fonctionnalites?x=1", { lang: "en-US,en;q=0.9" }))).toBe("/en/fonctionnalites?x=1");
    expect(location(get("/", { cookie: "rb_lang=en" }))).toBe("/en");
    expect(locale(get("/fonctionnalites", { lang: "en", cookie: "rb_lang=fr" }))).toBe("fr");
  });

  it("serves /en/… as the French route, in English, and remembers it", async () => {
    const get = await load(true);
    const res = get("/en/fonctionnalites/analyse-cv");
    expect(locale(res)).toBe("en");
    expect(res.headers.get("x-middleware-rewrite")).toBe("https://business.rabotka.work/fonctionnalites/analyse-cv");
    expect(res.headers.get("set-cookie")).toContain("rb_lang=en");
    // Not the public site: no English URL, so no rewrite (a 404, said in English).
    const space = get("/en/espace");
    expect(space.headers.get("x-middleware-rewrite")).toBeNull();
    expect(locale(space)).toBe("en");
  });

  it("switches with ?lang and keeps the space's URLs", async () => {
    const get = await load(true);
    const toEnglish = get("/espace/offres?tab=2&lang=en", { cookie: "rb_rt=x" });
    expect(location(toEnglish)).toBe("/espace/offres?tab=2");
    expect(toEnglish.headers.get("set-cookie")).toContain("rb_lang=en");
    expect(location(get("/en/contact?lang=fr"))).toBe("/contact");
    expect(location(get("/contact?lang=en"))).toBe("/en/contact");
    expect(locale(get("/espace", { cookie: "rb_rt=x; rb_lang=en" }))).toBe("en");
  });

  it("keeps candidate pages in French whatever the visitor reads", async () => {
    const get = await load(true);
    expect(locale(get("/carrieres/acme", { cookie: "rb_lang=en", lang: "en" }))).toBe("fr");
    expect(locale(get("/entretien/tok", { cookie: "rb_lang=en" }))).toBe("fr");
  });

  it("asks the backend for the visitor's language", async () => {
    const get = await load(true);
    const res = get("/api/v1/business/me", { cookie: "rb_lang=en", lang: "fr" });
    expect(res.headers.get("x-middleware-request-accept-language")).toBe("en");
  });
});
