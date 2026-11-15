"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { IconMicrophone, IconPlayerStopFilled } from "@tabler/icons-react";

import { Button } from "#/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "#/components/ui/dialog";
import { Textarea } from "#/components/ui/textarea";
import { useDictation } from "#/features/interviews/use-dictation";
import { useVideoPlan } from "#/features/interviews/use-video-plan";
import { friendlyError } from "#/lib/api/friendly-error";
import {
  getInterviewReport,
  interviewReportKey,
  interviewsKey,
  saveInterviewNotes,
  writeInterviewReport,
} from "#/lib/api/interview-controller";
import type { InterviewReport } from "#/lib/api/types";
import { cn } from "#/lib/utils";
import { Elapsed, joinText, LiveWaveform } from "./interview-report-panel";

const MAX_NOTE = 8000;

/** What finishing did: the note kept, the report started, or why not. */
type Done = { noted: boolean; writing: boolean; refused?: unknown };

/**
 * After the call, as Gemini does: one question, « Voulez-vous ajouter une
 * note ? », typed or dictated, and nothing else. Then the report is written
 * in the background from the call's transcript and the notes, and
 * « Votre compte rendu est prêt » follows (notification and e-mail).
 *
 * A report already written is not written over: « Notes et compte rendu »
 * rewrites it on demand.
 */
export function AfterCallDialog({
  interviewId,
  candidateName,
  open,
  onOpenChange,
}: Readonly<{ interviewId: string; candidateName: string; open: boolean; onOpenChange: (open: boolean) => void }>) {
  const queryClient = useQueryClient();
  const videoPlan = useVideoPlan();
  const [note, setNote] = useState("");
  const dictation = useDictation((text) => setNote((n) => joinText(n, text).slice(0, MAX_NOTE)));

  const finish = useMutation({
    mutationFn: async (withNote: boolean): Promise<Done> => {
      const text = withNote ? note.trim() : "";
      let saved: InterviewReport = await queryClient.fetchQuery({
        queryKey: interviewReportKey(interviewId),
        queryFn: () => getInterviewReport(interviewId),
      });
      if (text) {
        // Added to what the team already wrote during the call, never over it.
        saved = await saveInterviewNotes(interviewId, joinText(saved.notes, text).slice(0, MAX_NOTE));
        queryClient.setQueryData(interviewReportKey(interviewId), saved);
      }
      if (!videoPlan.allowed || saved.generatedAt || saved.writing) {
        return { noted: Boolean(text), writing: Boolean(saved.writing) };
      }
      try {
        queryClient.setQueryData(interviewReportKey(interviewId), await writeInterviewReport(interviewId));
        return { noted: Boolean(text), writing: true };
      } catch (refused) {
        return { noted: Boolean(text), writing: false, refused };
      }
    },
    onSuccess: ({ noted, writing, refused }) => {
      void queryClient.invalidateQueries({ queryKey: interviewsKey });
      dictation.stop();
      setNote("");
      onOpenChange(false);
      if (writing) {
        toast.success("Votre compte rendu est en cours de rédaction : vous serez prévenu dès qu'il est prêt.");
      } else if (refused) {
        toast(friendlyError(refused, "Le compte rendu n'a pas pu être lancé."));
      } else if (noted) {
        toast.success("Note ajoutée à l'entretien.");
      }
    },
    onError: (err) => toast.error(friendlyError(err, "Votre note n'a pas pu être enregistrée.")),
  });

  const close = (next: boolean) => {
    if (next) return;
    if (finish.isPending) return;
    // Closed without a word: as « Passer », the report still gets written.
    finish.mutate(false);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="w-[calc(100vw-2rem)] gap-5 rounded-3xl border-0 bg-card p-5 shadow-soft sm:max-w-lg sm:p-6">
        <div className="space-y-1.5 pr-8">
          <DialogTitle className="text-lg">L&apos;entretien est terminé</DialogTitle>
          <DialogDescription>
            Voulez-vous ajouter une note sur {candidateName} ?
            {videoPlan.allowed && " Le compte rendu est rédigé à partir de la visio et de vos notes : vous serez prévenu dès qu'il est prêt."}
          </DialogDescription>
        </div>

        <div className="overflow-hidden rounded-2xl bg-page">
          <Textarea
            value={note}
            autoFocus
            onChange={(e) => setNote(e.target.value.slice(0, MAX_NOTE))}
            placeholder="Votre impression, ses disponibilités, ses prétentions, la suite à donner…"
            className="min-h-32 resize-none rounded-none border-0 bg-transparent px-4 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          {dictation.listening ? (
            <div className="space-y-2 px-4 pb-3" role="status" aria-live="polite">
              <div className="flex items-center gap-3 rounded-full bg-card py-1 pr-1 pl-3">
                <span className="relative flex size-2.5 shrink-0">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive/60" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-destructive" />
                </span>
                <Elapsed since={dictation.startedAt} />
                <LiveWaveform analyser={dictation.analyser} />
                <button
                  type="button"
                  aria-label="Arrêter la dictée"
                  title="Arrêter la dictée"
                  onClick={dictation.stop}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive text-white transition-transform hover:scale-105"
                >
                  <IconPlayerStopFilled className="size-3.5" />
                </button>
              </div>
              <p className={cn("line-clamp-2 min-h-5 text-sm", dictation.interim ? "text-foreground/70" : "text-muted-foreground italic")}>
                {dictation.interim || "Je vous écoute… vos phrases s'ajoutent à la note."}
              </p>
            </div>
          ) : (
            dictation.supported && (
              <div className="px-3 pb-3">
                <Button type="button" variant="ghost" className="h-9 rounded-full bg-card px-3.5 text-sm" onClick={() => void dictation.start()}>
                  <IconMicrophone className="size-4" />
                  Dicter
                </Button>
              </div>
            )
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            className="h-11 rounded-full bg-page px-5 text-sm sm:h-11"
            disabled={finish.isPending}
            onClick={() => finish.mutate(false)}
          >
            Passer
          </Button>
          <Button
            type="button"
            className="h-11 rounded-full px-5 text-sm sm:h-11"
            disabled={!note.trim()}
            loading={finish.isPending}
            onClick={() => finish.mutate(true)}
          >
            Ajouter la note
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
