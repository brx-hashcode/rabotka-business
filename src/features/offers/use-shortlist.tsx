"use client";

import { useState } from "react";
import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { IconStar, IconStarOff } from "@tabler/icons-react";
import { toast } from "sonner";

import { ActionDialog } from "#/components/action-dialog";
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

/** What « Présélectionner » is asked for: the cards, the way, and who (for the question). */
type ShortlistAsk = {
  targets: ShortlistTargets;
  shortlisted: boolean;
  /** A name for one candidate; none for several. */
  who?: string;
  onDone?: () => void;
};

/**
 * `useShortlist` behind a confirmation, as every decision on a candidature
 * is: `ask()` opens « Présélectionner Awa ? », `dialog` is to render once.
 */
export function useConfirmedShortlist(offerId: string) {
  const shortlist = useShortlist(offerId);
  const [asked, setAsked] = useState<ShortlistAsk | null>(null);
  const count = asked ? asked.targets.rabotka.length + asked.targets.external.length : 0;
  const several = count > 1 || !asked?.who;
  const title = !asked
    ? ""
    : asked.shortlisted
      ? several
        ? `Présélectionner ${count} candidatures ?`
        : `Présélectionner ${asked.who} ?`
      : several
        ? `Retirer ${count} candidatures de la présélection ?`
        : `Retirer ${asked.who} de la présélection ?`;
  const dialog = (
    <ActionDialog
      open={!!asked}
      onOpenChange={(o) => !o && setAsked(null)}
      icon={asked?.shortlisted === false ? <IconStarOff className="size-5" /> : <IconStar className="size-5" />}
      title={title}
      description={
        asked?.shortlisted
          ? "Une étape pour votre équipe avant de décider : le candidat n'en est pas prévenu."
          : "La candidature revient à « À examiner ». Le candidat n'en est pas prévenu."
      }
      confirmLabel={asked?.shortlisted ? "Présélectionner" : "Retirer"}
      pending={shortlist.isPending}
      onConfirm={() => {
        if (!asked) return;
        const { targets, shortlisted, onDone } = asked;
        shortlist.mutate({ targets, shortlisted }, { onSuccess: () => onDone?.() });
        setAsked(null);
      }}
    />
  );
  return { ask: setAsked, dialog, isPending: shortlist.isPending };
}
