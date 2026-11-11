"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  IconCheck,
  IconFileText,
  IconMail,
  IconMicrophone,
  IconPencil,
  IconPlayerStopFilled,
  IconFileTypePdf,
  IconRefresh,
} from "@tabler/icons-react";

import { Bone } from "#/components/page-skeletons";
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
  interviewReportKey,
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
  /** Beside the call: notes first, the report below them. */
  compact?: boolean;
};

/**
 * « Compte rendu » of an interview: the team's notes (typed or dictated,
 * saved as they go), then the report the AI writes from them, which the
 * team edits, sends to itself by e-mail, or prints.
 */
export function InterviewReportPanel({ interviewId, candidateName, jobTitle, compact = false }: Readonly<Props>) {
  const queryClient = useQueryClient();
  const key = interviewReportKey(interviewId);
  const query = useQuery({ queryKey: key, queryFn: () => getInterviewReport(interviewId) });
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
  const enough = notes.trim().length >= MIN_NOTES;

  if (query.isLoading) {
    return (
      <div className="space-y-3">
        <Bone className="h-5 w-1/3" />
        <Bone className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-sm">Notes d&apos;entretien</h3>
          <span className="text-muted-foreground text-xs">
            {save.isPending ? "Enregistrement…" : draft !== null && draft !== saved?.notes ? "" : saved?.updatedAt ? "Enregistré" : ""}
          </span>
        </div>
        <Textarea
          value={notes}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX_NOTES))}
          placeholder="Ce qu'il a dit de son expérience, ses disponibilités, ses prétentions, votre impression…"
          className={cn("resize-y rounded-2xl border-0 bg-page", compact ? "min-h-56" : "min-h-40")}
        />
        {dictation.listening && (
          <div className="space-y-2 rounded-2xl bg-page px-4 py-3" role="status" aria-live="polite">
            <div className="flex items-center gap-3">
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
              {dictation.interim || "Je vous écoute… parlez normalement, vos phrases s'ajoutent aux notes."}
            </p>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {dictation.supported && !dictation.listening && (
            <Button type="button" variant="ghost" className="h-9 rounded-full bg-page px-3.5 text-sm" onClick={() => void dictation.start()}>
              <IconMicrophone className="size-4" />
              Dicter
            </Button>
          )}
          <Button type="button" className="h-9 rounded-full px-4 text-sm" disabled={!enough} loading={write.isPending} onClick={() => write.mutate()}>
            {report ? <IconRefresh className="size-4" /> : <IconFileText className="size-4" />}
            {report ? "Réécrire le compte rendu" : "Rédiger le compte rendu"}
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          {enough ? "Le compte rendu est rédigé par IA à partir de vos notes : relisez-le avant de l'envoyer." : "Quelques lignes de notes suffisent pour rédiger le compte rendu."}
          {dictation.supported && " La dictée passe par le service vocal de votre navigateur."}
        </p>
      </section>

      {write.isPending && !report && <Bone className="h-48 w-full rounded-2xl" />}

      {report && (
        <section className="space-y-4 rounded-2xl bg-page p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold">Compte rendu</h3>
              <p className="text-muted-foreground text-xs">
                {candidateName} · {jobTitle}
                {saved?.sentAt ? ` · envoyé le ${new Date(saved.sentAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}` : ""}
              </p>
            </div>
            {!editing && (
              <div className="flex flex-wrap gap-1.5">
                <IconAction label="Modifier" onClick={() => setEditing(report)}>
                  <IconPencil className="size-4" />
                </IconAction>
                <IconAction label="Aperçu PDF" onClick={() => setPreview(true)}>
                  <IconFileTypePdf className="size-4" />
                </IconAction>
                <Button type="button" className="h-9 rounded-full px-3.5 text-sm" onClick={() => setSending(true)}>
                  <IconMail className="size-4" />
                  Envoyer à l&apos;équipe
                </Button>
              </div>
            )}
          </div>

          {editing ? (
            <ReportEditor value={editing} onChange={setEditing} onCancel={() => setEditing(null)} onSave={() => edit.mutate(editing)} pending={edit.isPending} />
          ) : (
            <ReportView report={report} />
          )}
        </section>
      )}

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

function Block({ title, items }: Readonly<{ title: string; items: string[] }>) {
  if (!items.length) return null;
  return (
    <div className="space-y-1.5">
      <p className="font-medium text-sm">{title}</p>
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
      <div className="grid gap-4 sm:grid-cols-2">
        <Block title="Points forts" items={r.pointsForts} />
        <Block title="Points de vigilance" items={r.pointsDeVigilance} />
      </div>
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
          <p className="text-sm">{r.avisRecruteur}</p>
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

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
};

function recognitionClass(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noSubscribe = () => () => {};

/** The browser's own dictation (Chrome, Edge, Safari), in French; absent elsewhere. */
function useDictation(onText: (text: string) => void) {
  const supported = useSyncExternalStore(noSubscribe, () => recognitionClass() !== null, () => false);
  const [listening, setListening] = useState(false);
  /** The words heard so far, not yet final: shown in grey under the notes. */
  const [interim, setInterim] = useState("");
  /** The microphone's level, for the meter; the recognition has no level of its own. */
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const ref = useRef<Recognition | null>(null);
  const wanted = useRef(false);
  const audio = useRef<{ stream: MediaStream; context: AudioContext } | null>(null);
  const handler = useRef(onText);
  useEffect(() => {
    handler.current = onText;
  });

  const release = () => {
    audio.current?.stream.getTracks().forEach((t) => t.stop());
    void audio.current?.context.close();
    audio.current = null;
    setAnalyser(null);
  };
  useEffect(
    () => () => {
      wanted.current = false;
      ref.current?.stop();
      audio.current?.stream.getTracks().forEach((t) => t.stop());
      void audio.current?.context.close();
    },
    [],
  );

  const listen = (Klass: new () => Recognition) => {
    const r = new Klass();
    r.lang = "fr-FR";
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      let pending = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (!res) continue;
        if (res.isFinal) handler.current(res[0].transcript);
        else pending += res[0].transcript;
      }
      setInterim(pending);
    };
    // The browser ends a dictation after a silence: picked up again until « Arrêter ».
    r.onend = () => {
      setInterim("");
      if (wanted.current) {
        try {
          r.start();
          return;
        } catch {
          /* already restarting */
        }
      }
      setListening(false);
      release();
    };
    r.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      wanted.current = false;
      if (e.error === "not-allowed") toast.error("Autorisez le micro dans votre navigateur pour dicter.");
    };
    ref.current = r;
    r.start();
  };

  const start = async () => {
    const Klass = recognitionClass();
    if (!Klass) return;
    wanted.current = true;
    setListening(true);
    setStartedAt(Date.now());
    listen(Klass);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = new AudioContext();
      const node = context.createAnalyser();
      node.fftSize = 1024;
      node.smoothingTimeConstant = 0.6;
      context.createMediaStreamSource(stream).connect(node);
      audio.current = { stream, context };
      setAnalyser(node);
    } catch {
      // No meter without the microphone's stream; the dictation itself may still run.
    }
  };
  const stop = () => {
    wanted.current = false;
    ref.current?.stop();
    setListening(false);
    setInterim("");
    release();
  };
  return { supported, listening, interim, analyser, startedAt, start, stop };
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
        className="max-h-[92svh] w-[calc(100vw-2rem)] overflow-y-auto rounded-3xl border-0 bg-card p-5 shadow-soft sm:max-w-5xl sm:p-8"
      >
        <DialogTitle>Compte rendu · {props.candidateName}</DialogTitle>
        <DialogDescription>
          {props.jobTitle} · {new Date(props.startsAt).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
        </DialogDescription>
        <InterviewReportPanel {...props} />
      </DialogContent>
    </Dialog>
  );
}
