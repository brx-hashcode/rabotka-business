"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { JaaSMeeting } from "@jitsi/react-sdk";
import { IconArrowLeft, IconExternalLink, IconNotes, IconVideo, IconVideoOff } from "@tabler/icons-react";

import { BusinessLockup } from "#/components/business-lockup";
import { Bone } from "#/components/page-skeletons";
import { Button } from "#/components/ui/button";
import { friendlyError } from "#/lib/api/friendly-error";
import { joinVisioAsGuest, joinVisioAsHost } from "#/lib/api/interview-controller";
import type { VisioJoin } from "#/lib/api/types";
import { cn } from "#/lib/utils";
import { InterviewReportPanel } from "./interview-report-panel";

const when = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

/** What a recruiter and a candidate need in the call, and nothing to invite, stream or dial. */
const TOOLBAR = ["microphone", "camera", "desktop", "chat", "raisehand", "tileview", "select-background", "settings", "fullscreen", "hangup"];

const visioQuery = (room: string, host: boolean) => ({
  queryKey: ["visio", room, host],
  queryFn: () => (host ? joinVisioAsHost(room) : joinVisioAsGuest(room)),
  retry: false,
  // The token is signed for this visit: never refetched behind the call.
  staleTime: Infinity,
  refetchOnWindowFocus: false,
});

/** The JaaS call itself, filling its parent. */
function Call({ v, attempt, onLeave }: Readonly<{ v: Extract<VisioJoin, { provider: "jaas" }>; attempt: number; onLeave: () => void }>) {
  return (
    <JaaSMeeting
      key={attempt}
      appId={v.appId}
      roomName={v.roomName}
      jwt={v.jwt}
      lang="fr"
      configOverwrite={{
        subject: v.jobTitle,
        prejoinConfig: { enabled: true, hideExtraJoinButtons: ["no-audio", "by-phone"] },
        toolbarButtons: TOOLBAR,
        // Recording is off in the token: no warning about it before joining.
        recordings: { showPrejoinWarning: false },
        // Stay in the browser on phones, instead of « Get the app ».
        disableDeepLinking: true,
        disableInviteFunctions: true,
        enableWelcomePage: false,
        enableClosePage: false,
        hideConferenceTimer: false,
        disableThirdPartyRequests: true,
        notifications: [],
      }}
      interfaceConfigOverwrite={{ SHOW_PROMOTIONAL_CLOSE_PAGE: false, MOBILE_APP_PROMO: false, SHOW_CHROME_EXTENSION_BANNER: false }}
      getIFrameRef={(node) => {
        node.style.height = "100%";
        node.style.width = "100%";
      }}
      spinner={() => <Bone className="size-full rounded-none" />}
      onReadyToClose={onLeave}
    />
  );
}

/** Left, or the public Jitsi fallback: a small card instead of the call. */
function Notice({
  v,
  onRejoin,
}: Readonly<{ v: VisioJoin; onRejoin: () => void }>) {
  return (
    <div className="flex size-full items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-5 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-page">
          <IconVideo className="size-5 text-muted-foreground" />
        </span>
        {v.provider === "jitsi" ? (
          <>
            <p className="text-muted-foreground text-sm">La visio s&apos;ouvre dans un nouvel onglet.</p>
            <Button className="w-full rounded-full" render={<a href={v.url} target="_blank" rel="noreferrer" />}>
              Rejoindre la visio
              <IconExternalLink className="size-4" />
            </Button>
          </>
        ) : (
          <>
            <p className="font-medium">Vous avez quitté la visio.</p>
            <Button className="w-full rounded-full" onClick={onRejoin}>
              Revenir dans la visio
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * The business's side, inside « Entretiens »: sidebar and top bar stay,
 * the call fills the page under the interview's line.
 */
export function InterviewVisioPage({ room }: Readonly<{ room: string }>) {
  const [left, setLeft] = useState(false);
  const [notesOpen, setNotesOpen] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const query = useQuery(visioQuery(room, true));
  const v = query.data;
  // The call over (hung up in JaaS): the page turns to the « Compte rendu ».
  const ended = left && v?.provider === "jaas" && !!v.interviewId;
  const rejoin = () => {
    setAttempt((n) => n + 1);
    setLeft(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-full bg-card"
          aria-label="Retour aux entretiens"
          render={<Link href="/espace/entretiens" />}
        >
          <IconArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0">
          {v ? (
            <>
              <h1 className="truncate font-semibold text-lg leading-tight">Entretien avec {v.candidateName}</h1>
              <p className="truncate text-muted-foreground text-sm">
                {v.jobTitle} · {when(v.startsAt)} · {v.durationMinutes} min
              </p>
            </>
          ) : (
            <h1 className="font-semibold text-lg">Visio</h1>
          )}
        </div>
        {v?.interviewId && !ended && (
          <Button
            type="button"
            variant="ghost"
            className={cn("ml-auto h-10 shrink-0 rounded-full px-4 text-sm", notesOpen ? "bg-brand-lime/60 text-ink" : "bg-card")}
            onClick={() => setNotesOpen((o) => !o)}
          >
            <IconNotes className="size-4" />
            {notesOpen ? "Masquer les notes" : "Notes et compte rendu"}
          </Button>
        )}
      </div>

      {ended && v?.interviewId ? (
        // Hung up: the « Compte rendu » takes the call's place, notes kept.
        <section className="mx-auto w-full max-w-4xl space-y-5 rounded-3xl bg-card p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-page px-4 py-3">
            <p className="flex items-center gap-2 font-medium text-sm">
              <IconVideoOff className="size-4 text-muted-foreground" />
              Visio terminée : rédigez le compte rendu tant que l&apos;entretien est frais.
            </p>
            <button type="button" onClick={rejoin} className="font-medium text-sm underline underline-offset-2">
              Revenir dans la visio
            </button>
          </div>
          <InterviewReportPanel interviewId={v.interviewId} candidateName={v.candidateName} jobTitle={v.jobTitle} startsAt={v.startsAt} />
        </section>
      ) : (
        <div className={cn("grid gap-4", notesOpen && v?.interviewId && "lg:grid-cols-[minmax(0,1fr)_24rem]")}>
          <section className="h-[calc(100svh-12rem)] min-h-[28rem] overflow-hidden rounded-3xl bg-card">
            {query.isLoading ? (
              <Bone className="size-full rounded-none" />
            ) : !v ? (
              <div className="flex size-full items-center justify-center p-6">
                <div className="max-w-sm space-y-2 text-center">
                  <p className="font-semibold">Visio indisponible</p>
                  <p className="text-muted-foreground text-sm">
                    {friendlyError(query.error, "Cette visio n'appartient pas à un entretien de votre organisation.")}
                  </p>
                  <Link href={`/visio/${encodeURIComponent(room)}?invite=1`} className="inline-block pt-2 font-medium text-sm underline underline-offset-2">
                    Rejoindre en invité
                  </Link>
                </div>
              </div>
            ) : v.provider === "jaas" && !left ? (
              <Call v={v} attempt={attempt} onLeave={() => setLeft(true)} />
            ) : (
              <Notice v={v} onRejoin={rejoin} />
            )}
          </section>
          {notesOpen && v?.interviewId && (
            <aside className="rounded-3xl bg-card p-4 sm:p-5 lg:h-[calc(100svh-12rem)] lg:min-h-[28rem] lg:overflow-y-auto">
              <InterviewReportPanel compact interviewId={v.interviewId} candidateName={v.candidateName} jobTitle={v.jobTitle} startsAt={v.startsAt} />
            </aside>
          )}
        </div>
      )}
    </div>
  );
}

/** The candidate's side, by the link of the invitation: no account, a guest. */
export function VisioPage({ room }: Readonly<{ room: string }>) {
  const [left, setLeft] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const query = useQuery(visioQuery(room, false));
  const v = query.data;

  if (v?.provider === "jaas" && !left) {
    return (
      <main className="flex h-svh flex-col bg-page">
        <header className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="truncate font-semibold text-sm">{v.jobTitle}</p>
            <p className="truncate text-muted-foreground text-xs">
              {v.businessName} · {when(v.startsAt)}
            </p>
          </div>
          <span className="hidden shrink-0 sm:block">
            <BusinessLockup compact />
          </span>
        </header>
        <div className="min-h-0 flex-1 px-2 pb-2 sm:px-4 sm:pb-4">
          <div className="size-full overflow-hidden rounded-3xl bg-card">
            <Call v={v} attempt={attempt} onLeave={() => setLeft(true)} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-svh bg-page px-4 py-8 sm:py-14">
      <div className="mx-auto w-full max-w-lg space-y-6">
        <div className="flex justify-center">
          <BusinessLockup />
        </div>
        <section className="space-y-4 rounded-3xl bg-card p-6 text-center sm:p-8">
          {query.isLoading ? (
            <div className="space-y-4">
              <Bone className="mx-auto h-6 w-2/3" />
              <Bone className="h-12 w-full rounded-full" />
            </div>
          ) : !v ? (
            <div className="space-y-2">
              <h1 className="font-semibold text-lg">Visio indisponible</h1>
              <p className="text-muted-foreground text-sm">
                {friendlyError(query.error, "Ce lien de visio n'est plus valable. Utilisez le dernier e-mail reçu.")}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <h1 className="font-semibold text-lg">{v.jobTitle}</h1>
                <p className="text-muted-foreground text-sm">
                  {v.businessName} · {when(v.startsAt)}
                </p>
              </div>
              <Notice
                v={v}
                onRejoin={() => {
                  setAttempt((n) => n + 1);
                  setLeft(false);
                }}
              />
            </>
          )}
        </section>
      </div>
    </main>
  );
}
