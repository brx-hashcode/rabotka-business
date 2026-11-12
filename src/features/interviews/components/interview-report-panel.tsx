"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  IconCheck,
  IconCopy,
  IconFileText,
  IconMail,
  IconMicrophone,
  IconPencil,
  IconPlus,
  IconPlayerStopFilled,
  IconFileTypePdf,
  IconRefresh,
} from "@tabler/icons-react";

import { Bone } from "#/components/page-skeletons";
import { useDictation } from "#/features/interviews/use-dictation";
import { PreviewSheet } from "#/components/preview-sheet";
import { appConfig } from "#/config";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "#/components/ui/dialog";
import { Textarea } from "#/components/ui/textarea";
import { friendlyError } from "#/lib/api/friendly-error";
import {
  editInterviewReport,
  getInterviewReport,
  getInterviewTranscript,
  interviewReportKey,
  interviewTranscriptKey,
  type InterviewTranscript,
  interviewsKey,
  saveInterviewNotes,
  sendInterviewReport,
  writeInterviewReport,
} from "#/lib/api/interview-controller";
import { getTeam, teamKey } from "#/lib/api/team-controller";
import type { InterviewReport, InterviewReportBody } from "#/lib/api/types";
import { cn } from "#/lib/utils";

const MIN_NOTES = 40;
const MAX_NOTES = 8000;

type Props = {
  interviewId: string;
  candidateName: string;
  jobTitle: string;
  startsAt: string;
};

/**
 * « Compte rendu » of an interview: the team's notes (typed or dictated,
 * saved as they go), then the report the AI writes from them, which the
 * team edits, sends to itself by e-mail, or prints.
 */
export function InterviewReportPanel({ interviewId, candidateName, jobTitle }: Readonly<Props>) {
  const queryClient = useQueryClient();
  const key = interviewReportKey(interviewId);
  const query = useQuery({
    queryKey: key,
    queryFn: () => getInterviewReport(interviewId),
    // Written in the background: looked at again until it is there (the bell tells too).
    refetchInterval: (q) => (q.state.data?.writing ? 3000 : false),
  });
  const saved = query.data;
  const [draft, setDraft] = useState<string | null>(null);
  const notes = draft ?? saved?.notes ?? "";
  const [editing, setEditing] = useState<InterviewReportBody | null>(null);
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState(false);

  const store = (data: InterviewReport) => {
    queryClient.setQueryData(key, data);
    void queryClient.invalidateQueries({ queryKey: interviewsKey });
  };

  const save = useMutation({ mutationFn: (text: string) => saveInterviewNotes(interviewId, text), onSuccess: store });
  // Saved a second after the last keystroke (or dictated phrase).
  useEffect(() => {
    if (draft === null || draft === saved?.notes) return;
    const timer = setTimeout(() => save.mutate(draft), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the text decides
  }, [draft]);

  const write = useMutation({
    mutationFn: async () => {
      // The notes on screen are the ones written from, even typed a second ago.
      if (draft !== null && draft !== saved?.notes) await saveInterviewNotes(interviewId, draft);
      return writeInterviewReport(interviewId);
    },
    onSuccess: (data) => {
      store(data);
      setEditing(null);
      toast.success("Rédaction lancée : vous pouvez fermer cette fenêtre, une notification vous préviendra.");
    },
    onError: (err) => toast.error(friendlyError(err, "Le compte rendu n'a pas pu être rédigé.")),
  });
  const edit = useMutation({
    mutationFn: (r: InterviewReportBody) => editInterviewReport(interviewId, r),
    onSuccess: (data) => {
      store(data);
      setEditing(null);
      toast.success("Compte rendu enregistré.");
    },
    onError: (err) => toast.error(friendlyError(err, "Les modifications n'ont pas pu être enregistrées.")),
  });

  const dictation = useDictation((text) => setDraft((d) => joinText(d ?? saved?.notes ?? "", text).slice(0, MAX_NOTES)));
  const report = saved?.report ?? null;
  // In the background (the server's mark), or the request that starts it.
  const writing = Boolean(saved?.writing) || write.isPending;
  // Both sides' speech, merged by time, when the interview was transcribed.
  const transcript = useQuery({
    queryKey: interviewTranscriptKey(interviewId),
    queryFn: () => getInterviewTranscript(interviewId),
    refetchInterval: (q) => (q.state.data?.transcribe ? 8000 : false),
  });
  const lines = transcript.data?.lines ?? [];
  const spoken = lines.reduce((n, l) => n + l.text.length, 0);
  const live = transcript.data?.transcribe ?? false;
  const hasTranscript = lines.length > 0 || live;
  const turns = toTurns(lines);
  // Opens on the transcription once there is one; the tab chosen after that stays.
  const [tabChoice, setTab] = useState<"transcript" | "notes" | null>(null);
  const tab = hasTranscript ? (tabChoice ?? (lines.length > 0 ? "transcript" : "notes")) : "notes";
  const enough = notes.trim().length >= MIN_NOTES || spoken >= MIN_NOTES;

  if (query.isLoading) {
    return (
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Bone className="h-64 w-full rounded-2xl" />
        <Bone className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const status = save.isPending ? "Enregistrement…" : draft !== null && draft !== saved?.notes ? "Modifié" : saved?.updatedAt ? "Enregistré" : "";

  return (
    <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* Left: what the report is written from: the transcription, and the team's notes. */}
      <section className="flex min-h-0 flex-col gap-3">
        <div className="flex min-h-80 flex-1 flex-col overflow-hidden rounded-2xl bg-page">
          <div className="flex items-center gap-1 px-2 pt-2">
            {hasTranscript ? (
              <>
                <TabButton on={tab === "transcript"} onClick={() => setTab("transcript")} label="Transcription" count={turns.length} />
                <TabButton on={tab === "notes"} onClick={() => setTab("notes")} label="Vos notes" />
              </>
            ) : (
              <h3 className="px-2 py-1.5 font-semibold text-sm">Vos notes</h3>
            )}
            <span className="ml-auto flex items-center gap-1.5 px-2 text-muted-foreground text-xs" aria-live="polite">
              {tab === "transcript" ? (
                live ? (
                  <>
                    <span className="size-2 rounded-full bg-destructive" />
                    En cours
                  </>
                ) : (
                  "Automatique"
                )
              ) : (
                <>
                  {status === "Enregistré" && <IconCheck className="size-3.5" />}
                  {status}
                </>
              )}
            </span>
          </div>
          {tab === "transcript" ? (
            <Conversation
              turns={turns}
              live={live}
              consent={transcript.data?.consent ?? null}
              onAdd={(t) => {
                setDraft(joinText(notes, `${t.speaker} : ${t.text}`).slice(0, MAX_NOTES));
                toast.success("Ajouté à vos notes.");
              }}
            />
          ) : (
            <>
          <Textarea
            value={notes}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_NOTES))}
            placeholder="Ce qu'il a dit de son expérience, ses disponibilités, ses prétentions, votre impression…"
            className="min-h-48 flex-1 resize-none rounded-none border-0 bg-transparent px-4 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          {dictation.listening ? (
            <div className="space-y-2 px-4 pb-3" role="status" aria-live="polite">
              <div className="flex items-center gap-3 rounded-full bg-card py-1 pr-1 pl-3">
                <span className="relative flex size-2.5 shrink-0">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive/60" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-destructive" />
                </span>
                <Elapsed since={dictation.startedAt} />
                <LiveWaveform analyser={dictation.analyser} />
                <button
                  type="button"
                  aria-label="Arrêter la dictée"
                  title="Arrêter la dictée"
                  onClick={dictation.stop}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive text-white transition-transform hover:scale-105"
                >
                  <IconPlayerStopFilled className="size-3.5" />
                </button>
              </div>
              <p className={cn("line-clamp-2 min-h-5 text-sm", dictation.interim ? "text-foreground/70" : "text-muted-foreground italic")}>
                {dictation.interim || "Je vous écoute… vos phrases s'ajoutent aux notes."}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 px-3 pb-3">
              {dictation.supported ? (
                <Button type="button" variant="ghost" className="h-9 rounded-full bg-card px-3.5 text-sm" onClick={() => void dictation.start()}>
                  <IconMicrophone className="size-4" />
                  Dicter
                </Button>
              ) : (
                <span />
              )}
              <span className="text-muted-foreground text-xs tabular-nums">
                {notes.length > MAX_NOTES * 0.8 ? `${notes.length} / ${MAX_NOTES}` : ""}
              </span>
            </div>
          )}
            </>
          )}
        </div>
        <div className="flex gap-2">
          {tab === "transcript" && turns.length > 0 && (
            <Button type="button" variant="ghost" className="h-11 shrink-0 rounded-full bg-page px-4 text-sm sm:h-11" onClick={() => void copyTranscript(turns)}>
              <IconCopy className="size-4" />
              Copier
            </Button>
          )}
          <Button type="button" className="h-11 flex-1 rounded-full text-sm sm:h-11" disabled={!enough || writing} loading={write.isPending} onClick={() => write.mutate()}>
            {report ? <IconRefresh className={cn("size-4", writing && "animate-spin")} /> : <IconFileText className="size-4" />}
            {writing ? "Rédaction en cours…" : report ? "Réécrire le compte rendu" : "Rédiger le compte rendu"}
          </Button>
        </div>
        <p className="text-center text-muted-foreground text-xs">
          {enough
            ? lines.length > 0
              ? "Rédigé par IA à partir de la transcription et de vos notes : relisez-le avant de l'envoyer."
              : "Rédigé par IA à partir de vos notes : relisez-le avant de l'envoyer."
            : "Quelques lignes de notes, ou la transcription de l'entretien, suffisent pour rédiger le compte rendu."}
          {tab === "notes" && dictation.supported && " La dictée passe par le service vocal de votre navigateur."}
        </p>
      </section>

      {/* Right: the report, read, edited, sent or printed. */}
      <section className="flex min-h-0 flex-col rounded-2xl bg-page lg:overflow-hidden">
        {!writing && saved?.writingError && (
          <p className="mx-5 mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-destructive text-sm" role="alert">
            {saved.writingError}
          </p>
        )}
        {writing && !report ? (
          <div className="space-y-4 p-5">
            <WritingNotice />
            <Bone className="h-5 w-1/3" />
            <Bone className="h-24 w-full rounded-xl" />
            <Bone className="h-16 w-full rounded-xl" />
          </div>
        ) : !report ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-card">
              <IconFileText className="size-5 text-muted-foreground" />
            </span>
            <div className="max-w-xs space-y-1">
              <p className="font-medium text-sm">Le compte rendu apparaîtra ici</p>
              <p className="text-muted-foreground text-xs">
                Prenez vos notes pendant ou après l&apos;entretien, puis « Rédiger le compte rendu » : résumé, points forts, points de vigilance et prochaines étapes.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-3">
              <div className="min-w-0">
                <h3 className="font-semibold">Compte rendu</h3>
                <p className="text-muted-foreground text-xs">
                  {saved?.sentAt
                    ? `Envoyé à l'équipe le ${new Date(saved.sentAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`
                    : "Pas encore envoyé"}
                </p>
              </div>
              {!editing && (
                <div className="flex items-center gap-1.5">
                  <IconAction label="Modifier" onClick={() => setEditing(report)}>
                    <IconPencil className="size-4" />
                  </IconAction>
                  <IconAction label="Aperçu PDF" onClick={() => setPreview(true)}>
                    <IconFileTypePdf className="size-4" />
                  </IconAction>
                  <Button type="button" className="h-9 rounded-full px-3.5 text-sm" onClick={() => setSending(true)}>
                    <IconMail className="size-4" />
                    {saved?.sentAt ? "Renvoyer" : "Envoyer à l'équipe"}
                  </Button>
                </div>
              )}
            </div>
            {writing && (
              <div className="px-5 pb-3">
                <WritingNotice again />
              </div>
            )}
            <div className={cn("min-h-0 flex-1 px-5 pb-5 lg:overflow-y-auto", writing && "pointer-events-none opacity-50")}>
              {editing ? (
                <ReportEditor value={editing} onChange={setEditing} onCancel={() => setEditing(null)} onSave={() => edit.mutate(editing)} pending={edit.isPending} />
              ) : (
                <ReportView report={report} />
              )}
            </div>
          </>
        )}
      </section>

      {/* The Rabotka document, read, downloaded or printed from the panel; a new version after each change. */}
      {report && (
        <PreviewSheet
          open={preview}
          onOpenChange={setPreview}
          title="Compte rendu d'entretien"
          subtitle={`${candidateName} · ${jobTitle}`}
          src={`${appConfig.apiUrl}/business/me/interviews/${encodeURIComponent(interviewId)}/report.pdf?v=${encodeURIComponent(saved?.updatedAt ?? "")}`}
          kind="pdf"
          fileName={`compte-rendu-${slug(candidateName)}.pdf`}
          unavailable="Le document n'a pas pu être créé. Réessayez dans un instant."
        />
      )}
      {sending && <SendDialog interviewId={interviewId} onClose={() => setSending(false)} onSent={store} />}
    </div>
  );
}

type Turn = { key: string; at: string; speaker: string; role: InterviewTranscript["lines"][number]["role"]; text: string };

/** The rows of the transcription, in the order spoken. */
function toTurns(lines: InterviewTranscript["lines"]): Turn[] {
  const turns: Turn[] = [];
  for (const l of lines) {
    const last = turns.at(-1);
    // One row per sentence, as recognised; only an exact repeat is dropped.
    if (last && last.speaker === l.speaker && last.text === l.text) continue;
    turns.push({ key: `${l.at}-${turns.length}`, at: l.at, speaker: l.speaker, role: l.role, text: l.text });
  }
  return turns;
}

const hhmm = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

async function copyTranscript(turns: Turn[]) {
  try {
    await navigator.clipboard.writeText(turns.map((t) => `[${hhmm(t.at)}] ${t.speaker} : ${t.text}`).join("\n"));
    toast.success("Transcription copiée.");
  } catch {
    toast.error("La transcription n'a pas pu être copiée.");
  }
}

/** Who spoke, at a glance: the candidate in green, an invited person in violet. */
const SPEAKER_TONE: Record<Turn["role"], string> = {
  HOST: "text-foreground",
  CANDIDATE: "text-whatsapp-dark dark:text-whatsapp",
  GUEST: "text-chip-violet-foreground",
};

const CONSENT_LINE: Record<string, string> = {
  ACCEPTED: "Le candidat a accepté la transcription.",
  DECLINED: "Le candidat a refusé : seule la voix de votre équipe est transcrite.",
};

function TabButton({ on, onClick, label, count }: Readonly<{ on: boolean; onClick: () => void; label: string; count?: number }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn("rounded-full px-3.5 py-1.5 text-sm transition-colors", on ? "bg-card font-semibold" : "text-muted-foreground hover:text-foreground")}
    >
      {label}
      {count !== undefined && count > 0 && <span className="ml-1.5 font-normal text-muted-foreground tabular-nums">{count}</span>}
    </button>
  );
}

/**
 * The transcription, one line per sentence: time, who, what. While the call
 * runs it follows the newest line, unless the reader scrolled up.
 */
function Conversation({
  turns,
  live,
  consent,
  onAdd,
}: Readonly<{ turns: Turn[]; live: boolean; consent: string | null; onAdd: (t: Turn) => void }>) {
  const box = useRef<HTMLOListElement>(null);
  const pinned = useRef(true);
  const count = turns.length;
  useEffect(() => {
    const el = box.current;
    if (el && pinned.current) el.scrollTop = el.scrollHeight;
  }, [count]);

  if (turns.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <IconMicrophone className="size-5 text-muted-foreground" />
        <p className="max-w-xs text-muted-foreground text-sm">La transcription s&apos;affiche ici pendant l&apos;appel, phrase après phrase.</p>
      </div>
    );
  }
  return (
    <>
      <ol
        ref={box}
        onScroll={(e) => {
          const el = e.currentTarget;
          pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-2"
      >
        {turns.map((t) => (
          <li key={t.key} className="group flex items-start gap-2 rounded-lg px-1 py-0.5 hover:bg-card/60">
            <span className="w-11 shrink-0 pt-px font-mono text-muted-foreground text-xs tabular-nums">{hhmm(t.at)}</span>
            <p className="min-w-0 flex-1 text-sm leading-relaxed">
              <span className={cn("font-medium", SPEAKER_TONE[t.role])}>{t.speaker}</span>
              <span className="text-muted-foreground"> : </span>
              {t.text}
            </p>
            <button
              type="button"
              aria-label="Ajouter aux notes"
              title="Ajouter aux notes"
              onClick={() => onAdd(t)}
              className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:bg-card hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
            >
              <IconPlus className="size-3.5" />
            </button>
          </li>
        ))}
      </ol>
      <p className="px-4 pb-3 text-muted-foreground text-xs">
        Reconnue par le navigateur de chacun : elle peut contenir des erreurs.
        {consent ? ` ${CONSENT_LINE[consent] ?? ""}` : live ? " Le candidat n'a pas encore répondu." : ""}
      </p>
    </>
  );
}

/** While the report is written off the page: nobody has to wait in front of it. */
function WritingNotice({ again = false }: Readonly<{ again?: boolean }>) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-card px-4 py-3" role="status" aria-live="polite">
      <span className="relative mt-1 flex size-2.5 shrink-0">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-whatsapp/60" />
        <span className="relative inline-flex size-2.5 rounded-full bg-whatsapp" />
      </span>
      <div className="text-sm">
        <p className="font-medium">{again ? "Nouvelle rédaction en cours…" : "Rédaction en cours…"}</p>
        <p className="text-muted-foreground text-xs">
          Vous pouvez fermer cette fenêtre et continuer : une notification vous prévient dès que le compte rendu est prêt.
        </p>
      </div>
    </div>
  );
}

function IconAction({ label, onClick, children }: Readonly<{ label: string; onClick: () => void; children: React.ReactNode }>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex size-9 items-center justify-center rounded-full bg-card text-muted-foreground hover:text-foreground"
    >
      {children}
    </button>
  );
}

const SECTIONS: { key: "pointsForts" | "pointsDeVigilance" | "prochainesEtapes"; title: string }[] = [
  { key: "pointsForts", title: "Points forts" },
  { key: "pointsDeVigilance", title: "Points de vigilance" },
  { key: "prochainesEtapes", title: "Prochaines étapes" },
];

function practical(r: InterviewReportBody): string[] {
  return [
    r.infosPratiques.disponibilite && `Disponibilité : ${r.infosPratiques.disponibilite}`,
    r.infosPratiques.pretentions && `Prétentions : ${r.infosPratiques.pretentions}`,
    r.infosPratiques.mobilite && `Mobilité : ${r.infosPratiques.mobilite}`,
  ].filter((x): x is string => Boolean(x));
}

function Block({ title, items, tone }: Readonly<{ title: string; items: string[]; tone?: "good" | "warn" }>) {
  if (!items.length) return null;
  return (
    <div className={cn("space-y-1.5", tone && "rounded-xl bg-card p-3")}>
      <p className="flex items-center gap-2 font-medium text-sm">
        {tone && <span className={cn("size-2 rounded-full", tone === "good" ? "bg-whatsapp" : "bg-amber-500")} />}
        {title}
      </p>
      <ul className="list-disc space-y-1 pl-5 text-sm">
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </div>
  );
}

export function ReportView({ report: r }: Readonly<{ report: InterviewReportBody }>) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed">{r.resume}</p>
      {(r.pointsForts.length > 0 || r.pointsDeVigilance.length > 0) && (
        <div className={cn("grid gap-3", r.pointsForts.length > 0 && r.pointsDeVigilance.length > 0 && "sm:grid-cols-2")}>
          <Block title="Points forts" items={r.pointsForts} tone="good" />
          <Block title="Points de vigilance" items={r.pointsDeVigilance} tone="warn" />
        </div>
      )}
      {r.reponsesCles.length > 0 && (
        <div className="space-y-1.5">
          <p className="font-medium text-sm">Réponses clés</p>
          <dl className="space-y-2 text-sm">
            {r.reponsesCles.map((x) => (
              <div key={x.question} className="rounded-xl bg-card px-3 py-2">
                <dt className="text-muted-foreground text-xs">{x.question}</dt>
                <dd>{x.reponse}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
      <Block title="Infos pratiques" items={practical(r)} />
      {r.avisRecruteur && (
        <div className="space-y-1.5">
          <p className="font-medium text-sm">Avis du recruteur</p>
          <blockquote className="border-muted-foreground/30 border-l-2 pl-3 text-muted-foreground text-sm italic">{r.avisRecruteur}</blockquote>
        </div>
      )}
      <Block title="Prochaines étapes" items={r.prochainesEtapes} />
    </div>
  );
}

/** Each section in a field; the lists one item per line. */
function ReportEditor({
  value: r,
  onChange,
  onCancel,
  onSave,
  pending,
}: Readonly<{
  value: InterviewReportBody;
  onChange: (r: InterviewReportBody) => void;
  onCancel: () => void;
  onSave: () => void;
  pending: boolean;
}>) {
  const field = "rounded-xl border-0 bg-card text-sm";
  const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
  return (
    <div className="space-y-3">
      <label className="block space-y-1">
        <span className="font-medium text-sm">Résumé</span>
        <Textarea value={r.resume} onChange={(e) => onChange({ ...r, resume: e.target.value })} className={cn(field, "min-h-28")} />
      </label>
      {SECTIONS.map((s) => (
        <label key={s.key} className="block space-y-1">
          <span className="font-medium text-sm">
            {s.title} <span className="font-normal text-muted-foreground">(un par ligne)</span>
          </span>
          <Textarea
            defaultValue={r[s.key].join("\n")}
            onChange={(e) => onChange({ ...r, [s.key]: lines(e.target.value) })}
            className={cn(field, "min-h-20")}
          />
        </label>
      ))}
      <div className="grid gap-3 sm:grid-cols-3">
        {(["disponibilite", "pretentions", "mobilite"] as const).map((k) => (
          <label key={k} className="block space-y-1">
            <span className="font-medium text-sm">{{ disponibilite: "Disponibilité", pretentions: "Prétentions", mobilite: "Mobilité" }[k]}</span>
            <Textarea
              value={r.infosPratiques[k]}
              onChange={(e) => onChange({ ...r, infosPratiques: { ...r.infosPratiques, [k]: e.target.value } })}
              className={cn(field, "min-h-12")}
            />
          </label>
        ))}
      </div>
      <label className="block space-y-1">
        <span className="font-medium text-sm">Avis du recruteur</span>
        <Textarea value={r.avisRecruteur} onChange={(e) => onChange({ ...r, avisRecruteur: e.target.value })} className={cn(field, "min-h-16")} />
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" className="h-9 rounded-full bg-card px-4 text-sm" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="button" className="h-9 rounded-full px-4 text-sm" loading={pending} onClick={onSave}>
          <IconCheck className="size-4" />
          Enregistrer
        </Button>
      </div>
    </div>
  );
}

/** To the team only: the members chosen, by default those who get the hiring e-mails. */
function SendDialog({
  interviewId,
  onClose,
  onSent,
}: Readonly<{ interviewId: string; onClose: () => void; onSent: (r: InterviewReport) => void }>) {
  const team = useQuery({ queryKey: teamKey, queryFn: getTeam });
  const members = (team.data?.members ?? []).filter((m) => m.status === "ACTIVE");
  const [picked, setPicked] = useState<Set<string> | null>(null);
  const chosen = picked ?? new Set(members.filter((m) => m.emailsOn).map((m) => m.id));
  const send = useMutation({
    mutationFn: () => sendInterviewReport(interviewId, [...chosen]),
    onSuccess: (data) => {
      onSent(data);
      toast.success(data.sentTo > 1 ? `Compte rendu envoyé à ${data.sentTo} personnes.` : "Compte rendu envoyé.");
      onClose();
    },
    onError: (err) => toast.error(friendlyError(err, "Le compte rendu n'a pas pu être envoyé.")),
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-3xl border-0 bg-card p-6 shadow-soft sm:max-w-md">
        <DialogTitle>Envoyer le compte rendu</DialogTitle>
        <DialogDescription>Par e-mail, aux membres de votre équipe que vous choisissez.</DialogDescription>
        {team.isLoading ? (
          <Bone className="h-24 w-full rounded-2xl" />
        ) : (
          <ul className="max-h-72 space-y-1 overflow-y-auto">
            {members.map((m) => (
              <li key={m.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 hover:bg-page">
                  <Checkbox
                    checked={chosen.has(m.id)}
                    onCheckedChange={(on) => {
                      const next = new Set(chosen);
                      if (on) next.add(m.id);
                      else next.delete(m.id);
                      setPicked(next);
                    }}
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-sm">{m.name}</span>
                    <span className="block truncate text-muted-foreground text-xs">{m.email}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" className="h-10 rounded-full bg-page px-4" onClick={onClose}>
            Annuler
          </Button>
          <Button type="button" className="h-10 rounded-full px-4" disabled={chosen.size === 0} loading={send.isPending} onClick={() => send.mutate()}>
            Envoyer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function joinText(before: string, added: string): string {
  const a = added.trim();
  if (!a) return before;
  if (!before.trim()) return a.charAt(0).toUpperCase() + a.slice(1);
  return `${before.replace(/\s+$/, "")}${/[.!?]$/.test(before.trim()) ? " " : ". "}${a.charAt(0).toUpperCase()}${a.slice(1)}`;
}


const BAR = 3;
const GAP = 2;
const STEP = BAR + GAP;
/** A new bar every this many ms: the waveform's scrolling speed. */
const TICK = 50;

/**
 * The voice as a live waveform (as on ElevenLabs): rounded bars scrolling
 * right to left, as tall as the microphone's level, fading out on the left.
 * Drawn on a canvas each frame, with no render per frame.
 */
function LiveWaveform({ analyser }: Readonly<{ analyser: AnalyserNode | null }>) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const color = getComputedStyle(canvas).color;
    const samples = analyser ? new Uint8Array(analyser.fftSize) : null;
    const levels: number[] = [];
    let smooth = 0;
    let last = performance.now();
    let frame = 0;

    const level = (t: number) => {
      if (!analyser || !samples) return 0.05 + 0.04 * Math.sin(t / 260);
      analyser.getByteTimeDomainData(samples);
      let sum = 0;
      for (const v of samples) {
        const x = (v - 128) / 128;
        sum += x * x;
      }
      // Speech is quiet in RMS terms: lifted, then eased so bars don't flicker.
      const raw = Math.min(1, Math.sqrt(sum / samples.length) * 5);
      smooth = smooth * 0.35 + raw * 0.65;
      return smooth;
    };

    const draw = (t: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      while (t - last >= TICK) {
        last += TICK;
        levels.push(level(t));
        const max = Math.ceil(w / STEP) + 2;
        if (levels.length > max) levels.splice(0, levels.length - max);
      }
      const shift = ((t - last) / TICK) * STEP;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color;
      for (let i = 0; i < levels.length; i++) {
        const x = w - (levels.length - i) * STEP - shift;
        if (x < -BAR) continue;
        const v = levels[i] ?? 0;
        const bh = Math.max(BAR, v * (h - 2));
        // Faded on the left quarter, full on the right where the voice comes in.
        ctx.globalAlpha = Math.max(0, Math.min(1, x / (w * 0.3))) * (v < 0.06 ? 0.45 : 1);
        ctx.beginPath();
        ctx.roundRect(x, (h - bh) / 2, BAR, bh, BAR / 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [analyser]);
  return <canvas ref={ref} aria-hidden className="h-9 min-w-0 flex-1 text-whatsapp" />;
}

/** How long the dictation has been running, as 0:42. */
function Elapsed({ since }: Readonly<{ since: number }>) {
  const [now, setNow] = useState(since);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);
  const s = Math.max(0, Math.floor((now - since) / 1000));
  return <span className="w-10 shrink-0 font-medium text-sm tabular-nums">{`${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`}</span>;
}

function slug(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "candidat"
  );
}

/** The panel in a large window, from an interview's card on « Entretiens ». */
export function InterviewReportDialog({ open, onOpenChange, ...props }: Readonly<Props & { open: boolean; onOpenChange: (o: boolean) => void }>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        // The PDF opens in a panel portalled outside: a click there is not « outside ».
        onInteractOutside={(ev) => {
          if ((ev.target as HTMLElement | null)?.closest("[data-preview-sheet]")) ev.preventDefault();
        }}
        className="flex max-h-[92svh] w-[calc(100vw-2rem)] flex-col gap-4 overflow-y-auto rounded-3xl border-0 bg-card p-5 shadow-soft sm:max-w-6xl sm:p-6 lg:h-[86svh] lg:overflow-hidden"
      >
        <div className="space-y-1 pr-8">
          <DialogTitle className="text-lg">Compte rendu · {props.candidateName}</DialogTitle>
          <DialogDescription>
            {props.jobTitle} · {new Date(props.startsAt).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
          </DialogDescription>
        </div>
        <InterviewReportPanel {...props} />
      </DialogContent>
    </Dialog>
  );
}
