"use client";

import { useState } from "react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconCalendarEvent,
  IconCalendarPlus,
  IconCalendarRepeat,
  IconCircleCheck,
  IconExternalLink,
  IconHourglass,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { ActionDialog } from "#/components/action-dialog";
import { CardGridSkeleton, TilesSkeleton } from "#/components/page-skeletons";
import { StatTile } from "#/features/home/components/stat-tile";
import { friendlyError } from "#/lib/api/friendly-error";
import { cancelInterview, interviewsKey, listInterviews } from "#/lib/api/interview-controller";
import type { Interview } from "#/lib/api/types";
import { cn } from "#/lib/utils";
import { MODES, StatusChip, modeLabel } from "./interview-bits";
import { CalendarLinkDialog } from "./calendar-link-dialog";
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

/** The business's interviews, by day, as cards: who, when, how, and what the candidate answered. */
export function InterviewsPage() {
  const [calendarOpen, setCalendarOpen] = useState(false);
  // The tab lives in the URL (?onglet=), so a reload or a shared link keeps it.
  const [tab, setTab] = useQueryState("onglet", parseAsStringLiteral(["upcoming", "past"] as const).withDefault("upcoming"));
  // The upcoming ones feed the tiles whatever the tab.
  const upcoming = useQuery({ queryKey: [...interviewsKey, "upcoming"], queryFn: () => listInterviews({ scope: "upcoming" }) });
  const past = useQuery({ queryKey: [...interviewsKey, "past"], queryFn: () => listInterviews({ scope: "past" }), enabled: tab === "past" });
  const query = tab === "upcoming" ? upcoming : past;
  const items = query.data ?? [];

  const days: { label: string; items: Interview[] }[] = [];
  for (const i of items) {
    const label = dayLabel(i.startsAt);
    const last = days[days.length - 1];
    if (last?.label === label) last.items.push(i);
    else days.push({ label, items: [i] });
  }

  const live = (upcoming.data ?? []).filter((i) => i.status !== "CANCELLED");
  const count = (status: Interview["status"]) => live.filter((i) => i.status === status).length;

  return (
    <div className="w-full space-y-6 pt-2">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="font-semibold text-3xl tracking-tight">Entretiens</h1>
          <p className="text-muted-foreground">
            Les entretiens proposés à vos candidats, et leurs réponses. Planifiez-en depuis une analyse de CV ou une candidature.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCalendarOpen(true)}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-card px-5 font-medium hover:bg-card/70"
        >
          <IconCalendarPlus className="size-4" />
          Ajouter à mon agenda
        </button>
      </div>
      <CalendarLinkDialog open={calendarOpen} onOpenChange={setCalendarOpen} />

      {upcoming.isLoading ? (
        <div className="rounded-3xl bg-card p-6 sm:p-8">
          <TilesSkeleton />
        </div>
      ) : (
        upcoming.data && (
          <section className="grid grid-cols-2 gap-3 rounded-3xl bg-card p-6 sm:gap-4 sm:p-8 xl:grid-cols-4">
            <StatTile icon={IconCalendarEvent} label="À venir" value={String(live.length)} />
            <StatTile icon={IconCircleCheck} label="Confirmés" value={String(count("CONFIRMED"))} />
            <StatTile icon={IconHourglass} label="En attente" value={String(count("PENDING"))} hint="sans réponse du candidat" />
            <StatTile icon={IconCalendarRepeat} label="À replanifier" value={String(count("RESCHEDULE_REQUESTED"))} hint="autre moment demandé" />
          </section>
        )
      )}

      <section className="space-y-4">
        <div role="tablist" aria-label="Période" className="inline-flex rounded-full bg-card p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => void setTab(t.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-medium text-sm",
                tab === t.key ? "bg-selected text-selected-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {t.key === "upcoming" && upcoming.data && <span className="tabular-nums opacity-70">{live.length}</span>}
            </button>
          ))}
        </div>

        {query.isLoading ? (
          <CardGridSkeleton kind="mission" count={3} />
        ) : !query.data ? (
          <p className="rounded-3xl bg-card p-6 text-muted-foreground">
            {friendlyError(query.error, "Vos entretiens sont indisponibles pour le moment.")}
          </p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl bg-card px-6 py-14 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-page">
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
              <div key={day.label} className="space-y-3">
                <h2 className="flex items-center gap-2 font-semibold text-sm">
                  {day.label}
                  <span className="font-normal text-muted-foreground tabular-nums">
                    {day.items.length} entretien{day.items.length > 1 ? "s" : ""}
                  </span>
                </h2>
                <ul className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {day.items.map((i) => (
                    <InterviewCard key={i.id} interview={i} past={tab === "past"} />
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

const initials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
};

function InterviewCard({ interview: i, past }: Readonly<{ interview: Interview; past: boolean }>) {
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
  const at = new Date(i.startsAt);

  return (
    <li className={cn("flex h-full flex-col gap-4 rounded-3xl bg-card p-5", cancelled && "opacity-60")}>
      <div className="flex items-start gap-3.5">
        <div className="flex w-14 shrink-0 flex-col items-center rounded-2xl bg-brand-lime py-2 text-[#0f2414]">
          <span className="font-semibold text-xl leading-none">{at.getDate()}</span>
          <span className="mt-1 font-medium text-[11px] uppercase">{at.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "")}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-xl tabular-nums leading-tight">{time(i.startsAt)}</p>
          <p className="text-muted-foreground text-xs">
            {at.toLocaleDateString("fr-FR", { weekday: "long" })} · {i.durationMinutes} min
          </p>
        </div>
        <StatusChip status={i.status} />
      </div>

      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-page font-semibold text-muted-foreground text-xs">
          {initials(i.candidateName)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold">{i.candidateName}</p>
          <p className="truncate text-muted-foreground text-sm">
            {i.applicationId ? (
              <Link href={`/espace/candidatures?candidature=${i.applicationId}`} className="hover:underline">
                {i.jobTitle}
              </Link>
            ) : (
              i.jobTitle
            )}
          </p>
        </div>
      </div>

      <div className="space-y-2 rounded-2xl bg-page p-3 text-sm">
        <p className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-card">
            <Mode className="size-4 text-muted-foreground" />
          </span>
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
          <p className="rounded-xl bg-card px-3 py-2">
            <span className="text-muted-foreground">Message du candidat : </span>
            {i.responseNote}
          </p>
        )}
      </div>

      {!past && !cancelled && (
        <div className="mt-auto flex gap-2">
          <button type="button" onClick={() => setMoving(true)} className="h-10 flex-1 rounded-full bg-page font-medium text-sm hover:bg-page/70">
            Déplacer
          </button>
          <button
            type="button"
            onClick={() => setConfirm(true)}
            className="h-10 flex-1 rounded-full bg-page font-medium text-muted-foreground text-sm hover:bg-page/70 hover:text-destructive"
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
