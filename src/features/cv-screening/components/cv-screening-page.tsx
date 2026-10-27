"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconArrowLeft,
  IconBriefcase,
  IconCalendarEvent,
  IconCheck,
  IconCalendarPlus,
  IconChevronDown,
  IconClock,
  IconDownload,
  IconEye,
  IconFileTypeDocx,
  IconFileTypePdf,
  IconPhoto,
  IconMail,
  IconMapPin,
  IconPhone,
  IconShieldLock,
  IconTrash,
  IconTrophy,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { ActionDialog } from "#/components/action-dialog";
import { Checkbox } from "#/components/ui/checkbox";
import { Bone, ClaimDetailSkeleton } from "#/components/page-skeletons";
import { PreviewSheet } from "#/components/preview-sheet";
import { cvFileUrl, cvScreeningsKey, deleteCvScreening, getCvScreening } from "#/lib/api/cv-screening-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import type { CvResume, CvScreening, Interview } from "#/lib/api/types";
import { cn } from "#/lib/utils";
import { CRITERIA, Career, CriterionBar, ScoreRing, VerdictChip, band, duration } from "./cv-bits";
import { CvChatSheet } from "./cv-chat-sheet";
import { CvCompareSheet } from "./cv-compare-sheet";
import { InterviewLine, latestInterview } from "#/features/interviews/components/interview-bits";
import { ScheduleInterviewDialog } from "#/features/interviews/components/schedule-interview-dialog";
import { interviewsKey, listInterviews } from "#/lib/api/interview-controller";

/** CVs compared at once (the backend's limit too). */
const MAX_COMPARED = 5;

const date = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/**
 * One analysis: its CVs best first, filling in live while they are read
 * (the notifications socket refreshes it; a slow poll backs it up).
 */
export function CvScreeningPage({ id }: Readonly<{ id: string }>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: [...cvScreeningsKey, id],
    queryFn: () => getCvScreening(id),
    refetchInterval: (q) => (q.state.data?.status === "PROCESSING" ? 8_000 : false),
  });
  const [preview, setPreview] = useState<CvResume | null>(null);
  const [confirm, setConfirm] = useState(false);
  // CVs picked to compare (ids), and the comparison drawer.
  const [selected, setSelected] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  // The interviews already proposed, to show each on its candidate's card.
  const interviews = useQuery({ queryKey: [...interviewsKey, "all"], queryFn: () => listInterviews() });
  const toggle = (rid: string) =>
    setSelected((ids) => (ids.includes(rid) ? ids.filter((x) => x !== rid) : ids.length < MAX_COMPARED ? [...ids, rid] : ids));
  const remove = useMutation({
    mutationFn: () => deleteCvScreening(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cvScreeningsKey });
      toast.success("Analyse supprimée, avec ses fichiers.");
      router.push("/espace/analyse-cv");
    },
    onError: (err) => toast.error(friendlyError(err, "L'analyse n'a pas pu être supprimée.")),
  });

  if (query.isLoading) return <ClaimDetailSkeleton />;
  const s = query.data;
  if (!s) {
    return <p className="pt-6 text-muted-foreground">{friendlyError(query.error, "Cette analyse est introuvable.")}</p>;
  }

  const scored = s.resumes.filter((r) => r.status === "SCORED");
  const waiting = s.resumes.filter((r) => r.status === "QUEUED");
  const unread = s.resumes.filter((r) => r.status === "UNREADABLE" || r.status === "FAILED");
  const running = s.status === "PROCESSING";

  return (
    <div className="w-full space-y-6 pt-2">
      <Link href="/espace/analyse-cv" className="inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground">
        <IconArrowLeft className="size-4" />
        Analyse de CV
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          <h1 className="break-words font-semibold text-3xl tracking-tight">{s.jobTitle}</h1>
          <p className="text-muted-foreground">
            {s.total} CV · le {date(s.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selected.length > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-card p-1 pl-4">
              <span className="text-muted-foreground text-sm tabular-nums">
                {selected.length} sélectionné{selected.length > 1 ? "s" : ""}
              </span>
              <button
                type="button"
                onClick={() => setSelected([])}
                aria-label="Effacer la sélection"
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-page hover:text-foreground"
              >
                <IconX className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setCompareOpen(true)}
                disabled={selected.length < 2}
                title={selected.length < 2 ? "Choisissez au moins 2 CV" : undefined}
                className="inline-flex h-9 items-center rounded-full bg-brand-lime px-4 font-medium text-[#0f2414] text-sm hover:bg-brand-lime/80 disabled:opacity-40"
              >
                Comparer{selected.length > 1 ? ` (${selected.length})` : ""}
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => exportCsv(s)}
            disabled={scored.length === 0}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-card px-4 font-medium text-sm hover:bg-card/70 disabled:opacity-40"
          >
            <IconDownload className="size-4" />
            Exporter
          </button>
          <button
            type="button"
            onClick={() => setConfirm(true)}
            aria-label="Supprimer l'analyse"
            className="inline-flex size-11 items-center justify-center rounded-full bg-card text-muted-foreground hover:bg-card/70 hover:text-destructive"
          >
            <IconTrash className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="min-w-0 space-y-6">
          {running && <ProgressCard done={s.done} total={s.total} />}

          {s.purged && (
            <p className="rounded-2xl bg-card px-4 py-3 text-muted-foreground text-sm">
              Les fichiers et les coordonnées ont été supprimés à la fin de leur durée de conservation ; les notes restent.
            </p>
          )}

          <section className="space-y-3">
            {scored.map((r) => (
              <ResumeCard
                key={r.id}
                r={r}
                onPreview={() => setPreview(r)}
                screeningId={s.id}
                jobTitle={s.jobTitle}
                selected={selected.includes(r.id)}
                canSelect={selected.length < MAX_COMPARED}
                interview={latestInterview(interviews.data, (i) => i.cvResumeId === r.id)}
                onToggle={() => toggle(r.id)}
              />
            ))}
            {waiting.map((r, i) => (
              <WaitingCard key={r.id} r={r} reading={i < READING_AT_ONCE} />
            ))}
          </section>

          {unread.length > 0 && (
            <section className="space-y-3 rounded-3xl bg-card p-6">
              <div className="space-y-1">
                <h2 className="font-semibold">Non lus</h2>
                <p className="text-muted-foreground text-sm">Ces fichiers ne sont pas décomptés de vos CV inclus.</p>
              </div>
              <ul className="space-y-2">
                {unread.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-page px-4 py-3 text-sm">
                    <span className="min-w-0 flex-1 truncate font-medium">{r.fileName}</span>
                    <span className="text-muted-foreground">{r.error}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <JobAside s={s} scored={scored.length} unread={unread.length} />
      </div>

      {selected.length >= 2 && (
        <CvCompareSheet
          open={compareOpen}
          onOpenChange={setCompareOpen}
          screeningId={s.id}
          jobTitle={s.jobTitle}
          resumes={scored.filter((r) => selected.includes(r.id))}
        />
      )}

      <PreviewSheet
        open={!!preview}
        onOpenChange={(o) => !o && setPreview(null)}
        title={preview?.candidate?.name ?? preview?.fileName ?? "CV"}
        subtitle={preview?.fileName}
        src={preview?.hasFile ? cvFileUrl(s.id, preview.id) : undefined}
        kind={preview?.mimeType.startsWith("image/") ? "image" : "pdf"}
        fileName={preview?.fileName}
        unavailable="Ce CV a été supprimé à la fin de sa durée de conservation."
      />

      <ActionDialog
        open={confirm}
        onOpenChange={setConfirm}
        icon={<IconTrash className="size-5" />}
        tone="warning"
        title="Supprimer cette analyse ?"
        description="Le classement et les CV envoyés sont supprimés. Les CV déjà lus restent décomptés."
        confirmLabel="Supprimer"
        onConfirm={() => remove.mutate()}
        pending={remove.isPending}
      />
    </div>
  );
}

/** The queue reads this many CVs at a time (CvScreeningScheduler). */
const READING_AT_ONCE = 3;
/** Seconds one CV usually takes, for a rough « time left ». */
const SECONDS_PER_CV = 15;

function timeLeft(remaining: number): string {
  if (remaining <= READING_AT_ONCE) return "Quelques secondes encore";
  const secs = Math.ceil(remaining / READING_AT_ONCE) * SECONDS_PER_CV;
  return secs < 60 ? `Environ ${secs} s restantes` : `Environ ${Math.ceil(secs / 60)} min restantes`;
}

/** Where the analysis is: received, being read (n of m), ranked; and about how long is left. */
function ProgressCard({ done, total }: Readonly<{ done: number; total: number }>) {
  const steps = [
    { label: "CV reçus", state: "done" as const },
    { label: `Lecture · ${done}/${total}`, state: "active" as const },
    { label: "Classement", state: done === total ? ("active" as const) : ("todo" as const) },
  ];
  return (
    <section className="space-y-5 rounded-3xl bg-card p-6" aria-live="polite">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="font-semibold text-lg">Analyse en cours</p>
          <p className="text-muted-foreground text-sm">Rabotka lit chaque CV et le compare au poste.</p>
        </div>
        <p className="shrink-0 font-semibold text-2xl tabular-nums">
          {done}
          <span className="text-base text-muted-foreground">/{total}</span>
        </p>
      </div>

      <ol className="grid grid-cols-3 gap-2">
        {steps.map((step) => (
          <li key={step.label} className="space-y-2">
            <div
              className={cn(
                "h-1.5 rounded-full",
                step.state === "done" ? "bg-whatsapp-dark" : step.state === "active" ? "bg-whatsapp-dark/40" : "bg-page",
              )}
            >
              {step.state === "active" && step.label.startsWith("Lecture") && (
                <div className="h-full rounded-full bg-whatsapp-dark transition-[width] duration-500" style={{ width: `${(done / total) * 100}%` }} />
              )}
            </div>
            <p className={cn("flex items-center gap-1.5 text-xs", step.state === "todo" ? "text-muted-foreground" : "font-medium")}>
              {step.state === "done" && <IconCheck className="size-3.5 text-whatsapp-dark" />}
              {step.label}
            </p>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl bg-page px-4 py-3 text-sm">
        <span className="flex items-center gap-1.5 font-medium">
          <IconClock className="size-4" />
          {timeLeft(total - done)}
        </span>
        <span className="text-muted-foreground">Vous pouvez quitter la page : une notification vous prévient à la fin.</span>
      </div>
    </section>
  );
}

const FILE_KIND = (mime: string) =>
  mime.startsWith("image/")
    ? { icon: IconPhoto, label: "Photo", tile: "bg-chip-amber text-chip-amber-foreground" }
    : mime.includes("wordprocessingml")
      ? { icon: IconFileTypeDocx, label: "Word", tile: "bg-chip-violet text-chip-violet-foreground" }
      : { icon: IconFileTypePdf, label: "PDF", tile: "bg-destructive/10 text-destructive" };

/** A CV not read yet, in the shape its result will take, so the ranking fills in without jumping. */
function WaitingCard({ r, reading }: Readonly<{ r: CvResume; reading: boolean }>) {
  const kind = FILE_KIND(r.mimeType);
  return (
    <article className="rounded-3xl bg-card p-5 sm:p-6" aria-busy="true">
      <div className="flex items-start gap-4">
        <span className={cn("flex size-14 shrink-0 items-center justify-center rounded-full", kind.tile)}>
          <kind.icon className="size-6" />
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 truncate font-semibold" title={r.fileName}>
              {r.fileName}
            </p>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 font-medium text-xs",
                reading ? "bg-chip-green text-chip-green-foreground" : "bg-page text-muted-foreground",
              )}
            >
              {reading ? "Lecture en cours" : "En attente"}
            </span>
          </div>
          <p className="text-muted-foreground text-xs">
            {kind.label} · {reading ? "le score et l'avis arrivent dans quelques secondes" : "sera lu juste après"}
          </p>
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-11/12" />
        <Bone className="h-3 w-2/3" />
      </div>
      <div className="mt-5 flex gap-2">
        <Bone className="h-10 w-28 rounded-full" />
        <Bone className="h-10 w-28 rounded-full" />
      </div>
    </article>
  );
}

/** What the CVs were measured against, beside them: the analysis in figures, then the job itself. */
function JobAside({ s, scored, unread }: Readonly<{ s: CvScreening; scored: number; unread: number }>) {
  const [open, setOpen] = useState(false);
  const long = s.jobText.length > 700;
  return (
    <aside className="space-y-6 lg:sticky lg:top-24">
      <section className="space-y-4 rounded-3xl bg-card p-6">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">L&apos;analyse</p>
        <dl className="grid grid-cols-3 gap-2 text-center">
          <Figure label="CV" value={s.total} />
          <Figure label={scored > 1 ? "Classés" : "Classé"} value={scored} />
          <Figure label={unread > 1 ? "Non lus" : "Non lu"} value={unread} />
        </dl>
        <dl className="space-y-3 text-sm">
          <Meta icon={IconCalendarEvent} label="Créée le" value={date(s.createdAt)} />
          {s.bestScore !== null && <Meta icon={IconTrophy} label="Meilleur score" value={`${s.bestScore}/100`} />}
          <Meta
            icon={IconShieldLock}
            label="Fichiers et coordonnées"
            value={s.purged ? "Supprimés" : `Conservés jusqu'au ${date(s.expiresAt)}`}
          />
          {s.offerId && (
            <Meta
              icon={IconBriefcase}
              label="Offre"
              value={
                <Link href={`/espace/offres/${s.offerId}`} className="underline-offset-2 hover:underline">
                  Voir l&apos;offre
                </Link>
              }
            />
          )}
        </dl>
      </section>

      <section className="space-y-3 rounded-3xl bg-card p-6">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Le poste</p>
        <h2 className="break-words font-semibold text-lg leading-snug">{s.jobTitle}</h2>
        <div className="relative">
          <p className={cn("whitespace-pre-line text-muted-foreground text-sm leading-relaxed", long && !open && "max-h-80 overflow-hidden")}>
            {s.jobText}
          </p>
          {long && !open && <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />}
        </div>
        {long && (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="inline-flex items-center gap-1 font-medium text-sm hover:underline"
          >
            {open ? "Réduire" : "Voir tout"}
            <IconChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
          </button>
        )}
      </section>
    </aside>
  );
}

function Figure({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <div className="rounded-2xl bg-page px-2 py-3">
      <dd className="font-semibold text-xl tabular-nums leading-none">{value}</dd>
      <dt className="mt-1 text-muted-foreground text-xs">{label}</dt>
    </div>
  );
}

function Meta({ icon: Icon, label, value }: Readonly<{ icon: typeof IconBriefcase; label: string; value: React.ReactNode }>) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-page">
        <Icon className="size-4 text-muted-foreground" />
      </span>
      <div className="min-w-0">
        <dt className="text-muted-foreground text-xs">{label}</dt>
        <dd className="font-medium">{value}</dd>
      </div>
    </div>
  );
}

function ResumeCard({
  r,
  onPreview,
  screeningId,
  jobTitle,
  selected,
  canSelect,
  onToggle,
  interview,
}: Readonly<{
  r: CvResume;
  onPreview: () => void;
  screeningId: string;
  jobTitle: string;
  selected: boolean;
  canSelect: boolean;
  onToggle: () => void;
  interview?: Interview;
}>) {
  const [open, setOpen] = useState(r.rank === 1);
  const [chatOpen, setChatOpen] = useState(false);
  const [planning, setPlanning] = useState(false);
  const c = r.candidate;
  const name = c?.name ?? r.fileName;
  const score = r.score ?? 0;
  const facts = [
    c?.currentTitle,
    typeof c?.experienceMonths === "number"
      ? `${duration(c.experienceMonths)} d'expérience${typeof c.relevantMonths === "number" ? `, dont ${duration(c.relevantMonths)} en lien avec le poste` : ""}`
      : c?.yearsExperience !== null && c?.yearsExperience !== undefined
        ? `${c.yearsExperience} an${c.yearsExperience > 1 ? "s" : ""} d'expérience`
        : null,
  ].filter(Boolean);
  const isDocx = r.mimeType.includes("wordprocessingml");

  return (
    <article className="rounded-3xl bg-card p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <label className="flex w-6 shrink-0 cursor-pointer flex-col items-center gap-1.5 pt-3">
          <Checkbox
            checked={selected}
            disabled={!selected && !canSelect}
            onCheckedChange={onToggle}
            aria-label={`Comparer ${name}`}
            title={!selected && !canSelect ? `${MAX_COMPARED} CV au plus` : undefined}
            className="size-5 rounded-md"
          />
          <span className="font-semibold text-muted-foreground text-xs tabular-nums">{r.rank}</span>
        </label>
        <ScoreRing score={score} />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate font-semibold text-lg">{name}</h2>
            <VerdictChip score={score} />
          </div>
          {facts.length > 0 && <p className="text-muted-foreground text-sm">{facts.join(" · ")}</p>}
          {c?.city && (
            <p className="flex items-center gap-1 text-muted-foreground text-sm">
              <IconMapPin className="size-3.5" />
              {c.city}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-brand-lime px-4 font-medium text-[#0f2414] text-sm transition-colors hover:bg-brand-lime/80"
        >
          <span className="hidden sm:inline">Interroger le CV</span>
          <span className="sm:hidden">Questions</span>
        </button>
      </div>
      {planning && (
        <ScheduleInterviewDialog
          open={planning}
          onOpenChange={setPlanning}
          candidate={{ name, cvResumeId: r.id, email: c?.email }}
          jobTitle={jobTitle}
        />
      )}
      <CvChatSheet open={chatOpen} onOpenChange={setChatOpen} screeningId={screeningId} jobTitle={jobTitle} resume={r} />

      {r.summary && <p className="mt-4 text-sm leading-relaxed">{r.summary}</p>}

      {open && (
        <div className="mt-5 grid gap-5 md:grid-cols-2 2xl:grid-cols-[1fr_1fr_15rem]">
          <Points title="Points forts" items={r.strengths} tone="good" />
          <Points title="Points d'attention" items={r.gaps} tone="gap" />
          <div className="space-y-2.5 rounded-2xl bg-page p-4 md:col-span-2 2xl:col-span-1">
            {CRITERIA.filter((k) => typeof r.criteria?.[k.key] === "number").map((k) => (
              <CriterionBar key={k.key} label={k.label} value={r.criteria?.[k.key] ?? 0} />
            ))}
          </div>
          {!!c?.experiences?.length && (
            <div className="md:col-span-2 2xl:col-span-3">
              <Career experiences={c.experiences} totalMonths={c.experienceMonths ?? null} relevantMonths={c.relevantMonths ?? null} />
            </div>
          )}
        </div>
      )}

      {interview && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-page px-4 py-3">
          <InterviewLine interview={interview} />
          <Link href="/espace/entretiens" className="font-medium text-sm underline-offset-2 hover:underline">
            Voir mes entretiens
          </Link>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {!interview && (
          <button
            type="button"
            onClick={() => setPlanning(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 font-medium text-sm text-white hover:bg-ink/90"
          >
            <IconCalendarPlus className="size-4" />
            Planifier un entretien
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-page px-4 font-medium text-sm hover:bg-page/70"
        >
          {open ? "Moins de détails" : "Détails"}
          <IconChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        </button>
        {r.hasFile &&
          (isDocx ? (
            <a
              href={cvFileUrl(screeningId, r.id)}
              download={r.fileName}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-page px-4 font-medium text-sm hover:bg-page/70"
            >
              <IconDownload className="size-4" />
              Télécharger le CV
            </a>
          ) : (
            <button
              type="button"
              onClick={onPreview}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-page px-4 font-medium text-sm hover:bg-page/70"
            >
              <IconEye className="size-4" />
              Voir le CV
            </button>
          ))}
        {c?.phone && (
          <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-page px-4 text-sm hover:bg-page/70">
            <IconPhone className="size-4" />
            <span className="whitespace-nowrap">{c.phone}</span>
          </a>
        )}
        {c?.email && (
          <a href={`mailto:${c.email}`} className="inline-flex h-10 min-w-0 items-center gap-1.5 rounded-full bg-page px-4 text-sm hover:bg-page/70">
            <IconMail className="size-4 shrink-0" />
            <span className="truncate">{c.email}</span>
          </a>
        )}
      </div>
    </article>
  );
}

function Points({ title, items, tone }: Readonly<{ title: string; items: string[]; tone: "good" | "gap" }>) {
  return (
    <div className="space-y-2">
      <p className="font-medium text-sm">{title}</p>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">Aucun.</p>
      ) : (
        <ul className="space-y-1.5 text-sm">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden className={cn("mt-2 size-1.5 shrink-0 rounded-full", tone === "good" ? "bg-whatsapp-dark" : "bg-chip-amber-foreground")} />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The ranking as a spreadsheet: one line per CV read, best first. */
function exportCsv(s: CvScreening) {
  const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = ["Rang", "Nom", "Score", "Appréciation", ...CRITERIA.map((k) => k.label), "Poste actuel", "Ville", "Expérience (ans)", "Téléphone", "E-mail", "Résumé", "Fichier"];
  const rows = s.resumes
    .filter((r) => r.status === "SCORED")
    .map((r) => [
      r.rank,
      r.candidate?.name,
      r.score,
      band(r.score ?? 0).label,
      ...CRITERIA.map((k) => r.criteria?.[k.key] ?? ""),
      r.candidate?.currentTitle,
      r.candidate?.city,
      r.candidate?.yearsExperience,
      r.candidate?.phone,
      r.candidate?.email,
      r.summary,
      r.fileName,
    ]);
  // Semicolons and a BOM: what a French Excel opens as columns, accents intact.
  const csv = `﻿${[header, ...rows].map((line) => line.map(cell).join(";")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `analyse-cv-${s.jobTitle.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
