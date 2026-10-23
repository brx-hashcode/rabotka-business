import { describe, expect, it } from "vitest";

import { jwtMaxAge } from "./session-server";

function jwt(payload: Record<string, unknown>) {
  const encode = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${encode({ alg: "HS256" })}.${encode(payload)}.signature`;
}

describe("jwtMaxAge", () => {
  const now = Date.UTC(2026, 9, 5, 12, 0, 0);

  it("returns the seconds left until exp", () => {
    expect(jwtMaxAge(jwt({ exp: now / 1000 + 900 }), now)).toBe(900);
  });

  it("never goes negative for an expired token", () => {
    expect(jwtMaxAge(jwt({ exp: now / 1000 - 60 }), now)).toBe(0);
  });

  it("falls back to 15 minutes when exp is missing or the token is garbage", () => {
    expect(jwtMaxAge(jwt({}), now)).toBe(900);
    expect(jwtMaxAge("not-a-jwt", now)).toBe(900);
  });
});
