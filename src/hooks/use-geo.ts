import { useQuery } from "@tanstack/react-query";

import { getCities, getCountries } from "#/lib/api/public-controller";

const DAY = 24 * 60 * 60 * 1000;

export function useCountries() {
  return useQuery({
    queryKey: ["geo", "countries"],
    queryFn: getCountries,
    staleTime: DAY,
  });
}

export function useCities(countryCode: string) {
  return useQuery({
    queryKey: ["geo", "cities", countryCode],
    queryFn: () => getCities(countryCode),
    enabled: Boolean(countryCode),
    staleTime: DAY,
  });
}
