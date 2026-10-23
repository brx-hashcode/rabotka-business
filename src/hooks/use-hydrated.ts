import { useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * False on the server and during hydration, true after. For anything the
 * server cannot know — client-cached queries above all — so the first client
 * render matches the server HTML instead of tripping a hydration mismatch.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
