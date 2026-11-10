"use client";

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { friendlyError } from "#/lib/api/friendly-error";
import { externalApplicationsKey } from "#/lib/api/careers-controller";
import { offersKey, shortlistApplication, shortlistApplications } from "#/lib/api/offer-controller";

/** The candidatures to move, by the id each kind carries. */
export type ShortlistTargets = { rabotka: string[]; external: string[] };

/** `shortlistedAt` on the cached rows with those ids (offers' applicants, careers lists). */
function withShortlist<T>(data: T, ids: Set<string>, field: "applicationId" | "id", at: string | null): T {
  if (!Array.isArray(data)) return data;
  let changed = false;
  const next = data.map((row: unknown) => {
    const r = row as Record<string, unknown> | null;
    if (!r || typeof r !== "object" || !ids.has(String(r[field]))) return row;
    // Shortlisting keeps a date already there, as the server does.
    if (at && r.shortlistedAt) return row;
    changed = true;
    return { ...r, shortlistedAt: at };
  });
  return (changed ? next : data) as T;
}

/** Moves the cards at once; returns the undo for an error. */
function showShortlist(queryClient: QueryClient, targets: ShortlistTargets, shortlisted: boolean): () => void {
  const at = shortlisted ? new Date().toISOString() : null;
  const sets = [
    { key: offersKey, ids: new Set(targets.rabotka), field: "applicationId" as const },
    { key: externalApplicationsKey, ids: new Set(targets.external), field: "id" as const },
  ].filter((s) => s.ids.size > 0);
  const before = sets.flatMap((s) => {
    void queryClient.cancelQueries({ queryKey: s.key });
    const data = queryClient.getQueriesData({ queryKey: s.key });
    queryClient.setQueriesData({ queryKey: s.key }, (d: unknown) => withShortlist(d, s.ids, s.field, at));
    return data;
  });
  return () => {
    for (const [queryKey, data] of before) queryClient.setQueryData(queryKey, data);
  };
}

/**
 * « Présélectionner » / « Retirer de la présélection »: one card (its own
 * route, so the Historique says who), or several of the offer at once. The
 * candidate is never told: it is the business's own step.
 */
export function useShortlist(offerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ targets, shortlisted }: { targets: ShortlistTargets; shortlisted: boolean }) => {
      const count = targets.rabotka.length + targets.external.length;
      if (count === 1) {
        const [kind, id] = targets.rabotka.length ? (["rabotka", targets.rabotka[0]] as const) : (["external", targets.external[0]] as const);
        return shortlistApplication(kind, id, shortlisted).then(() => ({ changed: 1, skipped: 0 }));
      }
      return shortlistApplications(offerId, { ...targets, shortlisted });
    },
    onMutate: ({ targets, shortlisted }) => ({ undo: showShortlist(queryClient, targets, shortlisted) }),
    onSuccess: ({ changed, skipped }, { shortlisted }) => {
      if (changed > 1 || skipped > 0) {
        toast.success(
          (shortlisted
            ? changed === 1
              ? "1 candidature présélectionnée."
              : `${changed} candidatures présélectionnées.`
            : changed === 1
              ? "1 candidature retirée de la présélection."
              : `${changed} candidatures retirées de la présélection.`) +
            (skipped ? ` ${skipped} n'étai${skipped > 1 ? "ent" : "t"} plus en attente.` : ""),
        );
      }
    },
    onError: (err, _vars, ctx) => {
      ctx?.undo();
      toast.error(friendlyError(err, "La présélection n'a pas pu être modifiée."));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: offersKey });
      void queryClient.invalidateQueries({ queryKey: externalApplicationsKey });
    },
  });
}
