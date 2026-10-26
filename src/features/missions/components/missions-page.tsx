"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { IconCalendarCheck, IconCalendarEvent, IconChevronRight, IconStar, IconUsers } from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Skeleton } from "#/components/ui/skeleton";
import { StatTile } from "#/features/home/components/stat-tile";
import { ApplicationActions } from "#/features/offers/components/application-actions";
import { APPLICATION_STATUS, applicationStage, STAGE_CLASS, STATUS } from "#/features/offers/offer-labels";
import { friendlyError } from "#/lib/api/friendly-error";
import {
  getOfferApplicants,
  listOffers,
  listReceivedApplications,
  offersKey,
  type OfferListItem,
} from "#/lib/api/offer-controller";
import { cn, getInitials } from "#/lib/utils";

const DAY_MS = 24 * 60 * 60 * 1000;
const HIRED = new Set(["ACCEPTED", "WAITING_PAYMENT", "STARTED", "END"]);

/**
 * Missions: the offers someone was hired on, with their team — who is
 * coming, who is on it, who finished — and what is left to do (follow an
 * unlock, rate a finished mission). The same endpoints as the client app.
 */
export function MissionsPage() {
  const [tab, setTab] = useState<"current" | "done">("current");
  const offers = useQuery({
    queryKey: [...offersKey, "list", "missions"],
    queryFn: () => listOffers({ statuses: ["ACTIVE", "PARTIALLY_FILLED", "FILLED", "IN_PROGRESS", "COMPLETED"], pageSize: 100 }),
  });
  // Which offers have a hire, and how far each hire went: one call, not one per offer.
  const received = useQuery({
    queryKey: [...offersKey, "received", "missions"],
    queryFn: () => listReceivedApplications(0, 100),
    refetchInterval: 30_000,
  });

  const hiresByOffer = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const a of received.data?.items ?? []) {
      if (HIRED.has(a.status)) m.set(a.offer.id, [...(m.get(a.offer.id) ?? []), a.status]);
    }
    return m;
  }, [received.data]);

  const missions = (offers.data?.items ?? []).filter((o) => hiresByOffer.has(o.id));
  // Done once every hire on it finished, or the offer itself is closed.
  const isDone = (o: OfferListItem) => o.status === "COMPLETED" || (hiresByOffer.get(o.id) ?? []).every((s) => s === "END");
  const current = missions.filter((o) => !isDone(o)).sort((a, b) => (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? ""));
  const done = missions.filter(isDone).sort((a, b) => (b.scheduledAt ?? "").localeCompare(a.scheduledAt ?? ""));
  const shown = tab === "current" ? current : done;

  const statuses = [...hiresByOffer.values()].flat();
  const onIt = statuses.filter((s) => s === "STARTED").length;
  const coming = statuses.filter((s) => s === "ACCEPTED" || s === "WAITING_PAYMENT").length;
  const finished = statuses.filter((s) => s === "END").length;
  const loading = offers.isLoading || received.isLoading;

  return (
    <div className="w-full space-y-6 pt-2">
      <div className="space-y-1.5">
        <h1 className="font-semibold text-3xl tracking-tight">Missions</h1>
        <p className="text-muted-foreground">Vos recrutements sur le terrain : qui vient, qui est en mission, qui a terminé — et qui noter.</p>
      </div>

      {loading ? (
        <Skeleton className="h-96 rounded-3xl" />
      ) : !offers.data || !received.data ? (
        <p className="rounded-3xl bg-card p-6 text-muted-foreground">
          {friendlyError(offers.error ?? received.error, "Vos missions sont indisponibles pour le moment.")}
        </p>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 rounded-3xl bg-card p-6 sm:gap-4 sm:p-8 xl:grid-cols-4">
            <StatTile icon={IconCalendarEvent} label="Missions en cours" value={String(current.length)} />
            <StatTile icon={IconUsers} label="Attendus" value={String(coming)} hint="retenus, mission à venir" />
            <StatTile icon={IconCalendarCheck} label="En mission" value={String(onIt)} />
            <StatTile icon={IconStar} label="Terminées" value={String(finished)} hint="personnes ayant fini leur mission" />
          </section>

          <section className="space-y-4">
            <div role="tablist" className="inline-flex rounded-full bg-card p-1">
              {(
                [
                  ["current", "En cours et à venir", current.length],
                  ["done", "Terminées", done.length],
                ] as const
              ).map(([key, label, n]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-medium text-sm",
                    tab === key ? "bg-brand-lime text-[#0f2414]" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                  <span className="tabular-nums opacity-70">{n}</span>
                </button>
              ))}
            </div>

            {shown.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-3xl bg-card px-6 py-14 text-center">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-page">
                  <IconCalendarCheck className="size-6 text-muted-foreground" />
                </span>
                <p className="font-medium">{tab === "current" ? "Aucune mission en cours" : "Aucune mission terminée"}</p>
                <p className="max-w-sm text-muted-foreground text-sm">
                  {tab === "current" ? "Retenez un candidat sur l'une de vos offres : la mission apparaît ici." : "Vos missions terminées apparaîtront ici."}
                </p>
                <Link href="/espace/candidatures" className="mt-1 font-medium text-sm text-whatsapp-dark hover:underline">
                  Voir les candidatures
                </Link>
              </div>
            ) : (
              <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
                {shown.map((o) => (
                  <MissionCard key={o.id} offer={o} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function MissionCard({ offer: o }: Readonly<{ offer: OfferListItem }>) {
  // The offer page's own query: the same rows, with whether each was rated.
  const team = useQuery({ queryKey: [...offersKey, o.id, "applicants"], queryFn: () => getOfferApplicants(o.id) });
  const hired = (team.data ?? []).filter((a) => HIRED.has(a.status));
  const toRate = hired.filter((a) => a.status === "END" && !a.ratedByEmployer).length;
  const at = o.scheduledAt ? new Date(o.scheduledAt) : null;
  const days = at ? Math.ceil((at.getTime() - new Date().setHours(0, 0, 0, 0)) / DAY_MS) - 1 : null;
  const place = o.isRemote ? "À distance" : [o.city, o.countryName].filter(Boolean).join(", ");
  const filled = Math.min(hired.length, o.quantity);

  return (
    <article className="flex h-full flex-col gap-5 rounded-3xl bg-card p-5">
      <div className="flex items-start gap-3.5">
        <div className="flex w-14 shrink-0 flex-col items-center rounded-2xl bg-brand-lime py-2 text-[#0f2414]">
          <span className="font-semibold text-xl leading-none">{at ? at.getDate() : "—"}</span>
          <span className="mt-1 font-medium text-[11px] uppercase">{at ? at.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "") : ""}</span>
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <Link href={`/espace/offres/${o.id}`} className="line-clamp-2 font-semibold leading-snug hover:underline">
            {o.title}
          </Link>
          <p className="truncate text-muted-foreground text-xs">
            {at ? at.toLocaleString("fr-FR", { weekday: "short", hour: "2-digit", minute: "2-digit" }) : ""}
            {place && ` · ${place}`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className={cn("rounded-full px-2.5 py-0.5 font-medium text-xs", STATUS[o.status].className)}>{STATUS[o.status].label}</span>
        {days !== null && days >= 0 && o.status !== "COMPLETED" && (
          <span className="rounded-full bg-page px-2.5 py-0.5 font-medium text-xs">
            {days === 0 ? "Aujourd'hui" : days === 1 ? "Demain" : `Dans ${days} jours`}
          </span>
        )}
        {toRate > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-chip-amber px-2.5 py-0.5 font-medium text-chip-amber-foreground text-xs">
            <IconStar className="size-3" />
            {toRate} à noter
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-muted-foreground">Équipe</span>
          <span className="font-medium tabular-nums">
            {team.isLoading ? "…" : filled}/{o.quantity} poste{o.quantity > 1 ? "s" : ""}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-page">
          <div className="h-full rounded-full bg-whatsapp-dark" style={{ width: `${(filled / o.quantity) * 100}%` }} />
        </div>
      </div>

      {team.isLoading ? (
        <Skeleton className="h-28 rounded-2xl" />
      ) : (
        <ul className="space-y-1.5">
          {hired.map((a) => {
            const name = `${a.worker.firstName} ${a.worker.lastName}`.trim();
            const stage = a.status === "END" && a.ratedByEmployer ? "Terminée · notée" : (APPLICATION_STATUS[a.status] ?? a.status);
            return (
              <li key={a.applicationId} className="flex items-center gap-2.5 rounded-2xl bg-page p-2 pl-2.5">
                <Link href={`/espace/candidats/${a.worker.id}`} className="group flex min-w-0 flex-1 items-center gap-2.5">
                  <Avatar className="size-9 rounded-xl">
                    {a.worker.avatarUrl && <AvatarImage src={a.worker.avatarUrl} alt="" className="object-cover" />}
                    <AvatarFallback className="rounded-xl bg-card font-medium text-xs">{getInitials(name)}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-sm group-hover:underline">{name}</span>
                    <span className={cn("mt-0.5 inline-block rounded-full px-1.5 font-medium text-[11px]", STAGE_CLASS[applicationStage(a.status)])}>{stage}</span>
                  </span>
                </Link>
                <ApplicationActions applicant={a} name={name} variant="compact" />
              </li>
            );
          })}
        </ul>
      )}

      <Link href={`/espace/offres/${o.id}`} className="mt-auto inline-flex items-center gap-1 font-medium text-sm text-whatsapp-dark hover:underline">
        Voir la mission
        <IconChevronRight className="size-4" />
      </Link>
    </article>
  );
}
