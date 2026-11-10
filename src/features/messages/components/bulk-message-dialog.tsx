"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { IconSend } from "@tabler/icons-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "#/components/ui/dialog";
import { Textarea } from "#/components/ui/textarea";
import { friendlyError } from "#/lib/api/friendly-error";
import {
  listMessageTemplates,
  MESSAGE_KIND_LABEL,
  messageTemplatesKey,
  PLACEHOLDERS,
  renderTemplate,
  sendCandidatesMessage,
} from "#/lib/api/message-templates-controller";
import { cn } from "#/lib/utils";

const BODY_MAX = 1000;

/** Who the message goes to: the ids each kind carries, and a first name for the preview. */
export type MessageRecipients = { rabotka: string[]; external: string[]; firstName: string };

/**
 * « Envoyer un message » to several candidates of an offer: a template to
 * start from, the words to adjust, a preview for the first one. Rabotka
 * candidates read it in Messages, careers-page ones by e-mail.
 */
export function BulkMessageDialog({
  open,
  onOpenChange,
  offerId,
  jobTitle,
  businessName,
  recipients,
  onSent,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offerId: string;
  jobTitle: string;
  businessName: string;
  recipients: MessageRecipients;
  onSent?: () => void;
}>) {
  const [body, setBody] = useState("");
  const { data } = useQuery({ queryKey: messageTemplatesKey, queryFn: listMessageTemplates, enabled: open });
  // Refusals have their own dialog: the rest are offered here.
  const picks = [
    ...(data?.templates ?? []).map((t) => ({ key: t.id, kind: t.kind, title: t.title, body: t.body })),
    ...(data?.suggested ?? []),
  ].filter((t) => t.kind !== "REFUSAL");
  const count = recipients.rabotka.length + recipients.external.length;
  const preview = renderTemplate(body, { prenom: recipients.firstName, poste: jobTitle, entreprise: businessName });

  const send = useMutation({
    mutationFn: () => sendCandidatesMessage(offerId, { rabotka: recipients.rabotka, external: recipients.external, body }),
    onSuccess: ({ sent, skipped }) => {
      toast.success(
        `${sent === 1 ? "Message envoyé à 1 candidat" : `Message envoyé à ${sent} candidats`}.` +
          (skipped ? ` ${skipped} n'${skipped > 1 ? "ont" : "a"} pas pu le recevoir.` : ""),
      );
      setBody("");
      onSent?.();
      onOpenChange(false);
    },
    onError: (err) => toast.error(friendlyError(err, "Le message n'a pas pu être envoyé.")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] gap-5 rounded-3xl border-0 bg-card p-6 shadow-soft sm:max-w-2xl">
        <div className="space-y-1">
          <DialogTitle className="font-semibold text-xl">
            {count === 1 ? "Écrire au candidat" : `Écrire aux ${count} candidats`}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Chacun reçoit son message, à son prénom : dans Messages pour un candidat Rabotka, par e-mail pour une candidature de
            votre page carrières.
          </DialogDescription>
        </div>

        {picks.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {picks.map((t) => (
              <button
                key={t.key}
                type="button"
                title={MESSAGE_KIND_LABEL[t.kind]}
                onClick={() => setBody(t.body)}
                className={cn(
                  "rounded-full px-3 py-1.5 font-medium text-xs transition-colors",
                  body === t.body ? "bg-selected text-selected-foreground" : "bg-page text-muted-foreground hover:text-foreground",
                )}
              >
                {t.title}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={BODY_MAX}
            rows={6}
            placeholder="Bonjour {prenom}, …"
            className="min-h-36 rounded-xl border-0 bg-page px-4 py-3 shadow-none"
          />
          <p className="flex flex-wrap gap-x-1.5 text-muted-foreground text-xs">
            <span>Remplacés pour chacun :</span>
            {PLACEHOLDERS.map((p) => (
              <code key={p.token} className="font-medium text-foreground">
                {p.token}
              </code>
            ))}
            <span>· pas de téléphone, d&apos;e-mail ni de lien pour les candidats Rabotka.</span>
          </p>
        </div>

        {body.trim() && (
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-xs">Aperçu pour {recipients.firstName || "le premier candidat"}</p>
            <p className="whitespace-pre-line rounded-2xl bg-page px-4 py-3 text-sm">{preview}</p>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => onOpenChange(false)} className="h-10 rounded-full px-4 font-medium text-sm hover:bg-page">
            Annuler
          </button>
          <button
            type="button"
            disabled={!body.trim() || count === 0 || send.isPending}
            onClick={() => send.mutate()}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-5 font-medium text-sm text-white hover:bg-ink/90 disabled:opacity-50"
          >
            <IconSend className="size-4" />
            {count === 1 ? "Envoyer" : `Envoyer aux ${count}`}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
