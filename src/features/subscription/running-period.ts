import type { SubscriptionPeriod } from "#/lib/api/types";

export type PaidPeriod = "MONTHLY" | "ANNUAL";

/**
 * How the plan running now is billed: the paid period covering this moment,
 * from the history. Null on a trial, without a plan, or for a granted period
 * with no billing of its own.
 */
export function runningBillingPeriod(
  history: readonly Pick<SubscriptionPeriod, "status" | "billingPeriod" | "startsAt" | "endsAt">[],
  now: number = Date.now(),
): PaidPeriod | null {
  const running = history.find(
    (p) => p.status === "ACTIVE" && Date.parse(p.startsAt) <= now && now < Date.parse(p.endsAt),
  );
  return running?.billingPeriod === "MONTHLY" || running?.billingPeriod === "ANNUAL" ? running.billingPeriod : null;
}
