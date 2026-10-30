"use client";

import { useState } from "react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconArrowLeft,
  IconBriefcase,
  IconCalendarEvent,
  IconCash,
  IconCheck,
  IconChevronDown,
  IconCircleX,
  IconInbox,
  IconInfoCircle,
  IconMapPin,
  IconMinus,
  IconPencil,
  IconRefresh,
  IconTrash,
  IconUserCheck,
  IconUsers,
  IconX,
  type Icon as TablerIcon,
} from "@tabler/icons-react";
import { Loader } from "lucide-react";
import { toast } from "sonner";

import { ActionDialog } from "#/components/action-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Input } from "#/components/ui/input";
import { Skeleton } from "#/components/ui/skeleton";
import { Bone, RowsSkeleton, TilesSkeleton } from "#/components/page-skeletons";
import { ExternalApplicationCard, externalStage } from "#/features/applications/components/external-application-card";
import { CandidateCard } from "#/features/candidates/components/candidate-card";
import { ResumeButton } from "#/features/candidates/components/resume-button";
import { getMyBusiness, myBusinessKey, mySubscriptionKey } from "#/lib/api/business-controller";
import { externalApplicationsKey, listExternalApplications, type ExternalApplication } from "#/lib/api/careers-controller";
import { findCandidates } from "#/lib/api/candidate-controller";
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
  republishOffer,
  type ApplicantAssessment,
  type Offer,
  type OfferApplicant,
} from "#/lib/api/offer-controller";
import { cn, getInitials } from "#/lib/utils";
import {
  APPLICATION_STATUS,
  applicationStage,
  EMPLOYMENT_LABEL,
  fcfa,
  isDatedMission,
  offerDate,
  PAYMENT_SUFFIX,
  statusClass,
  STATUS,
  type ApplicationStage,
} from "../offer-labels";
import { failedLabel, KIND_LABEL } from "../offer-questions";
import { ApplicationActions } from "./application-actions";
import { REFUSAL_TEMPLATES, RefusalMessageField } from "./refusal-message";
import { ShareOfferMenu } from "./share-offer-menu";
import { Checkbox } from "#/components/ui/checkbox";
import { CriterionBar, Points, ScoreRing, VerdictChip } from "#/features/cv-screening/components/cv-bits";
import { scheduledIso } from "./offer-form";

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
  // Those who applied from the public careers page.
  const external = useQuery({ queryKey: externalApplicationsKey, queryFn: listExternalApplications });
  const outsiders = (external.data ?? []).filter((a) => a.offer.id === id);
  // The candidate's side moves on its own (paying their part of an unlock): keep up.
  const applicants = useQuery({
    queryKey: [...offersKey, id, "applicants"],
    queryFn: () => getOfferApplicants(id),
    refetchInterval: 30_000,
  });
  const categories = useQuery({ queryKey: ["job-categories"], queryFn: getJobCategories, staleTime: Infinity });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [republishing, setRepublishing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [newDate, setNewDate] = useState("");

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: offersKey });
    void queryClient.invalidateQueries({ queryKey: mySubscriptionKey });
  };
  const close = useMutation({
    mutationFn: () => closeOffer(id),
    onSuccess: () => {
      refresh();
      void queryClient.invalidateQueries({ queryKey: externalApplicationsKey });
      setConfirmClose(false);
      toast.success("Offre fermée. Les candidats en attente sont prévenus.");
    },
    onError: (err) => toast.error(friendlyError(err, "L'offre n'a pas pu être fermée.")),
  });
  const remove = useMutation({
    mutationFn: () => deleteOffer(id),
    onSuccess: () => {
      refresh();
      toast.success("Offre supprimée. Les candidats en attente sont prévenus.");
      router.push("/espace/offres");
    },
    onError: (err) => toast.error(friendlyError(err, "L'offre n'a pas pu être supprimée.")),
  });
  const republish = useMutation({
    mutationFn: () => republishOffer(id, scheduledIso(newDate, "")),
    onSuccess: () => {
      refresh();
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
                  <ShareOfferMenu slug={business.publicSlug} reference={o.reference} title={o.title} />
                )}
                {o.status === "ACTIVE" && (
                  <Link
                    href={`/espace/offres/${o.id}/modifier`}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 font-medium text-sm text-white hover:bg-ink/90"
                  >
                    <IconPencil className="size-4" />
                    Modifier
                  </Link>
                )}
                {(o.status === "ACTIVE" || o.status === "PARTIALLY_FILLED") && (
                  <button
                    type="button"
                    onClick={() => setConfirmClose(true)}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-page px-4 font-medium text-sm hover:bg-page/70"
                  >
                    <IconCircleX className="size-4" />
                    Fermer l&apos;offre
                  </button>
                )}
                {o.status === "EXPIRED" && (
                  <button
                    type="button"
                    onClick={() => setRepublishing(true)}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 font-medium text-sm text-white hover:bg-ink/90"
                  >
                    <IconRefresh className="size-4" />
                    Republier
                  </button>
                )}
                {(o.status === "ACTIVE" || o.status === "EXPIRED") && (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-page px-4 font-medium text-destructive text-sm hover:bg-destructive/10"
                  >
                    <IconTrash className="size-4" />
                    Supprimer
                  </button>
                )}
              </div>
            }
          />

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
              <section className="space-y-5 rounded-3xl bg-card p-6">
                <div className="space-y-2">
                  <h2 className="font-semibold text-lg">Description</h2>
                  <p className="whitespace-pre-line text-muted-foreground leading-relaxed">{o.description}</p>
                </div>
                {o.note && (
                  <div className="space-y-2 rounded-2xl bg-page p-4">
                    <h3 className="flex items-center gap-1.5 font-medium text-sm">
                      <IconInfoCircle className="size-4" />
                      Note pour les candidats
                    </h3>
                    <p className="whitespace-pre-line text-muted-foreground text-sm leading-relaxed">{o.note}</p>
                  </div>
                )}
              </section>
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
        open={republishing}
        onOpenChange={setRepublishing}
        icon={<IconRefresh className="size-5" />}
        title="Republier l'offre"
        description="Choisissez la nouvelle date (au moins 4 heures à l'avance)."
        confirmLabel="Republier"
        confirmDisabled={!newDate}
        pending={republish.isPending}
        onConfirm={() => republish.mutate()}
      >
        <Input
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          className="h-12 rounded-xl border-0 bg-page px-4 shadow-none"
        />
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
  const status = STATUS[o.status];
  const list = applicants ?? [];
  const toReview = list.filter((a) => applicationStage(a.status) === "new").length + outsiders.filter((a) => externalStage(a) === "new").length;
  // `acceptedCount` counts ACCEPTED only; a hire that has started or ended still fills its seat.
  const hired =
    list.filter((a) => applicationStage(a.status) === "hired").length + outsiders.filter((a) => a.status === "RETAINED").length;
  const filled = Math.min(Math.max(o.acceptedCount, hired), o.quantity);
  const left = o.scheduledAt ? daysUntil(o.scheduledAt) : null;
  const open = o.status === "ACTIVE" || o.status === "PARTIALLY_FILLED";

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
          label={isDatedMission(o.employmentType) ? "Mission" : "Clôture"}
          value={left === null ? "—" : left > 0 ? `J-${left}` : left === 0 ? "Aujourd'hui" : "Passée"}
          hint={o.scheduledAt ? (offerDate(o.scheduledAt, o.employmentType) ?? undefined) : undefined}
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
  const shown = tab === "all" ? list : list.filter((a) => applicationStage(a.status) === tab);
  const shownOutsiders = tab === "all" ? outsiders : outsiders.filter((a) => externalStage(a) === tab);
  // Ranked like CV analysis: best fit first; not scored yet, after, newest first.
  const assessed = useQuery({
    queryKey: [...offersKey, o.id, "assessments"],
    queryFn: () => getOfferAssessments(o.id),
    refetchInterval: (q) => ((q.state.data?.pending ?? 0) > 0 ? 30_000 : false),
  });
  const scores = new Map((assessed.data?.assessments ?? []).map((x) => [x.applicationId, x]));
  const pending = assessed.data?.pending ?? 0;
  // Refusals in bulk: those picked, or every one still waiting once the posts are filled.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState<"selected" | "remaining" | null>(null);
  const waiting = list.filter((a) => a.status === "PENDING" || a.status === "VIEWED");
  const hiredCount = list.filter((a) => applicationStage(a.status) === "hired").length;
  const filled = o.status === "FILLED" || hiredCount >= o.quantity;
  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  // Those who do not meet an « éliminatoire » question come last, and can be hidden.
  const [hideOut, setHideOut] = useState(false);
  const outCount = shown.filter((a) => a.knockedOut).length;
  const ranked = [...shown]
    .filter((a) => !(hideOut && a.knockedOut))
    .sort((x, y) => {
      if (!!x.knockedOut !== !!y.knockedOut) return x.knockedOut ? 1 : -1;
      const sx = scores.get(x.applicationId)?.score ?? -1;
      const sy = scores.get(y.applicationId)?.score ?? -1;
      return sy - sx || y.createdAt.localeCompare(x.createdAt);
    });
  const asked = o.questions.length > 0;
  const open = o.status === "ACTIVE" || o.status === "PARTIALLY_FILLED";

  return (
    <section className="space-y-5 rounded-3xl bg-card p-6">
      <div className="space-y-1">
        <h2 className="font-semibold text-xl">Candidats</h2>
        <p className="text-muted-foreground text-sm">Classés par adéquation avec l&apos;offre, d&apos;après leur profil Rabotka.</p>
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

          {filled && waiting.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-chip-violet/60 px-4 py-3 text-chip-violet-foreground text-sm">
              <span>
                Tous les postes sont pourvus.{" "}
                {waiting.length === 1 ? "1 candidature attend" : `${waiting.length} candidatures attendent`} encore une réponse.
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
              <span className="flex gap-2">
                <button type="button" onClick={() => setSelected(new Set())} className="h-9 rounded-full px-3 hover:bg-white/10">
                  Annuler
                </button>
                <button type="button" onClick={() => setBulk("selected")} className="h-9 rounded-full bg-white px-4 font-medium text-ink hover:bg-white/90">
                  Refuser la sélection
                </button>
              </span>
            </div>
          )}

          <BulkRefuseDialog
            offerId={o.id}
            mode={bulk}
            ids={[...selected]}
            count={bulk === "remaining" ? waiting.length : selected.size}
            onClose={() => setBulk(null)}
            onDone={() => setSelected(new Set())}
          />

          {shown.length + shownOutsiders.length === 0 ? (
            <p className="rounded-2xl bg-page p-4 text-muted-foreground text-sm">Aucun candidat à cette étape.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {ranked.map((a, i) => (
                <ApplicantRow
                  key={a.applicationId}
                  applicant={a}
                  rank={i + 1}
                  assessment={scores.get(a.applicationId)}
                  waiting={pending > 0}
                  asked={asked}
                  selected={selected.has(a.applicationId)}
                  onToggle={a.status === "PENDING" || a.status === "VIEWED" ? () => toggle(a.applicationId) : undefined}
                />
              ))}
              {shownOutsiders.map((a) => (
                <ExternalApplicationCard key={a.id} application={a} />
              ))}
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
  count,
  onClose,
  onDone,
}: Readonly<{
  offerId: string;
  mode: "selected" | "remaining" | null;
  ids: string[];
  count: number;
  onClose: () => void;
  onDone: () => void;
}>) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string>(mode === "remaining" ? REFUSAL_TEMPLATES[0].text : "");
  const refuse = useMutation({
    mutationFn: () =>
      refuseApplications(offerId, {
        ...(mode === "remaining" ? { remaining: true } : { applicationIds: ids }),
        ...(message.trim() ? { message: message.trim() } : {}),
      }),
    onSuccess: ({ refused, skipped }) => {
      void queryClient.invalidateQueries({ queryKey: offersKey });
      void queryClient.invalidateQueries({ queryKey: ["business", "me", "stats"] });
      toast.success(
        `${refused === 1 ? "1 candidature refusée" : `${refused} candidatures refusées`}, les candidats en sont prévenus.` +
          (skipped ? ` ${skipped} n'étai${skipped > 1 ? "ent" : "t"} plus en attente.` : ""),
      );
      onDone();
      onClose();
    },
    onError: (err) => toast.error(friendlyError(err, "Les candidatures n'ont pas pu être refusées.")),
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
  applicant: a,
  rank,
  assessment,
  waiting,
  asked,
  selected,
  onToggle,
}: Readonly<{
  applicant: OfferApplicant;
  rank: number;
  assessment?: ApplicantAssessment;
  waiting: boolean;
  /** The offer asks questions: say when this application has no answers. */
  asked: boolean;
  selected: boolean;
  /** Present only for an application still waiting: it can be refused in bulk. */
  onToggle?: () => void;
}>) {
  const [open, setOpen] = useState(false);
  const name = `${a.worker.firstName} ${a.worker.lastName}`.trim();
  const score = assessment?.score ?? null;
  const answers = a.answers ?? [];
  const failed = failedLabel(answers);
  return (
    <li className="rounded-2xl bg-page p-3 pr-4">
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
        {(assessment || answers.length > 0) && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="mr-auto inline-flex h-10 shrink-0 items-center gap-1 rounded-full bg-card px-3.5 font-medium text-sm hover:bg-card/70"
          >
            {assessment ? (answers.length > 0 ? "Score et réponses" : "Pourquoi ce score ?") : "Voir les réponses"}
            <IconChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
          </button>
        )}
        <ResumeButton workerId={a.worker.id} name={name} />
        <ApplicationActions applicant={a} name={name} />
      </div>
      {open && answers.length > 0 && <Answers answers={answers} />}
      {open && assessment && (
        <div className="mt-4 space-y-4">
          {assessment.summary && <p className="text-sm leading-relaxed">{assessment.summary}</p>}
          <div className="grid gap-5 md:grid-cols-[1fr_1fr_14rem]">
            <Points title="Points forts" items={assessment.strengths} tone="good" />
            <Points title="Points à vérifier" items={assessment.gaps} tone="gap" />
            <div className="space-y-2.5 rounded-2xl bg-card p-4">
              {APPLICANT_CRITERIA.filter((k) => typeof assessment.criteria?.[k.key] === "number").map((k) => (
                <CriterionBar key={k.key} label={k.label} value={assessment.criteria?.[k.key] ?? 0} />
              ))}
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

/** What a candidate answered to the offer's questions; ✓ / ✕ on the « éliminatoires ». */
function Answers({ answers }: Readonly<{ answers: NonNullable<OfferApplicant["answers"]> }>) {
  return (
    <div className="mt-4 space-y-2 rounded-2xl bg-card p-4">
      <p className="font-medium text-sm">Réponses aux questions</p>
      <dl className="space-y-2">
        {answers.map((x) => (
          <div key={x.label} className="flex items-start gap-2.5 text-sm">
            <span
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                x.passed === true && "bg-chip-green text-chip-green-foreground",
                x.passed === false && "bg-chip-amber text-chip-amber-foreground",
                x.passed === null && "bg-page text-muted-foreground",
              )}
            >
              {x.passed === false ? <IconX className="size-3" /> : x.passed === true ? <IconCheck className="size-3" /> : <IconMinus className="size-3" />}
            </span>
            <div className="min-w-0">
              <dt className="text-muted-foreground">{x.label}</dt>
              <dd className="whitespace-pre-line break-words font-medium">{x.value}</dd>
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
    {
      icon: IconCalendarEvent,
      label: isDatedMission(o.employmentType) ? "Date de la mission" : "Clôture des candidatures",
      value: offerDate(o.scheduledAt, o.employmentType)?.replace(/^Candidatures jusqu'au /, "") ?? "Non renseignée",
    },
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
