"use client";

import { useLocale, useTranslations } from "next-intl";
import { useWhyNot } from "#/lib/use-why-not";
import { trialLocks } from "#/features/subscription/trial-lock";
import { cvOutOfReach, packCredits, PACKS_HREF } from "#/features/subscription/packs";
import { usePackOnSale } from "#/features/subscription/use-packs";
import { useMemo } from "react";
import { debounce, parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
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
import { INTL_LOCALE, type Locale } from "#/i18n/config";
import type { Translator } from "#/i18n/translator";
import { useFriendlyError } from "#/lib/api/use-friendly-error";
import type { CvScreeningSummary, MySubscription } from "#/lib/api/types";
import { cn } from "#/lib/utils";
import { CvLocked, ScoreRing, VerdictChip, band } from "./cv-bits";

const DAY_MS = 24 * 60 * 60 * 1000;
const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const longDate = (iso: string, locale: Locale) =>
  new Date(iso).toLocaleDateString(INTL_LOCALE[locale], { day: "numeric", month: "long", year: "numeric" });

type ListT = Translator<"cv.list">;

/** « Aujourd'hui », « Hier », « Il y a 3 jours », then the date. A module helper: reading the clock is not render's business. */
function when(iso: string, t: ListT, locale: Locale): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS);
  if (days <= 0) return t("todayAt", { time: new Date(iso).toLocaleTimeString(INTL_LOCALE[locale], { hour: "2-digit", minute: "2-digit" }) });
  if (days === 1) return t("yesterday");
  if (days < 7) return t("daysAgo", { days });
  return t("on", { date: longDate(iso, locale) });
}

const FILTERS = [{ key: "all" }, { key: "running" }, { key: "done" }] as const;
type Filter = (typeof FILTERS)[number]["key"];

const SORTS = [{ key: "recent" }, { key: "best" }] as const;

/** « Analyse de CV »: the figures first, then the analyses, findable and sortable. */
export function CvScreeningsPage() {
  const t = useTranslations("cv.list");
  const whyNot = useWhyNot();
  const friendlyError = useFriendlyError();
  const subscription = useQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription });
  const screenings = useQuery({ queryKey: [...cvScreeningsKey, "list"], queryFn: () => listCvScreenings(0, 50) });
  const e = subscription.data?.entitlements;
  // Out of the plan and no pack left (or left out of the trial).
  const locked = !!e && cvOutOfReach(e);
  const packOnSale = usePackOnSale("CV");
  const items = useMemo(() => screenings.data?.items ?? [], [screenings.data]);

  // The search and the sort live in the URL too (?q=, ?tri=), so a reload keeps them.
  const [q, setQ] = useQueryState("q", parseAsString.withDefault("").withOptions({ limitUrlUpdates: debounce(300) }));
  // The tab lives in the URL (?onglet=), so a reload or a shared link keeps it.
  const [filter, setFilter] = useQueryState("onglet", parseAsStringLiteral(FILTERS.map((f) => f.key)).withDefault("all"));
  const [sort, setSort] = useQueryState("tri", parseAsStringLiteral(SORTS.map((s) => s.key)).withDefault("recent"));

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
          <h1 className="font-semibold text-3xl tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("intro")}</p>
        </div>
        {!locked && (
          <Link
            href="/espace/analyse-cv/nouvelle"
            aria-disabled={e?.cvRemaining === 0}
            title={whyNot([e?.cvRemaining === 0, { say: t("allUsed") }])}
            tabIndex={e?.cvRemaining === 0 ? -1 : undefined}
            onClick={(ev) => {
              if (e?.cvRemaining === 0) ev.preventDefault();
            }}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-5 font-medium text-white hover:bg-ink/90 aria-disabled:opacity-40"
          >
            <IconPlus className="size-4" />
            {t("new")}
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
        <CvLocked trial={trialLocks(e, "cvAnalysis")} packOnSale={packOnSale} />
      ) : (
        e && <Overview e={e} items={items} packOnSale={packOnSale} />
      )}

      {(!locked || items.length > 0) && (
        <section className="space-y-5 rounded-3xl bg-card p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="mr-auto font-semibold">{t("yours")}</h2>
            <div className="relative w-full sm:w-72">
              <IconSearch className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(ev) => void setQ(ev.target.value)}
                placeholder={t("search")}
                aria-label={t("searchLabel")}
                className="h-10 rounded-full border-0 bg-page pl-10 shadow-none focus-visible:ring-2 focus-visible:ring-ink/10"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" aria-label={t("state")} className="flex gap-1 overflow-x-auto rounded-full bg-page p-1">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  role="tab"
                  aria-selected={filter === f.key}
                  onClick={() => void setFilter(f.key)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 font-medium text-sm transition-colors",
                    filter === f.key ? "bg-selected text-selected-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t(`filters.${f.key}`)}
                  <span className="tabular-nums opacity-70">{count(f.key)}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-1 rounded-full bg-page p-1" role="radiogroup" aria-label={t("sort")}>
              {SORTS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  role="radio"
                  aria-checked={sort === s.key}
                  onClick={() => void setSort(s.key)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 font-medium text-sm transition-colors",
                    sort === s.key ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t(`sorts.${s.key}`)}
                </button>
              ))}
            </div>
          </div>

          {screenings.isLoading ? (
            <CardGridSkeleton kind="application" count={3} />
          ) : !screenings.data ? (
            <p className="text-muted-foreground">{friendlyError(screenings.error, t("unavailable"))}</p>
          ) : shown.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-page px-6 py-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-card">
                <IconFileSearch className="size-6 text-muted-foreground" />
              </span>
              <p className="font-medium">{items.length === 0 ? t("noneYet") : t("noneHere")}</p>
              <p className="max-w-sm text-muted-foreground text-sm">
                {items.length === 0
                  ? t("noneYetHint")
                  : t("changeFilter")}
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
function Overview({
  e,
  items,
  packOnSale,
}: Readonly<{ e: MySubscription["entitlements"]; items: CvScreeningSummary[]; packOnSale: boolean }>) {
  const packs = packCredits(e, "CV");
  const t = useTranslations("cv.list");
  const tVerdict = useTranslations("labels.verdict");
  const locale = useLocale() as Locale;
  const scored = items.reduce((n, s) => n + s.scored, 0);
  const weighted = items.reduce((n, s) => n + (s.averageScore ?? 0) * s.scored, 0);
  const average = scored ? Math.round(weighted / scored) : null;
  const strong = items.reduce((n, s) => n + s.bands.very, 0);
  const pct = e.cvQuota === null || e.cvQuota === 0 ? 0 : Math.min(100, Math.round((e.cvUsed / e.cvQuota) * 100));

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <Tile icon={IconListNumbers} label={t("analyses")} value={String(items.length)} hint={t("runningCount", { count: items.filter((s) => s.status === "PROCESSING").length })} />
      <Tile icon={IconFileText} label={t("ranked")} value={String(scored)} hint={t("strong", { count: strong })} />
      <Tile
        icon={IconChartBar}
        label={t("average")}
        value={average === null ? "—" : `${average}/100`}
        hint={average === null ? t("noneRanked") : tVerdict(band(average).level)}
      />
      <div className="space-y-3 rounded-3xl bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-muted-foreground text-sm">
            <IconFileSearch className="size-4" />
            {e.cvQuota === 0 ? t("fromPacks") : t("included")}
          </p>
          <p className="font-semibold tabular-nums">
            {e.cvQuota === null ? t("unlimited") : e.cvQuota === 0 ? t("packsLeft", { count: packs }) : `${e.cvUsed} / ${e.cvQuota}`}
          </p>
        </div>
        {e.cvQuota !== null && e.cvQuota > 0 && (
          <div className="h-2 overflow-hidden rounded-full bg-page">
            <div className={cn("h-full rounded-full", pct >= 100 ? "bg-destructive" : "bg-whatsapp-dark")} style={{ width: `${pct}%` }} />
          </div>
        )}
        <p className="text-muted-foreground text-xs">
          {e.cvRemaining === 0 ? (
            packOnSale ? (
              t.rich("allUsedPack", {
                pack: (chunks) => (
                  <Link href={PACKS_HREF} className="font-medium text-foreground underline underline-offset-2">
                    {chunks}
                  </Link>
                ),
              })
            ) : (
              t("allUsed")
            )
          ) : (
            `${packs > 0 && e.cvQuota ? t("plusPacks", { count: packs }) : ""}${t("limits", { batch: e.cvBatchMax, mb: e.cvFileMaxMb })}${
              e.endsAt && e.cvQuota !== 0 ? t("until", { date: longDate(e.endsAt, locale) }) : ""
            }`
          )}
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
  { key: "very", bar: "bg-whatsapp-dark" },
  { key: "good", bar: "bg-brand-lime" },
  { key: "partial", bar: "bg-chip-amber-foreground" },
  { key: "low", bar: "bg-foreground/20" },
] as const;

/** One analysis: where the job came from, the best candidate, how the CVs spread, how long the files stay. */
function ScreeningCard({ s }: Readonly<{ s: CvScreeningSummary }>) {
  const running = s.status === "PROCESSING";
  const unread = running ? 0 : s.total - s.scored;
  const t = useTranslations("cv.list");
  const locale = useLocale() as Locale;
  return (
    <li>
      <Link href={`/espace/analyse-cv/${s.id}`} className="group flex h-full flex-col gap-4 rounded-3xl bg-page p-5 transition-colors hover:bg-page/70">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 font-medium text-muted-foreground">
            {s.offerId ? <IconBriefcase className="size-3.5" /> : <IconPencil className="size-3.5" />}
            {s.offerId ? t("offer") : t("described")}
          </span>
          <span className="text-muted-foreground">{when(s.createdAt, t, locale)}</span>
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
                {t("running", { done: s.done, total: s.total })}
              </span>
            ) : (
              s.bestScore !== null && <VerdictChip score={s.bestScore} />
            )}
          </div>
        </div>

        {running ? (
          <div className="space-y-2 rounded-2xl bg-card p-3.5">
            <p className="text-muted-foreground text-xs">{t("readingCvs")}</p>
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
                  <span className="text-muted-foreground">{t("top")}</span>
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
                      {t(`bands.${b.key}`, { count: s.bands[b.key] })}
                    </span>
                  ))}
                </p>
              </div>
            )}
            <dl className="grid grid-cols-3 gap-2 text-center">
              <Stat label={t("cvs")} value={String(s.total)} />
              <Stat label={t("mean")} value={s.averageScore === null ? "—" : String(s.averageScore)} />
              <Stat label={t("unreadCount", { count: unread })} value={String(unread)} />
            </dl>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 text-muted-foreground text-xs">
          <span className="inline-flex items-center gap-1.5">
            <IconShieldLock className="size-3.5" />
            {s.purged
              ? t("purged")
              : s.recruiting
                ? t("keptOpen")
                : t("keptUntil", {
                    date: new Date(s.expiresAt).toLocaleDateString(INTL_LOCALE[locale], { day: "numeric", month: "long", year: "numeric" }),
                  })}
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
