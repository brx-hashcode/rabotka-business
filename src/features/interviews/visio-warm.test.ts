import { describe, expect, it } from "vitest";

import type { Interview } from "#/lib/api/types";
import { isRabotkaVisio, nextRoom } from "./visio-warm";

const at = (room: string, startsAt: string, more: Partial<Interview> = {}) =>
  ({ mode: "VIDEO", status: "CONFIRMED", location: `https://business.rabotka.work/visio/${room}`, startsAt, endedAt: null, ...more }) as Interview;

describe("isRabotkaVisio", () => {
  it.each([
    ["https://business.rabotka.work/visio/Rabotka-abc", true],
    ["https://meet.google.com/abc", false],
    ["Au bureau", false],
  ])("%s: %s", (location, yes) => expect(isRabotkaVisio(location)).toBe(yes));
});

describe("nextRoom", () => {
  it("is the soonest room of ours", () => {
    expect(nextRoom([at("Rabotka-b", "2026-12-02T10:00:00Z"), at("Rabotka-a", "2026-12-01T10:00:00Z")])).toBe("Rabotka-a");
  });

  it.each([
    ["ended", at("Rabotka-a", "2026-12-01T10:00:00Z", { endedAt: "2026-12-01T10:20:00Z" })],
    ["cancelled", at("Rabotka-a", "2026-12-01T10:00:00Z", { status: "CANCELLED" })],
    ["declined", at("Rabotka-a", "2026-12-01T10:00:00Z", { status: "DECLINED" })],
    ["on the phone", at("Rabotka-a", "2026-12-01T10:00:00Z", { mode: "PHONE" })],
    ["elsewhere", at("Rabotka-a", "2026-12-01T10:00:00Z", { location: "https://meet.google.com/abc" })],
  ])("leaves out one that is %s", (_, interview) => expect(nextRoom([interview])).toBeNull());
});
