"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { joinVisioAsHost } from "#/lib/api/interview-controller";
import type { Interview } from "#/lib/api/types";

/** A room made by « Créer un lien de visio »: opened here, not in a new tab. */
export function isRabotkaVisio(location: string): boolean {
  try {
    return new URL(location).pathname.startsWith("/visio/Rabotka-");
  } catch {
    return false;
  }
}

/** The room of the next interview that can be joined; null when there is none. */
export function nextRoom(interviews: Interview[]): string | null {
  const next = interviews
    .filter((i) => i.mode === "VIDEO" && i.location && isRabotkaVisio(i.location) && !i.endedAt && i.status !== "CANCELLED" && i.status !== "DECLINED")
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))[0];
  return next?.location ? decodeURIComponent(new URL(next.location).pathname.slice("/visio/".length)) : null;
}

/** The call's start script, loaded once; the call's own loader then finds it there. */
export function loadVisioScript(domain: string): void {
  const src = `https://${domain}/external_api.js`;
  if ("JitsiMeetExternalAPI" in window || document.querySelector(`script[src="${src}"]`)) return;
  const script = document.createElement("script");
  script.src = src;
  script.async = true;
  document.head.appendChild(script);
}

/**
 * On the interviews page, before anyone clicks: the connection to the call's
 * server and its start script. Only the server's address is kept from the
 * answer: the page of the call asks for its own place again, up to date.
 */
export function useVisioWarm(interviews: Interview[] | undefined, allowed: boolean): void {
  const room = allowed ? nextRoom(interviews ?? []) : null;
  const domain = useQuery({
    queryKey: ["visio-domain"],
    queryFn: async () => {
      const v = await joinVisioAsHost(room as string);
      return v.provider === "hosted" ? v.domain : null;
    },
    enabled: room !== null,
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  }).data;
  useEffect(() => {
    if (domain) loadVisioScript(domain);
  }, [domain]);
}
