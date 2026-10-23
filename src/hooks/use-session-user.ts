import { useQuery } from "@tanstack/react-query";

import type { SessionUser } from "#/lib/api/types";

export const sessionUserKey = ["session", "user"] as const;

/**
 * The signed-in person, as the login returned them. Cached only: there is no
 * request behind it yet — `GET /business/me` (the business-only check) will
 * replace it once the backend has it.
 */
export function useSessionUser() {
  return useQuery<SessionUser | null>({
    queryKey: sessionUserKey,
    queryFn: () => null,
    staleTime: Infinity,
  });
}
