"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  IconAlertTriangle,
  IconCalendarMonth,
  IconCheck,
  IconCircleCheckFilled,
  IconFileText,
  IconMicrophone,
  IconNotes,
  IconPlayerStopFilled,
  IconRefresh,
} from "@tabler/icons-react";

import { Button } from "#/components/ui/button";
import { Textarea } from "#/components/ui/textarea";
import { useDictation } from "#/features/interviews/use-dictation";
import { useVideoPlan } from "#/features/interviews/use-video-plan";
import { INTL_LOCALE, type Locale } from "#/i18n/config";
import type { Translator } from "#/i18n/translator";
import { useFriendlyError } from "#/lib/api/use-friendly-error";
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
export function untilText(at: string, now: number, t: Translator<"interviews.ended">): string {
  const s = Math.max(0, Math.round((new Date(at).getTime() - now) / 1000));
  if (s < 60) return t("inSeconds", { s });
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return rest ? t("inMinutesSeconds", { m, s: String(rest).padStart(2, "0") }) : t("inMinutes", { m });
}

/** The server's wait after the call, for the bar (AFTER_CALL_DELAY_MS there). */
const WAIT_MS = 2 * 60_000;

/** How far the wait is, 0 to 1. */
export function waitProgress(at: string, now: number): number {
  const left = new Date(at).getTime() - now;
  return Math.min(1, Math.max(0, 1 - left / WAIT_MS));
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
  jobTitle,
  endedAt,
  onOpenReport,
}: Readonly<{ interviewId: string; candidateName: string; jobTitle: string; endedAt?: string | null; onOpenReport: () => void }>) {
  const queryClient = useQueryClient();
  const tr = useTranslations("interviews.ended");
  const locale = useLocale() as Locale;
  const friendlyError = useFriendlyError();
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
    onError: (err) => toast.error(friendlyError(err, tr("startFailed"))),
  });

  // The countdown, while it waits.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (stage !== "waiting") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [stage]);

  let noteState: "noteOptional" | "saving" | "changed" | "saved" = "noteOptional";
  if (save.isPending) noteState = "saving";
  else if (draft !== null && draft !== saved?.notes) noteState = "changed";
  else if (notes) noteState = "saved";
  const endedTime = endedAt ? new Date(endedAt).toLocaleTimeString(INTL_LOCALE[locale], { hour: "2-digit", minute: "2-digit" }) : null;

  return (
    <div className="flex size-full justify-center overflow-y-auto px-4 py-8 sm:items-center sm:py-10">
      <div className="w-full max-w-lg space-y-4">
        <header className="space-y-3 pb-2 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-whatsapp/12 text-whatsapp">
            <IconCheck className="size-6" stroke={2.5} />
          </span>
          <div className="space-y-1">
            <h2 className="font-semibold text-xl tracking-tight">{tr("title")}</h2>
            <p className="text-muted-foreground text-sm">
              {candidateName} · {jobTitle}
              {endedTime && ` · ${endedTime}`}
            </p>
          </div>
        </header>

        <ReportCard
          stage={stage}
          report={saved}
          scheduledFor={saved?.scheduledFor ?? null}
          now={now}
          addedSinceReport={addedSinceReport}
          pending={write.isPending}
          onWrite={() => write.mutate()}
          onOpen={onOpenReport}
        />

        {/* One note, written or spoken: the microphone sits in it, as in a message. */}
        <section className="overflow-hidden rounded-2xl bg-page">
          <div className="flex items-center gap-2 px-4 pt-3.5">
            <IconNotes className="size-4 text-muted-foreground" />
            <h3 className="font-medium text-sm">{tr("note")}</h3>
          </div>
          <Textarea
            value={notes}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_NOTES))}
            placeholder={tr("notePlaceholder")}
            className="min-h-24 resize-none rounded-none border-0 bg-transparent px-4 pt-2 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          {dictation.listening ? (
            <div className="space-y-2 px-3 pb-3" role="status" aria-live="polite">
              <p className={cn("line-clamp-2 min-h-5 px-1 text-sm", dictation.interim ? "text-foreground/70" : "text-muted-foreground italic")}>
                {dictation.interim || tr("listening")}
              </p>
              <div className="flex items-center gap-3 rounded-full bg-card py-1 pr-1 pl-3">
                <span className="relative flex size-2.5 shrink-0">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive/60" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-destructive" />
                </span>
                <Elapsed since={dictation.startedAt} />
                <LiveWaveform analyser={dictation.analyser} />
                <button
                  type="button"
                  aria-label={tr("stopDictation")}
                  title={tr("stopDictation")}
                  onClick={dictation.stop}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive text-white transition-transform hover:scale-105"
                >
                  <IconPlayerStopFilled className="size-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 py-2.5 pr-2.5 pl-4">
              <span className="flex items-center gap-1 text-muted-foreground text-xs" aria-live="polite">
                {noteState === "saved" && <IconCheck className="size-3.5" />}
                {tr(noteState)}
              </span>
              {dictation.supported && (
                <button
                  type="button"
                  onClick={() => void dictation.start()}
                  className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-card px-4 text-sm transition-colors hover:bg-card/70"
                >
                  <IconMicrophone className="size-4" />
                  {tr("dictate")}
                </button>
              )}
            </div>
          )}
        </section>

        {/* Done here: back to the calendar. The note is already saved, the report follows by e-mail. */}
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            className="h-11 rounded-full bg-page px-5 text-sm sm:h-11"
            render={<Link href="/espace/entretiens" />}
            onClick={() => {
              // Typed a second ago and not saved yet: saved on the way out.
              if (draft !== null && draft !== saved?.notes) void saveInterviewNotes(interviewId, draft).catch(() => undefined);
            }}
          >
            <IconCalendarMonth className="size-4" />
            {tr("back")}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** The report's card: what it is, where it stands, the one action that fits, and how far along. */
function ReportCard({
  stage,
  report,
  scheduledFor,
  now,
  addedSinceReport,
  pending,
  onWrite,
  onOpen,
}: Readonly<{
  stage: ReportStage;
  report: InterviewReport | undefined;
  scheduledFor: string | null;
  now: number;
  addedSinceReport: boolean;
  pending: boolean;
  onWrite: () => void;
  onOpen: () => void;
}>) {
  const tr = useTranslations("interviews.ended");
  let title = tr("report");
  let line: string;
  let action: React.ReactNode = null;
  const ghost = "h-9 shrink-0 rounded-full bg-card px-4 text-sm sm:h-9";
  const primary = "h-9 shrink-0 rounded-full px-4 text-sm sm:h-9";
  switch (stage) {
    case "locked":
      line = tr("locked");
      break;
    case "waiting":
      line = tr("waiting", { when: scheduledFor ? untilText(scheduledFor, now, tr) : tr("shortly") });
      action = (
        <Button type="button" variant="ghost" className={ghost} loading={pending} onClick={onWrite}>
          {tr("writeNow")}
        </Button>
      );
      break;
    case "writing":
      line = tr("writing");
      break;
    case "ready":
      title = tr("ready");
      line = addedSinceReport ? tr("noteMissing") : tr("emailed");
      action = (
        <div className="flex shrink-0 gap-2">
          {addedSinceReport && (
            <Button type="button" variant="ghost" className={ghost} loading={pending} onClick={onWrite}>
              <IconRefresh className="size-4" />
              {tr("update")}
            </Button>
          )}
          <Button type="button" className={primary} onClick={onOpen}>
            {tr("read")}
          </Button>
        </div>
      );
      break;
    case "failed":
      title = tr("failed");
      line = report?.writingError ?? tr("failedLine");
      action = (
        <Button type="button" variant="ghost" className={ghost} loading={pending} onClick={onWrite}>
          {tr("retry")}
        </Button>
      );
      break;
    default:
      line = tr("notEnough");
      action = (
        <Button type="button" variant="ghost" className={ghost} loading={pending} onClick={onWrite}>
          {tr("write")}
        </Button>
      );
  }
  let icon = <IconFileText className="size-5 text-muted-foreground" />;
  if (stage === "ready") icon = <IconCircleCheckFilled className="size-5 text-whatsapp" />;
  if (stage === "failed") icon = <IconAlertTriangle className="size-5 text-destructive" />;

  return (
    <section className="overflow-hidden rounded-2xl bg-page">
      <div className="flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card">{icon}</span>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="font-medium text-sm">{title}</p>
          <p className="text-muted-foreground text-xs leading-relaxed">{line}</p>
          {(stage === "waiting" || stage === "writing") && (
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-card" role="progressbar" aria-label={tr("progress")}>
              <div
                className={cn("h-full rounded-full bg-whatsapp transition-[width] duration-1000 ease-linear", stage === "writing" && "w-full animate-pulse")}
                style={stage === "waiting" && scheduledFor ? { width: `${Math.round(waitProgress(scheduledFor, now) * 100)}%` } : undefined}
              />
            </div>
          )}
        </div>
        {/* On a phone the action goes under the text, lined up with it. */}
        {action && <div className="w-full pl-13 sm:w-auto sm:pl-0">{action}</div>}
      </div>
    </section>
  );
}
