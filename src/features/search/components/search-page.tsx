"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { IconLock, IconRefresh, IconSearch } from "@tabler/icons-react";

import { Input } from "#/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { CardGridSkeleton } from "#/components/page-skeletons";
import { CandidateCard } from "#/features/candidates/components/candidate-card";
import { useCities } from "#/hooks/use-geo";
import { getMySubscription, mySubscriptionKey } from "#/lib/api/business-controller";
import { findCandidates, getSuggestedCandidates, type CandidateFilters } from "#/lib/api/candidate-controller";
import { friendlyError, httpStatusOf } from "#/lib/api/friendly-error";
import { getJobCategories } from "#/lib/api/offer-controller";
import { cn } from "#/lib/utils";

const PAGE = 24;
const ANY = "any";
const trigger =
  "h-11 w-full gap-3 rounded-full border-0 bg-page px-4 font-medium shadow-none focus-visible:ring-2 focus-visible:ring-ink/10 dark:bg-page";

/** Waits for the typing to settle before searching. */
function useDebounced<T>(value: T, ms = 350): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/**
 * Recherche: every verified worker, by what they do and where — the client
 * app's worker search, with its filters. Suggestions ranked for the business
 * while nothing is asked. Reaching someone spends one contact of the plan.
 * Opened from an offer, its trade and city come preset (`?categoryId&city`).
 */
export function SearchPage() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [categoryId, setCategoryId] = useState(params.get("categoryId") ?? ANY);
  const [city, setCity] = useState(params.get("city") ?? ANY);
  const [minReliability, setMinReliability] = useState(ANY);
  const [minRating, setMinRating] = useState(ANY);

  const categories = useQuery({ queryKey: ["job-categories"], queryFn: getJobCategories, staleTime: Infinity });
  const cities = useCities("CG");
  const sub = useQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription });

  const filters: CandidateFilters = {
    q: useDebounced(q),
    categoryId: categoryId === ANY ? undefined : categoryId,
    city: city === ANY ? undefined : city,
    minReliability: minReliability === ANY ? undefined : Number(minReliability),
    minRating: minRating === ANY ? undefined : Number(minRating),
  };
  const asking = Object.values(filters).some((v) => v !== undefined && v !== "");

  const results = useInfiniteQuery({
    queryKey: ["candidates", "find", filters],
    queryFn: ({ pageParam }) => findCandidates(filters, pageParam, PAGE),
    initialPageParam: 0,
    getNextPageParam: (last, all) => (all.length * PAGE < last.total ? all.length : undefined),
  });
  const suggested = useQuery({ queryKey: ["candidates", "suggested"], queryFn: () => getSuggestedCandidates(6), enabled: !asking });

  const items = results.data?.pages.flatMap((p) => p.items) ?? [];
  const total = results.data?.pages[0]?.total ?? 0;
  const locked = httpStatusOf(results.error) === 403;
  const e = sub.data?.entitlements;

  function reset() {
    setQ("");
    setCategoryId(ANY);
    setCity(ANY);
    setMinReliability(ANY);
    setMinRating(ANY);
  }

  return (
    <div className="w-full space-y-6 pt-2">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="font-semibold text-3xl tracking-tight">Trouver des profils</h1>
          <p className="text-muted-foreground">Des profils vérifiés, par métier, ville et fiabilité : contactez-les directement.</p>
        </div>
        {e?.plan && (
          <p className="rounded-full bg-card px-4 py-2 font-medium text-sm">
            Contacts inclus :{" "}
            <span className="tabular-nums">
              {e.unlocksUsed}
              {e.unlocksQuota === null ? "" : ` sur ${e.unlocksQuota}`}
            </span>
          </p>
        )}
      </div>

      {locked ? (
        <section className="flex flex-col items-center gap-3 rounded-3xl bg-card px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-page">
            <IconLock className="size-6 text-muted-foreground" />
          </span>
          <p className="font-medium">La recherche de profils n&apos;est pas incluse dans votre formule</p>
          <p className="max-w-md text-muted-foreground text-sm">
            Passez à une formule qui l&apos;inclut pour chercher des profils et les contacter directement.
          </p>
          <Link href="/espace/abonnement" className="mt-1 inline-flex h-11 items-center rounded-full bg-ink px-5 font-medium text-sm text-white hover:bg-ink/90">
            Voir les formules
          </Link>
        </section>
      ) : (
        <>
          <section className="space-y-3 rounded-3xl bg-card p-5 sm:p-6">
            <div className="relative">
              <IconSearch className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(ev) => setQ(ev.target.value)}
                placeholder="Métier, compétence, description… ex. « serveuse expérimentée »"
                className="h-12 rounded-full border-0 bg-page pl-12 text-base shadow-none focus-visible:ring-2 focus-visible:ring-ink/10"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]">
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger aria-label="Métier" className={trigger}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={8} className="max-h-80">
                  <SelectItem value={ANY}>Tous les métiers</SelectItem>
                  {(categories.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger aria-label="Ville" className={trigger}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={8} className="max-h-80">
                  <SelectItem value={ANY}>Toutes les villes</SelectItem>
                  {(cities.data ?? []).map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={minReliability} onValueChange={setMinReliability}>
                <SelectTrigger aria-label="Fiabilité" className={trigger}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={8}>
                  <SelectItem value={ANY}>Toute fiabilité</SelectItem>
                  <SelectItem value="70">Fiabilité 70+</SelectItem>
                  <SelectItem value="80">Fiabilité 80+</SelectItem>
                  <SelectItem value="90">Fiabilité 90+</SelectItem>
                </SelectContent>
              </Select>
              <Select value={minRating} onValueChange={setMinRating}>
                <SelectTrigger aria-label="Note" className={trigger}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={8}>
                  <SelectItem value={ANY}>Toute note</SelectItem>
                  <SelectItem value="4">4 ★ et plus</SelectItem>
                  <SelectItem value="4.5">4,5 ★ et plus</SelectItem>
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={reset}
                disabled={!asking}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 font-medium text-muted-foreground text-sm hover:text-foreground disabled:opacity-40"
              >
                <IconRefresh className="size-4" />
                Réinitialiser
              </button>
            </div>
          </section>

          {!asking && (suggested.isLoading || (suggested.data?.length ?? 0) > 0) && (
            <section className="space-y-4 rounded-3xl bg-card p-5 sm:p-6">
              <div className="flex items-baseline gap-2">
                <h2 className="font-semibold text-xl">Suggérés pour vous</h2>
                <span className="text-muted-foreground text-sm">d&apos;après vos offres</span>
              </div>
              {suggested.isLoading ? (
                <CardGridSkeleton kind="profile" count={3} />
              ) : (
                <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {suggested.data!.map((c) => (
                    <CandidateCard key={c.id} candidate={c} />
                  ))}
                </ul>
              )}
            </section>
          )}

          <section className="space-y-4 rounded-3xl bg-card p-5 sm:p-6">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-semibold text-xl">
                {asking ? "Résultats" : "Tous les profils"}
              </h2>
              {results.data && (
                <span className="text-muted-foreground text-sm tabular-nums">
                  {total} profil{total > 1 ? "s" : ""}
                </span>
              )}
            </div>
            {results.isLoading ? (
              <CardGridSkeleton kind="profile" />
            ) : !results.data ? (
              <p className="text-muted-foreground">{friendlyError(results.error, "La recherche est indisponible pour le moment.")}</p>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl bg-page px-6 py-12 text-center">
                <p className="font-medium">Aucun profil ne correspond</p>
                <p className="max-w-sm text-muted-foreground text-sm">Élargissez la recherche : un autre métier, une autre ville, moins de critères.</p>
              </div>
            ) : (
              <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.map((c) => (
                  <CandidateCard key={c.id} candidate={c} />
                ))}
              </ul>
            )}
            {results.hasNextPage && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => void results.fetchNextPage()}
                  disabled={results.isFetchingNextPage}
                  className={cn("rounded-full bg-page px-5 py-2.5 font-medium text-sm hover:bg-page/70")}
                >
                  {results.isFetchingNextPage ? "Chargement…" : `Voir plus de profils (${total - items.length})`}
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
