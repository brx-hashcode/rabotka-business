"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconArrowLeft,
  IconBriefcase,
  IconCalendarEvent,
  IconCash,
  IconInbox,
  IconInfoCircle,
  IconMapPin,
  IconPencil,
  IconRefresh,
  IconTrash,
  IconUserCheck,
  IconUsers,
  type Icon as TablerIcon,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { ActionDialog } from "#/components/action-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Input } from "#/components/ui/input";
import { Skeleton } from "#/components/ui/skeleton";
import { CandidateCard } from "#/features/candidates/components/candidate-card";
import { mySubscriptionKey } from "#/lib/api/business-controller";
import { findCandidates } from "#/lib/api/candidate-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import {
  deleteOffer,
  getOffer,
  getJobCategories,
  getOfferApplicants,
  offersKey,
  republishOffer,
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
  STAGE_CLASS,
  STATUS,
  type ApplicationStage,
} from "../offer-labels";
import { ApplicationActions } from "./application-actions";
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
  // The candidate's side moves on its own (paying their part of an unlock): keep up.
  const applicants = useQuery({
    queryKey: [...offersKey, id, "applicants"],
    queryFn: () => getOfferApplicants(id),
    refetchInterval: 30_000,
  });
  const categories = useQuery({ queryKey: ["job-categories"], queryFn: getJobCategories, staleTime: Infinity });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [republishing, setRepublishing] = useState(false);
  const [newDate, setNewDate] = useState("");

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: offersKey });
    void queryClient.invalidateQueries({ queryKey: mySubscriptionKey });
  };
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
        Mes offres
      </Link>

      {offer.isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      ) : !o ? (
        <p className="rounded-3xl bg-card p-6 text-muted-foreground">{friendlyError(offer.error, "Cette offre est introuvable.")}</p>
      ) : (
        <>
          <OfferHeader
            offer={o}
            category={categories.data?.find((c) => c.id === o.categoryId)?.name}
            applicants={applicants.data}
            actions={
              <div className="flex flex-wrap gap-2 empty:hidden">
                {o.status === "ACTIVE" && (
                  <Link
                    href={`/espace/offres/${o.id}/modifier`}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 font-medium text-sm text-white hover:bg-ink/90"
                  >
                    <IconPencil className="size-4" />
                    Modifier
                  </Link>
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
              <ApplicantsCard offer={o} applicants={applicants.data} loading={applicants.isLoading} />
              {(o.status === "ACTIVE" || o.status === "PARTIALLY_FILLED") && (
                <SuggestedCard offer={o} exclude={(applicants.data ?? []).map((a) => a.worker.id)} />
              )}
            </div>
            <div className="space-y-6 lg:sticky lg:top-24">
              <DetailsCard offer={o} category={categories.data?.find((c) => c.id === o.categoryId)?.name} />
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
  actions,
}: Readonly<{ offer: Offer; category?: string; applicants?: OfferApplicant[]; actions: React.ReactNode }>) {
  const status = STATUS[o.status];
  const list = applicants ?? [];
  const toReview = list.filter((a) => applicationStage(a.status) === "new").length;
  // `acceptedCount` counts ACCEPTED only; a hire that has started or ended still fills its seat.
  const hired = list.filter((a) => applicationStage(a.status) === "hired").length;
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
        <Tile icon={IconInbox} label="Candidatures" value={applicants ? String(list.length) : "—"} />
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
  loading,
}: Readonly<{ offer: Offer; applicants?: OfferApplicant[]; loading: boolean }>) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("all");
  const list = applicants ?? [];
  const count = (k: (typeof TABS)[number]["key"]) => (k === "all" ? list.length : list.filter((a) => applicationStage(a.status) === k).length);
  const shown = tab === "all" ? list : list.filter((a) => applicationStage(a.status) === tab);
  const open = o.status === "ACTIVE" || o.status === "PARTIALLY_FILLED";

  return (
    <section className="space-y-5 rounded-3xl bg-card p-6">
      <h2 className="font-semibold text-xl">Candidats</h2>

      {loading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-page px-6 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-card">
            <IconUsers className="size-6 text-muted-foreground" />
          </span>
          <p className="font-medium">Aucune candidature pour le moment</p>
          <p className="max-w-sm text-muted-foreground text-sm">
            {open
              ? "Les travailleurs correspondants ont été prévenus de votre offre. Les candidatures apparaîtront ici."
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
                onClick={() => setTab(t.key)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 font-medium text-sm transition-colors",
                  tab === t.key ? "bg-brand-lime text-[#0f2414]" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
                <span className="tabular-nums opacity-70">{count(t.key)}</span>
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <p className="rounded-2xl bg-page p-4 text-muted-foreground text-sm">Aucun candidat à cette étape.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {shown.map((a) => {
                const name = `${a.worker.firstName} ${a.worker.lastName}`.trim();
                return (
                  <li
                    key={a.applicationId}
                    className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl bg-page p-3 pr-4"
                  >
                    <Link href={`/espace/candidats/${a.worker.id}`} className="group flex min-w-0 flex-1 items-center gap-4">
                      <Avatar className="size-11 rounded-xl">
                        {a.worker.avatarUrl && <AvatarImage src={a.worker.avatarUrl} alt="" className="object-cover" />}
                        <AvatarFallback className="rounded-xl bg-card font-medium">{getInitials(name)}</AvatarFallback>
                      </Avatar>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium group-hover:underline">{name}</span>
                        <span className="block text-muted-foreground text-xs">
                          Candidature du {new Date(a.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                          {a.worker.reliabilityScore !== null && ` · fiabilité ${a.worker.reliabilityScore}/100`}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2.5 py-1 font-medium text-xs",
                          STAGE_CLASS[applicationStage(a.status)],
                        )}
                      >
                        {APPLICATION_STATUS[a.status] ?? a.status}
                      </span>
                    </Link>
                    <ApplicationActions applicant={a} name={name} />
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

/**
 * Profiles that fit this offer — its trade and city, reliable ones first —
 * who have not applied: the business may reach them directly. Hidden when
 * the plan has no search (403) or nobody fits.
 */
function SuggestedCard({ offer: o, exclude }: Readonly<{ offer: Offer; exclude: string[] }>) {
  const filters = { categoryId: o.categoryId ?? undefined, city: o.isRemote ? undefined : (o.city ?? undefined), minReliability: 70 };
  const found = useQuery({
    queryKey: ["candidates", "for-offer", o.id],
    // The city first; too few there, the same trade anywhere (people travel for work).
    queryFn: async () => {
      const near = await findCandidates(filters, 0, 8);
      if (!filters.city || near.items.length >= 4 + exclude.length) return near;
      const wider = await findCandidates({ ...filters, city: undefined }, 0, 8 + exclude.length);
      const seen = new Set(near.items.map((c) => c.id));
      return { total: wider.total, items: [...near.items, ...wider.items.filter((c) => !seen.has(c.id))] };
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
          Voir plus dans Recherche
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
    { icon: IconBriefcase, label: "Type et domaine", value: [EMPLOYMENT_LABEL[o.employmentType], category].filter(Boolean).join(" · ") },
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
