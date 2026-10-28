import type { MySubscription } from "#/lib/api/types";

type Entitlements = MySubscription["entitlements"];

/** Offers published this period; a backend before the per-period rule only knows the offers online. */
export function offersUsed(e: Entitlements): number {
  return e.offersPublished ?? e.activeOffers;
}

/** No offer left to publish this period (or no plan at all). */
export function offersFull(e: Entitlements): boolean {
  if (!e.plan) return true;
  if (e.offersRemaining !== undefined) return e.offersRemaining === 0;
  return e.activeOffersLimit !== null && e.activeOffers >= e.activeOffersLimit;
}

/** « 3 offres par période », for a plan's list of what it includes. */
export function offersPerPeriodLabel(limit: number | null): string {
  return limit === null ? "Offres illimitées" : `${limit} offre${limit > 1 ? "s" : ""} à publier par période`;
}
