"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  candidate: { name: string; cvResumeId?: string; applicationId?: string; email?: string | null };
  jobTitle: string;
  /** Moving an interview already proposed. */
  existing?: Interview;
}>) {
  const queryClient = useQueryClient();
  const business = useQuery({ queryKey: myBusinessKey, queryFn: getMyBusiness, enabled: open });
  const start = existing ? new Date(existing.startsAt) : tomorrowAtTen();
  const [date, setDate] = useState(dateValue(start));
  const [time, setTime] = useState(timeValue(start));
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
        startsAt: new Date(`${date}T${time}`).toISOString(),
        durationMinutes: duration,
        mode,
        ...(location.trim() ? { location: location.trim() } : {}),
        ...(message.trim() ? { message: message.trim() } : {}),
      };
      return existing
        ? rescheduleInterview(existing.id, slot)
        : createInterview({
            ...slot,
            ...(candidate.cvResumeId ? { cvResumeId: candidate.cvResumeId } : { applicationId: candidate.applicationId }),
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
            <DialogTitle className="font-semibold text-xl">{existing ? "Déplacer l'entretien" : "Planifier un entretien"}</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {candidate.name} · {jobTitle}
            </DialogDescription>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1.5">
              <span className="font-medium text-sm">Date</span>
              <Input type="date" value={date} min={dateValue(new Date())} onChange={(e) => setDate(e.target.value)} className={field} />
            </label>
            <label className="space-y-1.5">
              <span className="font-medium text-sm">Heure</span>
              <Input type="time" value={time} step={300} onChange={(e) => setTime(e.target.value)} className={field} />
            </label>
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
            disabled={save.isPending || !date || !time}
            className="h-12 flex-[2] rounded-full bg-ink font-medium text-white hover:bg-ink/90 disabled:opacity-40"
          >
            {save.isPending ? "Envoi…" : existing ? "Déplacer et prévenir" : "Envoyer l'invitation"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
