"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { IconBriefcase, IconCalendar, IconMapPin, IconPlus, IconUsers } from "@tabler/icons-react";

import { Skeleton } from "#/components/ui/skeleton";
import { getMySubscription, mySubscriptionKey } from "#/lib/api/business-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import { listOffers, offersKey, type OfferListItem, type OfferStatus } from "#/lib/api/offer-controller";
import { cn } from "#/lib/utils";
import { EMPLOYMENT_LABEL, fcfa, offerDate, PAYMENT_SUFFIX, STATUS } from "../offer-labels";

const TABS: { key: string; label: string; statuses?: OfferStatus[] }[] = [
  { key: "all", label: "Toutes" },
  { key: "active", label: "En ligne", statuses: ["ACTIVE"] },
  { key: "running", label: "En cours", statuses: ["PARTIALLY_FILLED", "FILLED", "IN_PROGRESS"] },
  { key: "done", label: "Terminées", statuses: ["COMPLETED"] },
  { key: "expired", label: "Expirées", statuses: ["EXPIRED", "CANCELLED"] },
];

/** « Mes offres »: the organisation's offers, by state, and the way to publish one. */
export function OffersPage() {
  const [tab, setTab] = useState("all");
  const statuses = TABS.find((t) => t.key === tab)?.statuses;
  const { data, isLoading, error } = useQuery({
    queryKey: [...offersKey, "list", tab],
    queryFn: () => listOffers({ statuses }),
  });
  const { data: sub } = useQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription });
  const e = sub?.entitlements;
  const atLimit = !!e && e.activeOffersLimit !== null && e.activeOffers >= (e.plan ? e.activeOffersLimit : 0);

  return (
    <div className="w-full space-y-6 pt-2">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="font-semibold text-3xl tracking-tight">Offres</h1>
          <p className="text-muted-foreground">
            {e
              ? e.plan
                ? `${e.activeOffers} offre${e.activeOffers > 1 ? "s" : ""} en ligne sur ${e.activeOffersLimit ?? "∞"} incluses dans votre formule ${e.plan.name}.`
                : "Choisissez une formule pour publier vos offres."
              : "Publiez vos offres et suivez les candidatures."}
          </p>
        </div>
        {atLimit ? (
          <Link
            href="/espace/abonnement"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-card px-6 font-medium text-[15px] hover:bg-card/70"
          >
            {e?.plan ? "Passer à une formule supérieure" : "Choisir une formule"}
          </Link>
        ) : (
          <Link
            href="/espace/offres/nouvelle"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 font-medium text-[15px] text-white hover:bg-ink/90"
          >
            <IconPlus className="size-5" />
            Nouvelle offre
          </Link>
        )}
      </div>

      <div role="tablist" aria-label="État des offres" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "h-10 rounded-full px-4 font-medium text-sm transition-colors",
              tab === t.key ? "bg-brand-lime text-[#0f2414]" : "bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-48 rounded-3xl" />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-3xl bg-card p-6 text-muted-foreground">{friendlyError(error, "Vos offres n'ont pas pu être chargées.")}</p>
      ) : !data?.items.length ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-card px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-page">
            <IconBriefcase className="size-7 text-muted-foreground" />
          </span>
          <p className="font-medium">{tab === "all" ? "Aucune offre pour le moment" : "Aucune offre dans cet état"}</p>
          {tab === "all" && !atLimit && (
            <Link href="/espace/offres/nouvelle" className="font-medium text-sm text-whatsapp-dark hover:underline">
              Publier votre première offre
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.items.map((o) => (
            <OfferCard key={o.id} offer={o} />
          ))}
        </div>
      )}
    </div>
  );
}

function OfferCard({ offer: o }: Readonly<{ offer: OfferListItem }>) {
  const status = STATUS[o.status];
  const when = offerDate(o.scheduledAt, o.employmentType);
  const place = o.isRemote ? "À distance" : [o.city, o.countryName].filter(Boolean).join(", ");
  return (
    <Link href={`/espace/offres/${o.id}`} className="flex flex-col gap-4 rounded-3xl bg-card p-6 transition-colors hover:bg-card/70">
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-page px-2.5 py-1 font-medium text-xs">{EMPLOYMENT_LABEL[o.employmentType]}</span>
        <span className={cn("rounded-full px-2.5 py-1 font-medium text-xs", status.className)}>{status.label}</span>
      </div>
      <h2 className="line-clamp-2 font-semibold text-lg leading-snug">{o.title}</h2>
      <ul className="mt-auto space-y-1.5 text-muted-foreground text-sm">
        {when && (
          <li className="flex items-center gap-2">
            <IconCalendar className="size-4 shrink-0" />
            <span className="truncate">{when}</span>
          </li>
        )}
        {place && (
          <li className="flex items-center gap-2">
            <IconMapPin className="size-4 shrink-0" />
            <span className="truncate">{place}</span>
          </li>
        )}
        <li className="flex items-center gap-2">
          <IconUsers className="size-4 shrink-0" />
          {o.acceptedCount}/{o.quantity} poste{o.quantity > 1 ? "s" : ""} pourvu{o.quantity > 1 ? "s" : ""}
        </li>
      </ul>
      {o.amount !== null && (
        <p className="font-semibold">
          {fcfa(o.amount)} {o.paymentFlow && <span className="font-normal text-muted-foreground text-sm">{PAYMENT_SUFFIX[o.paymentFlow]}</span>}
        </p>
      )}
    </Link>
  );
}
