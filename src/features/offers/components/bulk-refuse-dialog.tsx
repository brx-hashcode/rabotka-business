"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconX } from "@tabler/icons-react";
import { toast } from "sonner";

import { ActionDialog } from "#/components/action-dialog";
import { showApplicationStatus, showExternalStatus } from "#/features/offers/application-cache";
import { externalApplicationsKey } from "#/lib/api/careers-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import { offersKey, refuseApplications } from "#/lib/api/offer-controller";
import { REFUSAL_TEMPLATES, RefusalMessageField } from "./refusal-message";

/** « Refuser la sélection » / « Refuser les autres candidatures »: one message for all. */
export function BulkRefuseDialog({
  offerId,
  mode,
  ids,
  selectedOutsiderIds,
  count,
  onClose,
  onDone,
}: Readonly<{
  offerId: string;
  mode: "selected" | "remaining" | null;
  /** Rabotka applications picked. */
  ids: string[];
  /** Careers-page applications picked. */
  selectedOutsiderIds: string[];
  count: number;
  onClose: () => void;
  onDone: () => void;
}>) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string>(mode === "remaining" ? REFUSAL_TEMPLATES[0].text : "");
  const refuse = useMutation({
    // One request for both kinds: the server refuses the careers-page
    // candidates too, each the usual way, and counts those no longer waiting.
    mutationFn: async () => {
      const text = message.trim() || undefined;
      const result = await refuseApplications(offerId, {
        ...(mode === "remaining" ? { remaining: true } : { applicationIds: ids, externalIds: selectedOutsiderIds }),
        ...(text ? { message: text } : {}),
      });
      return { ...result, failed: 0 };
    },
    onSuccess: ({ refused, skipped, failed }) => {
      void queryClient.invalidateQueries({ queryKey: offersKey });
      void queryClient.invalidateQueries({ queryKey: externalApplicationsKey });
      void queryClient.invalidateQueries({ queryKey: ["business", "me", "stats"] });
      toast.success(
        `${refused === 1 ? "1 candidature refusée" : `${refused} candidatures refusées`}, les candidats en sont prévenus.` +
          (skipped ? ` ${skipped} n'étai${skipped > 1 ? "ent" : "t"} plus en attente.` : ""),
      );
      if (failed) toast.error(`${failed} n'${failed > 1 ? "ont" : "a"} pas pu être refusée${failed > 1 ? "s" : ""} : réessayez.`);
      onDone();
      onClose();
    },
    // Picked cards change at once; « all the others » waits for the server,
    // which knows who is still waiting.
    onMutate: () => {
      if (mode !== "selected") return { undo: () => {} };
      const undos = [
        ...ids.map((id) => showApplicationStatus(queryClient, id, "REJECTED")),
        ...selectedOutsiderIds.map((id) => showExternalStatus(queryClient, id, "REFUSED")),
      ];
      return { undo: () => undos.reverse().forEach((u) => u()) };
    },
    onError: (err, _vars, ctx) => {
      ctx?.undo();
      void queryClient.invalidateQueries({ queryKey: offersKey });
      void queryClient.invalidateQueries({ queryKey: externalApplicationsKey });
      toast.error(friendlyError(err, "Les candidatures n'ont pas pu être refusées."));
    },
  });
  return (
    <ActionDialog
      open={mode !== null}
      onOpenChange={(o) => {
        if (!o) onClose();
        else setMessage(mode === "remaining" ? REFUSAL_TEMPLATES[0].text : "");
      }}
      tone="warning"
      icon={<IconX className="size-5" />}
      title={
        mode === "remaining"
          ? `Refuser les ${count} autres candidatures ?`
          : count === 1
            ? "Refuser la candidature sélectionnée ?"
            : `Refuser les ${count} candidatures sélectionnées ?`
      }
      description="Chaque candidat est prévenu, avec ce message."
      confirmLabel="Refuser"
      pending={refuse.isPending}
      onConfirm={() => refuse.mutate()}
    >
      <RefusalMessageField value={message} onChange={setMessage} />
    </ActionDialog>
  );
}
