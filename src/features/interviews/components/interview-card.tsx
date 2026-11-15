"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IconCalendarEvent,
  IconDots,
  IconExternalLink,
  IconFileText,
  IconLink,
  IconLock,
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
import { friendlyError } from "#/lib/api/friendly-error";
import { cancelInterview, interviewsKey } from "#/lib/api/interview-controller";
import type { Interview } from "#/lib/api/types";
import { cn } from "#/lib/utils";
import { canHire } from "#/features/team/member-access";
import { useMember } from "#/features/team/use-member";
import { MODES, StatusChip, modeLabel } from "./interview-bits";
import { ScheduleInterviewDialog } from "./schedule-interview-dialog";
import { InviteGuestDialog } from "./invite-guest-dialog";
import { InterviewReportDialog } from "./interview-report-panel";
import { useVideoPlan } from "../use-video-plan";

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

const initials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
};

/** One interview: when, who, how, the answer, and what to do with it. */
export function InterviewCard({ interview: i, past, focused = false }: Readonly<{ interview: Interview; past: boolean; focused?: boolean }>) {
  const queryClient = useQueryClient();
  const [moving, setMoving] = useState(false);
  // Moving or cancelling is the hiring side's: an Évaluateur only reads.
  const hire = canHire(useMember().role);
  const [confirm, setConfirm] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [inviting, setInviting] = useState(false);
  const videoPlan = useVideoPlan();
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
  // A Rabotka room, booked before or not, opens only with the plan's visio.
  const roomLocked = Boolean(join?.internal) && !videoPlan.loading && !videoPlan.allowed;
  const at = new Date(i.startsAt);
  // Several times offered and none chosen yet: the earliest shows, the rest below.
  const options = i.options ?? [];

  return (
    <li
      id={`entretien-${i.id}`}
      className={cn("flex h-full scroll-mt-24 flex-col gap-4 rounded-3xl bg-card p-5", cancelled && "opacity-60", focused && "ring-2 ring-whatsapp-dark")}
    >
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
          i.endedAt ? (
            <span className="shrink-0 rounded-full bg-chip-green px-2.5 py-1 font-medium text-chip-green-foreground text-xs">Terminé</span>
          ) : (
            <StatusChip status={i.status} />
          )
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
            (roomLocked ? (
              <span
                aria-disabled
                title="Visio dans Rabotka : incluse dans les formules supérieures"
                className={cn(JOIN, "cursor-not-allowed opacity-50")}
              >
                <IconLock className="size-4" />
                Rejoindre
              </span>
            ) : join.internal ? (
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
                  {join && i.location && !roomLocked && (
                    <DropdownMenuItem onSelect={() => copyLink(i.location!, join.internal)} className={MENU_ITEM}>
                      <IconLink className="size-4" />
                      Copier le lien de la visio
                    </DropdownMenuItem>
                  )}
                  {editable && join?.internal && (
                    <DropdownMenuItem disabled={!videoPlan.allowed} onSelect={() => setInviting(true)} className={MENU_ITEM}>
                      {videoPlan.allowed ? <IconUserPlus className="size-4" /> : <IconLock className="size-4" />}
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
