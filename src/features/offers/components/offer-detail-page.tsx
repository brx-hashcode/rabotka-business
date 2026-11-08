"use client";

import { DescriptionText } from "#/features/careers/components/description-text";
import { useEffect, useState } from "react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconCalendarPlus,
  IconArrowLeft,
  IconBriefcase,
  IconCalendarEvent,
  IconCash,
  IconCheck,
  IconChevronDown,
  IconCircleCheck,
  IconCircleX,
  IconFileCv,
  IconFileSearch,
  IconFileText,
  IconInbox,
  IconLock,
  IconMapPin,
  IconMessageCircle,
  IconPencil,
  IconRefresh,
  IconTrash,
  IconUserCheck,
  IconUsers,
  IconX,
  type Icon as TablerIcon,
  IconFileSpreadsheet,
} from "@tabler/icons-react";
import { Loader } from "lucide-react";
import { toast } from "sonner";

import { appConfig } from "#/config";
import { downloadFile } from "#/lib/api/download";

import { ActionDialog } from "#/components/action-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Input } from "#/components/ui/input";
import { Skeleton } from "#/components/ui/skeleton";
import { Bone, RowsSkeleton, TilesSkeleton } from "#/components/page-skeletons";
import { ExternalApplicationCard, externalStage, recruiting } from "#/features/applications/components/external-application-card";
import { offersFull } from "#/features/subscription/offers-quota";
import { CandidateCard } from "#/features/candidates/components/candidate-card";
import { CvCompareSheet } from "#/features/cv-screening/components/cv-compare-sheet";
import { CvChatSheet } from "#/features/cv-screening/components/cv-chat-sheet";
import { ScheduleInterviewDialog } from "#/features/interviews/components/schedule-interview-dialog";
import { CandidateInsight, detailsLabel } from "./candidate-insight";
import { byFit } from "../rank-candidates";
import { MAX_COMPARED } from "#/features/cv-screening/components/cv-screening-page";
import { ResumeButton } from "#/features/candidates/components/resume-button";
import { OwnCvButton } from "#/features/candidates/components/own-cv-button";
import { getMyBusiness, getMySubscription, myBusinessKey, mySubscriptionKey } from "#/lib/api/business-controller";
import {
  analyseExternalApplications,
  externalApplicationsKey,
  refuseExternalApplication,
  listExternalApplications,
  type ExternalApplication,
} from "#/lib/api/careers-controller";
import { findCandidates } from "#/lib/api/candidate-controller";
import { cvScreeningsKey, getCvScreening } from "#/lib/api/cv-screening-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import {
  closeOffer,
  deleteOffer,
  getOffer,
  getJobCategories,
  getOfferApplicants,
  getOfferAssessments,
  refuseApplications,
  offersKey,
  confirmOfferHire,
  republishOffer,
  type ApplicantAssessment,
  type CvAnalysis,
  type Offer,
  type OfferApplicant,
} from "#/lib/api/offer-controller";
import { showApplicationStatus, showExternalStatus } from "#/features/offers/application-cache";
import { cn, getInitials } from "#/lib/utils";
import {
  APPLICATION_STATUS,
  applicationStage,
  EMPLOYMENT_LABEL,
  fcfa,
  isDatedMission,
  offerChip,
  closingTile,
  offerDate,
  PAYMENT_SUFFIX,
  statusClass,
  type ApplicationStage,
} from "../offer-labels";
import { failedLabel, KIND_LABEL } from "../offer-questions";
import { ApplicationActions, useApplicationChat } from "./application-actions";
import { MoreActionsMenu, opinionLabel, type MoreAction } from "./more-actions-menu";
import { OfferDescriptionCard } from "./offer-description-card";
import { REFUSAL_TEMPLATES, RefusalMessageField } from "./refusal-message";
import { linkedinOffer } from "../linkedin-post";
import { PublishedShareCard } from "./published-share-card";
import { ShareOfferMenu } from "./share-offer-menu";
import { Checkbox } from "#/components/ui/checkbox";
import { CRITERIA, ScoreRing, VerdictChip } from "#/features/cv-screening/components/cv-bits";
import { scheduledIso } from "./offer-form";
import { canHire } from "#/features/team/member-access";
import { useMember } from "#/features/team/use-member";
import { TeamOpinionButton } from "#/features/team/components/team-opinion";
import { getOfferOpinions, offerOpinionsKey, type Verdict } from "#/lib/api/candidate-notes-controller";
import { pollEvery } from "#/features/layout/socket-status";

/**
 * One offer: where it stands (applications, positions filled, time left), its
 * applicants by stage (public profile only — a candidate opens in the profile
 * dialog, never with a phone), what was published, and what can be done with
 * it at this stage: edit while active, delete while nobody is engaged,
 * republish once expired.
 */
export function OfferDetailPage({ id }: Readonly<{ id: string }>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const offer = useQuery({ queryKey: [...offersKey, id], queryFn: () => getOffer(id) });
  const { data: business } = useQuery({ queryKey: myBusinessKey, queryFn: getMyBusiness });
  const { data: subscription } = useQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription });
  // An Évaluateur reads the offer; changing it is for those who hire.
  const hire = canHire(useMember().role);
  // Just published (new-offer-page): the moment to share it.
  const [published, setPublished] = useQueryState("publiee");
  const noOfferLeft = !!subscription && offersFull(subscription.entitlements);
  const needsDate = !offer.data || isDatedMission(offer.data.employmentType);
  const [confirmFinish, setConfirmFinish] = useState(false);
  // Those who applied from the public careers page.
  // This offer's only: not every application the business ever had, filtered here.
  const external = useQuery({
    queryKey: [...externalApplicationsKey, id],
    queryFn: () => listExternalApplications(id),
    // A CV being read gets its score in a few seconds.
    refetchInterval: (q) => (q.state.data?.some((a) => a.analysis?.status === "QUEUED") ? pollEvery(4000, 20_000) : false),
  });
  const outsiders = (external.data ?? []).filter((a) => a.offer.id === id);
  // The candidate's side moves on its own (paying their part of an unlock): keep up.
  const applicants = useQuery({
    queryKey: [...offersKey, id, "applicants"],
    queryFn: () => getOfferApplicants(id),
    // A CV being read gets its score in a few seconds.
    refetchInterval: (q) => (q.state.data?.some((a) => a.analysis?.status === "QUEUED") ? pollEvery(4000, 20_000) : pollEvery(30_000)),
  });
  const categories = useQuery({ queryKey: ["job-categories"], queryFn: getJobCategories, staleTime: Infinity });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [republishing, setRepublishing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [newDate, setNewDate] = useState("");

  // This offer (detail, candidates) is awaited, so its dialog closes on the
  // new state rather than flashing the old one; the lists follow in the
  // background (only the ones on screen refetch).
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: [...offersKey, "list"] });
    void queryClient.invalidateQueries({ queryKey: [...offersKey, "received"] });
    void queryClient.invalidateQueries({ queryKey: mySubscriptionKey });
    void queryClient.invalidateQueries({ queryKey: ["business", "me", "stats"] });
    return queryClient.invalidateQueries({ queryKey: [...offersKey, id] });
  };
  const close = useMutation({
    mutationFn: () => closeOffer(id),
    onSuccess: async () => {
      void queryClient.invalidateQueries({ queryKey: externalApplicationsKey });
      await refresh();
      setConfirmClose(false);
      toast.success("Offre fermée. Les candidats en attente sont prévenus.");
    },
    onError: (err) => toast.error(friendlyError(err, "L'offre n'a pas pu être fermée.")),
  });
  const finish = useMutation({
    mutationFn: () => confirmOfferHire(id),
    onSuccess: async () => {
      await refresh();
      setConfirmFinish(false);
      toast.success("Offre terminée. Vous pouvez noter votre recrutement.");
    },
    onError: (err) => toast.error(friendlyError(err, "L'offre n'a pas pu être terminée.")),
  });
  const remove = useMutation({
    mutationFn: () => deleteOffer(id),
    onSuccess: () => {
      // Gone: nothing of it to wait for, the list it goes back to refetches.
      queryClient.removeQueries({ queryKey: [...offersKey, id] });
      void refresh();
      toast.success("Offre supprimée. Les candidats en attente sont prévenus.");
      router.push("/espace/offres");
    },
    onError: (err) => toast.error(friendlyError(err, "L'offre n'a pas pu être supprimée.")),
  });
  const republish = useMutation({
    // The same hour: a mission keeps its start, a closing date its end of day.
    mutationFn: () =>
      republishOffer(
        id,
        needsDate ? scheduledIso(newDate, offer.data?.scheduledAt ? new Date(offer.data.scheduledAt).toTimeString().slice(0, 5) : "") : null,
      ),
    onSuccess: async () => {
      await refresh();
      setRepublishing(false);
      toast.success("Offre republiée.");
    },
    onError: (err) => toast.error(friendlyError(err, "L'offre n'a pas pu être republiée.")),
  });

  const o = offer.data;

  return (
    <div className="w-full space-y-6 pt-2">
      <Link href="/espace/offres" className="inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground">
        <IconArrowLeft className="size-4" />
        Offres
      </Link>

      {offer.isLoading ? (
        <>
          <div className="space-y-8 rounded-3xl bg-card p-6 sm:p-8">
            <div className="space-y-3">
              <Bone className="h-6 w-48 rounded-full" />
              <Bone className="h-10 w-2/3" />
              <Bone className="h-4 w-64" />
            </div>
            <TilesSkeleton />
          </div>
          <div className="rounded-3xl bg-card p-6">
            <RowsSkeleton count={4} />
          </div>
        </>
      ) : !o ? (
        <p className="rounded-3xl bg-card p-6 text-muted-foreground">{friendlyError(offer.error, "Cette offre est introuvable.")}</p>
      ) : (
        <>
          <OfferHeader
            offer={o}
            category={categories.data?.find((c) => c.id === o.categoryId)?.name}
            applicants={applicants.data}
            outsiders={outsiders}
            actions={
              <div className="flex flex-wrap gap-2 empty:hidden">
                {business?.publicSlug && business.verificationStatus === "VERIFIED" && (o.status === "ACTIVE" || o.status === "PARTIALLY_FILLED") && (
                  <ShareOfferMenu slug={business.publicSlug} offer={linkedinOffer(o, business.name, categories.data?.find((c) => c.id === o.categoryId)?.name)} />
                )}
                {hire && (o.status === "ACTIVE" || o.status === "PARTIALLY_FILLED") && (
                  <Link
                    href={`/espace/offres/${o.id}/modifier`}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 font-medium text-sm text-white hover:bg-ink/90"
                  >
                    <IconPencil className="size-4" />
                    Modifier
                  </Link>
                )}
                {hire && o.status === "FILLED" && !isDatedMission(o.employmentType) && (
                  <button
                    type="button"
                    onClick={() => setConfirmFinish(true)}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 font-medium text-sm text-white hover:bg-ink/90"
                  >
                    <IconCircleCheck className="size-4" />
                    Terminer l&apos;offre
                  </button>
                )}
                {/* Expired, or closed by hand with posts still free: it can recruit again. */}
                {hire && (o.status === "EXPIRED" || (o.status === "FILLED" && !!o.closedAt && o.acceptedCount < o.quantity)) && (
                  <button
                    type="button"
                    onClick={() => setRepublishing(true)}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 font-medium text-sm text-white hover:bg-ink/90"
                  >
                    <IconRefresh className="size-4" />
                    Republier
                  </button>
                )}
                {/* Closing and deleting end the offer: one step away, not beside « Modifier ». */}
                <MoreActionsMenu
                  name={o.title}
                  className="bg-page hover:bg-page/70"
                  actions={[
                    // « Exports RH »: Excel of every candidate; without the service, to the plans.
                    {
                      key: "export",
                      label: "Exporter les candidats",
                      icon: IconFileSpreadsheet,
                      hint: subscription?.entitlements.hrExports ? "Excel, avec statut, score et origine" : "Inclus dans les formules supérieures",
                      onSelect: () => {
                        if (!subscription?.entitlements.hrExports) {
                          router.push("/espace/abonnement");
                          return;
                        }
                        downloadFile(
                          `${appConfig.apiUrl}/business/me/exports/offers/${encodeURIComponent(o.id)}/candidates`,
                          `candidats-${o.reference}.xlsx`,
                        ).catch((err: unknown) =>
                          toast.error((err instanceof Error && err.message) || "L'export n'a pas pu être créé. Réessayez dans un instant."),
                        );
                      },
                    },
                    ...(hire && (o.status === "ACTIVE" || o.status === "PARTIALLY_FILLED")
                      ? [{ key: "close", label: "Fermer l'offre", icon: IconCircleX, onSelect: () => setConfirmClose(true), hint: "Plus de candidatures, les candidats en attente sont prévenus" }]
                      : []),
                    ...(hire && (o.status === "ACTIVE" || o.status === "EXPIRED")
                      ? [{ key: "delete", label: "Supprimer l'offre", icon: IconTrash, onSelect: () => setConfirmDelete(true), tone: "danger" as const }]
                      : []),
                  ]}
                />
              </div>
            }
          />

          {published && (
            <PublishedShareCard
              slug={business?.publicSlug ?? null}
              offer={linkedinOffer(o, business?.name, categories.data?.find((c) => c.id === o.categoryId)?.name)}
              isPublic={!!business?.publicSlug && business.verificationStatus === "VERIFIED" && (o.status === "ACTIVE" || o.status === "PARTIALLY_FILLED")}
              onDismiss={() => void setPublished(null)}
            />
          )}

          <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] 2xl:grid-cols-[minmax(0,1fr)_28rem]">
            <div className="min-w-0 space-y-6">
              <ApplicantsCard offer={o} applicants={applicants.data} outsiders={outsiders} loading={applicants.isLoading} />
              {(o.status === "ACTIVE" || o.status === "PARTIALLY_FILLED") && (
                <SuggestedCard
                  offer={o}
                  category={categories.data?.find((c) => c.id === o.categoryId)?.name}
                  exclude={(applicants.data ?? []).map((a) => a.worker.id)}
                />
              )}
            </div>
            <div className="space-y-6 lg:sticky lg:top-24">
              <DetailsCard offer={o} category={categories.data?.find((c) => c.id === o.categoryId)?.name} />
              <QuestionsCard offer={o} />
              <OfferDescriptionCard description={o.description} note={o.note} />
            </div>
          </div>
        </>
      )}

      <ActionDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        tone="warning"
        icon={<IconTrash className="size-5" />}
        title="Supprimer cette offre ?"
        description="Elle n'est plus visible des candidats ; ceux qui attendaient une réponse en sont prévenus. Impossible si quelqu'un est déjà engagé."
        confirmLabel="Supprimer"
        pending={remove.isPending}
        onConfirm={() => remove.mutate()}
      />

      <ActionDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        icon={<IconCircleX className="size-5" />}
        title="Fermer cette offre ?"
        description="Elle ne recevra plus de candidatures et les candidats en attente sont prévenus. Vos candidats retenus restent."
        confirmLabel="Fermer l'offre"
        tone="warning"
        pending={close.isPending}
        onConfirm={() => close.mutate()}
      />

      <ActionDialog
        open={confirmFinish}
        onOpenChange={setConfirmFinish}
        icon={<IconCircleCheck className="size-5" />}
        title="Terminer cette offre ?"
        description="Vous confirmez votre recrutement. L'offre est terminée, et vous pouvez noter les personnes recrutées."
        confirmLabel="Terminer l'offre"
        pending={finish.isPending}
        onConfirm={() => finish.mutate()}
      />

      <ActionDialog
        open={republishing}
        onOpenChange={setRepublishing}
        icon={<IconRefresh className="size-5" />}
        title="Republier l'offre"
        description={
          noOfferLeft
            ? "Votre formule n'a plus d'offre à publier sur cette période."
            : `${needsDate ? "Choisissez jusqu'à quand vous acceptez des candidatures : la mission peut commencer aujourd'hui. " : ""}Elle compte comme une offre publiée sur votre formule.`
        }
        confirmLabel="Republier"
        confirmDisabled={(needsDate && !newDate) || noOfferLeft}
        pending={republish.isPending}
        onConfirm={() => republish.mutate()}
      >
        {needsDate && (
          <Input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="h-12 rounded-xl border-0 bg-page px-4 shadow-none"
          />
        )}
      </ActionDialog>
    </div>
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;
const longDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/** Days from today to the offer's date: what is left to fill it. */
function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - new Date().setHours(0, 0, 0, 0)) / DAY_MS) - 1;
}

/** The offer at a glance: what it is, where it stands, and what can be done with it. */
function OfferHeader({
  offer: o,
  category,
  applicants,
  outsiders,
  actions,
}: Readonly<{ offer: Offer; category?: string; applicants?: OfferApplicant[]; outsiders: ExternalApplication[]; actions: React.ReactNode }>) {
  const status = offerChip(o);
  const list = applicants ?? [];
  const toReview = list.filter((a) => applicationStage(a.status) === "new").length + outsiders.filter((a) => externalStage(a) === "new").length;
  // `acceptedCount` counts ACCEPTED only; a hire that has started or ended still fills its seat.
  const hired =
    list.filter((a) => applicationStage(a.status) === "hired").length + outsiders.filter((a) => a.status === "RETAINED").length;
  const filled = Math.min(Math.max(o.acceptedCount, hired), o.quantity);
  const left = o.scheduledAt ? daysUntil(o.scheduledAt) : null;
  const open = o.status === "ACTIVE" || o.status === "PARTIALLY_FILLED";
  const closing = closingTile(o, left);

  return (
    <section className="space-y-8 rounded-3xl bg-card p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={cn("rounded-full px-2.5 py-1 font-medium", status.className)}>{status.label}</span>
            <span className="rounded-full bg-page px-2.5 py-1 font-medium">{EMPLOYMENT_LABEL[o.employmentType]}</span>
            {category && <span className="rounded-full bg-page px-2.5 py-1 font-medium">{category}</span>}
          </div>
          <h1 className="break-words font-semibold text-3xl tracking-tight sm:text-4xl">{o.title}</h1>
          <p className="text-muted-foreground text-sm">
            Réf. {o.reference}
            {o.createdAt && ` · publiée le ${longDate(o.createdAt)}`}
          </p>
        </div>
        {actions}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Tile icon={IconInbox} label="Candidatures" value={applicants ? String(list.length + outsiders.length) : "—"} />
        <Tile
          icon={IconUsers}
          label="À examiner"
          value={applicants ? String(toReview) : "—"}
          hint={toReview > 0 ? "en attente de votre réponse" : "aucune en attente"}
        />
        <Tile icon={IconUserCheck} label="Postes pourvus" value={`${filled}/${o.quantity}`}>
          <div className="h-1.5 overflow-hidden rounded-full bg-card">
            <div className="h-full rounded-full bg-whatsapp-dark" style={{ width: `${(filled / o.quantity) * 100}%` }} />
          </div>
        </Tile>
        <Tile
          icon={IconCalendarEvent}
          label={closing.label}
          value={closing.value}
          hint={closing.hint ?? (o.scheduledAt ? (offerDate(o.scheduledAt, o.employmentType) ?? undefined) : undefined)}
          muted={!open}
        />
      </div>
    </section>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  hint,
  muted,
  children,
}: Readonly<{ icon: TablerIcon; label: string; value: string; hint?: string; muted?: boolean; children?: React.ReactNode }>) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-2xl bg-page p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="hidden size-9 shrink-0 items-center justify-center rounded-xl bg-card sm:flex">
          <Icon className="size-4" />
        </span>
        <span className="truncate font-medium text-sm">{label}</span>
      </div>
      <p className={cn("font-semibold text-3xl tracking-tight", muted && "text-muted-foreground")}>{value}</p>
      {hint && <p className="-mt-2 line-clamp-2 text-muted-foreground text-xs">{hint}</p>}
      {children}
    </div>
  );
}

const TABS: { key: "all" | ApplicationStage; label: string }[] = [
  { key: "all", label: "Toutes" },
  { key: "new", label: "Nouvelles" },
  { key: "viewed", label: "Vues" },
  { key: "hired", label: "Retenues" },
  { key: "closed", label: "Refusées ou annulées" },
];

/** A CV analysis's score, once it is in. */
function cvScore(analysis: CvAnalysis | null | undefined): number | null {
  return analysis?.status === "SCORED" ? analysis.score : null;
}

/** A candidate of the offer, wherever they applied from: one list, one ranking. */
type Entry = {
  key: string;
  score: number | null;
  analysis: CvAnalysis | null;
  /** Still waiting: it can be refused with the selection. */
  refusable: boolean;
  stage: ApplicationStage;
} & ({ kind: "rabotka"; a: OfferApplicant } | { kind: "careers"; a: ExternalApplication });

/** The applicants by stage. A candidate opens in the profile dialog — public profile only. */
function ApplicantsCard({
  offer: o,
  applicants,
  outsiders,
  loading,
}: Readonly<{ offer: Offer; applicants?: OfferApplicant[]; outsiders: ExternalApplication[]; loading: boolean }>) {
  // The tab lives in the URL (?onglet=), so a reload or a shared link keeps it.
  const [tab, setTab] = useQueryState("onglet", parseAsStringLiteral(TABS.map((t) => t.key)).withDefault("all"));
  const list = applicants ?? [];
  const count = (k: (typeof TABS)[number]["key"]) =>
    k === "all"
      ? list.length + outsiders.length
      : list.filter((a) => applicationStage(a.status) === k).length + outsiders.filter((a) => externalStage(a) === k).length;
  // Opened from a notification on one candidature: show every stage, and
  // bring that candidate into view once the lists are in.
  const focusId = useSearchParams().get("candidature");
  const loaded = !loading;
  useEffect(() => {
    if (!focusId || !loaded) return;
    if (tab !== "all") void setTab("all");
    const t = setTimeout(
      () => document.getElementById(`candidature-${focusId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }),
      150,
    );
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per opened candidature
  }, [focusId, loaded]);
  // The team's Oui / Peut-être / Non on each candidate, for the « Avis » buttons.
  const opinions = useQuery({ queryKey: offerOpinionsKey(o.id), queryFn: () => getOfferOpinions(o.id) });
  // Ranked like CV analysis: best fit first; not scored yet, after, newest first.
  const assessed = useQuery({
    queryKey: [...offersKey, o.id, "assessments"],
    queryFn: () => getOfferAssessments(o.id),
    refetchInterval: (q) => ((q.state.data?.pending ?? 0) > 0 ? 30_000 : false),
  });
  const scores = new Map((assessed.data?.assessments ?? []).map((x) => [x.applicationId, x]));
  const pending = assessed.data?.pending ?? 0;
  const waiting = list.filter((a) => a.status === "PENDING" || a.status === "VIEWED");
  const waitingOutsiders = outsiders.filter((a) => a.status === "PENDING");
  const stillWaiting = waiting.length + waitingOutsiders.length;
  const hiredCount =
    list.filter((a) => applicationStage(a.status) === "hired").length + outsiders.filter((a) => a.status === "RETAINED").length;
  const filled = o.status === "FILLED" || hiredCount >= o.quantity;

  // Every candidate in one list, wherever they applied from, ranked by score.
  const all: Entry[] = [
    ...list.map(
      (a): Entry => ({
        kind: "rabotka",
        key: `r:${a.applicationId}`,
        a,
        // Its CV analysis once in: the same measure as a careers-page CV.
        score: cvScore(a.analysis) ?? scores.get(a.applicationId)?.score ?? null,
        analysis: a.analysis ?? null,
        refusable: a.status === "PENDING" || a.status === "VIEWED",
        stage: applicationStage(a.status),
      }),
    ),
    ...outsiders.map(
      (a): Entry => ({
        kind: "careers",
        key: `e:${a.id}`,
        a,
        score: a.analysis?.status === "SCORED" ? a.analysis.score : null,
        analysis: a.analysis,
        refusable: a.status === "PENDING",
        stage: externalStage(a),
      }),
    ),
  ];
  // Those who do not meet an « éliminatoire » question come last, and can be hidden.
  const [hideOut, setHideOut] = useState(false);
  const inTab = all.filter((e) => tab === "all" || e.stage === tab);
  const outCount = inTab.filter((e) => e.a.knockedOut).length;
  const ranked = inTab
    .filter((e) => !(hideOut && e.a.knockedOut))
    .sort(byFit);

  // One selection for the page: compare those with a CV analysis, refuse those waiting.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState<"selected" | "remaining" | null>(null);
  const [comparing, setComparing] = useState(false);
  const toggle = (key: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const picked = all.filter((e) => selected.has(e.key));
  const comparable = picked.filter((e) => e.analysis?.status === "SCORED");
  const compareIds = comparable.map((e) => e.analysis?.resumeId as string);
  const comparedScreening = comparable[0]?.analysis?.screeningId;
  const oneScreening = comparable.every((e) => e.analysis?.screeningId === comparedScreening);
  const compareBlocked =
    picked.length < 2
      ? "Choisissez au moins 2 candidats"
      : comparable.length < picked.length
        ? "Analysez d'abord le CV de chaque candidat choisi"
        : picked.length > MAX_COMPARED
          ? `${MAX_COMPARED} candidats au plus`
          : !oneScreening
            ? "Ces analyses ne peuvent pas être comparées ensemble"
            : null;
  const comparedResumes = useQuery({
    queryKey: [...cvScreeningsKey, comparedScreening, "compare-rows", [...compareIds].sort().join(",")],
    queryFn: async () => (await getCvScreening(comparedScreening as string)).resumes.filter((r) => compareIds.includes(r.id)),
    enabled: !!comparedScreening && !compareBlocked,
  });
  const refuseRabotka = picked.filter((e) => e.kind === "rabotka" && e.refusable).map((e) => (e.a as OfferApplicant).applicationId);
  const refuseCareers = picked.filter((e) => e.kind === "careers" && e.refusable).map((e) => (e.a as ExternalApplication).id);
  const refuseCount = refuseRabotka.length + refuseCareers.length;
  const asked = o.questions.length > 0;
  const open = o.status === "ACTIVE" || o.status === "PARTIALLY_FILLED";

  return (
    <section className="space-y-5 rounded-3xl bg-card p-6">
      <div className="space-y-1">
        <h2 className="font-semibold text-xl">Candidats</h2>
        <p className="text-muted-foreground text-sm">Classés par adéquation avec l&apos;offre, qu&apos;ils aient postulé sur Rabotka ou sur votre page carrières.</p>
      </div>

      {loading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : list.length + outsiders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-page px-6 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-card">
            <IconUsers className="size-6 text-muted-foreground" />
          </span>
          <p className="font-medium">Aucune candidature pour le moment</p>
          <p className="max-w-sm text-muted-foreground text-sm">
            {open
              ? "Les profils correspondants ont été prévenus de votre offre. Les candidatures apparaîtront ici."
              : "Cette offre n'a reçu aucune candidature."}
          </p>
        </div>
      ) : (
        <>
          <div role="tablist" aria-label="Étape" className="flex gap-1 overflow-x-auto rounded-full bg-page p-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => void setTab(t.key)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 font-medium text-sm transition-colors",
                  tab === t.key ? "bg-selected text-selected-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
                <span className="tabular-nums opacity-70">{count(t.key)}</span>
              </button>
            ))}
          </div>

          {outCount > 0 && (
            <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={hideOut} onCheckedChange={(v) => setHideOut(v === true)} className="size-4 rounded" />
              Masquer les candidats qui ne remplissent pas les critères
              <span className="text-muted-foreground tabular-nums">({outCount})</span>
            </label>
          )}

          {pending > 0 && (
            <p className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader className="size-4 animate-spin" />
              {pending === 1 ? "1 candidature en cours d'analyse" : `${pending} candidatures en cours d'analyse`} : le classement se met à
              jour seul.
            </p>
          )}

          {filled && stillWaiting > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-chip-violet/60 px-4 py-3 text-chip-violet-foreground text-sm">
              <span>
                Tous les postes sont pourvus.{" "}
                {stillWaiting === 1 ? "1 candidature attend" : `${stillWaiting} candidatures attendent`} encore une réponse.
              </span>
              <button
                type="button"
                onClick={() => setBulk("remaining")}
                className="h-10 rounded-full bg-card px-4 font-medium text-foreground hover:bg-card/70"
              >
                Refuser les autres candidatures
              </button>
            </div>
          )}

          {selected.size > 0 && (
            <div className="sticky top-20 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-white">
              <span>{selected.size === 1 ? "1 candidature sélectionnée" : `${selected.size} candidatures sélectionnées`}</span>
              <span className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setSelected(new Set())} className="h-9 rounded-full px-3 hover:bg-white/10">
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => setComparing(true)}
                  disabled={!!compareBlocked || !comparedResumes.data}
                  title={compareBlocked ?? undefined}
                  className="h-9 rounded-full bg-brand-lime px-4 font-medium text-[#0f2414] disabled:opacity-50"
                >
                  Comparer{picked.length > 1 ? ` (${picked.length})` : ""}
                </button>
                {refuseCount > 0 && (
                  <button type="button" onClick={() => setBulk("selected")} className="h-9 rounded-full bg-white px-4 font-medium text-ink hover:bg-white/90">
                    Refuser la sélection{refuseCount < selected.size ? ` (${refuseCount})` : ""}
                  </button>
                )}
              </span>
            </div>
          )}

          <BulkRefuseDialog
            // Remounted for each mode: the message starts from its template.
            key={bulk ?? "closed"}
            offerId={o.id}
            mode={bulk}
            ids={refuseRabotka}
            selectedOutsiderIds={refuseCareers}
            count={bulk === "remaining" ? stillWaiting : refuseCount}
            rabotkaWaiting={waiting.length}
            outsiderIds={waitingOutsiders.map((a) => a.id)}
            onClose={() => setBulk(null)}
            onDone={() => setSelected(new Set())}
          />

          {comparing && comparedScreening && comparedResumes.data && (
            <CvCompareSheet
              open={comparing}
              onOpenChange={setComparing}
              screeningId={comparedScreening}
              jobTitle={o.title}
              resumes={[...comparedResumes.data].sort((x, y) => (y.score ?? 0) - (x.score ?? 0))}
            />
          )}

          <AnalyseAllBar offerId={o.id} outsiders={outsiders} />

          {ranked.length === 0 ? (
            <p className="rounded-2xl bg-page p-4 text-muted-foreground text-sm">Aucun candidat à cette étape.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {ranked.map((e, i) => {
                const pickable = e.analysis?.status === "SCORED" || e.refusable;
                return e.kind === "rabotka" ? (
                  <ApplicantRow
                    key={e.key}
                    jobTitle={o.title}
                    applicant={e.a}
                    rank={i + 1}
                    assessment={scores.get(e.a.applicationId)}
                    waiting={pending > 0}
                    asked={asked}
                    recruiting={open}
                    selected={selected.has(e.key)}
                    onToggle={pickable ? () => toggle(e.key) : undefined}
                    opinions={opinions.data?.rabotka[e.a.applicationId]}
                    focused={focusId === e.a.applicationId}
                  />
                ) : (
                  <ExternalApplicationCard
                    key={e.key}
                    onOfferPage
                    application={e.a}
                    opinions={opinions.data?.external[e.a.id]}
                    focused={focusId === e.a.id}
                    compare={pickable ? { selected: selected.has(e.key), disabled: false, onToggle: () => toggle(e.key) } : undefined}
                  />
                );
              })}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

/** « Refuser la sélection » / « Refuser les autres candidatures »: one message for all. */
function BulkRefuseDialog({
  offerId,
  mode,
  ids,
  selectedOutsiderIds,
  count,
  rabotkaWaiting,
  outsiderIds,
  onClose,
  onDone,
}: Readonly<{
  offerId: string;
  mode: "selected" | "remaining" | null;
  /** Rabotka applications picked. */
  ids: string[];
  /** Careers-page applications picked. */
  selectedOutsiderIds: string[];
  count: number;
  rabotkaWaiting: number;
  outsiderIds: string[];
  onClose: () => void;
  onDone: () => void;
}>) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string>(mode === "remaining" ? REFUSAL_TEMPLATES[0].text : "");
  const refuse = useMutation({
    mutationFn: async () => {
      const text = message.trim() || undefined;
      const outside = mode === "remaining" ? outsiderIds : selectedOutsiderIds;
      // Both at once. Each careers candidate on its own: one failure no
      // longer reads as « none refused », and those already decided are not counted.
      const [rabotka, results] = await Promise.all([
        (mode === "remaining" && rabotkaWaiting === 0) || (mode === "selected" && ids.length === 0)
          ? Promise.resolve({ refused: 0, skipped: 0 })
          : refuseApplications(offerId, {
              ...(mode === "remaining" ? { remaining: true } : { applicationIds: ids }),
              ...(text ? { message: text } : {}),
            }).catch(() => null),
        Promise.allSettled(outside.map((id) => refuseExternalApplication(id, text))),
      ]);
      const outsideRefused = results.filter(
        (r) => r.status === "fulfilled" && (r.value as { refused?: boolean } | undefined)?.refused !== false,
      ).length;
      const outsideFailed = results.filter((r) => r.status === "rejected").length;
      // The Rabotka side failed as a whole: counted as failed, the careers side still reported.
      const rabotkaFailed = rabotka ? 0 : mode === "remaining" ? rabotkaWaiting : ids.length;
      return {
        refused: (rabotka?.refused ?? 0) + outsideRefused,
        skipped: (rabotka?.skipped ?? 0) + (outside.length - outsideRefused - outsideFailed),
        failed: outsideFailed + rabotkaFailed,
      };
    },
    onSuccess: ({ refused, skipped, failed }) => {
      void queryClient.invalidateQueries({ queryKey: offersKey });
      void queryClient.invalidateQueries({ queryKey: externalApplicationsKey });
      void queryClient.invalidateQueries({ queryKey: ["business", "me", "stats"] });
      toast.success(
        `${refused === 1 ? "1 candidature refusée" : `${refused} candidatures refusées`}, les candidats en sont prévenus.` +
          (skipped ? ` ${skipped} n'étai${skipped > 1 ? "ent" : "t"} plus en attente.` : ""),
      );
      if (failed) toast.error(`${failed} n'${failed > 1 ? "ont" : "a"} pas pu être refusée${failed > 1 ? "s" : ""} : réessayez.`);
      onDone();
      onClose();
    },
    // Picked cards change at once; « all the others » waits for the server,
    // which knows who is still waiting.
    onMutate: () => {
      if (mode !== "selected") return { undo: () => {} };
      const undos = [
        ...ids.map((id) => showApplicationStatus(queryClient, id, "REJECTED")),
        ...selectedOutsiderIds.map((id) => showExternalStatus(queryClient, id, "REFUSED")),
      ];
      return { undo: () => undos.reverse().forEach((u) => u()) };
    },
    onError: (err, _vars, ctx) => {
      ctx?.undo();
      void queryClient.invalidateQueries({ queryKey: offersKey });
      void queryClient.invalidateQueries({ queryKey: externalApplicationsKey });
      toast.error(friendlyError(err, "Les candidatures n'ont pas pu être refusées."));
    },
  });
  return (
    <ActionDialog
      open={mode !== null}
      onOpenChange={(o) => {
        if (!o) onClose();
        else setMessage(mode === "remaining" ? REFUSAL_TEMPLATES[0].text : "");
      }}
      tone="warning"
      icon={<IconX className="size-5" />}
      title={
        mode === "remaining"
          ? `Refuser les ${count} autres candidatures ?`
          : count === 1
            ? "Refuser la candidature sélectionnée ?"
            : `Refuser les ${count} candidatures sélectionnées ?`
      }
      description="Chaque candidat est prévenu, avec ce message."
      confirmLabel="Refuser"
      pending={refuse.isPending}
      onConfirm={() => refuse.mutate()}
    >
      <RefusalMessageField value={message} onChange={setMessage} />
    </ActionDialog>
  );
}

const APPLICANT_CRITERIA = [
  { key: "trade", label: "Métier" },
  { key: "experience", label: "Expérience" },
  { key: "location", label: "Proximité" },
  { key: "reliability", label: "Fiabilité" },
] as const;

/** One applicant: rank, score and verdict as in CV analysis, and why on demand. */
function ApplicantRow({
  jobTitle,
  applicant: a,
  rank,
  assessment,
  waiting,
  asked,
  recruiting,
  selected,
  onToggle,
  opinions,
  focused,
}: Readonly<{
  jobTitle: string;
  applicant: OfferApplicant;
  rank: number;
  assessment?: ApplicantAssessment;
  waiting: boolean;
  /** The offer asks questions: say when this application has no answers. */
  asked: boolean;
  recruiting: boolean;
  selected: boolean;
  /** Present when it can be picked: to compare (analysed) or refuse (waiting). */
  onToggle?: () => void;
  /** The team's opinions on it, counted. */
  opinions?: Record<Verdict, number>;
  /** Opened from a notification about it. */
  focused?: boolean;
}>) {
  const [open, setOpen] = useState(false);
  const name = `${a.worker.firstName} ${a.worker.lastName}`.trim();
  // What « ⋯ » opens: the CVs, the team's opinions; « Message » goes straight there.
  const [panel, setPanel] = useState<"own-cv" | "rabotka-cv" | "opinion" | "interview" | null>(null);
  const chat = useApplicationChat(a);
  const hire = canHire(useMember().role);
  const more: MoreAction[] = [
    ...(a.cv?.kind === "UPLOADED"
      ? [
          a.cv.available
            ? { key: "own-cv", label: "CV du candidat", icon: IconFileText, onSelect: () => setPanel("own-cv") }
            : {
                key: "own-cv",
                label: "CV du candidat",
                icon: IconLock,
                onSelect: () => undefined,
                disabled: true,
                hint: "S'ouvre une fois son contact obtenu",
              },
        ]
      : []),
    { key: "rabotka-cv", label: "CV Rabotka", icon: IconFileCv, onSelect: () => setPanel("rabotka-cv") },
    { key: "opinion", label: opinionLabel(opinions), icon: IconUsers, onSelect: () => setPanel("opinion") },
    ...(hire && chat.available
      ? [{ key: "message", label: "Message", icon: IconMessageCircle, onSelect: chat.open, disabled: chat.pending }]
      : []),
    // Invited by e-mail and in the app, as from « Candidatures ».
    ...(hire && recruiting && applicationStage(a.status) !== "closed"
      ? [{ key: "interview", label: "Planifier un entretien", icon: IconCalendarPlus, onSelect: () => setPanel("interview") }]
      : []),
  ];
  // The CV analysis, once in, speaks for the candidate as it does for a
  // careers-page CV; the profile score only until then.
  const analysed = cvScore(a.analysis) !== null ? (a.analysis as CvAnalysis) : null;
  const score = analysed ? analysed.score : (assessment?.score ?? null);
  const insight = analysed
    ? {
        summary: analysed.summary,
        strengths: analysed.strengths ?? [],
        gaps: analysed.gaps ?? [],
        criteria: CRITERIA.filter((k) => typeof analysed.criteria?.[k.key] === "number").map((k) => ({
          label: k.label,
          value: analysed.criteria?.[k.key] ?? 0,
        })),
      }
    : assessment
      ? {
          summary: assessment.summary,
          strengths: assessment.strengths,
          gaps: assessment.gaps,
          criteria: APPLICANT_CRITERIA.filter((k) => typeof assessment.criteria?.[k.key] === "number").map((k) => ({
            label: k.label,
            value: assessment.criteria?.[k.key] ?? 0,
          })),
        }
      : null;
  const answers = a.answers ?? [];
  const failed = failedLabel(answers);
  return (
    <li
      id={`candidature-${a.applicationId}`}
      className={cn("scroll-mt-24 rounded-2xl bg-page p-3 pr-4", focused && "ring-2 ring-whatsapp-dark")}
    >
      <div className="flex items-center gap-3">
        <span className="flex w-5 shrink-0 flex-col items-center gap-1">
          {onToggle && <Checkbox checked={selected} onCheckedChange={onToggle} aria-label={`Sélectionner ${name}`} className="size-4 rounded" />}
          <span className="font-semibold text-muted-foreground text-xs tabular-nums">{rank}</span>
        </span>
        {score !== null ? (
          <ScoreRing score={score} size={46} />
        ) : (
          // A spinner only while scores are on their way; otherwise no score (yet).
          <span
            className="flex size-[46px] shrink-0 items-center justify-center rounded-full bg-card text-muted-foreground"
            title={waiting ? "Analyse en cours" : "Pas encore de score"}
          >
            {waiting ? <Loader className="size-4 animate-spin" /> : "–"}
          </span>
        )}
        <Link href={`/espace/candidats/${a.worker.id}`} className="group flex min-w-0 flex-1 items-center gap-3">
          <Avatar className="size-10 shrink-0 rounded-xl">
            {a.worker.avatarUrl && <AvatarImage src={a.worker.avatarUrl} alt="" className="object-cover" />}
            <AvatarFallback className="rounded-xl bg-card font-medium">{getInitials(name)}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="truncate font-medium group-hover:underline">{name}</span>
              {score !== null && <VerdictChip score={score} />}
              {failed ? (
                <span className="rounded-full bg-chip-amber px-2.5 py-1 font-medium text-chip-amber-foreground text-xs">
                  Ne remplit pas : {failed}
                </span>
              ) : (
                asked &&
                answers.length === 0 && (
                  <span className="rounded-full bg-foreground/[0.07] px-2.5 py-1 font-medium text-muted-foreground text-xs">
                    Questions non répondues
                  </span>
                )
              )}
            </span>
            <span className="block truncate text-muted-foreground text-xs">
              Candidature du {new Date(a.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
              {a.worker.reliabilityScore !== null && ` · fiabilité ${a.worker.reliabilityScore}/100`}
            </span>
          </span>
        </Link>
        <span className={cn("shrink-0 rounded-full px-2.5 py-1 font-medium text-xs", statusClass(a.status))}>
          {APPLICATION_STATUS[a.status] ?? a.status}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        {(insight || answers.length > 0) && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="mr-auto inline-flex h-10 shrink-0 items-center gap-1 rounded-full bg-card px-3.5 font-medium text-sm hover:bg-card/70"
          >
            {detailsLabel(!!insight, answers.length > 0)}
            <IconChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
          </button>
        )}
        <ApplicantCvAnalysis jobTitle={jobTitle} analysis={a.analysis ?? null} />
        <ApplicationActions applicant={a} name={name} recruiting={recruiting} hideChat />
        <MoreActionsMenu name={name} actions={more} />
      </div>
      {a.cv?.kind === "UPLOADED" && (
        <OwnCvButton
          applicationId={a.applicationId}
          name={name}
          cv={a.cv}
          open={panel === "own-cv"}
          onOpenChange={(o) => setPanel(o ? "own-cv" : null)}
        />
      )}
      <ResumeButton workerId={a.worker.id} name={name} open={panel === "rabotka-cv"} onOpenChange={(o) => setPanel(o ? "rabotka-cv" : null)} />
      <TeamOpinionButton
        kind="rabotka"
        id={a.applicationId}
        name={name}
        summary={opinions}
        open={panel === "opinion"}
        onOpenChange={(o) => setPanel(o ? "opinion" : null)}
      />
      {panel === "interview" && (
        <ScheduleInterviewDialog
          open
          onOpenChange={(o) => setPanel(o ? "interview" : null)}
          candidate={{ name, applicationId: a.applicationId }}
          jobTitle={jobTitle}
        />
      )}
      {open && answers.length > 0 && <Answers answers={answers} />}
      {open && insight && <CandidateInsight {...insight} />}
    </li>
  );
}

/**
 * A Rabotka applicant's CV analysis, made as they apply (1 « CV inclus »):
 * « Interroger le CV » once it is in. It sits in the offer's screening, so it
 * can be compared with the careers-page CVs. What is read never carries their
 * contacts.
 */
function ApplicantCvAnalysis({
  jobTitle,
  analysis,
}: Readonly<{
  jobTitle: string;
  analysis: CvAnalysis | null;
}>) {
  const [chatting, setChatting] = useState(false);
  const scored = analysis?.status === "SCORED";
  // One request per screening, shared by every candidate of the offer; each picks its own.
  const resume = useQuery({
    queryKey: [...cvScreeningsKey, analysis?.screeningId],
    queryFn: () => getCvScreening(analysis?.screeningId as string),
    select: (s) => s.resumes.find((r) => r.id === analysis?.resumeId) ?? null,
    enabled: scored,
  });

  if (analysis?.status === "QUEUED") {
    return (
      <span className="inline-flex h-10 items-center gap-2 px-1 text-muted-foreground text-sm">
        <Loader className="size-4 animate-spin" />
        Analyse du CV…
      </span>
    );
  }
  if (scored) {
    return (
      <>
        <button
          type="button"
          disabled={!resume.data}
          onClick={() => setChatting(true)}
          className="inline-flex h-10 shrink-0 items-center rounded-full bg-brand-lime px-4 font-medium text-[#0f2414] text-sm disabled:opacity-60"
        >
          Interroger le CV
        </button>
        {chatting && resume.data && (
          <CvChatSheet
            open={chatting}
            onOpenChange={setChatting}
            screeningId={analysis.screeningId}
            jobTitle={jobTitle}
            resume={{ ...resume.data, score: analysis.score }}
          />
        )}
      </>
    );
  }
  // The model gave nothing usable: the backend tries again on its own.
  if (analysis?.status === "FAILED") {
    return (
      <span className="inline-flex h-10 items-center px-1 text-muted-foreground text-sm" title="L'analyse de son CV a échoué ; elle sera relancée automatiquement.">
        Analyse du CV à refaire
      </span>
    );
  }
  // Not analysed yet: it is done on its own as the application arrives, or by
  // the catch-up once the plan has « CV inclus » again. Nothing to press.
  return null;
}

/** What a candidate answered to the offer's questions; ✓ / ✕ on the « éliminatoires ». */
function Answers({ answers }: Readonly<{ answers: NonNullable<OfferApplicant["answers"]> }>) {
  return (
    <div className="mt-4 space-y-2 rounded-2xl bg-card p-4">
      <p className="font-medium text-sm">Réponses aux questions</p>
      <dl className="space-y-2">
        {answers.map((x) => (
          <div key={x.label} className="flex items-start gap-2.5 text-sm">
            {x.passed === null ? (
              // No criterion on this question: a plain list dot, as in the
              // offer's description. The ✓ / ✕ are kept for « éliminatoires ».
              <span aria-hidden className="mt-0.5 flex size-5 shrink-0 items-center justify-center">
                <span className="size-1.5 rounded-full bg-whatsapp-dark" />
              </span>
            ) : (
              <span
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                  x.passed ? "bg-chip-green text-chip-green-foreground" : "bg-chip-amber text-chip-amber-foreground",
                )}
              >
                {x.passed ? <IconCheck className="size-3" /> : <IconX className="size-3" />}
              </span>
            )}
            <div className="min-w-0">
              <dt className="text-muted-foreground">{x.label}</dt>
              <dd className="font-medium">
                <DescriptionText text={x.value} />
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** The offer's questions, as candidates see them, with the « éliminatoires » marked. */
function QuestionsCard({ offer: o }: Readonly<{ offer: Offer }>) {
  if (o.questions.length === 0) return null;
  return (
    <section className="space-y-3 rounded-3xl bg-card p-6">
      <h2 className="font-semibold text-lg">Questions aux candidats</h2>
      <ol className="space-y-2.5">
        {o.questions.map((q, i) => (
          <li key={i} className="space-y-1 rounded-2xl bg-page p-3 text-sm">
            <p className="font-medium">
              {i + 1}. {q.label}
            </p>
            <p className="flex flex-wrap items-center gap-1.5 text-muted-foreground text-xs">
              {KIND_LABEL[q.kind]}
              {q.kind === "CHOICE" && ` : ${q.options.join(", ")}`}
              {!q.required && " · facultative"}
              {q.knockout && (
                <span className="rounded-full bg-chip-amber px-2 py-0.5 font-medium text-chip-amber-foreground">
                  Éliminatoire : {q.kind === "YES_NO" ? (q.accepted[0] === "yes" ? "Oui" : "Non") : q.accepted.join(", ")} attendu
                </span>
              )}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * Profiles that fit this offer — its trade and city, reliable ones first —
 * who have not applied: the business may reach them directly. Hidden when
 * the plan has no search (403) or nobody fits.
 */
/**
 * Reads every waiting careers-page CV of the offer at once: they can then be
 * compared. Rabotka applicants need none of it, analysed as they apply.
 */
function AnalyseAllBar({ offerId, outsiders }: Readonly<{ offerId: string; outsiders: ExternalApplication[] }>) {
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const waiting = outsiders.filter((a) => a.status === "PENDING" && recruiting(a) && a.hasCv && !a.analysis).length;
  const analyse = useMutation({
    mutationFn: () => analyseExternalApplications(offerId),
    onSuccess: ({ left }) => {
      void queryClient.invalidateQueries({ queryKey: externalApplicationsKey });
      void queryClient.invalidateQueries({ queryKey: mySubscriptionKey });
      setConfirm(false);
      if (left > 0) toast.info(`Encore ${left} CV à analyser : votre formule en lit un nombre limité à la fois.`);
    },
    onError: (err) => toast.error(friendlyError(err, "Les CV n'ont pas pu être analysés.")),
  });
  if (waiting === 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-page p-4">
      <p className="text-sm">
        {waiting === 1 ? "1 candidat sans analyse de CV" : `${waiting} candidats sans analyse de CV`} : analysez-les pour les
        interroger et les comparer.
      </p>
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="inline-flex h-10 items-center rounded-full bg-ink px-4 font-medium text-sm text-white"
      >
        Analyser tout
      </button>
      <ActionDialog
        open={confirm}
        onOpenChange={setConfirm}
        icon={<IconFileSearch className="size-5" />}
        title="Analyser ces CV ?"
        description="Chaque CV lu utilise 1 CV inclus de votre formule."
        confirmLabel="Analyser"
        pending={analyse.isPending}
        onConfirm={() => analyse.mutate()}
      />
    </div>
  );
}

function SuggestedCard({
  offer: o,
  category,
  exclude,
}: Readonly<{ offer: Offer; category?: string; exclude: string[] }>) {
  const filters = { categoryId: o.categoryId ?? undefined, city: o.isRemote ? undefined : (o.city ?? undefined), minReliability: 70 };
  const found = useQuery({
    queryKey: ["candidates", "for-offer", o.id],
    // The city first; too few there, the same trade anywhere (people travel for work).
    queryFn: async () => {
      const near = await findCandidates(filters, 0, 8);
      if (near.items.length >= 4 + exclude.length) return near;
      const wider = filters.city ? await findCandidates({ ...filters, city: undefined }, 0, 8 + exclude.length) : near;
      const seen = new Set(near.items.map((c) => c.id));
      const found = { total: wider.total, items: [...near.items, ...wider.items.filter((c) => !seen.has(c.id))] };
      if (found.items.length > 0 || !category) return found;
      // Nobody with this exact trade: the search also finds the rest of its sector.
      return findCandidates({ q: category, minReliability: filters.minReliability }, 0, 8 + exclude.length);
    },
    retry: false,
  });
  const shown = (found.data?.items ?? []).filter((c) => !exclude.includes(c.id)).slice(0, 4);
  if (found.isLoading || shown.length === 0) return null;
  const more = new URLSearchParams(Object.entries(filters).filter(([k, v]) => v !== undefined && k !== "minReliability") as [string, string][]);

  return (
    <section className="space-y-4 rounded-3xl bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-xl">Profils suggérés</h2>
        </div>
        <Link href={`/espace/recherche?${more}`} className="font-medium text-sm text-whatsapp-dark hover:underline">
          Voir plus de profils
        </Link>
      </div>
      <p className="-mt-2 text-muted-foreground text-sm">Ils correspondent à cette offre et n&apos;ont pas encore postulé : contactez-les directement.</p>
      <ul className="grid gap-3 md:grid-cols-2">
        {shown.map((c) => (
          <CandidateCard key={c.id} candidate={c} compact />
        ))}
      </ul>
    </section>
  );
}

function DetailsCard({ offer: o, category }: Readonly<{ offer: Offer; category?: string }>) {
  const place = o.isRemote ? "À distance" : [o.city, o.countryName].filter(Boolean).join(", ");
  const rows: { icon: TablerIcon; label: string; value: string; hint?: string }[] = [
    ...(isDatedMission(o.employmentType) || o.scheduledAt
      ? [
          {
            icon: IconCalendarEvent,
            label: isDatedMission(o.employmentType) ? "Candidatures jusqu'au" : "Clôture des candidatures",
            value: offerDate(o.scheduledAt, o.employmentType)?.replace(/^Candidatures jusqu'au /, "") ?? "Non renseignée",
          },
        ]
      : []),
    { icon: IconMapPin, label: "Lieu", value: place || "Non renseigné", hint: o.isRemote ? undefined : (o.address ?? undefined) },
    { icon: IconUsers, label: "Postes", value: `${o.quantity} personne${o.quantity > 1 ? "s" : ""}` },
    {
      icon: IconCash,
      label: "Rémunération",
      value: o.amount === null ? "À discuter avec le candidat" : `${fcfa(o.amount)}${o.paymentFlow ? ` ${PAYMENT_SUFFIX[o.paymentFlow]}` : ""}`,
    },
    { icon: IconBriefcase, label: "Type et métier", value: [EMPLOYMENT_LABEL[o.employmentType], category].filter(Boolean).join(" · ") },
  ];
  return (
    <section className="space-y-4 rounded-3xl bg-card p-6">
      <h2 className="font-semibold text-lg">Détails</h2>
      <dl className="space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-page">
              <r.icon className="size-4 text-muted-foreground" />
            </span>
            <div className="min-w-0">
              <dt className="text-muted-foreground text-xs">{r.label}</dt>
              <dd className="break-words font-medium text-sm">{r.value}</dd>
              {r.hint && <dd className="break-words text-muted-foreground text-xs">{r.hint}</dd>}
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}
