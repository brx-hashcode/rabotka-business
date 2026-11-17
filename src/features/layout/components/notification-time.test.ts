import { describe, expect, it } from "vitest";

import { groupByDay, shortAgo } from "./notification-bell";

const NOW = new Date("2026-11-16T12:00:00Z").getTime();
const ago = (minutes: number) => new Date(NOW - minutes * 60_000).toISOString();
// Intl puts a no-break space between figure and unit.
const plain = (s: string | null) => s?.replace(/\s/g, " ");

describe("shortAgo", () => {
  it("keeps the French as it was", () => {
    expect(shortAgo(ago(0), "fr", NOW)).toBeNull();
    expect(plain(shortAgo(ago(5), "fr", NOW))).toBe("5 min");
    expect(plain(shortAgo(ago(7 * 60), "fr", NOW))).toBe("7 h");
    expect(plain(shortAgo(ago(2 * 24 * 60), "fr", NOW))).toBe("2 j");
  });

  it("speaks English", () => {
    expect(plain(shortAgo(ago(5), "en", NOW))).toBe("5 mins");
    expect(plain(shortAgo(ago(2 * 24 * 60), "en", NOW))).toBe("2 days");
  });
});

describe("groupByDay", () => {
  it("returns day keys in feed order", () => {
    const now = new Date(NOW);
    const groups = groupByDay([{ createdAt: ago(10) }, { createdAt: ago(26 * 60) }, { createdAt: ago(30 * 24 * 60) }], now);
    expect(groups.map(([day]) => day)).toEqual(["today", "yesterday", "older"]);
  });
});
