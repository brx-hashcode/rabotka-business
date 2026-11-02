"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  IconBug,
  IconCreditCard,
  IconFileCertificate,
  IconMessageQuestion,
  IconPhotoPlus,
  IconReceipt,
  IconUserExclamation,
  IconX,
  type Icon as TablerIcon,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { CLAIM_IMAGE_ACCEPT, CLAIM_IMAGE_MAX_BYTES, CLAIM_MAX_IMAGES, type ClaimStatus } from "#/lib/api/claim-controller";
import { cn } from "#/lib/utils";

/** What the request is about: the team reads it first, in the title. */
export const TOPICS = [
  { value: "candidate", label: "Candidat ou mission", hint: "Absence, retard, travail mal fait…", icon: IconUserExclamation },
  { value: "payment", label: "Paiement ou facture", hint: "Montant, prélèvement, facture…", icon: IconReceipt },
  { value: "plan", label: "Abonnement", hint: "Formule, contacts inclus…", icon: IconCreditCard },
  { value: "account", label: "Compte et documents", hint: "Vérification, informations…", icon: IconFileCertificate },
  { value: "bug", label: "Problème technique", hint: "Une page ou une action qui ne marche pas", icon: IconBug },
  { value: "other", label: "Autre", hint: "Une question, une idée…", icon: IconMessageQuestion },
] as const;
export type Topic = (typeof TOPICS)[number]["value"];

/**
 * The topic and the subject, out of a title written as « Topic — subject »;
 * a title from elsewhere (the client app, the demo) has no topic.
 */
export function splitTitle(title: string): { topic: { label: string; icon: TablerIcon } | null; subject: string } {
  const at = title.indexOf(" — ");
  if (at > 0) {
    const label = title.slice(0, at);
    const topic = TOPICS.find((t) => t.label === label);
    if (topic) return { topic, subject: title.slice(at + 3).trim() || title };
  }
  return { topic: null, subject: title };
}

export const CLAIM_STATUS: Record<ClaimStatus, { label: string; className: string }> = {
  CREATED: { label: "Envoyée", className: "bg-chip-amber text-chip-amber-foreground" },
  IN_PROGRESS: { label: "En cours", className: "bg-chip-violet text-chip-violet-foreground" },
  COMPLETED: { label: "Résolue", className: "bg-chip-green text-chip-green-foreground" },
  REJECTED: { label: "Refusée", className: "bg-page text-muted-foreground" },
};

export const isClosed = (s: ClaimStatus) => s === "COMPLETED" || s === "REJECTED";

export function StatusPill({ status }: Readonly<{ status: ClaimStatus }>) {
  const s = CLAIM_STATUS[status] ?? { label: status, className: "bg-page" };
  return <span className={cn("shrink-0 rounded-full px-2.5 py-1 font-medium text-xs", s.className)}>{s.label}</span>;
}

/**
 * Up to three photos (JPG, PNG, WEBP, 5 Mo each) — the server's rule, said
 * before an upload is wasted on it.
 */
export function ImagePicker({
  files,
  onChange,
  disabled,
  compact,
}: Readonly<{ files: File[]; onChange: (files: File[]) => void; disabled?: boolean; compact?: boolean }>) {
  const input = useRef<HTMLInputElement>(null);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  function add(list: FileList | null) {
    if (!list) return;
    const next = [...files];
    for (const f of Array.from(list)) {
      if (!CLAIM_IMAGE_ACCEPT.split(",").includes(f.type)) {
        toast.error(`${f.name} : seules les photos JPG, PNG ou WEBP sont acceptées.`);
      } else if (f.size > CLAIM_IMAGE_MAX_BYTES) {
        toast.error(`${f.name} dépasse 5 Mo.`);
      } else if (next.length >= CLAIM_MAX_IMAGES) {
        toast.error(`${CLAIM_MAX_IMAGES} photos au plus.`);
        break;
      } else next.push(f);
    }
    onChange(next);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {previews.map((url, i) => (
        <span key={url} className={cn("relative overflow-hidden rounded-xl bg-page", compact ? "size-14" : "size-20")}>
          {/* A local blob: nothing next/image could optimise. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="size-full object-cover" />
          <button
            type="button"
            aria-label="Retirer la photo"
            disabled={disabled}
            onClick={() => onChange(files.filter((_, j) => j !== i))}
            className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white"
          >
            <IconX className="size-3.5" />
          </button>
        </span>
      ))}
      {files.length < CLAIM_MAX_IMAGES && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => input.current?.click()}
          aria-label="Ajouter des photos"
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl bg-page text-muted-foreground text-sm transition-colors hover:text-foreground",
            compact ? "size-12" : "h-20 px-5",
          )}
        >
          <IconPhotoPlus className="size-5" />
          {!compact && "Ajouter des photos"}
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept={CLAIM_IMAGE_ACCEPT}
        multiple
        hidden
        onChange={(e) => {
          add(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
