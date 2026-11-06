import { afterEach, describe, expect, it } from "vitest";

import { pollEvery, setSocketConnected } from "./socket-status";

afterEach(() => setSocketConnected(false));

describe("pollEvery", () => {
  it("keeps its own pace while the socket is down", () => {
    expect(pollEvery(30_000)).toBe(30_000);
  });

  it("slows to the fallback while it is up, never faster than its own", () => {
    setSocketConnected(true);
    expect(pollEvery(30_000)).toBe(120_000);
    expect(pollEvery(4_000, 15_000)).toBe(15_000);
    expect(pollEvery(300_000)).toBe(300_000);
  });
});
