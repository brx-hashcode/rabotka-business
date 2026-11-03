import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { getBusinessCatalog } from "#/lib/api/signup-controller";

/**
 * The organisation catalog for a country (its papers and identifiers, in its
 * words). A code outside the list falls back to the default one: the backend
 * would refuse it, and every catalog lists the countries to pick from.
 */
export function useBusinessCatalog(country?: string | null) {
  const fallback = useQuery({
    queryKey: ["business-catalog", ""],
    queryFn: () => getBusinessCatalog(),
    staleTime: Infinity,
  });
  const known = !!country && !!fallback.data?.countries?.some((c) => c.code === country);
  const own = useQuery({
    queryKey: ["business-catalog", country ?? ""],
    queryFn: () => getBusinessCatalog(country ?? undefined),
    enabled: known,
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  });
  // Never another country's papers while this one loads: nothing, or the
  // country shown before (placeholderData).
  return known ? own.data : fallback.data;
}
