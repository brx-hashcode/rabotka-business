"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  IconAlertTriangle,
  IconCheck,
  IconCircleCheckFilled,
  IconFileText,
  IconMicrophone,
  IconPlayerStopFilled,
  IconRefresh,
} from "@tabler/icons-react";

import { Button } from "#/components/ui/button";
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

const MAX_NOTES = 8000;

/** Where the report stands, from the server's view of it. */
export type ReportStage = "locked" | "waiting" | "writing" | "ready" | "failed" | "none";

export function reportStage(r: InterviewReport | undefined, planAllowed: boolean): ReportStage {
  if (r?.report && !r.writing) return "ready";
  if (r?.scheduledFor) return "waiting";
  if (r?.writing) return "writing";
  if (!planAllowed) return "locked";
  if (r?.writingError) return "failed";
  return "none";
}

/** « dans 1 min 30 »: what is left before the report writes itself. */
export function untilText(at: string, now: number): string {
  const s = Math.max(0, Math.round((new Date(at).getTime() - now) / 1000));
  if (s < 60) return `dans ${s} s`;
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return rest ? `dans ${m} min ${String(rest).padStart(2, "0")}` : `dans ${m} min`;
}

/**
 * Where the call was, once « Terminer » ended it: done, the report on its
 * way by itself (« Votre compte rendu est prêt » follows by notification and
 * e-mail), and a note to add if the business wants to, spoken or typed,
 * saved as it goes. Nothing to answer, nothing to lose by leaving.
 */
export function CallEnded({
  interviewId,
  candidateName,
  onOpenReport,
}: Readonly<{ interviewId: string; candidateName: string; onOpenReport: () => void }>) {
  const queryClient = useQueryClient();
  const key = interviewReportKey(interviewId);
  const videoPlan = useVideoPlan();
  const query = useQuery({
    queryKey: key,
    queryFn: () => getInterviewReport(interviewId),
    // Waiting or being written: looked at again until it is there (the bell tells too).
    refetchInterval: (q) => (q.state.data?.writing ? 3000 : false),
  });
  const saved = query.data;
  const stage = reportStage(saved, videoPlan.allowed);

  // The notes, saved a second after the last keystroke or dictated phrase.
  const [draft, setDraft] = useState<string | null>(null);
  const notes = draft ?? saved?.notes ?? "";
  // A note added once the report was written: it can be written again with it.
  const [addedSinceReport, setAddedSinceReport] = useState(false);
  const save = useMutation({
    mutationFn: (text: string) => saveInterviewNotes(interviewId, text),
    onSuccess: (data) => {
      queryClient.setQueryData(key, data);
      if (data.generatedAt) setAddedSinceReport(true);
    },
  });
  useEffect(() => {
    if (draft === null || draft === saved?.notes) return;
    const t = setTimeout(() => save.mutate(draft), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the text decides
  }, [draft]);
  const dictation = useDictation((text) => setDraft((d) => joinText(d ?? saved?.notes ?? "", text).slice(0, MAX_NOTES)));

  const write = useMutation({
    mutationFn: async () => {
      // Written from the notes on screen, even typed a second ago.
      if (draft !== null && draft !== saved?.notes) await saveInterviewNotes(interviewId, draft);
      return writeInterviewReport(interviewId);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(key, data);
      setAddedSinceReport(false);
      void queryClient.invalidateQueries({ queryKey: interviewsKey });
    },
    onError: (err) => toast.error(friendlyError(err, "Le compte rendu n'a pas pu être lancé.")),
  });

  // The countdown, while it waits.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (stage !== "waiting") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [stage]);

  const status = save.isPending ? "Enregistrement…" : draft !== null && draft !== saved?.notes ? "Modifié" : saved?.updatedAt && notes ? "Enregistré" : "";

  return (
    <div className="flex size-full items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-8">
      <div className="w-full max-w-xl space-y-6">
        <div className="space-y-1">
          <p className="flex items-center gap-2 font-semibold text-lg">
            <IconCircleCheckFilled className="size-5 text-whatsapp" />
            Entretien terminé
          </p>
          <p className="text-muted-foreground text-sm">Avec {candidateName}. Son lien n&apos;ouvre plus la visio.</p>
        </div>

        <ReportStatus
          stage={stage}
          report={saved}
          until={saved?.scheduledFor ? untilText(saved.scheduledFor, now) : ""}
          addedSinceReport={addedSinceReport}
          pending={write.isPending}
          onWrite={() => write.mutate()}
          onOpen={onOpenReport}
        />

        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-semibold text-sm">Une note à ajouter ?</h2>
            <span className="flex items-center gap-1 text-muted-foreground text-xs" aria-live="polite">
              {status === "Enregistré" && <IconCheck className="size-3.5" />}
              {status}
            </span>
          </div>

          {dictation.listening ? (
            <div className="space-y-2 rounded-2xl bg-page p-3" role="status" aria-live="polite">
              <div className="flex items-center gap-3 rounded-full bg-card py-1 pr-1 pl-3">
                <span className="relative flex size-2.5 shrink-0">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive/60" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-destructive" />
                </span>
                <Elapsed since={dictation.startedAt} />
                <LiveWaveform analyser={dictation.analyser} />
                <button
                  type="button"
                  aria-label="Arrêter l'enregistrement"
                  title="Arrêter l'enregistrement"
                  onClick={dictation.stop}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive text-white transition-transform hover:scale-105"
                >
                  <IconPlayerStopFilled className="size-3.5" />
                </button>
              </div>
              <p className={cn("line-clamp-2 min-h-5 px-1 text-sm", dictation.interim ? "text-foreground/70" : "text-muted-foreground italic")}>
                {dictation.interim || "Je vous écoute… vos phrases s'ajoutent à la note."}
              </p>
            </div>
          ) : (
            dictation.supported && (
              <Button type="button" className="h-12 w-full rounded-full text-sm sm:h-12" onClick={() => void dictation.start()}>
                <IconMicrophone className="size-4" />
                Enregistrer une note vocale
              </Button>
            )
          )}

          <Textarea
            value={notes}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_NOTES))}
            placeholder={dictation.supported ? "Ou écrivez-la : votre impression, ses disponibilités, la suite à donner…" : "Votre impression, ses disponibilités, la suite à donner…"}
            className="min-h-28 resize-none rounded-2xl border-0 bg-page px-4 py-3 shadow-none focus-visible:ring-0 dark:bg-page"
          />
        </section>
      </div>
    </div>
  );
}

/** The report's line: on its way, ready, or why not, with the one action that fits. */
function ReportStatus({
  stage,
  report,
  until,
  addedSinceReport,
  pending,
  onWrite,
  onOpen,
}: Readonly<{
  stage: ReportStage;
  report: InterviewReport | undefined;
  until: string;
  addedSinceReport: boolean;
  pending: boolean;
  onWrite: () => void;
  onOpen: () => void;
}>) {
  const box = "flex flex-col gap-3 rounded-2xl bg-page p-4 sm:flex-row sm:items-center";
  if (stage === "locked") {
    return (
      <div className={box}>
        <p className="flex-1 text-muted-foreground text-sm">Vos notes restent avec l&apos;entretien. Le compte rendu rédigé par IA est inclus dans les formules supérieures.</p>
      </div>
    );
  }
  if (stage === "ready") {
    return (
      <div className={box}>
        <div className="flex-1 space-y-0.5">
          <p className="flex items-center gap-2 font-medium text-sm">
            <IconCheck className="size-4 text-whatsapp" />
            Votre compte rendu est prêt
          </p>
          <p className="text-muted-foreground text-xs">
            {addedSinceReport ? "Votre note n'y figure pas encore : mettez-le à jour." : "Vous l'avez aussi reçu par e-mail. Relisez-le avant de l'envoyer."}
          </p>
        </div>
        <div className="flex gap-2">
          {addedSinceReport && (
            <Button type="button" variant="ghost" className="h-10 rounded-full bg-card px-4 text-sm sm:h-10" loading={pending} onClick={onWrite}>
              <IconRefresh className="size-4" />
              Mettre à jour
            </Button>
          )}
          <Button type="button" className="h-10 rounded-full px-4 text-sm sm:h-10" onClick={onOpen}>
            <IconFileText className="size-4" />
            Lire le compte rendu
          </Button>
        </div>
      </div>
    );
  }
  if (stage === "waiting" || stage === "writing") {
    return (
      <div className={box}>
        <span className="relative flex size-2.5 shrink-0 self-start sm:self-center">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-whatsapp/60" />
          <span className="relative inline-flex size-2.5 rounded-full bg-whatsapp" />
        </span>
        <div className="flex-1 space-y-0.5">
          <p className="font-medium text-sm">{stage === "waiting" ? `Compte rendu rédigé ${until}` : "Rédaction du compte rendu…"}</p>
          <p className="text-muted-foreground text-xs">
            {stage === "waiting"
              ? "Ajoutez une note d'ici là si vous le souhaitez. Vous serez prévenu par e-mail dès qu'il est prêt."
              : "Vous serez prévenu par e-mail dès qu'il est prêt : vous pouvez quitter cette page."}
          </p>
        </div>
        {stage === "waiting" && (
          <Button type="button" variant="ghost" className="h-10 rounded-full bg-card px-4 text-sm sm:h-10" loading={pending} onClick={onWrite}>
            Rédiger maintenant
          </Button>
        )}
      </div>
    );
  }
  return (
    <div className={box}>
      <p className="flex flex-1 items-start gap-2 text-sm">
        {stage === "failed" && <IconAlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />}
        <span className={stage === "failed" ? "" : "text-muted-foreground"}>
          {stage === "failed"
            ? (report?.writingError ?? "Le compte rendu n'a pas pu être rédigé.")
            : "Pas assez d'éléments pour un compte rendu : ajoutez une note, puis rédigez-le."}
        </span>
      </p>
      <Button type="button" className="h-10 rounded-full px-4 text-sm sm:h-10" loading={pending} onClick={onWrite}>
        {stage === "failed" ? "Réessayer" : "Rédiger le compte rendu"}
      </Button>
    </div>
  );
}
