"use client";

import { useQuery } from "@tanstack/react-query";

import { getMySubscription, mySubscriptionKey } from "#/lib/api/business-controller";

/** Where a locked « Visio dans Rabotka » action leads. */
export const PLANS_HREF = "/espace/abonnement";

/**
 * « Visio dans Rabotka » is a plan service: a link made in Rabotka, guests,
 * the transcription. A Meet or Zoom link stays open to every plan, and a
 * visio already booked keeps working.
 */
export function useVideoPlan() {
  const query = useQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription });
  return { allowed: query.data?.entitlements.videoInterviews === true, loading: query.isLoading };
}
