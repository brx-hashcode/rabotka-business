"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { IconMicrophone, IconMicrophoneOff } from "@tabler/icons-react";

import { Button } from "#/components/ui/button";
import { friendlyError } from "#/lib/api/friendly-error";
import {
  addGuestTranscript,
  addHostTranscript,
  answerTranscription,
  getInterviewTranscript,
  getTranscriptionStatus,
  interviewTranscriptKey,
  setInterviewTranscription,
} from "#/lib/api/interview-controller";
import { cn } from "#/lib/utils";
import { useCallTranscript } from "../use-call-transcript";
import { speechErrorText } from "../use-dictation";

const CONSENT_TEXT: Record<string, string> = {
  ACCEPTED: "Le candidat a accepté",
  DECLINED: "Le candidat a refusé : seule votre voix est transcrite",
};

/** The live dot of a running transcription. */
function Live() {
  return (
    <span className="relative flex size-2 shrink-0">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive/60" />
      <span className="relative inline-flex size-2 rounded-full bg-destructive" />
    </span>
  );
}

/**
 * « Transcrire » on the business's call page: switched on or off for the
 * interview; while on and in the call, the organiser's own voice is
 * transcribed here. The candidate's is transcribed on their side, once they
 * accept, and both are merged by time for the « Compte rendu ».
 */
export function HostTranscription({ interviewId, inCall }: Readonly<{ interviewId: string; inCall: boolean }>) {
  const queryClient = useQueryClient();
  const key = interviewTranscriptKey(interviewId);
  const query = useQuery({
    queryKey: key,
    queryFn: () => getInterviewTranscript(interviewId),
    // The candidate's answer and the lines arrive while the call runs.
    refetchInterval: inCall ? 8000 : false,
  });
  const on = query.data?.transcribe ?? false;
  const toggle = useMutation({
    mutationFn: (next: boolean) => setInterviewTranscription(interviewId, next),
    onSuccess: (data) => queryClient.setQueryData(key, data),
    onError: (err) => toast.error(friendlyError(err, "La transcription n'a pas pu être changée.")),
  });
  const speech = useCallTranscript(on && inCall, (lines) => addHostTranscript(interviewId, lines));

  if (!speech.supported) {
    return <span className="hidden text-muted-foreground text-xs lg:inline">Transcription indisponible sur ce navigateur</span>;
  }
  const consent = query.data?.consent;
  return (
    <div className="flex shrink-0 items-center gap-2">
      {on && (
        <span className="hidden min-w-0 items-center gap-2 text-muted-foreground text-xs md:flex">
          {inCall && speech.listening && <Live />}
          {inCall && speech.error && <span className="text-destructive">{speechErrorText(speech.error)}</span>}
          <span className="truncate">{consent ? CONSENT_TEXT[consent] : "En attente de l'accord du candidat"}</span>
        </span>
      )}
      <Button
        type="button"
        variant="ghost"
        className={cn("h-10 shrink-0 rounded-full px-4 text-sm sm:h-10", on ? "bg-destructive/10 text-destructive hover:bg-destructive/15" : "bg-card")}
        loading={toggle.isPending}
        disabled={query.isLoading}
        aria-pressed={on}
        onClick={() => toggle.mutate(!on)}
      >
        {on ? <IconMicrophoneOff className="size-4" /> : <IconMicrophone className="size-4" />}
        <span className="hidden lg:inline">{on ? "Arrêter la transcription" : "Transcrire"}</span>
      </Button>
    </div>
  );
}

/**
 * The guest's side, on the call page reached by a link: when the business
 * transcribes, the candidate (or an invited person) is asked first, and only
 * after « Accepter » is their own voice transcribed, by their own browser.
 */
export function GuestTranscription({ room, guestToken, inCall }: Readonly<{ room: string; guestToken?: string; inCall: boolean }>) {
  const status = useQuery({
    queryKey: ["visio-transcription", room],
    queryFn: () => getTranscriptionStatus(room),
    refetchInterval: inCall ? 15000 : false,
  });
  // The candidate's answer is kept by the server; an invited person's only here.
  const [answer, setAnswer] = useState<"ACCEPTED" | "DECLINED" | null>(null);
  const known = answer ?? (guestToken ? null : (status.data?.consent ?? null));
  const transcribe = status.data?.transcribe ?? false;
  const reply = useMutation({
    mutationFn: (accepted: boolean) => answerTranscription(room, accepted, guestToken),
    onMutate: (accepted) => setAnswer(accepted ? "ACCEPTED" : "DECLINED"),
    onError: () => setAnswer(null),
  });
  const speech = useCallTranscript(inCall && transcribe && known === "ACCEPTED", (lines) =>
    addGuestTranscript(room, lines, guestToken),
  );

  // A browser that cannot transcribe has nothing to ask: only the recruiter is transcribed.
  if (!speech.supported || !inCall || !transcribe) return null;
  if (known === "ACCEPTED" && speech.error) {
    return (
      <div className="absolute inset-x-0 top-2 z-10 flex justify-center px-3">
        <span className="max-w-md rounded-2xl bg-card/95 px-3 py-2 text-center text-xs shadow-soft" role="alert">
          {speechErrorText(speech.error)} Votre voix n&apos;est pas transcrite : essayez Chrome ou Safari.
        </span>
      </div>
    );
  }
  if (known === "ACCEPTED") {
    return (
      <div className="pointer-events-none absolute inset-x-0 top-2 z-10 flex justify-center px-3">
        <span className="flex items-center gap-2 rounded-full bg-card/95 px-3 py-1.5 text-xs shadow-soft">
          <Live />
          Entretien transcrit pour le compte rendu
        </span>
      </div>
    );
  }
  if (known === "DECLINED") return null;
  return (
    <div className="absolute inset-x-0 bottom-20 z-10 flex justify-center px-3 sm:bottom-24">
      <div className="w-full max-w-md space-y-3 rounded-3xl bg-card p-4 shadow-soft">
        <p className="text-sm">
          Le recruteur souhaite transcrire l&apos;entretien pour rédiger son compte rendu : votre navigateur transforme votre voix en texte. Aucun son n&apos;est
          enregistré.
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" className="h-10 flex-1 rounded-full bg-page sm:h-10" onClick={() => reply.mutate(false)}>
            Refuser
          </Button>
          <Button type="button" className="h-10 flex-1 rounded-full sm:h-10" onClick={() => reply.mutate(true)}>
            Accepter
          </Button>
        </div>
      </div>
    </div>
  );
}
