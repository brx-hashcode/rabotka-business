"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconInfoCircle, IconListCheck, IconRefresh, IconWand } from "@tabler/icons-react";
import { Loader } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "#/components/ui/dialog";
import { Textarea } from "#/components/ui/textarea";
import { draftOffer, mySubscriptionKey } from "#/lib/api/business-controller";
import { useFriendlyError } from "#/lib/api/use-friendly-error";
import type { OfferDraft, OfferDraftInput } from "#/lib/api/types";


/**
 * « Rédiger avec l'IA »: a few words in, an offer out, in the form's shape.
 * Nothing is saved here: « Utiliser cette offre » fills the form, which the
 * business then reads, edits and publishes.
 */
export function OfferAiDialog({
  open,
  onOpenChange,
  context,
  onUse,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What the form already says, given to the AI along with the words. */
  context: Omit<OfferDraftInput, "brief">;
  onUse: (draft: OfferDraft) => void;
}>) {
  const queryClient = useQueryClient();
  const t = useTranslations("offers.ai");
  const friendlyError = useFriendlyError();
  const EXAMPLES = t.raw("examples") as string[];
  const [brief, setBrief] = useState(context.title ?? "");
  const write = useMutation({
    mutationFn: () => draftOffer({ ...context, brief: brief.trim() }),
    // The drafts left are part of the plan's figures.
    onSettled: () => void queryClient.invalidateQueries({ queryKey: mySubscriptionKey }),
  });
  const draft = write.data;
  const left = draft?.remaining;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) write.reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="w-[calc(100vw-2rem)] max-w-xl gap-0 overflow-hidden rounded-3xl border-0 bg-card p-0 shadow-soft">
        <div className="max-h-[85svh] space-y-5 overflow-y-auto px-6 pt-6 pb-2">
          <div className="space-y-1">
            <DialogTitle className="font-semibold text-xl">{t("title")}</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">{t("text")}</DialogDescription>
          </div>

          <div className="space-y-2">
            <Textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={3}
              maxLength={1500}
              autoFocus
              placeholder={EXAMPLES[0]}
              className="min-h-24 rounded-xl border-0 bg-page px-4 py-3 text-base shadow-none md:text-[15px]"
            />
            {!draft && !brief.trim() && (
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setBrief(e)}
                    className="rounded-full bg-page px-3 py-1.5 text-left text-muted-foreground text-xs hover:text-foreground"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          {write.isError && (
            <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-destructive text-sm">
              {friendlyError(write.error, t("failed"))}
            </p>
          )}

          {draft && (
            <div className="space-y-3 rounded-2xl bg-page p-4">
              <p className="font-semibold">{draft.title}</p>
              <p className="whitespace-pre-line text-sm leading-relaxed">{draft.description}</p>
              {draft.categoryName && (
                <p className="text-muted-foreground text-xs">
                  {t("trade")} <span className="font-medium text-foreground">{draft.categoryName}</span>
                </p>
              )}
              {!!draft.toConfirm?.length && (
                <div className="flex gap-2 rounded-xl bg-card px-3 py-2 text-xs">
                  <IconListCheck className="mt-px size-4 shrink-0 text-whatsapp-dark" />
                  <span>
                    <span className="font-medium">{t("toConfirm")}</span>{" "}
                    <span className="text-muted-foreground">{t("toConfirmText", { items: draft.toConfirm.join(", ") })}</span>
                  </span>
                </div>
              )}
              {draft.removed.length > 0 && (
                <p className="flex gap-2 rounded-xl bg-chip-amber/60 px-3 py-2 text-chip-amber-foreground text-xs">
                  <IconInfoCircle className="mt-px size-4 shrink-0" />
                  <span>{t("removed", { items: draft.removed.join(", ") })}</span>
                </p>
              )}
            </div>
          )}

          {left !== undefined && left !== null && (
            <p className="text-muted-foreground text-xs">
              {left === 0 ? t("lastOne") : t("left", { count: left })}
            </p>
          )}
        </div>

        <div className="flex gap-2 px-6 pt-3 pb-6">
          {draft ? (
            <>
              <button
                type="button"
                disabled={write.isPending || left === 0 || brief.trim().length < 3}
                onClick={() => write.mutate()}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-page font-medium hover:bg-page/70 disabled:opacity-40"
              >
                {write.isPending ? <Loader className="size-4 animate-spin" /> : <IconRefresh className="size-4" />}
                {t("again")}
              </button>
              <button
                type="button"
                onClick={() => {
                  onUse(draft);
                  write.reset();
                  onOpenChange(false);
                }}
                className="h-12 flex-[2] rounded-full bg-ink font-medium text-white hover:bg-ink/90"
              >
                {t("use")}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="h-12 flex-1 rounded-full bg-page font-medium hover:bg-page/70"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                disabled={write.isPending || brief.trim().length < 3}
                onClick={() => write.mutate()}
                className="inline-flex h-12 flex-[2] items-center justify-center gap-2 rounded-full bg-ink font-medium text-white hover:bg-ink/90 disabled:opacity-40"
              >
                {write.isPending ? <Loader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
                {write.isPending ? t("writing") : t("write")}
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
