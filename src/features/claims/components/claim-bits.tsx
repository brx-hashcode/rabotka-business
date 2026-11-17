"use client";

import { useTranslations } from "next-intl";
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
import type { Translator } from "#/i18n/translator";
import { cn } from "#/lib/utils";

/**
 * What the request is about: the team reads it first, in the title. `inTitle`
 * is what the title is written with, in French whatever the screen's language
 * (the Rabotka team reads it, and old titles are told by it); what the screen
 * shows is the `claims.topics` messages.
 */
export const TOPICS = [
  { value: "candidate", inTitle: "Candidat ou mission", icon: IconUserExclamation },
  { value: "payment", inTitle: "Paiement ou facture", icon: IconReceipt },
  { value: "plan", inTitle: "Abonnement", icon: IconCreditCard },
  { value: "account", inTitle: "Compte et documents", icon: IconFileCertificate },
  { value: "bug", inTitle: "Problème technique", icon: IconBug },
  { value: "other", inTitle: "Autre", icon: IconMessageQuestion },
] as const;
export type Topic = (typeof TOPICS)[number]["value"];

/**
 * The topic and the subject, out of a title written as « Topic — subject »;
 * a title from elsewhere (the client app, the demo) has no topic.
 */
export function splitTitle(title: string): { topic: { value: Topic; icon: TablerIcon } | null; subject: string } {
  const at = title.indexOf(" — ");
  if (at > 0) {
    const label = title.slice(0, at);
    const topic = TOPICS.find((t) => t.inTitle === label);
    if (topic) return { topic, subject: title.slice(at + 3).trim() || title };
  }
  return { topic: null, subject: title };
}

/** A claim's title as the screen says it: the topic in the reader's language. */
export function displayTitle(title: string, t: Translator<"claims">): string {
  const { topic, subject } = splitTitle(title);
  return topic ? `${t(`topics.${topic.value}.label`)} — ${subject}` : title;
}

export const CLAIM_STATUS: Record<ClaimStatus, string> = {
  CREATED: "bg-chip-amber text-chip-amber-foreground",
  IN_PROGRESS: "bg-chip-violet text-chip-violet-foreground",
  COMPLETED: "bg-chip-green text-chip-green-foreground",
  REJECTED: "bg-page text-muted-foreground",
};

export const isClosed = (s: ClaimStatus) => s === "COMPLETED" || s === "REJECTED";

export function StatusPill({ status }: Readonly<{ status: ClaimStatus }>) {
  const t = useTranslations("claims.status");
  const known = status in CLAIM_STATUS;
  return (
    <span className={cn("shrink-0 rounded-full px-2.5 py-1 font-medium text-xs", known ? CLAIM_STATUS[status] : "bg-page")}>
      {known ? t(status) : status}
    </span>
  );
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
  const t = useTranslations("claims.photos");
  const input = useRef<HTMLInputElement>(null);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  function add(list: FileList | null) {
    if (!list) return;
    const next = [...files];
    for (const f of Array.from(list)) {
      if (!CLAIM_IMAGE_ACCEPT.split(",").includes(f.type)) {
        toast.error(t("wrongType", { name: f.name }));
      } else if (f.size > CLAIM_IMAGE_MAX_BYTES) {
        toast.error(t("tooBig", { name: f.name }));
      } else if (next.length >= CLAIM_MAX_IMAGES) {
        toast.error(t("tooMany", { max: CLAIM_MAX_IMAGES }));
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
            aria-label={t("remove")}
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
          aria-label={t("add")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl bg-page text-muted-foreground text-sm transition-colors hover:text-foreground",
            compact ? "size-12" : "h-20 px-5",
          )}
        >
          <IconPhotoPlus className="size-5" />
          {!compact && t("add")}
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
