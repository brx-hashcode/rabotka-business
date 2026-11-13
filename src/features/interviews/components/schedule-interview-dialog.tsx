"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconLock, IconPlus, IconVideo, IconX } from "@tabler/icons-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import { getMyBusiness, myBusinessKey } from "#/lib/api/business-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import {
  createInterview,
  INTERVIEW_DURATIONS,
  interviewsKey,
  rescheduleInterview,
} from "#/lib/api/interview-controller";
import type { Interview, InterviewMode } from "#/lib/api/types";
import { cn } from "#/lib/utils";
import { MODES } from "./interview-bits";
import { PLANS_HREF, useVideoPlan } from "../use-video-plan";

/** Tomorrow at 10:00, local: a sensible first proposal. */
function tomorrowAtTen(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d;
}

const pad = (n: number) => String(n).padStart(2, "0");
const dateValue = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const timeValue = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Times a business may offer for one interview (the server's limit). */
const MAX_SLOTS = 3;

/** A video room inside Rabotka, hard to guess: the candidate joins by its link, without an account. */
function jitsiLink(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  const id = Array.from(bytes, (b) => "abcdefghijkmnpqrstuvwxyz23456789"[b % 32]).join("");
  return `${window.location.origin}/visio/Rabotka-${id}`;
}

const LOCATION: Record<InterviewMode, { label: string; placeholder: string; optional?: boolean }> = {
  IN_PERSON: { label: "Adresse", placeholder: "Ex. : 12 avenue de la Paix, Brazzaville" },
  PHONE: { label: "Numéro à appeler", placeholder: "Le vôtre, si le candidat doit appeler", optional: true },
  VIDEO: { label: "Lien de la visio", placeholder: "https://meet.google.com/…" },
};

/**
 * Proposes an interview (or moves one): the date and time, how long, how and
 * where, a message. The candidate is invited by e-mail with a calendar file
 * and answers through a private link.
 */
export function ScheduleInterviewDialog({
  open,
  onOpenChange,
  candidate,
  jobTitle,
  existing,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: { name: string; cvResumeId?: string; applicationId?: string; externalApplicationId?: string; email?: string | null };
  jobTitle: string;
  /** Moving an interview already proposed. */
  existing?: Interview;
}>) {
  const queryClient = useQueryClient();
  const business = useQuery({ queryKey: myBusinessKey, queryFn: getMyBusiness, enabled: open });
  const videoPlan = useVideoPlan();
  // One time, or up to three for the candidate to choose from.
  const initial = existing?.options?.length
    ? existing.options.map((x) => new Date(x.startsAt))
    : [existing ? new Date(existing.startsAt) : tomorrowAtTen()];
  const [slots, setSlots] = useState(initial.map((d) => ({ date: dateValue(d), time: timeValue(d) })));
  const setSlot = (i: number, patch: Partial<{ date: string; time: string }>) =>
    setSlots((all) => all.map((x, n) => (n === i ? { ...x, ...patch } : x)));
  const addSlot = () =>
    setSlots((all) => {
      // The next one a day after the last, same hour: a sensible start.
      const last = new Date(`${all.at(-1)?.date}T${all.at(-1)?.time}`);
      last.setDate(last.getDate() + 1);
      return [...all, { date: dateValue(last), time: timeValue(last) }];
    });
  const times = slots.map((x) => new Date(`${x.date}T${x.time}`).toISOString());
  const complete = slots.every((x) => x.date && x.time);
  const [duration, setDuration] = useState(existing?.durationMinutes ?? 30);
  const [mode, setMode] = useState<InterviewMode>(existing?.mode ?? "IN_PERSON");
  const [locations, setLocations] = useState<Partial<Record<InterviewMode, string>>>(
    existing ? { [existing.mode]: existing.location ?? "" } : {},
  );
  const [email, setEmail] = useState(candidate.email ?? "");
  const [message, setMessage] = useState(existing?.message ?? "");

  // In person, the organisation's address until another is typed.
  const location = locations[mode] ?? (mode === "IN_PERSON" ? (business.data?.address ?? "") : "");
  const isCv = !!candidate.cvResumeId;

  const save = useMutation({
    mutationFn: () => {
      const slot = {
        ...(times.length > 1 ? { options: times } : { startsAt: times[0] }),
        durationMinutes: duration,
        mode,
        ...(location.trim() ? { location: location.trim() } : {}),
        ...(message.trim() ? { message: message.trim() } : {}),
      };
      return existing
        ? rescheduleInterview(existing.id, slot)
        : createInterview({
            ...slot,
            ...(candidate.cvResumeId
              ? { cvResumeId: candidate.cvResumeId }
              : candidate.externalApplicationId
                ? { externalApplicationId: candidate.externalApplicationId }
                : { applicationId: candidate.applicationId }),
            ...(isCv && email.trim() ? { candidateEmail: email.trim() } : {}),
          });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: interviewsKey });
      toast.success(existing ? `Entretien déplacé : ${candidate.name} est prévenu.` : `Invitation envoyée à ${candidate.name}.`);
      onOpenChange(false);
    },
    onError: (err) => toast.error(friendlyError(err, "L'invitation n'a pas pu être envoyée.")),
  });

  const field = "h-12 rounded-xl border-0 bg-page px-4 text-base shadow-none md:text-[15px]";

  return (
    <Dialog open={open} onOpenChange={(o) => !save.isPending && onOpenChange(o)}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg gap-0 overflow-hidden rounded-3xl border-0 bg-card p-0 shadow-soft">
        <div className="max-h-[85svh] space-y-5 overflow-y-auto px-6 pt-6 pb-2">
          <div className="space-y-1">
            <DialogTitle className="font-semibold text-xl">{existing ? "Modifier l'entretien" : "Planifier un entretien"}</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {candidate.name} · {jobTitle}
            </DialogDescription>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-medium text-sm">{slots.length > 1 ? "Créneaux proposés" : "Date et heure"}</span>
              {slots.length > 1 && <span className="text-muted-foreground text-xs">Le candidat choisit celui qui lui convient.</span>}
            </div>
            {slots.map((x, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  type="date"
                  aria-label={`Date du créneau ${i + 1}`}
                  value={x.date}
                  min={dateValue(new Date())}
                  onChange={(e) => setSlot(i, { date: e.target.value })}
                  className={cn(field, "flex-1")}
                />
                <Input
                  type="time"
                  aria-label={`Heure du créneau ${i + 1}`}
                  value={x.time}
                  step={300}
                  onChange={(e) => setSlot(i, { time: e.target.value })}
                  className={cn(field, "w-32 shrink-0")}
                />
                {slots.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setSlots((all) => all.filter((_, n) => n !== i))}
                    aria-label={`Retirer le créneau ${i + 1}`}
                    className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-page hover:text-foreground"
                  >
                    <IconX className="size-4" />
                  </button>
                )}
              </div>
            ))}
            {slots.length < MAX_SLOTS && (
              <button
                type="button"
                onClick={addSlot}
                className="inline-flex items-center gap-1.5 rounded-full px-1 py-1 font-medium text-sm text-whatsapp-dark hover:underline"
              >
                <IconPlus className="size-4" />
                {slots.length === 1 ? "Proposer plusieurs créneaux" : "Ajouter un créneau"}
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <span className="font-medium text-sm">Durée</span>
            <div className="flex flex-wrap gap-1.5">
              {INTERVIEW_DURATIONS.filter((d) => d >= 15).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 font-medium text-sm",
                    duration === d ? "bg-ink text-white" : "bg-page text-muted-foreground hover:text-foreground",
                  )}
                >
                  {d < 60 ? `${d} min` : `${d / 60} h${d % 60 ? ` ${d % 60}` : ""}`}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="font-medium text-sm">Format</span>
            <div role="radiogroup" aria-label="Format" className="grid grid-cols-3 gap-1 rounded-2xl bg-page p-1">
              {MODES.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  role="radio"
                  aria-checked={mode === m.key}
                  onClick={() => setMode(m.key)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 font-medium text-sm",
                    mode === m.key ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <m.icon className="size-4" />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block space-y-1.5">
            <span className="font-medium text-sm">
              {LOCATION[mode].label}
              {LOCATION[mode].optional && <span className="font-normal text-muted-foreground"> (facultatif)</span>}
            </span>
            <Input
              value={location}
              onChange={(e) => setLocations((l) => ({ ...l, [mode]: e.target.value }))}
              placeholder={LOCATION[mode].placeholder}
              className={field}
            />
            {mode === "PHONE" && !location.trim() && <span className="text-muted-foreground text-xs">Sinon, le candidat sera prévenu que vous l&apos;appelez.</span>}
            {mode === "VIDEO" &&
              (videoPlan.allowed ? (
                <button
                  type="button"
                  onClick={() => setLocations((l) => ({ ...l, VIDEO: jitsiLink() }))}
                  className="inline-flex items-center gap-1.5 pt-1 font-medium text-sm text-whatsapp-dark hover:underline"
                >
                  <IconVideo className="size-4" />
                  Créer un lien de visio
                  <span className="font-normal text-muted-foreground">(dans Rabotka, sans compte)</span>
                </button>
              ) : (
                !videoPlan.loading && (
                  // Not in the plan: a Meet or Zoom link above still works.
                  <Link href={PLANS_HREF} className="inline-flex items-center gap-1.5 pt-1 font-medium text-muted-foreground text-sm hover:text-foreground">
                    <IconLock className="size-4" />
                    Créer un lien de visio
                    <span className="font-normal">· inclus dans les formules supérieures</span>
                  </Link>
                )
              ))}
          </label>

          {isCv && !existing && (
            <label className="block space-y-1.5">
              <span className="font-medium text-sm">E-mail du candidat</span>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="L'invitation lui est envoyée ici" className={field} />
            </label>
          )}

          <label className="block space-y-1.5">
            <span className="font-medium text-sm">
              Message <span className="font-normal text-muted-foreground">(facultatif)</span>
            </span>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Ce qu'il faut apporter, à qui se présenter…"
              className="rounded-xl border-0 bg-page px-4 py-3 text-base shadow-none md:text-[15px]"
            />
          </label>
        </div>

        <div className="flex gap-2 px-6 pt-3 pb-6">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={save.isPending}
            className="h-12 flex-1 rounded-full bg-page font-medium hover:bg-page/70"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={save.isPending || !complete}
            className="h-12 flex-[2] rounded-full bg-ink font-medium text-white hover:bg-ink/90 disabled:opacity-40"
          >
            {save.isPending ? "Envoi…" : existing ? "Enregistrer et prévenir" : "Envoyer l'invitation"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
