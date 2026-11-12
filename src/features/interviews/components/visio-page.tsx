"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { JaaSMeeting } from "@jitsi/react-sdk";
import { IconArrowLeft, IconExternalLink, IconFileText, IconNotes, IconPlayerStop, IconVideo } from "@tabler/icons-react";

import { ActionDialog } from "#/components/action-dialog";
import { BusinessLockup } from "#/components/business-lockup";
import { Bone } from "#/components/page-skeletons";
import { Button } from "#/components/ui/button";
import { friendlyError } from "#/lib/api/friendly-error";
import { endInterview, interviewsKey, joinVisioAsGuest, joinVisioAsHost } from "#/lib/api/interview-controller";
import type { VisioJoin } from "#/lib/api/types";
import { cn } from "#/lib/utils";
import { InterviewReportDialog } from "./interview-report-panel";
import { GuestTranscription, HostTranscription } from "./call-transcription";

/**
 * The visible screen under the status-bar strip of the root layout: `dvh`
 * follows the browser's own bars on phones, where `svh` lets content slide
 * under them.
 */
const SCREEN_MIN = "min-h-[calc(100dvh-env(safe-area-inset-top))]";

const when = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

/** What a recruiter and a candidate need in the call, and nothing to invite, stream or dial. */
const TOOLBAR = ["microphone", "camera", "desktop", "chat", "raisehand", "tileview", "select-background", "settings", "fullscreen", "hangup"];

const visioQuery = (room: string, host: boolean, guestToken?: string) => ({
  queryKey: ["visio", room, host, guestToken ?? null],
  queryFn: () => (host ? joinVisioAsHost(room) : joinVisioAsGuest(room, guestToken)),
  retry: false,
  // The token is signed for this visit: never refetched behind the call.
  staleTime: Infinity,
  refetchOnWindowFocus: false,
});

/** The JaaS call itself, filling its parent. */
function Call({
  v,
  attempt,
  onLeave,
  onApi,
}: Readonly<{ v: Extract<VisioJoin, { provider: "jaas" }>; attempt: number; onLeave: () => void; onApi?: (api: CallApi) => void }>) {
  return (
    <JaaSMeeting
      onApiReady={(api) => onApi?.(api as unknown as CallApi)}
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

/** What the page asks of the running call: only to end it for everyone. */
type CallApi = { executeCommand: (command: string) => void };

/** Left, ended, or the public Jitsi fallback: a small card instead of the call. */
function Notice({
  v,
  onRejoin,
  onReport,
  onEnd,
  ended = false,
}: Readonly<{ v: VisioJoin; onRejoin: () => void; onReport?: () => void; onEnd?: () => void; ended?: boolean }>) {
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
            <div className="space-y-1">
              <p className="font-medium">{ended ? "Entretien terminé." : "Vous avez quitté la visio."}</p>
              {ended && <p className="text-muted-foreground text-sm">Son lien n&apos;ouvre plus la visio.</p>}
            </div>
            {onReport && (
              <Button className="w-full rounded-full" onClick={onReport}>
                <IconFileText className="size-4" />
                Ouvrir le compte rendu
              </Button>
            )}
            {!ended && (
              <Button variant="ghost" className="w-full rounded-full bg-page" onClick={onRejoin}>
                Revenir dans la visio
              </Button>
            )}
            {!ended && onEnd && (
              <Button variant="ghost" className="w-full rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={onEnd}>
                <IconPlayerStop className="size-4" />
                Terminer l&apos;entretien
              </Button>
            )}
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
  const [attempt, setAttempt] = useState(0);
  const query = useQuery(visioQuery(room, true));
  const v = query.data;
  // The call over (hung up in JaaS): the « Compte rendu » opens, notes kept.
  const [reportOpen, setReportOpen] = useState(false);
  const queryClient = useQueryClient();
  const api = useRef<CallApi | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [endedNow, setEndedNow] = useState(false);
  const ended = endedNow || Boolean(v?.endedAt);
  const end = useMutation({
    mutationFn: () => endInterview(v?.interviewId ?? ""),
    onSuccess: () => {
      // Everyone out of the call, then the compte rendu.
      try {
        api.current?.executeCommand("endConference");
      } catch {
        /* already gone */
      }
      setEndedNow(true);
      setLeft(true);
      setConfirmEnd(false);
      void queryClient.invalidateQueries({ queryKey: interviewsKey });
      setReportOpen(true);
    },
    onError: (err) => toast.error(friendlyError(err, "L'entretien n'a pas pu être terminé.")),
  });
  const rejoin = () => {
    setReportOpen(false);
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
          <div className="ml-auto flex min-w-0 items-center gap-2">
            <HostTranscription interviewId={v.interviewId} inCall={v.provider === "jaas" && !left} />
            {v.provider === "jaas" && !left && (
              <Button
                type="button"
                variant="ghost"
                className="h-10 shrink-0 rounded-full bg-card px-4 text-destructive text-sm hover:bg-destructive/10 hover:text-destructive sm:h-10"
                onClick={() => setConfirmEnd(true)}
              >
                <IconPlayerStop className="size-4" />
                <span className="hidden sm:inline">Terminer</span>
              </Button>
            )}
          </div>
        )}
        {v?.interviewId && (
          <Button type="button" className="h-10 shrink-0 rounded-full px-4 text-sm" onClick={() => setReportOpen(true)}>
            <IconNotes className="size-4" />
            Notes et compte rendu
          </Button>
        )}
      </div>

        <div>
          <section className="h-[calc(100dvh-12rem-env(safe-area-inset-top))] min-h-[24rem] overflow-hidden rounded-2xl bg-card sm:rounded-3xl">
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
            ) : v.provider === "jaas" && !left && !ended ? (
              <Call
                v={v}
                attempt={attempt}
                onApi={(a) => {
                  api.current = a;
                }}
                onLeave={() => {
                  setLeft(true);
                  if (v.interviewId) setReportOpen(true);
                }}
              />
            ) : (
              <Notice
                v={v}
                ended={ended}
                onRejoin={rejoin}
                onReport={v.interviewId ? () => setReportOpen(true) : undefined}
                onEnd={v.interviewId ? () => setConfirmEnd(true) : undefined}
              />
            )}
          </section>
        </div>
      <ActionDialog
        open={confirmEnd}
        onOpenChange={setConfirmEnd}
        tone="warning"
        title="Terminer l'entretien ?"
        description="La visio se ferme pour tout le monde : son lien ne l'ouvrira plus, et la transcription s'arrête. Le compte rendu s'ouvre ensuite."
        confirmLabel="Terminer l'entretien"
        onConfirm={() => end.mutate()}
        pending={end.isPending}
      />
      {reportOpen && v?.interviewId && (
        <InterviewReportDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          interviewId={v.interviewId}
          candidateName={v.candidateName}
          jobTitle={v.jobTitle}
          startsAt={v.startsAt}
        />
      )}
    </div>
  );
}

/**
 * The guests' side, with no account: the candidate by the link of the
 * invitation, or someone the business invited by their personal link.
 */
export function VisioPage({ room, guestToken }: Readonly<{ room: string; guestToken?: string }>) {
  const [left, setLeft] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const query = useQuery(visioQuery(room, false, guestToken));
  const v = query.data;
  const [closed, setClosed] = useState<string | null>(null);
  // Back to the top: the card below is read from its start, not where the call left the page.
  const leave = () => {
    setLeft(true);
    window.scrollTo(0, 0);
  };

  if (v?.provider === "jaas" && !left) {
    return (
      // Pinned to the screen: nothing scrolls, so the browser's bars never push the call around.
      <main className="fixed inset-x-0 top-[env(safe-area-inset-top)] bottom-0 z-40 flex flex-col overflow-hidden overscroll-none bg-page">
        <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-2.5 sm:px-6 sm:py-3">
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
        <div className="min-h-0 flex-1 px-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] sm:px-4 sm:pb-4">
          <div className="relative size-full overflow-hidden rounded-2xl bg-card sm:rounded-3xl">
            <Call v={v} attempt={attempt} onLeave={leave} />
            <GuestTranscription room={room} guestToken={guestToken} inCall />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={cn(SCREEN_MIN, "bg-page px-4 py-8 sm:py-14")}>
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
              {closed ? (
                <p className="text-muted-foreground text-sm">{closed}</p>
              ) : (
                <Notice
                  v={v}
                  onRejoin={() => {
                    // Asked again: an interview ended by the business no longer opens.
                    void query.refetch().then((r) => {
                      if (r.isError) {
                        setClosed(friendlyError(r.error, "Cet entretien est terminé."));
                        return;
                      }
                      setAttempt((n) => n + 1);
                      setLeft(false);
                    });
                  }}
                />
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
