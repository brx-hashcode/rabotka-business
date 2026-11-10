import { afterEach, describe, expect, it, vi } from "vitest";

import { playNotificationSound } from "./notification-sound";

describe("playNotificationSound", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("rings once for notifications that arrive together", () => {
    const play = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("window", {});
    vi.stubGlobal(
      "Audio",
      class {
        volume = 1;
        preload = "";
        currentTime = 0;
        play = play;
      },
    );

    playNotificationSound(10_000);
    playNotificationSound(10_500);
    playNotificationSound(11_000);
    expect(play).toHaveBeenCalledTimes(1);

    playNotificationSound(12_000);
    expect(play).toHaveBeenCalledTimes(2);
  });

  it("does nothing on the server", () => {
    expect(() => playNotificationSound(50_000)).not.toThrow();
  });
});
