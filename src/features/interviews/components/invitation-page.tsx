"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconCalendarEvent, IconCheck, IconClock, IconExternalLink, IconX } from "@tabler/icons-react";

import { BusinessLockup } from "#/components/business-lockup";
import { Bone } from "#/components/page-skeletons";
import { Textarea } from "#/components/ui/textarea";
import { friendlyError } from "#/lib/api/friendly-error";
import { answerInvitation, getInvitation } from "#/lib/api/interview-controller";
import type { InterviewAnswer, InterviewInvitation } from "#/lib/api/types";
import { cn } from "#/lib/utils";
import { MODES } from "./interview-bits";

const longWhen = (iso: string) => {
  const d = new Date(iso);
  const day = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} à ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
};

const ANSWERED: Partial<Record<InterviewInvitation["status"], { title: string; text: string }>> = {
  CONFIRMED: { title: "Présence confirmée", text: "Le recruteur est prévenu. À bientôt !" },
  DECLINED: { title: "Entretien décliné", text: "Le recruteur est prévenu. Merci de votre réponse." },
  RESCHEDULE_REQUESTED: { title: "Autre moment demandé", text: "Le recruteur est prévenu et revient vers vous par e-mail." },
  CANCELLED: { title: "Entretien annulé", text: "Le recruteur a annulé cet entretien." },
};

/**
 * The candidate's side of an interview, behind the private link of the
 * invitation e-mail: when, how, where, and three answers. No account needed.
 */
export function InvitationPage({ token }: Readonly<{ token: string }>) {
  const queryClient = useQueryClient();
  const key = ["invitation", token];
  const query = useQuery({ queryKey: key, queryFn: () => getInvitation(token), retry: false });
  const [other, setOther] = useState(false);
  const [note, setNote] = useState("");
  const answer = useMutation({
    mutationFn: (a: InterviewAnswer) => answerInvitation(token, a, note.trim() || undefined),
    onSuccess: (data) => {
      queryClient.setQueryData(key, data);
      setOther(false);
    },
  });

  const i = query.data;
  const Mode = MODES.find((m) => m.key === i?.mode)?.icon ?? IconCalendarEvent;
  const done = i ? ANSWERED[i.status] : undefined;

  return (
    <main className="min-h-svh bg-page px-4 py-8 sm:py-14">
      <div className="mx-auto w-full max-w-lg space-y-6">
        <div className="flex justify-center">
          <BusinessLockup />
        </div>

        <section className="space-y-6 rounded-3xl bg-card p-6 sm:p-8">
          {query.isLoading ? (
            <div className="space-y-4">
              <Bone className="h-6 w-2/3" />
              <Bone className="h-24 w-full rounded-2xl" />
              <Bone className="h-12 w-full rounded-full" />
            </div>
          ) : !i ? (
            <div className="space-y-2 text-center">
              <h1 className="font-semibold text-lg">Invitation introuvable</h1>
              <p className="text-muted-foreground text-sm">
                {friendlyError(query.error, "Ce lien n'est plus valable : l'entretien a peut-être été déplacé. Utilisez le dernier e-mail reçu.")}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                {i.businessLogoUrl ? (
                  // A profile picture from storage: nothing next/image could optimise here.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={i.businessLogoUrl} alt="" className="size-12 rounded-2xl bg-page object-cover" />
                ) : (
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-lime font-semibold text-[#0f2414]">
                    {i.businessName.charAt(0)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-muted-foreground text-sm">{i.businessName} vous invite à un entretien</p>
                  <h1 className="font-semibold text-xl leading-snug">{i.jobTitle}</h1>
                </div>
              </div>

              <dl className="space-y-3 rounded-2xl bg-page p-4 text-sm">
                <div className="flex gap-3">
                  <IconCalendarEvent className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <dd className="font-medium">{longWhen(i.startsAt)}</dd>
                </div>
                <div className="flex gap-3">
                  <IconClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <dd>{i.durationMinutes} minutes</dd>
                </div>
                <div className="flex gap-3">
                  <Mode className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <dd className="min-w-0">
                    {i.mode === "VIDEO" && i.location ? (
                      <a href={i.location} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium underline underline-offset-2">
                        Rejoindre la visio <IconExternalLink className="size-3.5" />
                      </a>
                    ) : i.mode === "PHONE" ? (
                      i.location ? `Par téléphone : appelez le ${i.location}` : "Par téléphone : le recruteur vous appelle"
                    ) : (
                      <span className="break-words">En personne : {i.location}</span>
                    )}
                  </dd>
                </div>
              </dl>

              {i.message && <p className="whitespace-pre-line text-sm leading-relaxed">{i.message}</p>}

              {done ? (
                <div
                  className={cn(
                    "flex items-start gap-3 rounded-2xl p-4",
                    i.status === "CONFIRMED" ? "bg-chip-green text-chip-green-foreground" : "bg-page",
                  )}
                >
                  {i.status === "CONFIRMED" ? <IconCheck className="mt-0.5 size-5 shrink-0" /> : <IconX className="mt-0.5 size-5 shrink-0" />}
                  <div className="space-y-0.5">
                    <p className="font-semibold">{done.title}</p>
                    <p className="text-sm">{done.text}</p>
                    {i.status !== "CANCELLED" && !i.past && (
                      <button type="button" onClick={() => setOther(true)} className="pt-1 font-medium text-sm underline underline-offset-2">
                        Changer ma réponse
                      </button>
                    )}
                  </div>
                </div>
              ) : i.past ? (
                <p className="rounded-2xl bg-page p-4 text-muted-foreground text-sm">Cet entretien est passé.</p>
              ) : null}

              {!i.past && i.status !== "CANCELLED" && (!done || other) && (
                <div className="space-y-3">
                  {other ? (
                    <div className="space-y-2">
                      <Textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                        maxLength={1000}
                        placeholder="Les jours et heures qui vous conviennent, ou votre message au recruteur"
                        className="rounded-xl border-0 bg-page px-4 py-3 text-base shadow-none"
                      />
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setOther(false)} className="h-12 flex-1 rounded-full bg-page font-medium hover:bg-page/70">
                          Retour
                        </button>
                        <button
                          type="button"
                          disabled={answer.isPending || !note.trim()}
                          onClick={() => answer.mutate("RESCHEDULE_REQUESTED")}
                          className="h-12 flex-[2] rounded-full bg-ink font-medium text-white hover:bg-ink/90 disabled:opacity-40"
                        >
                          Proposer un autre moment
                        </button>
                      </div>
                      {done && (
                        <div className="flex gap-2 pt-1">
                          <button type="button" disabled={answer.isPending} onClick={() => answer.mutate("CONFIRMED")} className="h-11 flex-1 rounded-full bg-page font-medium text-sm hover:bg-page/70">
                            Je serai présent
                          </button>
                          <button type="button" disabled={answer.isPending} onClick={() => answer.mutate("DECLINED")} className="h-11 flex-1 rounded-full bg-page font-medium text-sm hover:bg-page/70">
                            Je décline
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={answer.isPending}
                        onClick={() => answer.mutate("CONFIRMED")}
                        className="h-12 w-full rounded-full bg-ink font-medium text-white hover:bg-ink/90 disabled:opacity-40"
                      >
                        Je serai présent
                      </button>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setOther(true)} className="h-12 flex-1 rounded-full bg-page font-medium hover:bg-page/70">
                          Autre moment
                        </button>
                        <button
                          type="button"
                          disabled={answer.isPending}
                          onClick={() => answer.mutate("DECLINED")}
                          className="h-12 flex-1 rounded-full bg-page font-medium text-muted-foreground hover:bg-page/70 hover:text-foreground"
                        >
                          Je décline
                        </button>
                      </div>
                    </>
                  )}
                  {answer.isError && (
                    <p className="text-destructive text-sm">{friendlyError(answer.error, "La réponse n'a pas pu être envoyée. Réessayez.")}</p>
                  )}
                </div>
              )}
            </>
          )}
        </section>

        <p className="text-center text-muted-foreground text-xs">Invitation envoyée via Rabotka · www.rabotka.work</p>
      </div>
    </main>
  );
}
