"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconArrowLeft,
  IconCalendar,
  IconMapPin,
  IconPencil,
  IconRefresh,
  IconTrash,
  IconUsers,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { ActionDialog } from "#/components/action-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Input } from "#/components/ui/input";
import { Skeleton } from "#/components/ui/skeleton";
import { mySubscriptionKey } from "#/lib/api/business-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import {
  deleteOffer,
  getOffer,
  getOfferApplicants,
  offersKey,
  republishOffer,
  type Offer,
} from "#/lib/api/offer-controller";
import { cn, getInitials } from "#/lib/utils";
import { APPLICATION_STATUS, EMPLOYMENT_LABEL, fcfa, offerDate, PAYMENT_SUFFIX, STATUS } from "../offer-labels";
import { scheduledIso } from "./offer-form";

/**
 * One offer: what was published, its applicants (public profile only — a
 * candidate opens in the profile dialog, never with a phone), and what can be
 * done with it at this stage: edit while active, delete while nobody is
 * engaged, republish once expired.
 */
export function OfferDetailPage({ id }: Readonly<{ id: string }>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const offer = useQuery({ queryKey: [...offersKey, id], queryFn: () => getOffer(id) });
  const applicants = useQuery({ queryKey: [...offersKey, id, "applicants"], queryFn: () => getOfferApplicants(id) });
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
        <Skeleton className="h-72 rounded-3xl" />
      ) : !o ? (
        <p className="rounded-3xl bg-card p-6 text-muted-foreground">{friendlyError(offer.error, "Cette offre est introuvable.")}</p>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_26rem]">
          <OfferSummary
            offer={o}
            actions={
              <div className="flex flex-wrap gap-2">
                {o.status === "ACTIVE" && (
                  <Link
                    href={`/espace/offres/${o.id}/modifier`}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-page px-4 font-medium text-sm hover:bg-page/70"
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

          <section className="space-y-4 rounded-3xl bg-card p-6">
            <h2 className="font-semibold text-lg">
              Candidats{applicants.data?.length ? ` (${applicants.data.length})` : ""}
            </h2>
            {applicants.isLoading ? (
              <Skeleton className="h-40 rounded-2xl" />
            ) : !applicants.data?.length ? (
              <p className="rounded-2xl bg-page p-4 text-muted-foreground text-sm">
                Aucune candidature pour le moment. Les candidats correspondants ont été prévenus de votre offre.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {applicants.data.map((a) => {
                  const name = `${a.worker.firstName} ${a.worker.lastName}`.trim();
                  return (
                    <li key={a.applicationId}>
                      <Link
                        href={`/espace/candidats/${a.worker.id}`}
                        className="flex items-center gap-3 rounded-2xl bg-page p-3 transition-colors hover:bg-page/70"
                      >
                        <Avatar className="size-10 rounded-xl">
                          {a.worker.avatarUrl && <AvatarImage src={a.worker.avatarUrl} alt="" className="object-cover" />}
                          <AvatarFallback className="rounded-xl bg-card font-medium">{getInitials(name)}</AvatarFallback>
                        </Avatar>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-sm">{name}</span>
                          <span className="block text-muted-foreground text-xs">
                            {a.worker.reliabilityScore !== null ? `Fiabilité ${a.worker.reliabilityScore}/100 · ` : ""}
                            {new Date(a.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                          </span>
                        </span>
                        <span className="shrink-0 rounded-full bg-card px-2.5 py-1 font-medium text-xs">
                          {APPLICATION_STATUS[a.status] ?? a.status}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
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

function OfferSummary({ offer: o, actions }: Readonly<{ offer: Offer; actions: React.ReactNode }>) {
  const status = STATUS[o.status];
  const when = offerDate(o.scheduledAt, o.employmentType);
  const place = o.isRemote
    ? "À distance"
    : [o.address, [o.city, o.countryName].filter(Boolean).join(", ")].filter(Boolean).join(" — ");
  return (
    <section className="space-y-6 rounded-3xl bg-card p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-page px-2.5 py-1 font-medium text-xs">{EMPLOYMENT_LABEL[o.employmentType]}</span>
        <span className={cn("rounded-full px-2.5 py-1 font-medium text-xs", status.className)}>{status.label}</span>
        <span className="text-muted-foreground text-xs">Réf. {o.reference}</span>
      </div>
      <div className="space-y-3">
        <h1 className="font-semibold text-3xl tracking-tight">{o.title}</h1>
        {actions}
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
        {when && <Fact icon={IconCalendar} label="Date" value={when} />}
        {place && <Fact icon={IconMapPin} label="Lieu" value={place} />}
        <Fact icon={IconUsers} label="Postes" value={`${o.acceptedCount}/${o.quantity} pourvu${o.quantity > 1 ? "s" : ""}`} />
      </ul>
      {o.amount !== null && (
        <p className="font-semibold text-2xl">
          {fcfa(o.amount)}{" "}
          {o.paymentFlow && <span className="font-normal text-base text-muted-foreground">{PAYMENT_SUFFIX[o.paymentFlow]}</span>}
        </p>
      )}
      <div className="space-y-2">
        <h2 className="font-medium text-sm">Description</h2>
        <p className="whitespace-pre-line text-muted-foreground leading-relaxed">{o.description}</p>
      </div>
      {o.note && (
        <div className="space-y-2">
          <h2 className="font-medium text-sm">Note pour les candidats</h2>
          <p className="whitespace-pre-line text-muted-foreground leading-relaxed">{o.note}</p>
        </div>
      )}
    </section>
  );
}

function Fact({ icon: Icon, label, value }: Readonly<{ icon: typeof IconCalendar; label: string; value: string }>) {
  return (
    <li className="rounded-2xl bg-page p-4">
      <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
        <Icon className="size-3.5" />
        {label}
      </p>
      <p className="mt-1 font-medium text-sm">{value}</p>
    </li>
  );
}
