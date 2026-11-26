"use client";

import { useTradeName } from "#/lib/api/use-trade-name";
import { startsWithVowel } from "#/features/subscription/french";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import {
  IconArrowDownRight,
  IconArrowRight,
  IconArrowUpRight,
  IconCircleCheckFilled,
  IconCircleDashed,
  IconFileText,
  IconInbox,
  IconMinus,
  IconStarFilled,
  IconUserCheck,
  IconUsers,
} from "@tabler/icons-react";

import { Skeleton } from "#/components/ui/skeleton";
import { PreviewSheet } from "#/components/preview-sheet";
import { appConfig } from "#/config";
import { offerChip } from "#/features/offers/offer-labels";
import { INTL_LOCALE, type Locale } from "#/i18n/config";
import { formatPercent } from "#/i18n/format";
import { SubscriptionBanner } from "#/features/subscription/components/subscription-banner";
import { useSessionUser } from "#/hooks/use-session-user";
import {
  getMyBusiness,
  getMyStats,
  getMySubscription,
  myBusinessKey,
  myStatsKey,
  mySubscriptionKey,
} from "#/lib/api/business-controller";
import { sourceLabel } from "#/features/careers/candidate-source";
import type { BusinessStats, MyBusiness, MySubscription, StatsPeriod } from "#/lib/api/types";
import { cn } from "#/lib/utils";
import { formatDelay, trend, type Trend } from "../stats-format";
import { ApplicationsChart } from "./applications-chart";
import { ReportExportMenu } from "./report-export-menu";
import { StatTile } from "./stat-tile";
import { offersUsed } from "#/features/subscription/offers-quota";
import { packCredits, planShare } from "#/features/subscription/packs";

const PERIODS: StatsPeriod[] = [7, 30, 90];

const date = (iso: string, locale: Locale) =>
  new Date(iso).toLocaleDateString(INTL_LOCALE[locale], { day: "numeric", month: "long", year: "numeric" });
const nf = (n: number, locale: Locale) => n.toLocaleString(INTL_LOCALE[locale], { maximumFractionDigits: 1 });
const percent = (n: number | null, locale: Locale) => (n === null ? "—" : formatPercent(n, locale));

/**
 * The business space's home: how recruitment is going over a chosen period —
 * volume, the funnel, delays and outcomes, each against the period before —
 * then the offers that need attention and the plan's usage.
 */
export function HomeOverview() {
  const { data: user } = useSessionUser();
  const t = useTranslations("home");
  const locale = useLocale();
  const [days, setDays] = useState<StatsPeriod>(30);
  const [reportOpen, setReportOpen] = useState(false);
  const business = useQuery({ queryKey: myBusinessKey, queryFn: getMyBusiness });
  const subscription = useQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription });
  const stats = useQuery({ queryKey: myStatsKey(days), queryFn: () => getMyStats(days), placeholderData: (prev) => prev });
  const b = business.data;
  const s = subscription.data;
  const st = stats.data;

  return (
    <div className="w-full space-y-6 pt-2">
      <section className="rounded-3xl bg-card p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="font-semibold text-3xl tracking-tight sm:text-4xl">{t("title")}</h1>
            <p className="text-muted-foreground">
              {t("greeting", greeting(user?.first_name || b?.owner?.firstName, b?.name, days))}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PeriodPicker value={days} onChange={setDays} />
            <ReportExportMenu days={days} onOpenPdf={() => setReportOpen(true)} />
          </div>
        </div>
        {/* The same period as a document to keep or send: read, downloaded and printed from the drawer. */}
        <PreviewSheet
          open={reportOpen}
          onOpenChange={setReportOpen}
          title={t("report.title")}
          subtitle={t("report.subtitle", { name: b?.name ?? t("report.yourOrganisation"), days })}
          src={`${appConfig.apiUrl}/business/me/report.pdf?days=${days}`}
          kind="pdf"
          fileName={t("report.fileName", { days })}
          unavailable={t("report.unavailable")}
        />
        {/* Only when something is to do about the plan. */}
        <SubscriptionBanner className="mt-4 rounded-2xl p-4" />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {!st ? (
            stats.isLoading ? (
              [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)
            ) : (
              <Unavailable className="sm:col-span-2 xl:col-span-4" />
            )
          ) : (
            <>
              <StatTile
                icon={IconInbox}
                label={t("tiles.received")}
                value={nf(st.applications.received, locale)}
                href="/espace/candidatures?onglet=all"
                footer={<TrendLine trend={trend(st.applications.received, st.applications.receivedPrevious, false, locale)} days={days} />}
              />
              <StatTile
                icon={IconUsers}
                label={t("tiles.toReview")}
                value={nf(st.applications.toReview, locale)}
                href="/espace/candidatures?onglet=new"
                hint={
                  st.applications.overdue > 0
                    ? t("tiles.overdue", { count: st.applications.overdue })
                    : st.applications.toReview > 0
                      ? t("tiles.recent")
                      : t("tiles.noneWaiting")
                }
              />
              <StatTile
                icon={IconUserCheck}
                label={t("tiles.hires")}
                value={nf(st.hires.count, locale)}
                href="/espace/candidatures?onglet=hired"
                footer={<TrendLine trend={trend(st.hires.count, st.hires.previous, false, locale)} days={days} />}
              />
              <StatTile
                icon={IconFileText}
                label={t("tiles.openPositions")}
                value={nf(st.offers.openPositions, locale)}
                href="/espace/offres"
                hint={t("tiles.onOffers", { count: st.offers.open })}
              />
            </>
          )}
        </div>
      </section>

      {b && s && <NextSteps business={b} subscription={s} />}

      {st && (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card
              className="lg:col-span-2"
              title={t("perDay.title")}
              href="/espace/candidatures?onglet=all"
              action={
                <span className="text-muted-foreground text-sm">
                  {st.applications.perOffer === null ? "" : t("perDay.perOffer", { n: nf(st.applications.perOffer, locale) })}
                </span>
              }
            >
              <ApplicationsChart series={st.series} />
            </Card>
            <FunnelCard funnel={st.funnel} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <DelaysCard timing={st.timing} days={days} />
            <ResultsCard quality={st.quality} />
            <SubscriptionCard subscription={s} loading={subscription.isLoading} unlocked={st.contacts.unlocked} days={days} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <OffersCard offers={st.topOffers} />
            <div className="flex flex-col gap-6">
              <CategoriesCard categories={st.categories} />
              <SourcesCard sources={st.sources ?? []} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PeriodPicker({ value, onChange }: Readonly<{ value: StatsPeriod; onChange: (d: StatsPeriod) => void }>) {
  const t = useTranslations("home");
  return (
    <div role="radiogroup" aria-label={t("period")} className="inline-flex rounded-full bg-page p-1">
      {PERIODS.map((days) => (
        <button
          key={days}
          type="button"
          role="radio"
          aria-checked={value === days}
          onClick={() => onChange(days)}
          className={cn(
            "rounded-full px-4 py-1.5 font-medium text-sm transition-colors",
            value === days ? "bg-selected text-selected-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t("days", { days })}
        </button>
      ))}
    </div>
  );
}

/** « +25 % vs les 30 jours précédents », green when it is good news, red when not. */
function TrendLine({ trend: t, days }: Readonly<{ trend: Trend | null; days: number }>) {
  const tr = useTranslations("home");
  if (!t) return null;
  const Icon = t.direction === "up" ? IconArrowUpRight : t.direction === "down" ? IconArrowDownRight : IconMinus;
  return (
    <p className="text-muted-foreground text-sm">
      <span
        className={cn(
          "mr-1 inline-flex items-center gap-0.5 whitespace-nowrap font-medium",
          t.good === true && "text-chip-green-foreground",
          t.good === false && "text-destructive",
        )}
      >
        <Icon className="size-4" />
        {t.direction === "flat" ? tr("trendStable") : t.label}
      </span>
      {tr("trend", { days })}
    </p>
  );
}

function Unavailable({ className }: Readonly<{ className?: string }>) {
  const t = useTranslations("home");
  return (
    <p className={cn("rounded-2xl bg-page p-5 text-muted-foreground text-sm", className)}>
      {t("unavailable")}
    </p>
  );
}

/** A dashboard card; with `href`, its title opens the page behind it. */
function Card({
  title,
  action,
  href,
  className,
  children,
}: Readonly<{ title: string; action?: React.ReactNode; href?: string; className?: string; children: React.ReactNode }>) {
  return (
    <section className={cn("flex flex-col gap-5 rounded-3xl bg-card p-6", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-xl">
          {href ? (
            <Link href={href} className="group inline-flex items-center gap-1.5 hover:underline hover:underline-offset-4">
              {title}
              <IconArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : (
            title
          )}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function CardLink({ href, children }: Readonly<{ href: string; children: React.ReactNode }>) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 font-medium text-sm text-whatsapp-dark hover:underline">
      {children}
      <IconArrowRight className="size-4" />
    </Link>
  );
}

/** A share of a whole as a thin bar: one hue (green unless told), from the left. */
function Bar({ value, max, color = "bg-whatsapp-dark" }: Readonly<{ value: number; max: number; color?: string }>) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-page">
      <div className={cn("h-full rounded-full", color)} style={{ width: `${max === 0 ? 0 : (value / max) * 100}%` }} />
    </div>
  );
}

function FunnelCard({ funnel }: Readonly<{ funnel: BusinessStats["funnel"] }>) {
  const t = useTranslations("home.funnel");
  const locale = useLocale();
  const steps = [
    // One colour per stage, in order, so each step reads at a glance.
    { label: t("received"), value: funnel.received, color: "bg-sky-500" },
    { label: t("viewed"), value: funnel.viewed, color: "bg-violet-500" },
    { label: t("hired"), value: funnel.hired, color: "bg-whatsapp-dark" },
    { label: t("started"), value: funnel.started, color: "bg-amber-500" },
    { label: t("completed"), value: funnel.completed, color: "bg-teal-500" },
  ];
  return (
    <Card title={t("title")} href="/espace/candidatures?onglet=all">
      {funnel.received === 0 ? (
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      ) : (
        <ol className="space-y-4">
          {steps.map((step) => (
            <li key={step.label} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <span aria-hidden className={cn("size-2 shrink-0 rounded-full", step.color)} />
                  {step.label}
                </span>
                <span className="tabular-nums">
                  <span className="font-semibold">{step.value}</span>
                  <span className="text-muted-foreground"> · {percent(Math.round((step.value / funnel.received) * 100), locale)}</span>
                </span>
              </div>
              <Bar value={step.value} max={funnel.received} color={step.color} />
            </li>
          ))}
        </ol>
      )}
      <p className="mt-auto text-muted-foreground text-xs">{t("note")}</p>
    </Card>
  );
}

function Figure({
  label,
  hint,
  value,
  trend: t,
  days,
}: Readonly<{ label: string; hint: string; value: React.ReactNode; trend?: Trend | null; days?: number }>) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-page p-4">
      <div className="min-w-0">
        <p className="font-medium text-sm">{label}</p>
        <p className="text-muted-foreground text-xs">{hint}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-semibold text-xl tabular-nums">{value}</p>
        {t && days && t.direction !== "flat" && (
          <p
            className={cn(
              "inline-flex items-center gap-0.5 font-medium text-xs",
              t.good ? "text-chip-green-foreground" : "text-destructive",
            )}
          >
            {t.direction === "up" ? <IconArrowUpRight className="size-3.5" /> : <IconArrowDownRight className="size-3.5" />}
            {t.label}
          </p>
        )}
      </div>
    </div>
  );
}

function DelaysCard({ timing, days }: Readonly<{ timing: BusinessStats["timing"]; days: number }>) {
  const t = useTranslations("home.delays");
  const locale = useLocale();
  const hire = (d: number | null) => (d === null ? null : d * 24);
  return (
    <Card title={t("title")} href="/espace/candidatures?onglet=new">
      <div className="space-y-2">
        <Figure
          label={t("firstApplicant")}
          hint={t("firstApplicantHint")}
          value={formatDelay(timing.firstApplicantHours, t, locale)}
          trend={trend(timing.firstApplicantHours, timing.firstApplicantHoursPrevious, true, locale)}
          days={days}
        />
        <Figure
          label={t("response")}
          hint={t("responseHint")}
          value={formatDelay(timing.responseHours, t, locale)}
          trend={trend(timing.responseHours, timing.responseHoursPrevious, true, locale)}
          days={days}
        />
        <Figure
          label={t("hire")}
          hint={t("hireHint")}
          value={formatDelay(hire(timing.timeToHireDays), t, locale)}
          trend={trend(timing.timeToHireDays, timing.timeToHireDaysPrevious, true, locale)}
          days={days}
        />
      </div>
      <p className="mt-auto text-muted-foreground text-xs">{t("note")}</p>
    </Card>
  );
}

function Stars({ value }: Readonly<{ value: number | null }>) {
  const locale = useLocale();
  if (value === null) return <>—</>;
  return (
    <span className="inline-flex items-center gap-1">
      {nf(value, locale)}
      <IconStarFilled className="size-4 text-amber-400" />
    </span>
  );
}

function ResultsCard({ quality: q }: Readonly<{ quality: BusinessStats["quality"] }>) {
  const t = useTranslations("home.results");
  const locale = useLocale();
  return (
    <Card title={t("title")} href="/espace/missions">
      <div className="space-y-2 rounded-2xl bg-page p-4">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <p className="font-medium text-sm">{t("filled")}</p>
            <p className="text-muted-foreground text-xs">
              {t("filledHint", { filled: q.positionsFilled, proposed: q.positionsProposed })}
            </p>
          </div>
          <p className="font-semibold text-xl tabular-nums">{percent(q.fillRate, locale)}</p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-card">
          <div className="h-full rounded-full bg-whatsapp-dark" style={{ width: `${q.fillRate ?? 0}%` }} />
        </div>
      </div>
      <div className="space-y-2">
        <Figure
          label={t("noShows")}
          hint={q.missionsEnded ? t("noShowsHint", { count: q.missionsEnded }) : t("noMissionEnded")}
          value={percent(q.noShowRate, locale)}
        />
        <Figure label={t("ratingGiven")} hint={t("ratingGivenHint", { count: q.ratingsGivenCount })} value={<Stars value={q.ratingGiven} />} />
        <Figure label={t("ratingReceived")} hint={t("ratingReceivedHint", { count: q.ratingsReceivedCount })} value={<Stars value={q.ratingReceived} />} />
      </div>
    </Card>
  );
}

function SubscriptionCard({
  subscription,
  loading,
  unlocked,
  days,
}: Readonly<{ subscription?: MySubscription; loading: boolean; unlocked: number; days: number }>) {
  const t = useTranslations("home.subscription");
  const locale = useLocale();
  if (loading || !subscription) {
    return (
      <Card title={t("title")} href="/espace/abonnement">
        {loading ? <Skeleton className="h-52 rounded-2xl" /> : <Unavailable />}
      </Card>
    );
  }
  const e = subscription.entitlements;
  if (!e.plan) {
    return (
      <Card title={t("title")} href="/espace/abonnement">
        <p className="text-muted-foreground text-sm">{t("none")}</p>
        <Link
          href="/espace/abonnement"
          className="mt-auto inline-flex h-12 items-center justify-center rounded-full bg-ink font-medium text-[15px] text-white hover:bg-ink/90"
        >
          {t("choose")}
        </Link>
      </Card>
    );
  }
  const period = currentPeriod(subscription);
  const meters = [
    { label: t("contacts"), used: e.unlocksUsed, limit: e.unlocksQuota, over: "overContacts" as const },
    { label: t("offers"), used: offersUsed(e), limit: e.activeOffersLimit, over: "overOffers" as const },
    ...(e.cvQuota !== 0 ? [{ label: t("cvs"), used: e.cvUsed, limit: e.cvQuota, over: "overCvs" as const }] : []),
    // The plan's own drafts this period, packs aside, as on the subscription page.
    ...(e.offerDraftsQuota !== undefined && e.offerDraftsQuota !== 0
      ? [
          {
            label: t("drafts"),
            used:
              e.offerDraftsQuota === null
                ? 0
                : e.offerDraftsQuota - (planShare(e.offerDraftsRemaining, packCredits(e, "OFFER_DRAFT")) ?? 0),
            limit: e.offerDraftsQuota,
            over: "overDrafts" as const,
          },
        ]
      : []),
  ];
  return (
    <Card title={t("title")} action={<CardLink href="/espace/abonnement">{t("manage")}</CardLink>}>
      <div className="flex items-center gap-5">
        {period && <TimeLeftRing period={period} />}
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-lg">{e.plan.name}</p>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 font-medium text-xs",
                e.status === "TRIAL" ? "bg-chip-violet text-chip-violet-foreground" : "bg-chip-green text-chip-green-foreground",
              )}
            >
              {e.status === "TRIAL" ? t("trial") : t("active")}
            </span>
          </div>
          {e.endsAt && (
            <p className="text-muted-foreground text-sm">
              {t.rich(e.status === "TRIAL" ? "trialUntil" : "until", {
                date: date(e.endsAt, locale),
                strong: (chunks) => <span className="font-medium text-foreground">{chunks}</span>,
              })}
            </p>
          )}
        </div>
      </div>

      <ul className="space-y-4">
        {meters.map((m) => (
          <Meter key={m.label} {...m} />
        ))}
      </ul>

      <p className="mt-auto text-muted-foreground text-xs">{t("unlocked", { count: unlocked, days })}</p>
    </Card>
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** The period running now (trial or paid), from the history. A module helper: reading the clock is not render's business. */
function currentPeriod(s: MySubscription): { startsAt: string; endsAt: string } | null {
  const now = Date.now();
  return (
    s.history.find(
      (p) => (p.status === "ACTIVE" || p.status === "TRIAL") && new Date(p.startsAt).getTime() <= now && new Date(p.endsAt).getTime() > now,
    ) ?? null
  );
}

function daysLeft(endsAt: string): number {
  return Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / DAY_MS));
}

/** What is left of the period, as a ring: days left in the middle, the share of the period still to come around it. */
function TimeLeftRing({ period }: Readonly<{ period: { startsAt: string; endsAt: string } }>) {
  const total = Math.max(1, Math.round((new Date(period.endsAt).getTime() - new Date(period.startsAt).getTime()) / DAY_MS));
  const left = Math.min(total, daysLeft(period.endsAt));
  const pct = (left / total) * 100;
  const tone = left <= 3 ? "var(--color-destructive)" : left <= 7 ? "rgb(245 158 11)" : "var(--color-whatsapp-dark)";
  const t = useTranslations("home.subscription");
  return (
    <div
      role="img"
      aria-label={t("daysLeftLabel", { left, total })}
      className="relative size-24 shrink-0 rounded-full"
      style={{ background: `conic-gradient(${tone} ${pct}%, var(--page) ${pct}% 100%)` }}
    >
      <div className="absolute inset-2.5 flex flex-col items-center justify-center rounded-full bg-card text-center">
        <span className="font-semibold text-2xl leading-none tabular-nums">{left}</span>
        <span className="mt-1 text-[11px] text-muted-foreground leading-tight">
          {t.rich("daysLeft", { left, br: () => <br /> })}
        </span>
      </div>
    </div>
  );
}

/** One thing the plan covers: used against included, green, then amber near the limit, red at or past it. */
function Meter({
  label,
  used,
  limit,
  over: overKey,
}: Readonly<{
  label: string;
  used: number;
  limit: number | null;
  over: "overContacts" | "overOffers" | "overCvs" | "overDrafts";
}>) {
  const t = useTranslations("home.subscription");
  const ratio = limit === null || limit === 0 ? 0 : used / limit;
  const over = limit !== null && used > limit;
  const full = limit !== null && used >= limit;
  const color = full ? "bg-destructive" : ratio >= 0.8 ? "bg-amber-500" : "bg-whatsapp-dark";
  return (
    <li className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums">
          {limit === null ? (
            <>
              <span className="font-semibold">{used}</span>
              <span className="text-muted-foreground"> · {t("unlimited")}</span>
            </>
          ) : (
            <>
              <span className={cn("font-semibold", over && "text-destructive")}>{used}</span>
              <span className="text-muted-foreground"> / {limit}</span>
            </>
          )}
        </span>
      </div>
      {limit !== null && (
        <div className="h-2 overflow-hidden rounded-full bg-page">
          <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
        </div>
      )}
      {over && (
        <p className="text-destructive text-xs">{t(overKey, { used, limit })}</p>
      )}
    </li>
  );
}

function OffersCard({ offers }: Readonly<{ offers: BusinessStats["topOffers"] }>) {
  const t = useTranslations("home.offers");
  const tLabels = useTranslations("labels");
  return (
    <Card className="lg:col-span-2" title={t("title")} action={<CardLink href="/espace/offres">{t("all")}</CardLink>}>
      {offers.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-muted-foreground text-sm">{t("empty")}</p>
          <CardLink href="/espace/offres/nouvelle">{t("publish")}</CardLink>
        </div>
      ) : (
        <ul className="space-y-2">
          {offers.map((o) => (
            <li key={o.id}>
              <Link
                href={`/espace/offres/${o.id}`}
                className="grid items-center gap-x-4 gap-y-2 rounded-2xl bg-page p-4 transition-colors hover:bg-page/70 sm:grid-cols-[1fr_9rem_auto]"
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-medium">{o.title}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={cn("rounded-full px-2 py-0.5 font-medium", offerChip(o, tLabels).className)}>
                      {offerChip(o, tLabels).label}
                    </span>
                    <span className="text-muted-foreground">{t("applications", { count: o.applications })}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">
                    {t("filled", { filled: Math.min(o.hired, o.quantity), quantity: o.quantity })}
                  </p>
                  <Bar value={Math.min(o.hired, o.quantity)} max={o.quantity} />
                </div>
                <span
                  className={cn(
                    "justify-self-start rounded-full px-2.5 py-1 font-medium text-xs sm:justify-self-end",
                    o.toReview > 0 ? "bg-chip-amber text-chip-amber-foreground" : "text-muted-foreground",
                  )}
                >
                  {o.toReview > 0 ? t("toReview", { count: o.toReview }) : t("upToDate")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function CategoriesCard({ categories }: Readonly<{ categories: BusinessStats["categories"] }>) {
  const max = Math.max(0, ...categories.map((c) => c.applications));
  const t = useTranslations("home");
  const trade = useTradeName();
  return (
    <Card title={t("categories.title")} href="/espace/offres">
      {categories.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("funnel.empty")}</p>
      ) : (
        <ul className="space-y-4">
          {categories.map((c) => (
            <li key={c.name} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-medium">{trade(c.name)}</span>
                <span className="shrink-0 tabular-nums">{c.applications}</span>
              </div>
              <Bar value={c.applications} max={max} />
            </li>
          ))}
        </ul>
      )}
      <p className="mt-auto text-muted-foreground text-xs">{t("categories.note")}</p>
    </Card>
  );
}

function SourcesCard({ sources }: Readonly<{ sources: NonNullable<BusinessStats["sources"]> }>) {
  const max = Math.max(0, ...sources.map((s) => s.received));
  const t = useTranslations("home");
  const tLabels = useTranslations("labels");
  return (
    <Card title={t("sources.title")} href="/espace/candidatures?onglet=all">
      {sources.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("funnel.empty")}</p>
      ) : (
        <ul className="space-y-4">
          {sources.slice(0, 6).map((s) => (
            <li key={s.source} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-medium">{sourceLabel(s.source, tLabels)}</span>
                <span className="shrink-0 tabular-nums">
                  {s.received}
                  {s.hired > 0 && <span className="text-muted-foreground"> · {t("sources.hired", { count: s.hired })}</span>}
                </span>
              </div>
              <Bar value={s.received} max={max} />
            </li>
          ))}
        </ul>
      )}
      <p className="mt-auto text-muted-foreground text-xs">{t("sources.note")}</p>
    </Card>
  );
}

/** Setting up the account, shown until every step is done. */
function NextSteps({ business, subscription }: Readonly<{ business: MyBusiness; subscription: MySubscription }>) {
  const t = useTranslations("home.nextSteps");
  const steps = [
    { label: t("logo"), done: !!business.logoUrl, href: "/espace/organisation" },
    {
      label: t("documents"),
      // No paper is required: verified, or every paper sent accepted.
      done:
        business.verificationStatus === "VERIFIED" ||
        (business.documents.length > 0 && business.documents.every((d) => d.verificationStatus === "VERIFIED")),
      href: "/espace/organisation",
    },
    { label: t("verified"), done: business.verificationStatus === "VERIFIED", href: "/espace/organisation" },
    { label: t("plan"), done: !!subscription.entitlements.plan, href: "/espace/abonnement" },
    {
      label: t("firstOffer"),
      done: subscription.entitlements.hasPublishedOffer,
      href: "/espace/offres/nouvelle",
    },
  ];
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;
  return (
    <Card title={t("title")} action={<span className="text-muted-foreground text-sm">{t("done", { done, total: steps.length })}</span>}>
      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {steps.map((s) => (
          <li key={s.label}>
            <Link
              href={s.href}
              className={cn(
                "flex h-full items-start gap-3 rounded-2xl p-4 text-sm transition-colors",
                s.done ? "bg-chip-green text-chip-green-foreground" : "bg-page hover:bg-page/70",
              )}
            >
              {s.done ? <IconCircleCheckFilled className="size-5 shrink-0" /> : <IconCircleDashed className="size-5 shrink-0 text-muted-foreground" />}
              <span className="font-medium">{s.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/**
 * The values of home.greeting: « Bonjour Awa, voici… », or « Voici… » when no
 * first name is known (never a lowercase start); « d'… » before a vowel.
 */
function greeting(firstName: string | undefined, businessName: string | undefined, days: number) {
  return {
    named: firstName?.trim() ? "yes" : "no",
    firstName: firstName?.trim() ?? "",
    hasBusiness: businessName ? "yes" : "no",
    business: businessName ?? "",
    elision: businessName && startsWithVowel(businessName) ? "vowel" : "other",
    days,
  };
}
