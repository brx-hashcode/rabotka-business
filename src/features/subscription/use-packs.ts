"use client";

import { useQuery } from "@tanstack/react-query";

import { getMyPacks, myPacksKey } from "#/lib/api/business-controller";
import type { PackKind } from "#/lib/api/types";

/** The packs on sale and those bought. Prices change rarely: kept a few minutes. */
export function usePacks() {
  return useQuery({ queryKey: myPacksKey, queryFn: getMyPacks, staleTime: 5 * 60 * 1000 });
}

/** Whether a pack of this kind can be bought now: the way out of a quota used up. */
export function usePackOnSale(kind: PackKind): boolean {
  const { data } = usePacks();
  return !!data?.onSale.some((p) => p.kind === kind);
}
