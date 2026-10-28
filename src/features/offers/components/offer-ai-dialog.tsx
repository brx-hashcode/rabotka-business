"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconInfoCircle, IconLoader2, IconRefresh, IconWand } from "@tabler/icons-react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "#/components/ui/dialog";
import { Textarea } from "#/components/ui/textarea";
import { draftOffer, mySubscriptionKey } from "#/lib/api/business-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import type { OfferDraft, OfferDraftInput } from "#/lib/api/types";

const EXAMPLES = [
  "2 serveurs pour un mariage samedi soir à Pointe-Noire, 15 000 FCFA chacun",
  "Un agent d'entretien pour nos bureaux, 3 matinées par semaine",
  "Un chauffeur-livreur avec permis B pour nos livraisons en ville",
];

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
            <DialogTitle className="font-semibold text-xl">Rédiger avec l&apos;IA</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Décrivez le besoin en quelques mots : l&apos;IA rédige l&apos;intitulé et la description, et propose le métier. Vous
              relisez avant de publier.
            </DialogDescription>
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
              {friendlyError(write.error, "La rédaction n'a pas abouti. Réessayez dans un instant.")}
            </p>
          )}

          {draft && (
            <div className="space-y-3 rounded-2xl bg-page p-4">
              <p className="font-semibold">{draft.title}</p>
              <p className="whitespace-pre-line text-sm leading-relaxed">{draft.description}</p>
              {draft.categoryName && (
                <p className="text-muted-foreground text-xs">
                  Métier proposé : <span className="font-medium text-foreground">{draft.categoryName}</span>
                </p>
              )}
              {draft.removed.length > 0 && (
                <p className="flex gap-2 rounded-xl bg-chip-amber/60 px-3 py-2 text-chip-amber-foreground text-xs">
                  <IconInfoCircle className="mt-px size-4 shrink-0" />
                  <span>
                    Retiré de l&apos;offre : {draft.removed.join(", ")}. Ces critères écartent des candidats pour des raisons sans
                    rapport avec le poste.
                  </span>
                </p>
              )}
            </div>
          )}

          {left !== undefined && left !== null && (
            <p className="text-muted-foreground text-xs">
              {left === 0
                ? "C'était la dernière rédaction incluse dans votre formule pour cette période."
                : `${left} rédaction${left > 1 ? "s" : ""} restante${left > 1 ? "s" : ""} pour cette période.`}
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
                {write.isPending ? <IconLoader2 className="size-4 animate-spin" /> : <IconRefresh className="size-4" />}
                Autre version
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
                Utiliser cette offre
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="h-12 flex-1 rounded-full bg-page font-medium hover:bg-page/70"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={write.isPending || brief.trim().length < 3}
                onClick={() => write.mutate()}
                className="inline-flex h-12 flex-[2] items-center justify-center gap-2 rounded-full bg-ink font-medium text-white hover:bg-ink/90 disabled:opacity-40"
              >
                {write.isPending ? <IconLoader2 className="size-4 animate-spin" /> : <IconWand className="size-4" />}
                {write.isPending ? "Rédaction…" : "Rédiger"}
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
