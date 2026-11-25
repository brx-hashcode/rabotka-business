import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LOADED_GRACE_MS, whenCallShows } from "./call-opening";

function setup() {
  const listeners = new Map<string, () => void>();
  const frame = new EventTarget() as HTMLIFrameElement;
  const show = vi.fn();
  const stop = whenCallShows({ addListener: (event, listener) => void listeners.set(event, listener) }, frame, show);
  return { tell: (event: string) => listeners.get(event)?.(), frame, show, stop };
}

beforeEach(() => void vi.useFakeTimers());
afterEach(() => void vi.useRealTimers());

describe("whenCallShows", () => {
  it.each(["prejoinScreenLoaded", "videoConferenceJoined", "errorOccurred"])("shows on %s, once", (event) => {
    const { tell, show } = setup();
    tell(event);
    tell("videoConferenceJoined");
    expect(show).toHaveBeenCalledTimes(1);
  });

  it("shows after the page has loaded when the server tells nothing", () => {
    const { frame, show } = setup();
    vi.advanceTimersByTime(60_000);
    expect(show).not.toHaveBeenCalled();
    frame.dispatchEvent(new Event("load"));
    vi.advanceTimersByTime(LOADED_GRACE_MS - 1);
    expect(show).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(show).toHaveBeenCalledTimes(1);
  });

  it("says nothing once stopped", () => {
    const { tell, frame, show, stop } = setup();
    frame.dispatchEvent(new Event("load"));
    stop();
    tell("prejoinScreenLoaded");
    vi.advanceTimersByTime(60_000);
    expect(show).not.toHaveBeenCalled();
  });
});
