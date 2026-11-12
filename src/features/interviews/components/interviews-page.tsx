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
  IconDots,
  IconExternalLink,
  IconHourglass,
  IconFileText,
  IconLink,
  IconPencil,
  IconUserPlus,
  IconVideo,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { ActionDialog } from "#/components/action-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { CardGridSkeleton, TilesSkeleton } from "#/components/page-skeletons";
import { StatTile } from "#/features/home/components/stat-tile";
import { friendlyError } from "#/lib/api/friendly-error";
import { cancelInterview, interviewsKey, listInterviews } from "#/lib/api/interview-controller";
import type { Interview } from "#/lib/api/types";
import { cn } from "#/lib/utils";
import { MODES, StatusChip, modeLabel } from "./interview-bits";
import { CalendarLinkDialog } from "./calendar-link-dialog";
import { ScheduleInterviewDialog } from "./schedule-interview-dialog";
import { InviteGuestDialog } from "./invite-guest-dialog";
import { InterviewReportDialog } from "./interview-report-panel";
import { canHire } from "#/features/team/member-access";
import { useMember } from "#/features/team/use-member";

const TABS = [
  { key: "upcoming", label: "À venir" },
  { key: "past", label: "Passés" },
] as const;

/** « aujourd'hui », « demain », or the weekday: the card already shows the date. */
function dayWord(at: Date): string {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (at.toDateString() === today.toDateString()) return "aujourd'hui";
  if (at.toDateString() === tomorrow.toDateString()) return "demain";
  return at.toLocaleDateString("fr-FR", { weekday: "long" });
}

const time = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

/** The business's interviews as cards, in date order: who, when, how, and what the candidate answered. */
export function InterviewsPage() {
  const [calendarOpen, setCalendarOpen] = useState(false);
  // The tab lives in the URL (?onglet=), so a reload or a shared link keeps it.
  const [tab, setTab] = useQueryState("onglet", parseAsStringLiteral(["upcoming", "past"] as const).withDefault("upcoming"));
  // The upcoming ones feed the tiles whatever the tab.
  const upcoming = useQuery({ queryKey: [...interviewsKey, "upcoming"], queryFn: () => listInterviews({ scope: "upcoming" }) });
  const past = useQuery({ queryKey: [...interviewsKey, "past"], queryFn: () => listInterviews({ scope: "past" }), enabled: tab === "past" });
  const query = tab === "upcoming" ? upcoming : past;
  const items = query.data ?? [];

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
          // Each card carries its date: all of them, in date order, no day headings.
          <ul className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((i) => (
              <InterviewCard key={i.id} interview={i} past={tab === "past"} />
            ))}
          </ul>
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
  // Moving or cancelling is the hiring side's: an Évaluateur only reads.
  const hire = canHire(useMember().role);
  const [confirm, setConfirm] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [inviting, setInviting] = useState(false);
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
  // Changing or cancelling is the hiring side's, and only before it happens.
  const editable = hire && !past && !cancelled;
  const join =
    !past && !cancelled && i.mode === "VIDEO" && i.location
      ? isRabotkaVisio(i.location)
        ? { href: `/espace/entretiens${new URL(i.location).pathname}`, internal: true }
        : { href: i.location, internal: false }
      : null;
  const at = new Date(i.startsAt);
  // Several times offered and none chosen yet: the earliest shows, the rest below.
  const options = i.options ?? [];

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
            {options.length > 0 ? `${options.length} créneaux proposés` : dayWord(at)} · {i.durationMinutes} min
          </p>
        </div>
        {options.length > 0 && i.status === "PENDING" ? (
          <span className="shrink-0 rounded-full bg-chip-amber px-2.5 py-1 font-medium text-chip-amber-foreground text-xs">
            Au choix du candidat
          </span>
        ) : (
          <StatusChip status={i.status} />
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-page font-semibold text-muted-foreground text-xs">
          {initials(i.candidateName)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold">{i.candidateName}</p>
          <p className="truncate text-muted-foreground text-sm">
            {/* The offer, whichever way they applied; a Rabotka applicant's card is
                brought into view there. Only a CV analysed against a job typed by
                hand has no offer to open. */}
            {i.offerId ? (
              <Link
                href={`/espace/offres/${i.offerId}${i.applicationId ? `?candidature=${i.applicationId}` : ""}`}
                className="hover:underline"
              >
                {i.jobTitle}
              </Link>
            ) : (
              i.jobTitle
            )}
          </p>
        </div>
      </div>

      <div className="space-y-2 rounded-2xl bg-page p-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-card">
            <Mode className="size-4 text-muted-foreground" />
          </span>
          <span className="min-w-0 flex-1 truncate">
            {i.mode === "VIDEO" && i.location ? (isRabotkaVisio(i.location) ? "Visio dans Rabotka" : "Visio · lien externe") : modeLabel(i)}
          </span>
          {/* The call, where the format is said: the one thing to do on the day. */}
          {join &&
            (join.internal ? (
              <Link href={join.href} className={JOIN}>
                <IconVideo className="size-4" />
                Rejoindre
              </Link>
            ) : (
              <a href={join.href} target="_blank" rel="noreferrer" className={JOIN}>
                <IconVideo className="size-4" />
                Rejoindre
                <IconExternalLink className="size-3.5" />
              </a>
            ))}
        </div>
        {options.length > 0 && (
          <ul className="space-y-1 rounded-xl bg-card px-3 py-2">
            <li className="text-muted-foreground text-xs">En attente du choix du candidat :</li>
            {options.map((o) => (
              <li key={o.id} className="font-medium tabular-nums">
                {new Date(o.startsAt).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} à {time(o.startsAt)}
              </li>
            ))}
          </ul>
        )}
        {i.responseNote && (
          <p className="rounded-xl bg-card px-3 py-2">
            <span className="text-muted-foreground">Message du candidat : </span>
            {i.responseNote}
          </p>
        )}
      </div>

      {!cancelled && (
        <div className="mt-auto">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setReporting(true)}
              className="flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-page px-3 font-medium text-sm hover:bg-page/70"
            >
              <IconFileText className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">Compte rendu</span>
            </button>
            {editable && (
              <button
                type="button"
                onClick={() => setMoving(true)}
                className="flex h-10 items-center justify-center gap-2 rounded-full bg-page px-4 font-medium text-sm hover:bg-page/70"
              >
                <IconPencil className="size-4 text-muted-foreground" />
                Modifier
              </button>
            )}
            {(join || editable) && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Plus d'actions"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-page text-muted-foreground outline-none hover:bg-page/70 hover:text-foreground"
                >
                  <IconDots className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-2xl border-0 bg-card p-1.5 shadow-soft">
                  {join && i.location && (
                    <DropdownMenuItem onSelect={() => copyLink(i.location!, join.internal)} className={MENU_ITEM}>
                      <IconLink className="size-4" />
                      Copier le lien de la visio
                    </DropdownMenuItem>
                  )}
                  {editable && join?.internal && (
                    <DropdownMenuItem onSelect={() => setInviting(true)} className={MENU_ITEM}>
                      <IconUserPlus className="size-4" />
                      Partager la visio
                    </DropdownMenuItem>
                  )}
                  {editable && (
                    <>
                      {join && <DropdownMenuSeparator className="my-1" />}
                      <DropdownMenuItem onSelect={() => setConfirm(true)} className={cn(MENU_ITEM, "text-destructive focus:text-destructive")}>
                        <IconX className="size-4" />
                        Annuler l&apos;entretien
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      )}

      {inviting && <InviteGuestDialog interview={i} open={inviting} onOpenChange={setInviting} />}
      {moving && (
        <ScheduleInterviewDialog
          open={moving}
          onOpenChange={setMoving}
          candidate={{ name: i.candidateName, cvResumeId: i.cvResumeId ?? undefined, applicationId: i.applicationId ?? undefined }}
          jobTitle={i.jobTitle}
          existing={i}
        />
      )}
      {reporting && (
        <InterviewReportDialog
          open={reporting}
          onOpenChange={setReporting}
          interviewId={i.id}
          candidateName={i.candidateName}
          jobTitle={i.jobTitle}
          startsAt={i.startsAt}
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

const MENU_ITEM = "gap-2 rounded-xl px-3 py-2";

/** The room's link is the candidate's: someone else is invited by their own. */
async function copyLink(url: string, rabotka: boolean) {
  try {
    await navigator.clipboard.writeText(url);
    toast.success(
      rabotka ? "Lien copié : c'est celui du candidat. Pour un collègue, utilisez « Partager la visio »." : "Lien de la visio copié.",
    );
  } catch {
    toast.error("Le lien n'a pas pu être copié.");
  }
}

const JOIN =
  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 font-medium text-primary-foreground text-xs transition-colors hover:bg-primary/90";

/** A room made by « Créer un lien de visio »: opened here, not in a new tab. */
function isRabotkaVisio(location: string): boolean {
  try {
    return new URL(location).pathname.startsWith("/visio/Rabotka-");
  } catch {
    return false;
  }
}
