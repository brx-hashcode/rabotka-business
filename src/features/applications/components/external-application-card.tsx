"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconAlertTriangle, IconCalendarPlus, IconCheck, IconChevronDown, IconChevronUp, IconDownload, IconSparkles, IconFileText, IconMail, IconPhone, IconX } from "@tabler/icons-react";
import { toast } from "sonner";

import { ActionDialog } from "#/components/action-dialog";
import { ScheduleInterviewDialog } from "#/features/interviews/components/schedule-interview-dialog";
import { PreviewSheet } from "#/components/preview-sheet";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Checkbox } from "#/components/ui/checkbox";
import { Textarea } from "#/components/ui/textarea";
import { ScoreRing, VerdictChip } from "#/features/cv-screening/components/cv-bits";
import { CvChatSheet } from "#/features/cv-screening/components/cv-chat-sheet";
import {
  analyseExternalApplications,
  externalApplicationsKey,
  refuseExternalApplication,
  retainExternalApplication,
  type ExternalApplication,
} from "#/lib/api/careers-controller";
import { cvScreeningsKey, getCvScreening } from "#/lib/api/cv-screening-controller";
import { downloadFile } from "#/lib/api/download";
import { friendlyError } from "#/lib/api/friendly-error";
import { getInitials } from "#/lib/utils";

const YES_NO: Record<string, string> = { yes: "Oui", no: "Non" };

/** Where an application from the public careers page sits among the tabs. */
export function externalStage(a: Pick<ExternalApplication, "status" | "viewedAt">) {
  if (a.status === "REFUSED") return "closed";
  if (a.status === "RETAINED") return "hired";
  return a.viewedAt ? "viewed" : "new";
}

/** Someone who applied from the public page: their contact comes with it. */
export function ExternalApplicationCard({
  application: a,
  compare,
}: Readonly<{
  application: ExternalApplication;
  /** On an offer's page: the checkbox of Analyse de CV. */
  compare?: { selected: boolean; disabled: boolean; onToggle: () => void };
}>) {
  const queryClient = useQueryClient();
  const name = `${a.firstName} ${a.lastName}`;
  const [refusing, setRefusing] = useState(false);
  const [retaining, setRetaining] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [chatting, setChatting] = useState(false);
  const score = a.analysis?.status === "SCORED" ? a.analysis.score : null;
  // Chat reads the resume as Analyse de CV holds it.
  const resume = useQuery({
    queryKey: [...cvScreeningsKey, a.analysis?.screeningId, "resume", a.analysis?.resumeId],
    queryFn: async () => (await getCvScreening(a.analysis?.screeningId as string)).resumes.find((r) => r.id === a.analysis?.resumeId) ?? null,
    enabled: score !== null,
  });
  const [message, setMessage] = useState("");
  const [reading, setReading] = useState(false);
  const cvUrl = `/api/v1/business/me/external-applications/${encodeURIComponent(a.id)}/cv`;
  // The sheet shows a PDF; a Word file can only be saved.
  const canShow = a.cvMimeType === "application/pdf";

  const refuse = useMutation({
    mutationFn: () => refuseExternalApplication(a.id, message.trim() || undefined),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: externalApplicationsKey });
      toast.success(`${name} est prévenu par e-mail.`);
      setRefusing(false);
    },
    onError: (err) => toast.error(friendlyError(err, "Le refus n'a pas pu être envoyé.")),
  });

  const refreshList = () => void queryClient.invalidateQueries({ queryKey: externalApplicationsKey });

  const analyse = useMutation({
    mutationFn: () => analyseExternalApplications(a.offer.id, a.id),
    onSuccess: () => {
      refreshList();
      setAnalysing(false);
    },
    onError: (err) => toast.error(friendlyError(err, "Ce CV n'a pas pu être analysé.")),
  });

  const retain = useMutation({
    mutationFn: () => retainExternalApplication(a.id),
    onSuccess: () => {
      refreshList();
      toast.success(`${name} est prévenu par e-mail.`);
      setRetaining(false);
    },
    onError: (err) => toast.error(friendlyError(err, "La candidature n'a pas pu être retenue.")),
  });

  async function saveCv() {
    try {
      await downloadFile(cvUrl, a.cvFileName);
      refreshList();
    } catch (err) {
      toast.error(friendlyError(err, "Ce CV n'a pas pu être ouvert."));
    }
  }

  return (
    <li className="flex flex-col gap-3 rounded-3xl bg-page p-5">
      <div className="flex items-start gap-3.5">
        {compare && score !== null && (
          <label className="flex w-6 shrink-0 cursor-pointer flex-col items-center pt-4">
            <Checkbox
              checked={compare.selected}
              disabled={compare.disabled}
              onCheckedChange={compare.onToggle}
              aria-label={`Comparer ${name}`}
              className="size-5 rounded-md"
            />
          </label>
        )}
        {score !== null ? (
          <ScoreRing score={score} />
        ) : (
          <Avatar className="size-14 rounded-2xl">
            <AvatarFallback className="rounded-2xl bg-brand-lime font-semibold text-[#0f2414]">{getInitials(name)}</AvatarFallback>
          </Avatar>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{name}</p>
          <p className="mt-1 flex flex-wrap gap-1.5">
            {score !== null && <VerdictChip score={score} />}
            <span className="rounded-full bg-card px-2 py-0.5 font-medium text-[11px]">Hors Rabotka</span>
            {a.status === "REFUSED" && <span className="rounded-full bg-card px-2 py-0.5 font-medium text-[11px]">Refusée</span>}
            {a.status === "RETAINED" && <span className="rounded-full bg-brand-lime px-2 py-0.5 font-medium text-[#0f2414] text-[11px]">Retenue</span>}
          </p>
          {a.analysis?.status === "QUEUED" && <p className="mt-1 text-muted-foreground text-xs">Analyse du CV en cours…</p>}
          {a.analysis && a.analysis.status !== "QUEUED" && score === null && (
            <p className="mt-1 text-muted-foreground text-xs">Ce CV n&apos;a pas pu être lu.</p>
          )}
        </div>
      </div>

      <Link href={`/espace/offres/${a.offer.id}`} className="group space-y-0.5 rounded-2xl bg-card p-3">
        <span className="block text-muted-foreground text-[11px] uppercase tracking-wide">Pour l&apos;offre</span>
        <span className="line-clamp-1 font-medium text-sm group-hover:underline">{a.offer.title}</span>
      </Link>

      <div className="space-y-1 text-sm">
        <a href={`mailto:${a.email}`} className="flex items-center gap-2 hover:underline">
          <IconMail className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{a.email}</span>
        </a>
        <a href={`tel:${a.phone}`} className="flex items-center gap-2 hover:underline">
          <IconPhone className="size-4 shrink-0 text-muted-foreground" />
          {a.phone}
        </a>
      </div>

      {a.analysis?.summary && <p className="line-clamp-3 text-sm leading-relaxed">{a.analysis.summary}</p>}

      {score !== null ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!resume.data}
            onClick={() => setChatting(true)}
            className="inline-flex h-10 items-center rounded-full bg-brand-lime px-4 font-medium text-[#0f2414] text-sm disabled:opacity-60"
          >
            Interroger le CV
          </button>
          {a.status !== "REFUSED" && (
            <button
              type="button"
              onClick={() => setScheduling(true)}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-card px-4 font-medium text-sm"
            >
              <IconCalendarPlus className="size-4" />
              Entretien
            </button>
          )}
        </div>
      ) : (
        !a.analysis &&
        a.status === "PENDING" &&
        a.hasCv && (
          <button
            type="button"
            onClick={() => setAnalysing(true)}
            className="inline-flex w-fit items-center gap-1.5 font-medium text-sm hover:underline"
          >
            <IconSparkles className="size-4" />
            Analyser le CV
          </button>
        )
      )}

      {a.knockedOut && (
        <p className="flex items-center gap-1.5 text-chip-amber-foreground text-xs">
          <IconAlertTriangle className="size-3.5 shrink-0" />
          Ne remplit pas un critère éliminatoire
        </p>
      )}

      {a.answers.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            aria-expanded={showAnswers}
            onClick={() => setShowAnswers(!showAnswers)}
            className="inline-flex items-center gap-1 font-medium text-sm hover:underline"
          >
            {showAnswers ? "Masquer" : "Voir"} {a.answers.length > 1 ? `les ${a.answers.length} réponses` : "la réponse"}
            {showAnswers ? <IconChevronUp className="size-4" /> : <IconChevronDown className="size-4" />}
          </button>
          {showAnswers && (
            <dl className="space-y-2 rounded-2xl bg-card p-3 text-sm">
              {a.answers.map((answer) => (
                <div key={answer.label}>
                  <dt className="text-muted-foreground text-xs">{answer.label}</dt>
                  <dd className="font-medium">{YES_NO[answer.value] ?? answer.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}

      {/* The decision reads left to right: look, say no, say yes. */}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
        {a.hasCv ? (
          <button
            type="button"
            onClick={() => (canShow ? setReading(true) : void saveCv())}
            className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full px-1 font-medium text-sm underline-offset-4 hover:underline"
          >
            {canShow ? <IconFileText className="size-4" /> : <IconDownload className="size-4" />}
            {canShow ? "Voir le CV" : "Télécharger le CV"}
          </button>
        ) : (
          <span />
        )}
        {a.status === "PENDING" && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRefusing(true)}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-card px-4 font-medium text-sm"
            >
              <IconX className="size-4" />
              Refuser
            </button>
            <button
              type="button"
              onClick={() => setRetaining(true)}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 font-medium text-sm text-white"
            >
              <IconCheck className="size-4" />
              Retenir
            </button>
          </div>
        )}
      </div>

      <PreviewSheet
        open={reading}
        onOpenChange={(open) => {
          setReading(open);
          // On close, not on open: being read moves the card to another tab,
          // and the sheet would go with it.
          if (!open) refreshList();
        }}
        title={name}
        subtitle={a.offer.title}
        src={cvUrl}
        kind="pdf"
        fileName={a.cvFileName}
        unavailable="Ce CV n'est plus disponible."
      />

      <ActionDialog
        open={analysing}
        onOpenChange={setAnalysing}
        title={`Analyser le CV de ${name} ?`}
        description="Son CV est lu et noté pour cette offre. Cela utilise 1 CV inclus de votre formule."
        confirmLabel="Analyser"
        pending={analyse.isPending}
        onConfirm={() => analyse.mutate()}
      />

      {chatting && a.analysis && resume.data && (
        <CvChatSheet
          open={chatting}
          onOpenChange={setChatting}
          screeningId={a.analysis.screeningId}
          jobTitle={a.offer.title}
          resume={{ ...resume.data, score }}
        />
      )}

      {scheduling && a.analysis && (
        <ScheduleInterviewDialog
          open={scheduling}
          onOpenChange={setScheduling}
          candidate={{ name, cvResumeId: a.analysis.resumeId, email: a.email }}
          jobTitle={a.offer.title}
        />
      )}

      <ActionDialog
        open={retaining}
        onOpenChange={setRetaining}
        title={`Retenir ${name} ?`}
        description="La personne est prévenue par e-mail, et compte dans vos postes pourvus."
        confirmLabel="Retenir"
        pending={retain.isPending}
        onConfirm={() => retain.mutate()}
      />

      <ActionDialog
        open={refusing}
        onOpenChange={setRefusing}
        title={`Refuser ${name} ?`}
        description="La personne est prévenue par e-mail."
        confirmLabel="Refuser"
        tone="warning"
        pending={refuse.isPending}
        onConfirm={() => refuse.mutate()}
      >
        <Textarea value={message} maxLength={500} onChange={(e) => setMessage(e.target.value)} placeholder="Un mot pour la personne (facultatif)" className="rounded-xl border-0 bg-page shadow-none" />
      </ActionDialog>
    </li>
  );
}
