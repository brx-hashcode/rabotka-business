import { describe, expect, it } from "vitest";

import { canSchedule } from "./can-schedule";

type Arg = Parameters<typeof canSchedule>[0];
const app = (status: string, offer: string) => ({ status, offer: { status: offer } }) as unknown as Arg;

describe("canSchedule", () => {
  it("invites a pending candidate while the offer recruits", () => {
    expect(canSchedule(app("PENDING", "ACTIVE"))).toBe(true);
    expect(canSchedule(app("PENDING", "PARTIALLY_FILLED"))).toBe(true);
  });

  it("stops inviting pending candidates once the offer is filled", () => {
    expect(canSchedule(app("PENDING", "FILLED"))).toBe(false);
  });

  it("keeps the retained candidate invitable after the offer is filled", () => {
    expect(canSchedule(app("RETAINED", "FILLED"))).toBe(true);
  });

  it("never invites a refused candidate", () => {
    expect(canSchedule(app("REFUSED", "ACTIVE"))).toBe(false);
  });
});
