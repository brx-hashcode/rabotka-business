"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { IconCalendarEvent, IconClock, IconInbox, IconSearch, IconShieldCheck } from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Input } from "#/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { CardGridSkeleton } from "#/components/page-skeletons";
import { ApplicationActions } from "#/features/offers/components/application-actions";
import { APPLICATION_STATUS, applicationStage, STAGE_CLASS, type ApplicationStage } from "#/features/offers/offer-labels";
import { friendlyError } from "#/lib/api/friendly-error";
import { listReceivedApplications, offersKey, type ReceivedApplication } from "#/lib/api/offer-controller";
import { cn, getInitials } from "#/lib/utils";

const PAGE = 100;
const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const TABS: { key: "all" | ApplicationStage; label: string }[] = [
  { key: "new", label: "À examiner" },
  { key: "viewed", label: "Vues" },
  { key: "hired", label: "Retenues" },
  { key: "closed", label: "Refusées ou annulées" },
  { key: "all", label: "Toutes" },
];

/**
 * Every application to the business's offers, in one inbox — the client
 * app's « Candidatures reçues » endpoint. Decided here as on an offer's page:
 * retain, turn down, follow the unlock, write, rate.
 */
export function ApplicationsPage() {
  const query = useInfiniteQuery({
    queryKey: [...offersKey, "received"],
    queryFn: ({ pageParam }) => listReceivedApplications(pageParam, PAGE),
    initialPageParam: 0,
    getNextPageParam: (last, all) => (all.length * PAGE < last.total ? all.length : undefined),
    // A candidate's side moves on its own (applying, paying their part).
    refetchInterval: 30_000,
  });
  const all = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const total = query.data?.pages[0]?.total ?? 0;

  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("new");
  const [offerId, setOfferId] = useState("all");
  const [q, setQ] = useState("");

  const offers = useMemo(() => {
    const byId = new Map<string, { id: string; title: string; n: number }>();
    for (const a of all) {
      const o = byId.get(a.offer.id) ?? { id: a.offer.id, title: a.offer.title, n: 0 };
      o.n++;
      byId.set(a.offer.id, o);
    }
    return [...byId.values()].sort((a, b) => b.n - a.n);
  }, [all]);

  const scoped = all.filter((a) => (offerId === "all" || a.offer.id === offerId) && (!q.trim() || fold(`${a.worker.firstName} ${a.worker.lastName} ${a.offer.title}`).includes(fold(q.trim()))));
  const count = (k: (typeof TABS)[number]["key"]) => (k === "all" ? scoped.length : scoped.filter((a) => applicationStage(a.status) === k).length);
  const shown = tab === "all" ? scoped : scoped.filter((a) => applicationStage(a.status) === tab);

  return (
    <div className="w-full space-y-6 pt-2">
      <div className="space-y-1.5">
        <h1 className="font-semibold text-3xl tracking-tight">Candidatures</h1>
        <p className="text-muted-foreground">Toutes les candidatures à vos offres, au même endroit : retenez, refusez, écrivez.</p>
      </div>

      <section className="space-y-5 rounded-3xl bg-card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-60 flex-1">
            <IconSearch className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un candidat, une offre…"
              className="h-11 rounded-full border-0 bg-page pl-10 shadow-none focus-visible:ring-2 focus-visible:ring-ink/10"
            />
          </div>
          {offers.length > 1 && (
            <Select value={offerId} onValueChange={setOfferId}>
              <SelectTrigger
                aria-label="Offre"
                className="h-11 w-full gap-3 rounded-full border-0 bg-page px-4 font-medium shadow-none focus-visible:ring-2 focus-visible:ring-ink/10 sm:w-80 dark:bg-page"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="end" sideOffset={8} className="max-h-96 w-[var(--radix-select-trigger-width)] min-w-80">
                <SelectItem value="all" className="[&>span:last-child]:flex-1 [&>span:last-child]:gap-3">
                  <span className="flex-1">Toutes les offres</span>
                  <span className="text-muted-foreground tabular-nums">{all.length}</span>
                </SelectItem>
                {offers.map((o) => (
                  <SelectItem key={o.id} value={o.id} className="[&>span:last-child]:min-w-0 [&>span:last-child]:flex-1 [&>span:last-child]:gap-3">
                    <span className="min-w-0 flex-1 truncate">{o.title}</span>
                    <span className="text-muted-foreground tabular-nums">{o.n}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

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

        {query.isLoading ? (
          <CardGridSkeleton kind="application" />
        ) : !query.data ? (
          <p className="text-muted-foreground">{friendlyError(query.error, "Vos candidatures sont indisponibles pour le moment.")}</p>
        ) : shown.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-page px-6 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-card">
              <IconInbox className="size-6 text-muted-foreground" />
            </span>
            <p className="font-medium">{all.length === 0 ? "Aucune candidature pour le moment" : "Aucune candidature ici"}</p>
            <p className="max-w-sm text-muted-foreground text-sm">
              {all.length === 0
                ? "Publiez une offre : les profils correspondants en sont prévenus et leurs candidatures arrivent ici."
                : tab === "new"
                  ? "Vous avez répondu à tout le monde."
                  : "Changez d'étape ou de filtre pour en voir d'autres."}
            </p>
          </div>
        ) : (
          <ul className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
            {shown.map((a) => (
              <ApplicationCard key={a.applicationId} application={a} />
            ))}
          </ul>
        )}

        {query.hasNextPage && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => void query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
              className="rounded-full bg-page px-5 py-2 font-medium text-sm hover:bg-page/70"
            >
              {query.isFetchingNextPage ? "Chargement…" : `Charger les plus anciennes (${total - all.length})`}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days since `iso`. A module helper: reading the clock is not render's business. */
function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS);
}

function ago(iso: string): string {
  const days = daysSince(iso);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  return `Il y a ${days} jours`;
}

/** One application: who, for which offer, how long it has waited — and the decision. */
function ApplicationCard({ application: a }: Readonly<{ application: ReceivedApplication }>) {
  const name = `${a.worker.firstName} ${a.worker.lastName}`.trim();
  const waitingDays = a.status === "PENDING" ? daysSince(a.createdAt) : 0;
  const at = a.offer.scheduledAt ? new Date(a.offer.scheduledAt) : null;
  return (
    <li className="flex flex-col gap-4 rounded-3xl bg-page p-5">
      <div className="flex items-start gap-3.5">
        <Link href={`/espace/candidats/${a.worker.id}`} className="shrink-0">
          <Avatar className="size-14 rounded-2xl">
            {a.worker.avatarUrl && <AvatarImage src={a.worker.avatarUrl} alt="" className="object-cover" />}
            <AvatarFallback className="rounded-2xl bg-brand-lime font-semibold text-[#0f2414]">{getInitials(name)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/espace/candidats/${a.worker.id}`} className="block truncate font-semibold hover:underline">
            {name}
          </Link>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={cn("rounded-full px-2 py-0.5 font-medium text-[11px]", STAGE_CLASS[applicationStage(a.status)])}>
              {APPLICATION_STATUS[a.status] ?? a.status}
            </span>
            <span className="text-muted-foreground text-xs">{ago(a.createdAt)}</span>
          </p>
          {a.worker.reliabilityScore !== null && (
            <p className="mt-1 inline-flex items-center gap-1 font-medium text-xs">
              <IconShieldCheck className="size-3.5 text-whatsapp-dark" />
              Fiabilité {a.worker.reliabilityScore}/100
            </p>
          )}
        </div>
      </div>

      <Link href={`/espace/offres/${a.offer.id}`} className="group space-y-0.5 rounded-2xl bg-card p-3">
        <span className="block text-muted-foreground text-[11px] uppercase tracking-wide">Pour l&apos;offre</span>
        <span className="line-clamp-1 font-medium text-sm group-hover:underline">{a.offer.title}</span>
        {at && (
          <span className="flex items-center gap-1 text-muted-foreground text-xs">
            <IconCalendarEvent className="size-3.5" />
            {at.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" })}
          </span>
        )}
      </Link>

      {waitingDays >= 2 && (
        <p className="-mt-1 flex items-center gap-1.5 text-chip-amber-foreground text-xs">
          <IconClock className="size-3.5" />
          En attente de votre réponse depuis {waitingDays} jours
        </p>
      )}

      <div className="mt-auto">
        <ApplicationActions applicant={a} name={name} variant="card" />
      </div>
    </li>
  );
}
