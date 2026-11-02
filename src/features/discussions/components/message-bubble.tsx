"use client";

import { useState } from "react";
import { IconAlertTriangle, IconBan, IconCheck, IconChecks, IconFlag, IconTrash } from "@tabler/icons-react";

import type { DiscussionMessage } from "#/lib/api/discussions-controller";
import { cn } from "#/lib/utils";
import { discussionsContent } from "../content";
import { redactionSegments } from "../redaction-segments";

const time = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

/**
 * One message, as the client app draws it: the other side's text arrives
 * already masked by the server; the author's own shows, struck through in
 * place, what did not go through — and may say it was a mistake. A message
 * taken back is a tombstone, not a gap.
 */
export function MessageBubble({
  message,
  firstOfGroup,
  showRecipientNotice,
  onReport,
  onDelete,
}: Readonly<{
  message: DiscussionMessage;
  firstOfGroup: boolean;
  /** Only under the thread's first hole: the rule is said once. */
  showRecipientNotice: boolean;
  onReport: (messageId: string) => void;
  onDelete: (message: DiscussionMessage) => void;
}>) {
  const deleted = message.deletedAt !== null;
  const held = message.status === "HELD";
  const mine = message.mine;
  const warning = discussionsContent.warning;

  return (
    <div className={cn("group flex w-full flex-col", mine ? "items-end" : "items-start", firstOfGroup ? "mt-4" : "mt-1")}>
      <div className={cn("flex max-w-[78%] items-center gap-1.5", mine && "flex-row-reverse")}>
        <div
          className={cn(
            "relative min-w-0 rounded-2xl px-3.5 pt-2 pb-1.5",
            mine ? "bg-brand-lime text-[#0f2414]" : "bg-page text-foreground",
            firstOfGroup && (mine ? "rounded-tr-md" : "rounded-tl-md"),
            held && "opacity-70",
            deleted && "bg-page/70",
          )}
        >
          {deleted ? (
            <p className="flex items-center gap-1.5 text-muted-foreground text-sm italic">
              <IconBan className="size-3.5 shrink-0" />
              {discussionsContent.thread.deleted}
            </p>
          ) : (
            <p className="whitespace-pre-wrap break-words text-[15px] leading-snug">
              {redactionSegments(message.body, message.redactions).map((s, i) =>
                s.withheld ? (
                  // Readable to its author, struck through where it was: they see which number did not go.
                  <span key={i} className="rounded bg-destructive/15 px-0.5 line-through decoration-destructive/60">
                    {s.text}
                  </span>
                ) : (
                  <span key={i}>{s.text}</span>
                ),
              )}
            </p>
          )}
          <p
            className={cn(
              "mt-0.5 flex items-center justify-end gap-1 text-[11px] tabular-nums",
              mine ? "text-[#0f2414]/60" : "text-muted-foreground",
            )}
          >
            {time(message.createdAt)}
            {/* Ticks on the author's side only, and none on what never arrived or is gone. */}
            {mine && !held && !deleted && (message.readAt ? <IconChecks className="size-3.5 text-sky-600" /> : <IconCheck className="size-3.5" />)}
          </p>
        </div>
        {mine && !deleted && (
          <button
            type="button"
            onClick={() => onDelete(message)}
            aria-label={discussionsContent.thread.actionsDelete}
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:bg-page hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
          >
            <IconTrash className="size-4" />
          </button>
        )}
      </div>

      {mine && !deleted && (held || message.redactions.length > 0) && (
        <AuthorNotice held={held} reported={message.reported} onReport={() => onReport(message.id)} />
      )}
      {!mine && showRecipientNotice && <p className="mt-1 max-w-[78%] text-muted-foreground text-xs">{warning.recipient}</p>}
    </div>
  );
}

/** Under the author's message that did not go through whole: the rule, and a way to contest it (two clicks). */
function AuthorNotice({ held, reported, onReport }: Readonly<{ held: boolean; reported: boolean; onReport: () => void }>) {
  const [confirming, setConfirming] = useState(false);
  const warning = discussionsContent.warning;
  return (
    <div className="mt-1 max-w-[78%] space-y-0.5 text-right">
      <p className="flex items-start justify-end gap-1.5 text-muted-foreground text-xs">
        <IconAlertTriangle className="mt-px size-3.5 shrink-0 text-destructive/70" />
        <span>{held ? warning.held : warning.sender}</span>
      </p>
      {reported ? (
        <p className="text-muted-foreground text-xs">{warning.reportDone}</p>
      ) : (
        <button
          type="button"
          onClick={() => (confirming ? onReport() : setConfirming(true))}
          className="inline-flex items-center gap-1 text-muted-foreground text-xs underline underline-offset-2"
        >
          <IconFlag className="size-3.5" />
          {confirming ? warning.reportConfirm : warning.reportCta}
        </button>
      )}
    </div>
  );
}
