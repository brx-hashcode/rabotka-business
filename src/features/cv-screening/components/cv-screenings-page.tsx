"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  IconBriefcase,
  IconChartBar,
  IconChevronRight,
  IconFileSearch,
  IconFileText,
  IconListNumbers,
  IconPencil,
  IconPlus,
  IconSearch,
  IconShieldLock,
  IconTrophy,
  type Icon as TablerIcon,
} from "@tabler/icons-react";

import { Bone, CardGridSkeleton } from "#/components/page-skeletons";
import { Input } from "#/components/ui/input";
import { getMySubscription, mySubscriptionKey } from "#/lib/api/business-controller";
import { cvScreeningsKey, listCvScreenings } from "#/lib/api/cv-screening-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import type { CvScreeningSummary, MySubscription } from "#/lib/api/types";
import { cn } from "#/lib/utils";
import { CvLocked, ScoreRing, VerdictChip, band } from "./cv-bits";

const DAY_MS = 24 * 60 * 60 * 1000;
const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const longDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/** « Aujourd'hui », « Hier », « Il y a 3 jours », then the date. A module helper: reading the clock is not render's business. */
function when(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS);
  if (days <= 0) return `Aujourd'hui à ${new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} jours`;
  return `Le ${longDate(iso)}`;
}

function daysLeft(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / DAY_MS));
}

const FILTERS = [
  { key: "all", label: "Toutes" },
  { key: "running", label: "En cours" },
  { key: "done", label: "Terminées" },
] as const;
type Filter = (typeof FILTERS)[number]["key"];

const SORTS = [
  { key: "recent", label: "Plus récentes" },
  { key: "best", label: "Meilleur score" },
] as const;
type Sort = (typeof SORTS)[number]["key"];

/** « Tri des CV »: the figures first, then the analyses, findable and sortable. */
export function CvScreeningsPage() {
  const subscription = useQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription });
  const screenings = useQuery({ queryKey: [...cvScreeningsKey, "list"], queryFn: () => listCvScreenings(0, 50) });
  const e = subscription.data?.entitlements;
  const locked = e?.cvQuota === 0;
  const items = useMemo(() => screenings.data?.items ?? [], [screenings.data]);

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("recent");

  const shown = useMemo(() => {
    const needle = fold(q.trim());
    const rows = items.filter(
      (s) =>
        (filter === "all" || (filter === "running" ? s.status === "PROCESSING" : s.status === "DONE")) &&
        (!needle || fold(`${s.jobTitle} ${s.bestCandidate ?? ""}`).includes(needle)),
    );
    return sort === "best" ? [...rows].sort((a, b) => (b.bestScore ?? -1) - (a.bestScore ?? -1)) : rows;
  }, [items, q, filter, sort]);

  const count = (f: Filter) => (f === "all" ? items.length : items.filter((s) => (f === "running" ? s.status === "PROCESSING" : s.status === "DONE")).length);

  return (
    <div className="w-full space-y-6 pt-2">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="font-semibold text-3xl tracking-tight">Tri des CV</h1>
          <p className="text-muted-foreground">
            Envoyez les CV reçus pour un poste : Rabotka les lit et les classe, du plus adapté au moins adapté.
          </p>
        </div>
        {!locked && (
          <Link
            href="/espace/tri-cv/nouveau"
            aria-disabled={e?.cvRemaining === 0}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-5 font-medium text-white hover:bg-ink/90 aria-disabled:pointer-events-none aria-disabled:opacity-40"
          >
            <IconPlus className="size-4" />
            Nouveau tri
          </Link>
        )}
      </div>

      {subscription.isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Bone key={i} className="h-32 rounded-3xl" onPage />
          ))}
        </div>
      ) : locked ? (
        <CvLocked />
      ) : (
        e && <Overview e={e} items={items} />
      )}

      {(!locked || items.length > 0) && (
        <section className="space-y-5 rounded-3xl bg-card p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="mr-auto font-semibold">Vos analyses</h2>
            <div className="relative w-full sm:w-72">
              <IconSearch className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(ev) => setQ(ev.target.value)}
                placeholder="Poste ou candidat…"
                aria-label="Rechercher une analyse"
                className="h-10 rounded-full border-0 bg-page pl-10 shadow-none focus-visible:ring-2 focus-visible:ring-ink/10"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" aria-label="État" className="flex gap-1 overflow-x-auto rounded-full bg-page p-1">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  role="tab"
                  aria-selected={filter === f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 font-medium text-sm transition-colors",
                    filter === f.key ? "bg-brand-lime text-[#0f2414]" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f.label}
                  <span className="tabular-nums opacity-70">{count(f.key)}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-1 rounded-full bg-page p-1" role="radiogroup" aria-label="Trier">
              {SORTS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  role="radio"
                  aria-checked={sort === s.key}
                  onClick={() => setSort(s.key)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 font-medium text-sm transition-colors",
                    sort === s.key ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {screenings.isLoading ? (
            <CardGridSkeleton kind="application" count={3} />
          ) : !screenings.data ? (
            <p className="text-muted-foreground">{friendlyError(screenings.error, "Vos analyses sont indisponibles pour le moment.")}</p>
          ) : shown.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-page px-6 py-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-card">
                <IconFileSearch className="size-6 text-muted-foreground" />
              </span>
              <p className="font-medium">{items.length === 0 ? "Aucune analyse pour le moment" : "Aucune analyse ici"}</p>
              <p className="max-w-sm text-muted-foreground text-sm">
                {items.length === 0
                  ? "Choisissez une offre, ajoutez les CV (PDF, Word ou photo) : le classement arrive en quelques secondes par CV."
                  : "Changez de filtre ou de recherche pour en voir d'autres."}
              </p>
            </div>
          ) : (
            <ul className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
              {shown.map((s) => (
                <ScreeningCard key={s.id} s={s} />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

/** The figures that matter at a glance: how much was sorted, how good it was, what the plan still covers. */
function Overview({ e, items }: Readonly<{ e: MySubscription["entitlements"]; items: CvScreeningSummary[] }>) {
  const scored = items.reduce((n, s) => n + s.scored, 0);
  const weighted = items.reduce((n, s) => n + (s.averageScore ?? 0) * s.scored, 0);
  const average = scored ? Math.round(weighted / scored) : null;
  const strong = items.reduce((n, s) => n + s.bands.very, 0);
  const pct = e.cvQuota === null || e.cvQuota === 0 ? 0 : Math.min(100, Math.round((e.cvUsed / e.cvQuota) * 100));

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <Tile icon={IconListNumbers} label="Analyses" value={String(items.length)} hint={`${items.filter((s) => s.status === "PROCESSING").length} en cours`} />
      <Tile icon={IconFileText} label="CV classés" value={String(scored)} hint={`dont ${strong} très adapté${strong > 1 ? "s" : ""}`} />
      <Tile
        icon={IconChartBar}
        label="Score moyen"
        value={average === null ? "—" : `${average}/100`}
        hint={average === null ? "Aucun CV classé" : band(average).label}
      />
      <div className="space-y-3 rounded-3xl bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-muted-foreground text-sm">
            <IconFileSearch className="size-4" />
            CV inclus
          </p>
          <p className="font-semibold tabular-nums">
            {e.cvQuota === null ? "Illimité" : `${e.cvUsed} / ${e.cvQuota}`}
          </p>
        </div>
        {e.cvQuota !== null && (
          <div className="h-2 overflow-hidden rounded-full bg-page">
            <div className={cn("h-full rounded-full", pct >= 100 ? "bg-destructive" : "bg-whatsapp-dark")} style={{ width: `${pct}%` }} />
          </div>
        )}
        <p className="text-muted-foreground text-xs">
          {e.cvRemaining === 0
            ? "Tous utilisés : changez de formule pour en analyser davantage."
            : `${e.cvBatchMax} CV par analyse · ${e.cvFileMaxMb} Mo chacun${e.endsAt ? ` · jusqu'au ${longDate(e.endsAt)}` : ""}`}
        </p>
      </div>
    </div>
  );
}

function Tile({ icon: Icon, label, value, hint }: Readonly<{ icon: TablerIcon; label: string; value: string; hint: string }>) {
  return (
    <div className="space-y-2 rounded-3xl bg-card p-4 sm:p-5">
      <p className="flex items-center gap-2 text-muted-foreground text-sm">
        <Icon className="size-4" />
        {label}
      </p>
      <p className="font-semibold text-2xl tabular-nums tracking-tight sm:text-3xl">{value}</p>
      <p className="text-muted-foreground text-xs">{hint}</p>
    </div>
  );
}

const BANDS = [
  { key: "very", label: "Très adaptés", bar: "bg-whatsapp-dark" },
  { key: "good", label: "Adaptés", bar: "bg-brand-lime" },
  { key: "partial", label: "Partiels", bar: "bg-chip-amber-foreground" },
  { key: "low", label: "Peu adaptés", bar: "bg-foreground/20" },
] as const;

/** One analysis: where the job came from, the best candidate, how the CVs spread, how long the files stay. */
function ScreeningCard({ s }: Readonly<{ s: CvScreeningSummary }>) {
  const running = s.status === "PROCESSING";
  const unread = running ? 0 : s.total - s.scored;
  const left = daysLeft(s.expiresAt);
  return (
    <li>
      <Link href={`/espace/tri-cv/${s.id}`} className="group flex h-full flex-col gap-4 rounded-3xl bg-page p-5 transition-colors hover:bg-page/70">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 font-medium text-muted-foreground">
            {s.offerId ? <IconBriefcase className="size-3.5" /> : <IconPencil className="size-3.5" />}
            {s.offerId ? "Offre" : "Poste décrit"}
          </span>
          <span className="text-muted-foreground">{when(s.createdAt)}</span>
        </div>

        <div className="flex items-start gap-3.5">
          {s.bestScore !== null && !running ? (
            <ScoreRing score={s.bestScore} />
          ) : (
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-card">
              <IconFileSearch className="size-6 text-muted-foreground" />
            </span>
          )}
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="line-clamp-2 font-semibold leading-snug group-hover:underline">{s.jobTitle}</p>
            {running ? (
              <span className="inline-flex rounded-full bg-chip-amber px-2.5 py-1 font-medium text-chip-amber-foreground text-xs">
                En cours · {s.done}/{s.total}
              </span>
            ) : (
              s.bestScore !== null && <VerdictChip score={s.bestScore} />
            )}
          </div>
        </div>

        {running ? (
          <div className="space-y-2 rounded-2xl bg-card p-3.5">
            <p className="text-muted-foreground text-xs">Lecture des CV…</p>
            <div className="h-2 overflow-hidden rounded-full bg-page">
              <div className="h-full rounded-full bg-whatsapp-dark transition-[width]" style={{ width: `${(s.done / s.total) * 100}%` }} />
            </div>
          </div>
        ) : (
          <div className="space-y-3 rounded-2xl bg-card p-3.5">
            {s.bestCandidate && (
              <p className="flex items-center gap-2 text-sm">
                <IconTrophy className="size-4 shrink-0 text-whatsapp-dark" />
                <span className="min-w-0 truncate">
                  <span className="text-muted-foreground">En tête : </span>
                  <span className="font-medium">{s.bestCandidate}</span>
                </span>
              </p>
            )}
            {s.scored > 0 && (
              <div className="space-y-2">
                <div className="flex h-2 gap-0.5 overflow-hidden rounded-full" aria-hidden>
                  {BANDS.filter((b) => s.bands[b.key] > 0).map((b) => (
                    <span key={b.key} className={cn("h-full", b.bar)} style={{ flexGrow: s.bands[b.key] }} />
                  ))}
                </div>
                <p className="flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground text-xs">
                  {BANDS.filter((b) => s.bands[b.key] > 0).map((b) => (
                    <span key={b.key} className="inline-flex items-center gap-1.5">
                      <span className={cn("size-2 rounded-full", b.bar)} />
                      {s.bands[b.key]} {s.bands[b.key] > 1 ? b.label.toLowerCase() : b.label.toLowerCase().replace(/s$/, "")}
                    </span>
                  ))}
                </p>
              </div>
            )}
            <dl className="grid grid-cols-3 gap-2 text-center">
              <Stat label="CV" value={String(s.total)} />
              <Stat label="Moyenne" value={s.averageScore === null ? "—" : String(s.averageScore)} />
              <Stat label={unread > 1 ? "Non lus" : "Non lu"} value={String(unread)} />
            </dl>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 text-muted-foreground text-xs">
          <span className="inline-flex items-center gap-1.5">
            <IconShieldLock className="size-3.5" />
            {s.purged ? "Fichiers supprimés, notes conservées" : `Fichiers conservés ${left} jour${left > 1 ? "s" : ""}`}
          </span>
          <IconChevronRight className="size-4 shrink-0" />
        </div>
      </Link>
    </li>
  );
}

function Stat({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-xl bg-page px-2 py-2">
      <dd className="font-semibold tabular-nums leading-none">{value}</dd>
      <dt className="mt-1 text-muted-foreground text-[11px]">{label}</dt>
    </div>
  );
}
