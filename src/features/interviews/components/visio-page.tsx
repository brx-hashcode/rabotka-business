"use client";

import { useLocale, useTranslations } from "next-intl";
import { useWhyNot } from "#/lib/use-why-not";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { JitsiMeeting } from "@jitsi/react-sdk";
import { IconArrowLeft, IconExternalLink, IconFileText, IconNotes, IconLock, IconPlayerStop, IconUserPlus, IconVideo } from "@tabler/icons-react";

import { ActionDialog } from "#/components/action-dialog";
import { BusinessLockup } from "#/components/business-lockup";
import { Bone } from "#/components/page-skeletons";
import { Button } from "#/components/ui/button";
import { INTL_LOCALE, type Locale } from "#/i18n/config";
import { useFriendlyError } from "#/lib/api/use-friendly-error";
import { endInterview, interviewReportKey, interviewsKey, joinVisioAsGuest, joinVisioAsHost, markCallStarted } from "#/lib/api/interview-controller";
import type { VisioJoin } from "#/lib/api/types";
import { cn } from "#/lib/utils";
import { CallEnded } from "./call-ended";
import { CallOpening, whenCallShows } from "./call-opening";
import { InterviewReportDialog } from "./interview-report-panel";
import { useCallCaptions, type CallCaptionsApi } from "../call-captions";
import { InviteGuestDialog } from "./invite-guest-dialog";
import { useVideoPlan } from "../use-video-plan";
import { VisioWaiting } from "./visio-waiting";


const SCREEN_MIN = "min-h-[calc(100dvh-env(safe-area-inset-top))]";

const visioLink = (room: string) => `${window.location.origin}/visio/${encodeURIComponent(room)}`;

const when = (iso: string, locale: Locale) =>
  new Date(iso).toLocaleString(INTL_LOCALE[locale], { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });


const TOOLBAR = [
  "microphone",
  "camera",
  "toggle-camera",
  "select-background",
  "videoquality",
  "desktop",
  "shareaudio",
  "chat",
  "raisehand",
  "reactions",
  "closedcaptions",
  "polls",
  "recording",
  "participants-pane",
  "mute-everyone",
  "mute-video-everyone",
  "security",
  "whiteboard",
  "etherpad",
  "sharedvideo",
  "noisesuppression",
  "tileview",
  "filmstrip",
  "stats",
  "shortcuts",
  "settings",
  "fullscreen",
  "hangup",
];

const visioQuery = (room: string, host: boolean, guestToken?: string) => ({
  queryKey: ["visio", room, host, guestToken ?? null],
  queryFn: () => (host ? joinVisioAsHost(room) : joinVisioAsGuest(room, guestToken)),
  retry: false,
  staleTime: Infinity,
  refetchOnWindowFocus: false,
});

/** Jitsi's buttons that leave: told on the click, Jitsi still does the leaving. */
const LEAVE_BUTTONS = ["hangup", "end-meeting"];
/** At most this long hidden but still connected, while Jitsi leaves the room. */
const LEAVE_GRACE_MS = 4000;

/**
 * The call. Leaving shows at once (`onLeave` on the click), while the hidden
 * frame finishes leaving the room and only then goes (`onGone`): pulled out
 * mid-leave, it would linger in the call as a ghost for a minute.
 */
function Call({
  v,
  attempt,
  hidden = false,
  onLeave,
  onGone,
  onApi,
}: Readonly<{
  v: Extract<VisioJoin, { provider: "hosted" }>;
  attempt: number;
  hidden?: boolean;
  onLeave: () => void;
  onGone: () => void;
  onApi?: (api: CallApi) => void;
}>) {
  // Jitsi's own buttons speak the page's language; the transcription is in the
  // interview's (the job's), the same for the recruiter and the candidate; when
  // the job does not tell (or an older server), the language this page is read in.
  const locale = useLocale() as Locale;
  // Which try has something on screen: a new one starts covered again.
  const [shown, setShown] = useState<number | null>(null);
  const unwatch = useRef<(() => void) | null>(null);
  useEffect(() => () => unwatch.current?.(), []);
  // Hidden by the page (« Terminer », a click outside Jitsi): gone at the latest after the grace.
  useEffect(() => {
    if (!hidden) return;
    const t = setTimeout(onGone, LEAVE_GRACE_MS);
    return () => clearTimeout(t);
  }, [hidden, onGone]);

  return (
    <div className={cn("relative size-full", hidden && "hidden")}>
    {shown !== attempt && <CallOpening key={`opening-${attempt}`} />}
    <JitsiMeeting
      onApiReady={(raw) => {
        const api = raw as unknown as CallApi;
        unwatch.current?.();
        unwatch.current = whenCallShows(api, raw.getIFrame() as HTMLIFrameElement | null, () => setShown(attempt));
        let left = false;
        const leave = () => {
          if (left) return;
          left = true;
          onLeave();
        };
        // The red button: the page moves on now, not when Jitsi is done.
        api.addListener("toolbarButtonClicked", (e) => {
          if (e?.key && LEAVE_BUTTONS.includes(e.key)) leave();
        });
        // Ended for everyone by someone else: the same.
        api.addListener("errorOccurred", (e) => {
          if (e?.name === "conference.destroyed") leave();
        });
        // Out of the room: the frame can go.
        api.addListener("videoConferenceLeft", () => {
          leave();
          onGone();
        });
        onApi?.(api);
      }}
      key={attempt}
      domain={v.domain}
      roomName={v.roomName}
      jwt={v.jwt}
      lang={locale}
      configOverwrite={{
        subject: v.jobTitle,
        transcription: { useAppLanguage: false, preferredLanguage: INTL_LOCALE[v.language ?? locale] },
        prejoinConfig: { enabled: true, hideExtraJoinButtons: ["no-audio", "by-phone"] },
        toolbarButtons: TOOLBAR,
        recordings: { showPrejoinWarning: false },
        disableDeepLinking: true,
        disableInviteFunctions: true,
        enableWelcomePage: false,
        enableClosePage: false,
        hideConferenceTimer: false,
        // On for « Partager une vidéo » (YouTube). Gravatar stays off: no email
        // hash leaves for an avatar.
        disableThirdPartyRequests: false,
        gravatar: { disabled: true },
        // « Commencer l'enregistrement » records in the browser, to a file; everyone
        // in the call is told when it starts.
        localRecording: { notifyAllParticipants: true },
        notifications: [],
        buttonsWithNotifyClick: LEAVE_BUTTONS.map((key) => ({ key, preventExecution: false })),
        logging: { defaultLogLevel: "error", loggers: {} },
      }}
      interfaceConfigOverwrite={{ SHOW_PROMOTIONAL_CLOSE_PAGE: false, MOBILE_APP_PROMO: false, SHOW_CHROME_EXTENSION_BANNER: false }}
      getIFrameRef={(node) => {
        node.style.height = "100%";
        node.style.width = "100%";
      }}
      onReadyToClose={() => {
        onLeave();
        onGone();
      }}
    />
    </div>
  );
}

type CallApi = CallCaptionsApi;

function Notice({
  v,
  onRejoin,
  onReport,
  onEnd,
  ended = false,
}: Readonly<{ v: VisioJoin; onRejoin: () => void; onReport?: () => void; onEnd?: () => void; ended?: boolean }>) {
  const tv = useTranslations("interviews.visio");
  return (
    <div className="flex size-full items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-5 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-page">
          <IconVideo className="size-5 text-muted-foreground" />
        </span>
        {v.provider === "jitsi" ? (
          <>
            <p className="text-muted-foreground text-sm">{tv("newTab")}</p>
            <Button className="w-full rounded-full" render={<a href={v.url} target="_blank" rel="noreferrer" />}>
              {tv("join")}
              <IconExternalLink className="size-4" />
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-1">
              <p className="font-medium">{ended ? tv("ended") : tv("left")}</p>
              {ended && <p className="text-muted-foreground text-sm">{tv("linkClosed")}</p>}
            </div>
            {onReport && (
              <Button className="w-full rounded-full" onClick={onReport}>
                <IconFileText className="size-4" />
                {tv("openReport")}
              </Button>
            )}
            {!ended && (
              <Button variant="ghost" className="w-full rounded-full bg-page" onClick={onRejoin}>
                {tv("rejoin")}
              </Button>
            )}
            {!ended && onEnd && (
              <Button variant="ghost" className="w-full rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={onEnd}>
                <IconPlayerStop className="size-4" />
                {tv("end")}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** What fills the host's call area: loading, unavailable, the call, or where it stands. */
function HostCallArea({
  room,
  loading,
  error,
  v,
  inCall,
  ended,
  attempt,
  canJoinAsGuest,
  framed,
  onApi,
  onLeave,
  onGone,
  onRejoin,
  onReport,
  onEnd,
}: Readonly<{
  room: string;
  loading: boolean;
  error: unknown;
  v: VisioJoin | undefined;
  inCall: boolean;
  ended: boolean;
  attempt: number;
  canJoinAsGuest: boolean;
  /** The frame still there: in the call, or finishing to leave it. */
  framed: boolean;
  onApi: (api: CallApi) => void;
  onLeave: () => void;
  onGone: () => void;
  onRejoin: () => void;
  onReport: () => void;
  onEnd: () => void;
}>) {
  const tv = useTranslations("interviews.visio");
  const friendlyError = useFriendlyError();
  if (loading) return <div className="relative size-full"><CallOpening /></div>;

  if (!v) {
    return (
      <div className="flex size-full items-center justify-center p-6">
        <div className="max-w-sm space-y-2 text-center">
          <p className="font-semibold">{tv("unavailable")}</p>
          <p className="text-muted-foreground text-sm">
            {friendlyError(error, tv("notYours"))}
          </p>
          {canJoinAsGuest && (
            <Link href={`/visio/${encodeURIComponent(room)}?invite=1`} className="inline-block pt-2 font-medium text-sm underline underline-offset-2">
              {tv("joinAsGuest")}
            </Link>
          )}
        </div>
      </div>
    );
  }

  const id = v.interviewId;
  const call = v.provider === "hosted" && framed && (
    <Call
      v={v}
      attempt={attempt}
      hidden={!inCall}
      onGone={onGone}
      onApi={(a) => {
          onApi(a);
          // In the call: its real start, for the « Compte rendu » (kept once).
        if (id) a.addListener("videoConferenceJoined", () => void markCallStarted(id).catch(() => undefined));
      }}
      onLeave={onLeave}
    />
  );
  if (v.provider === "hosted" && inCall) return call;

  return (
    <>
      {call}
      {/* Ended in Rabotka's call: done, the report on its way, a note to add. */}
      {ended && id && v.provider === "hosted" ? (
        <CallEnded interviewId={id} candidateName={v.candidateName} jobTitle={v.jobTitle} endedAt={v.endedAt} onOpenReport={onReport} />
      ) : (
        <Notice v={v} ended={ended} onRejoin={onRejoin} onReport={id ? onReport : undefined} onEnd={id ? onEnd : undefined} />
      )}
    </>
  );
}

export function InterviewVisioPage({ room }: Readonly<{ room: string }>) {
  const tv = useTranslations("interviews.visio");
  const whyNot = useWhyNot();
  const locale = useLocale() as Locale;
  const friendlyError = useFriendlyError();
  const [left, setLeft] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const query = useQuery(visioQuery(room, true));
  const v = query.data;
  const [reportOpen, setReportOpen] = useState(false);
  const queryClient = useQueryClient();
  const api = useRef<CallApi | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [sharing, setSharing] = useState(false);
  const videoPlan = useVideoPlan();
  // Our Jitsi transcribes the call; its sentences go to the « Compte rendu ».
  const captions = useCallCaptions(v?.interviewId ?? undefined, videoPlan.allowed);
  const [endedNow, setEndedNow] = useState(false);
  const [gone, setGone] = useState(false);
  const onGone = useCallback(() => setGone(true), []);
  const ended = endedNow || Boolean(v?.endedAt);
  const end = useMutation({
    mutationFn: () => endInterview(v?.interviewId ?? ""),
    // Ended at once, for everyone: no wait on the server to close the call.
    onMutate: () => {
      try {
        api.current?.executeCommand("endConference");
      } catch {
        // already gone
      }
      setEndedNow(true);
      setLeft(true);
      setConfirmEnd(false);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: interviewsKey });
      // The report now waits a couple of minutes before writing itself: the end screen shows it.
      void queryClient.invalidateQueries({ queryKey: interviewReportKey(v?.interviewId ?? "") });
    },
    onError: (err) => {
      // Not recorded as ended: « Rejoindre » and « Terminer » stay offered.
      setEndedNow(false);
      toast.error(friendlyError(err, tv("endFailed")));
    },
  });
  const rejoin = () => {
    setReportOpen(false);
    setAttempt((n) => n + 1);
    setGone(false);
    setLeft(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-full bg-card"
          aria-label={tv("back")}
          render={<Link href="/espace/entretiens" />}
        >
          <IconArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0">
          {v ? (
            <>
              <h1 className="truncate font-semibold text-lg leading-tight">{tv("with", { name: v.candidateName })}</h1>
              <p className="truncate text-muted-foreground text-sm">
                {v.jobTitle} · {when(v.startsAt, locale)} · {v.durationMinutes} min
              </p>
            </>
          ) : (
            <h1 className="font-semibold text-lg">{tv("title")}</h1>
          )}
        </div>
        {v?.interviewId && !ended && (
          <div className="ml-auto flex min-w-0 items-center gap-2">
            <span title={videoPlan.allowed ? tv("share") : tv("shareLocked")}>
              <Button
                type="button"
                variant="ghost"
                className="h-10 shrink-0 rounded-full bg-card px-4 text-sm sm:h-10"
                aria-label={tv("share")}
                disabled={!videoPlan.allowed}
                title={whyNot([!videoPlan.allowed, { say: tv("shareLocked") }])}
                onClick={() => setSharing(true)}
              >
                {videoPlan.allowed ? <IconUserPlus className="size-4" /> : <IconLock className="size-4" />}
                <span className="hidden lg:inline">{tv("shareShort")}</span>
              </Button>
            </span>
            {v.provider === "hosted" && !left && (
              <Button
                type="button"
                variant="ghost"
                className="h-10 shrink-0 rounded-full bg-card px-4 text-destructive text-sm hover:bg-destructive/10 hover:text-destructive sm:h-10"
                onClick={() => setConfirmEnd(true)}
              >
                <IconPlayerStop className="size-4" />
                <span className="hidden lg:inline">{tv("endShort")}</span>
              </Button>
            )}
          </div>
        )}
        {/* Ended: « Ouvrir le compte rendu » below says the same. */}
        {v?.interviewId && !ended && (
          <Button type="button" className="h-10 shrink-0 rounded-full px-4 text-sm" onClick={() => setReportOpen(true)}>
            <IconNotes className="size-4" />
            {tv("notes")}
          </Button>
        )}
      </div>

      <div>
        <section className="h-[calc(100dvh-12rem-env(safe-area-inset-top))] min-h-96 overflow-hidden rounded-2xl bg-card sm:rounded-3xl">
          <HostCallArea
            room={room}
            loading={query.isLoading}
            error={query.error}
            v={v}
            inCall={!left && !ended}
            ended={ended}
            attempt={attempt}
            framed={!gone}
            onGone={onGone}
            canJoinAsGuest={videoPlan.allowed}
            onApi={(a) => {
              api.current = a;
              captions(a);
            }}
            onLeave={() => {
              setLeft(true);
              // Ended by a colleague's « Terminer »: the page says so, not « Rejoindre ».
              void query.refetch();
            }}
            onRejoin={rejoin}
            onReport={() => setReportOpen(true)}
            onEnd={() => setConfirmEnd(true)}
          />
        </section>
      </div>
      {sharing && v?.interviewId && (
        <InviteGuestDialog
          interview={{ id: v.interviewId, candidateName: v.candidateName, jobTitle: v.jobTitle, location: visioLink(room) }}
          open={sharing}
          onOpenChange={setSharing}
        />
      )}
      <ActionDialog
        open={confirmEnd}
        onOpenChange={setConfirmEnd}
        tone="warning"
        title={tv("endTitle")}
        description={tv("endText")}
        confirmLabel={tv("end")}
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
  const tv = useTranslations("interviews.visio");
  const locale = useLocale() as Locale;
  const friendlyError = useFriendlyError();
  const [left, setLeft] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const query = useQuery(visioQuery(room, false, guestToken));
  const v = query.data;
  const [closed, setClosed] = useState<string | null>(null);
  const [gone, setGone] = useState(false);
  const onGone = useCallback(() => setGone(true), []);
  // Told by the call itself: the server transcribes it (for the business's compte rendu).
  const [transcribed, setTranscribed] = useState(false);
  // Back to the top: the card below is read from its start, not where the call left the page.
  const leave = () => {
    setLeft(true);
    window.scrollTo(0, 0);
  };

  // Too early: the interview, when the visio opens, how to get ready.
  if (v?.provider === "waiting") {
    return <VisioWaiting v={v} onOpen={() => void query.refetch()} />;
  }

  // Kept (hidden) after leaving, until Jitsi is out of the room.
  const call = v?.provider === "hosted" && !gone && (
      // Pinned to the screen: nothing scrolls, so the browser's bars never push the call around.
      <main
        className={cn(
          "fixed inset-x-0 top-[env(safe-area-inset-top)] bottom-0 z-40 flex flex-col overflow-hidden overscroll-none bg-page",
          left && "hidden",
        )}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-2.5 sm:px-6 sm:py-3">
          <div className="min-w-0">
            <p className="truncate font-semibold text-sm">{v.jobTitle}</p>
            <p className="truncate text-muted-foreground text-xs">
              {v.businessName} · {when(v.startsAt, locale)}
            </p>
          </div>
          <span className="hidden shrink-0 sm:block">
            <BusinessLockup compact />
          </span>
        </header>
        <div className="min-h-0 flex-1 px-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] sm:px-4 sm:pb-4">
          <div className="relative size-full overflow-hidden rounded-2xl bg-card sm:rounded-3xl">
            <Call
              v={v}
              attempt={attempt}
              hidden={left}
              onLeave={leave}
              onGone={onGone}
              onApi={(a) => a.addListener("transcribingStatusChanged", (e) => setTranscribed(Boolean(e?.on)))}
            />
            {!left && transcribed && (
              <div className="pointer-events-none absolute inset-x-0 top-2 z-10 flex justify-center px-3">
                <span className="flex items-center gap-2 rounded-full bg-card/95 px-3 py-1.5 text-xs shadow-soft">
                  <span className="relative flex size-2 shrink-0">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive/60" />
                    <span className="relative inline-flex size-2 rounded-full bg-destructive" />
                  </span>
                  <span>{tv("transcribed")}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </main>
  );
  if (call && !left) return call;

  return (
    <>
    {call}
    <main className={cn(SCREEN_MIN, "bg-page px-4 py-8 sm:py-14")}>
      <div className="mx-auto w-full max-w-lg space-y-6">
        <div className="flex justify-center">
          <BusinessLockup />
        </div>
        <section className="space-y-4 rounded-3xl bg-card p-6 text-center sm:p-8">
          {query.isLoading && (
            <div className="space-y-4">
              <Bone className="mx-auto h-6 w-2/3" />
              <Bone className="h-12 w-full rounded-full" />
            </div>
          )}
          {!query.isLoading && !v && (
            <div className="space-y-2">
              <h1 className="font-semibold text-lg">{tv("unavailable")}</h1>
              <p className="text-muted-foreground text-sm">
                {friendlyError(query.error, tv("invalidLink"))}
              </p>
            </div>
          )}
          {!query.isLoading && v && (
            <>
              <div className="space-y-1">
                <h1 className="font-semibold text-lg">{v.jobTitle}</h1>
                <p className="text-muted-foreground text-sm">
                  {v.businessName} · {when(v.startsAt, locale)}
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
                        setClosed(friendlyError(r.error, tv("over")));
                        return;
                      }
                      setAttempt((n) => n + 1);
                      setGone(false);
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
    </>
  );
}
