"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconCalendarEvent, IconExternalLink } from "@tabler/icons-react";
import { toast } from "sonner";

import { ActionDialog } from "#/components/action-dialog";
import { ClaimRowsSkeleton } from "#/components/page-skeletons";
import { friendlyError } from "#/lib/api/friendly-error";
import { cancelInterview, interviewsKey, listInterviews } from "#/lib/api/interview-controller";
import type { Interview } from "#/lib/api/types";
import { cn } from "#/lib/utils";
import { MODES, StatusChip, modeLabel } from "./interview-bits";
import { ScheduleInterviewDialog } from "./schedule-interview-dialog";

const TABS = [
  { key: "upcoming", label: "À venir" },
  { key: "past", label: "Passés" },
] as const;

/** « Aujourd'hui », « Demain », or the date: how a day reads in an agenda. */
function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === tomorrow.toDateString()) return "Demain";
  const label = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const time = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

/** The business's interviews, by day: who, when, how, and what the candidate answered. */
export function InterviewsPage() {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const query = useQuery({ queryKey: [...interviewsKey, tab], queryFn: () => listInterviews({ scope: tab }) });
  const items = query.data ?? [];

  const days: { label: string; items: Interview[] }[] = [];
  for (const i of items) {
    const label = dayLabel(i.startsAt);
    const last = days[days.length - 1];
    if (last?.label === label) last.items.push(i);
    else days.push({ label, items: [i] });
  }

  return (
    <div className="w-full space-y-6 pt-2">
      <div className="space-y-1.5">
        <h1 className="font-semibold text-3xl tracking-tight">Entretiens</h1>
        <p className="text-muted-foreground">
          Les entretiens proposés à vos candidats, et leurs réponses. Planifiez-en depuis une analyse de CV ou une candidature.
        </p>
      </div>

      <section className="space-y-5 rounded-3xl bg-card p-6">
        <div role="tablist" aria-label="Période" className="inline-flex rounded-full bg-page p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "rounded-full px-4 py-1.5 font-medium text-sm",
                tab === t.key ? "bg-brand-lime text-[#0f2414]" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {query.isLoading ? (
          <ClaimRowsSkeleton />
        ) : !query.data ? (
          <p className="text-muted-foreground">{friendlyError(query.error, "Vos entretiens sont indisponibles pour le moment.")}</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-page px-6 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-card">
              <IconCalendarEvent className="size-6 text-muted-foreground" />
            </span>
            <p className="font-medium">{tab === "upcoming" ? "Aucun entretien prévu" : "Aucun entretien passé"}</p>
            {tab === "upcoming" && (
              <p className="max-w-sm text-muted-foreground text-sm">
                Depuis une{" "}
                <Link href="/espace/analyse-cv" className="font-medium text-foreground underline underline-offset-2">
                  analyse de CV
                </Link>{" "}
                ou une{" "}
                <Link href="/espace/candidatures" className="font-medium text-foreground underline underline-offset-2">
                  candidature
                </Link>
                , « Planifier un entretien » envoie l&apos;invitation au candidat.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {days.map((day) => (
              <div key={day.label} className="space-y-2.5">
                <h2 className="font-semibold text-sm">{day.label}</h2>
                <ul className="space-y-2.5">
                  {day.items.map((i) => (
                    <InterviewRow key={i.id} interview={i} past={tab === "past"} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function InterviewRow({ interview: i, past }: Readonly<{ interview: Interview; past: boolean }>) {
  const queryClient = useQueryClient();
  const [moving, setMoving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const cancel = useMutation({
    mutationFn: () => cancelInterview(i.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: interviewsKey });
      toast.success(`Entretien annulé : ${i.candidateName} est prévenu.`);
      setConfirm(false);
    },
    onError: (err) => toast.error(friendlyError(err, "L'entretien n'a pas pu être annulé.")),
  });
  const Mode = MODES.find((m) => m.key === i.mode)?.icon ?? IconCalendarEvent;
  const cancelled = i.status === "CANCELLED";

  return (
    <li className={cn("flex flex-col gap-4 rounded-2xl bg-page p-4 sm:flex-row sm:items-start", cancelled && "opacity-60")}>
      <div className="flex shrink-0 items-baseline gap-2 sm:w-24 sm:flex-col sm:gap-0.5">
        <span className="font-semibold text-xl tabular-nums">{time(i.startsAt)}</span>
        <span className="text-muted-foreground text-xs">{i.durationMinutes} min</span>
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{i.candidateName}</p>
          <StatusChip status={i.status} />
        </div>
        <p className="text-muted-foreground text-sm">
          {i.applicationId ? (
            <Link href={`/espace/candidatures?candidature=${i.applicationId}`} className="hover:underline">
              {i.jobTitle}
            </Link>
          ) : (
            i.jobTitle
          )}
        </p>
        <p className="flex items-center gap-1.5 text-sm">
          <Mode className="size-4 shrink-0 text-muted-foreground" />
          {i.mode === "VIDEO" && i.location ? (
            <a href={i.location} target="_blank" rel="noreferrer" className="inline-flex min-w-0 items-center gap-1 font-medium hover:underline">
              <span className="truncate">Rejoindre la visio</span>
              <IconExternalLink className="size-3.5 shrink-0" />
            </a>
          ) : (
            <span className="min-w-0 truncate">{modeLabel(i)}</span>
          )}
        </p>
        {i.responseNote && (
          <p className="rounded-xl bg-card px-3 py-2 text-sm">
            <span className="text-muted-foreground">Message du candidat : </span>
            {i.responseNote}
          </p>
        )}
      </div>

      {!past && !cancelled && (
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => setMoving(true)} className="h-10 rounded-full bg-card px-4 font-medium text-sm hover:bg-card/70">
            Déplacer
          </button>
          <button
            type="button"
            onClick={() => setConfirm(true)}
            className="h-10 rounded-full bg-card px-4 font-medium text-muted-foreground text-sm hover:bg-card/70 hover:text-destructive"
          >
            Annuler
          </button>
        </div>
      )}

      {moving && (
        <ScheduleInterviewDialog
          open={moving}
          onOpenChange={setMoving}
          candidate={{ name: i.candidateName, cvResumeId: i.cvResumeId ?? undefined, applicationId: i.applicationId ?? undefined }}
          jobTitle={i.jobTitle}
          existing={i}
        />
      )}
      <ActionDialog
        open={confirm}
        onOpenChange={setConfirm}
        tone="warning"
        title={`Annuler l'entretien avec ${i.candidateName} ?`}
        description="Le candidat est prévenu par e-mail, et l'entretien est retiré de son agenda."
        confirmLabel="Annuler l'entretien"
        onConfirm={() => cancel.mutate()}
        pending={cancel.isPending}
      />
    </li>
  );
}
