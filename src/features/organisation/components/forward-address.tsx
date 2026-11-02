"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconCopy, IconRefresh } from "@tabler/icons-react";
import { toast } from "sonner";

import { ActionDialog } from "#/components/action-dialog";
import { ProviderTile } from "#/components/mail-provider-logos";
import { copyText } from "#/lib/clipboard";
import { friendlyError } from "#/lib/api/friendly-error";
import { mailboxesKey, regenerateForwardAddress } from "#/lib/api/mailbox-controller";

/**
 * The organisation's own CV address. Forwarding a candidate's mail there puts
 * its CV in « Analyse de CV »: no access to the mailbox is ever asked for.
 */
export function ForwardAddress({ email }: Readonly<{ email: string }>) {
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const regenerate = useMutation({
    mutationFn: regenerateForwardAddress,
    onSuccess: () => {
      setConfirm(false);
      void queryClient.invalidateQueries({ queryKey: mailboxesKey });
      toast.success("Nouvelle adresse créée. L'ancienne ne reçoit plus rien.");
    },
    onError: (err) => toast.error(friendlyError(err, "L'adresse n'a pas pu être changée.")),
  });

  async function copy() {
    if (await copyText(email)) toast.success("Adresse copiée.");
    else toast.error("L'adresse n'a pas pu être copiée.");
  }

  return (
    <div className="space-y-3 rounded-2xl bg-page p-4">
      <div className="flex items-center gap-3">
        <ProviderTile provider="forward" />
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-sm">Votre adresse de transfert</span>
          <span className="block truncate font-mono text-sm">{email}</span>
        </span>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-ink px-3.5 font-medium text-sm text-white"
        >
          <IconCopy className="size-4" />
          Copier
        </button>
      </div>
      <p className="text-muted-foreground text-xs leading-relaxed">
        Transférez à cette adresse les candidatures que vous recevez, depuis n&apos;importe quelle messagerie : leurs CV
        arrivent dans « Analyse de CV » en une minute. Vous pouvez aussi créer une règle de transfert automatique.
      </p>
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="inline-flex items-center gap-1.5 font-medium text-muted-foreground text-xs hover:text-foreground"
      >
        <IconRefresh className="size-3.5" />
        Changer d&apos;adresse
      </button>

      <ActionDialog
        open={confirm}
        onOpenChange={setConfirm}
        tone="warning"
        icon={<IconRefresh className="size-5" />}
        title="Changer d'adresse de transfert ?"
        description="L'adresse actuelle cessera de recevoir des CV. Les CV déjà reçus restent disponibles."
        confirmLabel="Changer d'adresse"
        pending={regenerate.isPending}
        onConfirm={() => regenerate.mutate()}
      />
    </div>
  );
}
