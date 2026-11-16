"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconX } from "@tabler/icons-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { ActionDialog } from "#/components/action-dialog";
import { showApplicationStatus, showExternalStatus } from "#/features/offers/application-cache";
import { externalApplicationsKey } from "#/lib/api/careers-controller";
import { useFriendlyError } from "#/lib/api/use-friendly-error";
import { offersKey, refuseApplications } from "#/lib/api/offer-controller";
import { RefusalMessageField, useDefaultRefusals } from "./refusal-message";

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
  const t = useTranslations("offers.refusal");
  const friendlyError = useFriendlyError();
  const firstTemplate = useDefaultRefusals()[0].text;
  const [message, setMessage] = useState<string>(mode === "remaining" ? firstTemplate : "");
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
        t("refused", { count: refused }) + (skipped ? t("skipped", { count: skipped }) : ""),
      );
      if (failed) toast.error(t("failed", { count: failed }));
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
      toast.error(friendlyError(err, t("error")));
    },
  });
  return (
    <ActionDialog
      open={mode !== null}
      onOpenChange={(o) => {
        if (!o) onClose();
        else setMessage(mode === "remaining" ? firstTemplate : "");
      }}
      tone="warning"
      icon={<IconX className="size-5" />}
      title={
        mode === "remaining" ? t("remainingTitle", { count }) : count === 1 ? t("oneTitle") : t("selectedTitle", { count })
      }
      description={t("text")}
      confirmLabel={t("confirm")}
      pending={refuse.isPending}
      onConfirm={() => refuse.mutate()}
    >
      <RefusalMessageField value={message} onChange={setMessage} />
    </ActionDialog>
  );
}
