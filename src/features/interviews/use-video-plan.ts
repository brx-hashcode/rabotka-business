"use client";

import { useQuery } from "@tanstack/react-query";

import { getMySubscription, mySubscriptionKey } from "#/lib/api/business-controller";

/**
 * « Visio dans Rabotka » is a plan service: a link made in Rabotka, guests,
 * the transcription, and joining a room (one booked before closes too). Its
 * actions show disabled without it; a Meet or Zoom link stays open to every plan.
 */
export function useVideoPlan() {
  const query = useQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription });
  return { allowed: query.data?.entitlements.videoInterviews === true, loading: query.isLoading };
}
