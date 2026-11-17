"use client";

import { useCallback } from "react";
import { useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";

import { getJobCategories } from "./offer-controller";

/**
 * A trade's name in the reader's language. The server names trades in French
 * everywhere (offers, profiles, statistics); read in English, the name is
 * looked up in the trades list, which carries each one's English name. A
 * trade without one, or a name that is no trade, shows as it came.
 */
export function useTradeName(): (name: string) => string {
  const locale = useLocale();
  const { data } = useQuery({
    queryKey: ["job-categories"],
    queryFn: getJobCategories,
    staleTime: Infinity,
    enabled: locale !== "fr",
  });
  return useCallback(
    (name: string) => {
      if (locale === "fr") return name;
      return data?.find((c) => c.name === name)?.nameEn ?? name;
    },
    [data, locale],
  );
}
