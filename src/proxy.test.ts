import { describe, expect, it } from "vitest";

import { isCrossSiteWrite } from "./proxy";

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
