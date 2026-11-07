import type { MySubscription, TrialAiFeature } from "#/lib/api/types";

/**
 * Whether the running trial leaves this AI feature out: its quota reads 0
 * like a plan without it, but it comes with any paid plan. False on an older
 * backend, which sends no `trialLocked`.
 */
export function trialLocks(e: MySubscription["entitlements"] | undefined, feature: TrialAiFeature): boolean {
  return !!e?.trialLocked?.includes(feature);
}
