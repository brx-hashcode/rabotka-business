import { useQuery } from "@tanstack/react-query";

import { getSupportContact } from "#/lib/api/public-controller";

/** Rabotka's contact for agents (email, phone), as admins set it. */
export function useSupportContact() {
  return useQuery({
    queryKey: ["support-contact"],
    queryFn: getSupportContact,
    staleTime: 60 * 60 * 1000,
  });
}
