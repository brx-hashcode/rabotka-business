"use client";

import { useQuery } from "@tanstack/react-query";

import { getMe, meKey } from "#/lib/api/team-controller";

/** Who is signed in, and their role. Read once a session, kept warm. */
export function useMember() {
  const query = useQuery({ queryKey: meKey, queryFn: getMe, staleTime: 5 * 60_000 });
  return { ...query, member: query.data, role: query.data?.role };
}
