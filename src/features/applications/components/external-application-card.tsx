"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconAlertTriangle, IconArrowBackUp, IconCalendarPlus, IconCheck, IconChevronDown, IconDownload, IconFileText, IconMail, IconPhone, IconUsers, IconX } from "@tabler/icons-react";
import { toast } from "sonner";

import { ActionDialog } from "#/components/action-dialog";
import { ScheduleInterviewDialog } from "#/features/interviews/components/schedule-interview-dialog";
import { PreviewSheet, previewKindOf } from "#/components/preview-sheet";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Checkbox } from "#/components/ui/checkbox";
import { Textarea } from "#/components/ui/textarea";
import { CRITERIA, ScoreRing, VerdictChip } from "#/features/cv-screening/components/cv-bits";
import { CandidateInsight, detailsLabel } from "#/features/offers/components/candidate-insight";
import { MoreActionsMenu, opinionLabel, type MoreAction } from "#/features/offers/components/more-actions-menu";
import type { CvAnalysis } from "#/lib/api/offer-controller";
import { CvChatSheet } from "#/features/cv-screening/components/cv-chat-sheet";
import {
  analyseExternalApplications,
  externalApplicationsKey,
  refuseExternalApplication,
  retainExternalApplication,
  unretainExternalApplication,
  type ExternalApplication,
} from "#/lib/api/careers-controller";
import { cvScreeningsKey, getCvScreening } from "#/lib/api/cv-screening-controller";
import { sourceLabel } from "#/features/careers/candidate-source";
import { APPLICATION_STATUS, statusClass } from "#/features/offers/offer-labels";
import { DescriptionText } from "#/features/careers/components/description-text";
import { canSchedule } from "#/features/applications/can-schedule";
import { downloadFile } from "#/lib/api/download";
import { friendlyError } from "#/lib/api/friendly-error";
import { cn, getInitials } from "#/lib/utils";
import { canHire } from "#/features/team/member-access";
import { useMember } from "#/features/team/use-member";
import { TeamOpinionButton } from "#/features/team/components/team-opinion";
import type { Verdict } from "#/lib/api/candidate-notes-controller";

const YES_NO: Record<string, string> = { yes: "Oui", no: "Non" };

/** The analysis has more to show than its score and summary. */
export function hasInsight(a: CvAnalysis) {
  return (a.strengths?.length ?? 0) + (a.gaps?.length ?? 0) > 0 || Object.keys(a.criteria ?? {}).length > 0;
}

/** The offer still takes decisions; once it ended, only reading is left. */
export function recruiting(a: Pick<ExternalApplication, "offer">) {
  return a.offer.status === "ACTIVE" || a.offer.status === "PARTIALLY_FILLED";
}

/** A careers-page stage, as the Rabotka status that reads the same. */
const STAGE_STATUS = { new: "PENDING", viewed: "VIEWED", hired: "ACCEPTED", closed: "REJECTED" } as const;

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
  opinions,
  focused,
  onOfferPage = false,
}: Readonly<{
  application: ExternalApplication;
  /** On an offer's page: its box in the page's one selection (compare, refuse). */
  compare?: { selected: boolean; disabled: boolean; onToggle: () => void };
  /** On an offer's page: the team's opinions, counted. */
  opinions?: Record<Verdict, number>;
  /** Opened from a notification about it. */
  focused?: boolean;
  /** On the offer's own page: « Pour l'offre » would only repeat it. */
  onOfferPage?: boolean;
}>) {
  const queryClient = useQueryClient();
  const name = `${a.firstName} ${a.lastName}`;
  // Deciding is for those who hire; an Évaluateur reads and gives its opinion.
  const hire = canHire(useMember().role);
  const [refusing, setRefusing] = useState(false);
  const [retaining, setRetaining] = useState(false);
  const [unretaining, setUnretaining] = useState(false);
  // One toggle for its analysis and its answers, as on a Rabotka applicant's card.
  const [showDetails, setShowDetails] = useState(false);
  const [opinionOpen, setOpinionOpen] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [chatting, setChatting] = useState(false);
  const score = a.analysis?.status === "SCORED" ? a.analysis.score : null;
  const insight = score !== null && !!a.analysis && hasInsight(a.analysis);
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
  // PDF, Word and photos open in the panel; anything else downloads.
  const previewKind = previewKindOf(a.cvMimeType);
  const canShow = previewKind !== null;
  // What « ⋯ » offers, as on a Rabotka applicant's card.
  const more: MoreAction[] = [
    ...(a.hasCv
      ? [
          {
            key: "cv",
            label: canShow ? "CV du candidat" : "Télécharger le CV du candidat",
            icon: canShow ? IconFileText : IconDownload,
            onSelect: () => (canShow ? setReading(true) : void saveCv()),
          },
        ]
      : []),
    { key: "opinion", label: opinionLabel(opinions), icon: IconUsers, onSelect: () => setOpinionOpen(true) },
    // With or without a CV analysis: the address they applied with is enough.
    ...(hire && canSchedule(a)
      ? [{ key: "interview", label: "Planifier un entretien", icon: IconCalendarPlus, onSelect: () => setScheduling(true) }]
      : []),
    // A mistaken « Retenir », or a candidate who fell through: the post is freed.
    ...(hire && a.status === "RETAINED"
      ? [{ key: "unretain", label: "Annuler « retenu »", icon: IconArrowBackUp, onSelect: () => setUnretaining(true) }]
      : []),
  ];

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

  const unretain = useMutation({
    mutationFn: () => unretainExternalApplication(a.id),
    onSuccess: () => {
      refreshList();
      toast.success("Décision annulée : la personne est prévenue par e-mail.");
      setUnretaining(false);
    },
    onError: (err) => toast.error(friendlyError(err, "La décision n'a pas pu être annulée.")),
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
    <li
      id={`candidature-${a.id}`}
      className={cn("flex scroll-mt-24 flex-col gap-3 rounded-3xl bg-page p-5", focused && "ring-2 ring-whatsapp-dark")}
    >
      <div className="flex items-start gap-3.5">
        {compare && (
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
            <span className="rounded-full bg-card px-2 py-0.5 font-medium text-[11px]">Page carrières</span>
            {a.source && a.source !== "direct" && (
              <span className="rounded-full bg-card px-2 py-0.5 font-medium text-[11px] text-muted-foreground">via {sourceLabel(a.source)}</span>
            )}
          </p>
          {a.analysis?.status === "QUEUED" && <p className="mt-1 text-muted-foreground text-xs">Analyse du CV en cours…</p>}
          {a.analysis && a.analysis.status !== "QUEUED" && score === null && (
            <p className="mt-1 text-muted-foreground text-xs">Ce CV n&apos;a pas pu être lu.</p>
          )}
        </div>
        {/* Where it stands, in the words and colours of a Rabotka applicant's card. */}
        <span className={cn("shrink-0 rounded-full px-2.5 py-1 font-medium text-xs", statusClass(STAGE_STATUS[externalStage(a)]))}>
          {APPLICATION_STATUS[STAGE_STATUS[externalStage(a)]]}
        </span>
      </div>

      {!onOfferPage && (
        <Link href={`/espace/offres/${a.offer.id}`} className="group space-y-0.5 rounded-2xl bg-card p-3">
          <span className="block text-muted-foreground text-[11px] uppercase tracking-wide">Pour l&apos;offre</span>
          <span className="line-clamp-1 font-medium text-sm group-hover:underline">{a.offer.title}</span>
        </Link>
      )}

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

      {a.knockedOut && (
        <p className="flex items-center gap-1.5 text-chip-amber-foreground text-xs">
          <IconAlertTriangle className="size-3.5 shrink-0" />
          Ne remplit pas un critère éliminatoire
        </p>
      )}

      {/* The same row, in the same order, as a Rabotka applicant's: read, then decide. */}
      <div className="mt-auto flex flex-wrap items-center justify-end gap-2 pt-1">
        {(insight || a.answers.length > 0) && (
          <button
            type="button"
            aria-expanded={showDetails}
            onClick={() => setShowDetails(!showDetails)}
            className="mr-auto inline-flex h-10 shrink-0 items-center gap-1 rounded-full bg-card px-3.5 font-medium text-sm hover:bg-card/70"
          >
            {detailsLabel(insight, a.answers.length > 0)}
            <IconChevronDown className={cn("size-4 transition-transform", showDetails && "rotate-180")} />
          </button>
        )}
        {!a.analysis && a.status === "PENDING" && recruiting(a) && a.hasCv && (
          <button
            type="button"
            onClick={() => setAnalysing(true)}
            className="inline-flex h-10 shrink-0 items-center rounded-full bg-card px-3.5 font-medium text-sm hover:bg-card/70"
          >
            Analyser le CV
          </button>
        )}
        {score !== null && (
          <button
            type="button"
            disabled={!resume.data}
            onClick={() => setChatting(true)}
            className="inline-flex h-10 shrink-0 items-center rounded-full bg-brand-lime px-4 font-medium text-[#0f2414] text-sm disabled:opacity-60"
          >
            Interroger le CV
          </button>
        )}
        {hire && a.status === "PENDING" && (
          <>
            <button
              type="button"
              onClick={() => setRefusing(true)}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-card px-3.5 font-medium text-sm hover:bg-card/70"
            >
              <IconX className="size-4" />
              Refuser
            </button>
            {recruiting(a) && (
              <button
                type="button"
                onClick={() => setRetaining(true)}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-ink px-4 font-medium text-sm text-white"
              >
                <IconCheck className="size-4" />
                Retenir
              </button>
            )}
          </>
        )}
        <MoreActionsMenu name={name} actions={more} />
      </div>

      <TeamOpinionButton
        kind="external"
        id={a.id}
        name={name}
        summary={opinions}
        open={opinionOpen}
        onOpenChange={setOpinionOpen}
      />

      {showDetails && a.answers.length > 0 && (
        <dl className="space-y-2 rounded-2xl bg-card p-4 text-sm">
          <p className="font-medium text-sm">Réponses aux questions</p>
          {a.answers.map((answer) => (
            <div key={answer.label}>
              <dt className="text-muted-foreground">{answer.label}</dt>
              <dd className="font-medium">
                <DescriptionText text={YES_NO[answer.value] ?? answer.value} />
              </dd>
            </div>
          ))}
        </dl>
      )}
      {showDetails && insight && a.analysis && (
        <CandidateInsight
          strengths={a.analysis.strengths ?? []}
          gaps={a.analysis.gaps ?? []}
          criteria={CRITERIA.filter((k) => typeof a.analysis?.criteria?.[k.key] === "number").map((k) => ({
            label: k.label,
            value: a.analysis?.criteria?.[k.key] ?? 0,
          }))}
        />
      )}

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
        kind={previewKind ?? "pdf"}
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

      {scheduling && (
        <ScheduleInterviewDialog
          open={scheduling}
          onOpenChange={setScheduling}
          candidate={
            score !== null && a.analysis
              ? { name, cvResumeId: a.analysis.resumeId, email: a.email }
              : { name, externalApplicationId: a.id, email: a.email }
          }
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
        open={unretaining}
        onOpenChange={setUnretaining}
        title={`Ne plus retenir ${name} ?`}
        description="Le poste est libéré et l'offre recrute de nouveau. La personne est prévenue par e-mail que sa candidature reste à l'étude."
        confirmLabel="Ne plus retenir"
        tone="warning"
        pending={unretain.isPending}
        onConfirm={() => unretain.mutate()}
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
