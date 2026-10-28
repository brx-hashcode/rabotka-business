"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
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
import { STATUS } from "#/features/offers/offer-labels";
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
import type { BusinessStats, MyBusiness, MySubscription, StatsPeriod } from "#/lib/api/types";
import { cn } from "#/lib/utils";
import { formatDelay, trend, type Trend } from "../stats-format";
import { ApplicationsChart } from "./applications-chart";
import { StatTile } from "./stat-tile";
import { offersUsed } from "#/features/subscription/offers-quota";

const PERIODS: { days: StatsPeriod; label: string }[] = [
  { days: 7, label: "7 jours" },
  { days: 30, label: "30 jours" },
  { days: 90, label: "90 jours" },
];

const date = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const nf = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
const percent = (n: number | null) => (n === null ? "—" : `${n} %`);

/**
 * The business space's home: how recruitment is going over a chosen period —
 * volume, the funnel, delays and outcomes, each against the period before —
 * then the offers that need attention and the plan's usage.
 */
export function HomeOverview() {
  const { data: user } = useSessionUser();
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
            <h1 className="font-semibold text-3xl tracking-tight sm:text-4xl">Tableau de bord</h1>
            <p className="text-muted-foreground">
              {greeting(user?.first_name || b?.owner?.firstName, b?.name, days)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PeriodPicker value={days} onChange={setDays} />
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-page px-4 font-medium text-sm hover:bg-page/70"
            >
              <IconFileText className="size-4" />
              Rapport PDF
            </button>
          </div>
        </div>
        {/* The same period as a document to keep or send: read, downloaded and printed from the drawer. */}
        <PreviewSheet
          open={reportOpen}
          onOpenChange={setReportOpen}
          title="Rapport de recrutement"
          subtitle={`${b?.name ?? "Votre organisation"} · ${days} derniers jours`}
          src={`${appConfig.apiUrl}/business/me/report.pdf?days=${days}`}
          kind="pdf"
          fileName={`rapport-recrutement-${days}-jours.pdf`}
          unavailable="Le rapport n'a pas pu être créé. Réessayez dans un instant."
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
                label="Candidatures reçues"
                value={nf(st.applications.received)}
                footer={<TrendLine trend={trend(st.applications.received, st.applications.receivedPrevious)} days={days} />}
              />
              <StatTile
                icon={IconUsers}
                label="À examiner"
                value={nf(st.applications.toReview)}
                hint={
                  st.applications.overdue > 0
                    ? `dont ${st.applications.overdue} en attente depuis plus de 48 h`
                    : st.applications.toReview > 0
                      ? "toutes reçues il y a moins de 48 h"
                      : "aucune candidature en attente"
                }
              />
              <StatTile
                icon={IconUserCheck}
                label="Candidats retenus"
                value={nf(st.hires.count)}
                footer={<TrendLine trend={trend(st.hires.count, st.hires.previous)} days={days} />}
              />
              <StatTile
                icon={IconFileText}
                label="Postes ouverts"
                value={nf(st.offers.openPositions)}
                hint={`sur ${st.offers.open} offre${st.offers.open > 1 ? "s" : ""} en ligne`}
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
              title="Candidatures par jour"
              action={
                <span className="text-muted-foreground text-sm">
                  {st.applications.perOffer === null ? "" : `${nf(st.applications.perOffer)} par offre en moyenne`}
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
            <CategoriesCard categories={st.categories} />
          </div>
        </>
      )}
    </div>
  );
}

function PeriodPicker({ value, onChange }: Readonly<{ value: StatsPeriod; onChange: (d: StatsPeriod) => void }>) {
  return (
    <div role="radiogroup" aria-label="Période" className="inline-flex rounded-full bg-page p-1">
      {PERIODS.map((p) => (
        <button
          key={p.days}
          type="button"
          role="radio"
          aria-checked={value === p.days}
          onClick={() => onChange(p.days)}
          className={cn(
            "rounded-full px-4 py-1.5 font-medium text-sm transition-colors",
            value === p.days ? "bg-selected text-selected-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

/** « +25 % vs les 30 jours précédents », green when it is good news, red when not. */
function TrendLine({ trend: t, days }: Readonly<{ trend: Trend | null; days: number }>) {
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
        {t.label}
      </span>
      vs les {days} jours précédents
    </p>
  );
}

function Unavailable({ className }: Readonly<{ className?: string }>) {
  return (
    <p className={cn("rounded-2xl bg-page p-5 text-muted-foreground text-sm", className)}>
      Ces informations sont indisponibles pour le moment. Réessayez dans un instant.
    </p>
  );
}

function Card({
  title,
  action,
  className,
  children,
}: Readonly<{ title: string; action?: React.ReactNode; className?: string; children: React.ReactNode }>) {
  return (
    <section className={cn("flex flex-col gap-5 rounded-3xl bg-card p-6", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-xl">{title}</h2>
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
  const steps = [
    // One colour per stage, in order, so each step reads at a glance.
    { label: "Reçues", value: funnel.received, color: "bg-sky-500" },
    { label: "Consultées", value: funnel.viewed, color: "bg-violet-500" },
    { label: "Retenues", value: funnel.hired, color: "bg-whatsapp-dark" },
    { label: "Mission démarrée", value: funnel.started, color: "bg-amber-500" },
    { label: "Mission terminée", value: funnel.completed, color: "bg-teal-500" },
  ];
  return (
    <Card title="Où en sont vos candidatures">
      {funnel.received === 0 ? (
        <p className="text-muted-foreground text-sm">Aucune candidature reçue sur la période.</p>
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
                  <span className="text-muted-foreground"> · {Math.round((step.value / funnel.received) * 100)} %</span>
                </span>
              </div>
              <Bar value={step.value} max={funnel.received} color={step.color} />
            </li>
          ))}
        </ol>
      )}
      <p className="mt-auto text-muted-foreground text-xs">Les candidatures reçues sur la période, et jusqu&apos;où elles sont allées.</p>
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
  const hire = (d: number | null) => (d === null ? null : d * 24);
  return (
    <Card title="Délais">
      <div className="space-y-2">
        <Figure
          label="Premier candidat"
          hint="après la publication d'une offre"
          value={formatDelay(timing.firstApplicantHours)}
          trend={trend(timing.firstApplicantHours, timing.firstApplicantHoursPrevious, true)}
          days={days}
        />
        <Figure
          label="Délai de réponse"
          hint="avant d'ouvrir ou de répondre"
          value={formatDelay(timing.responseHours)}
          trend={trend(timing.responseHours, timing.responseHoursPrevious, true)}
          days={days}
        />
        <Figure
          label="Délai de recrutement"
          hint="de la publication à l'acceptation"
          value={formatDelay(hire(timing.timeToHireDays))}
          trend={trend(timing.timeToHireDays, timing.timeToHireDaysPrevious, true)}
          days={days}
        />
      </div>
      <p className="mt-auto text-muted-foreground text-xs">En moyenne sur la période, comparé à la période précédente.</p>
    </Card>
  );
}

function Stars({ value }: Readonly<{ value: number | null }>) {
  if (value === null) return <>—</>;
  return (
    <span className="inline-flex items-center gap-1">
      {nf(value)}
      <IconStarFilled className="size-4 text-amber-400" />
    </span>
  );
}

function ResultsCard({ quality: q }: Readonly<{ quality: BusinessStats["quality"] }>) {
  return (
    <Card title="Résultats">
      <div className="space-y-2 rounded-2xl bg-page p-4">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <p className="font-medium text-sm">Postes pourvus</p>
            <p className="text-muted-foreground text-xs">
              {q.positionsFilled} poste{q.positionsFilled > 1 ? "s" : ""} pourvu{q.positionsFilled > 1 ? "s" : ""} sur{" "}
              {q.positionsProposed}
            </p>
          </div>
          <p className="font-semibold text-xl tabular-nums">{percent(q.fillRate)}</p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-card">
          <div className="h-full rounded-full bg-whatsapp-dark" style={{ width: `${q.fillRate ?? 0}%` }} />
        </div>
      </div>
      <div className="space-y-2">
        <Figure
          label="Absences"
          hint={q.missionsEnded ? `sur ${q.missionsEnded} mission${q.missionsEnded > 1 ? "s" : ""} terminée${q.missionsEnded > 1 ? "s" : ""}` : "aucune mission terminée"}
          value={percent(q.noShowRate)}
        />
        <Figure label="Note donnée" hint={`moyenne de vos ${q.ratingsGivenCount} avis`} value={<Stars value={q.ratingGiven} />} />
        <Figure label="Note reçue" hint={`${q.ratingsReceivedCount} avis de candidats`} value={<Stars value={q.ratingReceived} />} />
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
  if (loading || !subscription) {
    return (
      <Card title="Abonnement">
        {loading ? <Skeleton className="h-52 rounded-2xl" /> : <Unavailable />}
      </Card>
    );
  }
  const e = subscription.entitlements;
  if (!e.plan) {
    return (
      <Card title="Abonnement">
        <p className="text-muted-foreground text-sm">
          Aucune formule en cours : vos contacts sont payés à l&apos;unité et vous ne pouvez pas publier d&apos;offres.
        </p>
        <Link
          href="/espace/abonnement"
          className="mt-auto inline-flex h-12 items-center justify-center rounded-full bg-ink font-medium text-[15px] text-white hover:bg-ink/90"
        >
          Choisir une formule
        </Link>
      </Card>
    );
  }
  const period = currentPeriod(subscription);
  const meters = [
    { label: "Contacts inclus", used: e.unlocksUsed, limit: e.unlocksQuota, unit: ["contact", "contacts"] as const },
    { label: "Offres publiées", used: offersUsed(e), limit: e.activeOffersLimit, unit: ["offre", "offres"] as const },
    ...(e.cvQuota !== 0 ? [{ label: "CV inclus", used: e.cvUsed, limit: e.cvQuota, unit: ["CV", "CV"] as const }] : []),
  ];
  return (
    <Card title="Abonnement" action={<CardLink href="/espace/abonnement">Gérer</CardLink>}>
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
              {e.status === "TRIAL" ? "Essai" : "Active"}
            </span>
          </div>
          {e.endsAt && (
            <p className="text-muted-foreground text-sm">
              {e.status === "TRIAL" ? "Essai jusqu'au" : "Jusqu'au"} <span className="font-medium text-foreground">{date(e.endsAt)}</span>
            </p>
          )}
        </div>
      </div>

      <ul className="space-y-4">
        {meters.map((m) => (
          <Meter key={m.label} {...m} />
        ))}
      </ul>

      <p className="mt-auto text-muted-foreground text-xs">
        {unlocked} contact{unlocked > 1 ? "s" : ""} obtenu{unlocked > 1 ? "s" : ""} sur les {days} derniers jours.
      </p>
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
  return (
    <div
      role="img"
      aria-label={`${left} jour${left > 1 ? "s" : ""} restant${left > 1 ? "s" : ""} sur ${total}`}
      className="relative size-24 shrink-0 rounded-full"
      style={{ background: `conic-gradient(${tone} ${pct}%, var(--page) ${pct}% 100%)` }}
    >
      <div className="absolute inset-2.5 flex flex-col items-center justify-center rounded-full bg-card text-center">
        <span className="font-semibold text-2xl leading-none tabular-nums">{left}</span>
        <span className="mt-1 text-[11px] text-muted-foreground leading-tight">
          jour{left > 1 ? "s" : ""}
          <br />
          restant{left > 1 ? "s" : ""}
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
  unit,
}: Readonly<{ label: string; used: number; limit: number | null; unit: readonly [string, string] }>) {
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
              <span className="text-muted-foreground"> · illimité</span>
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
        <p className="text-destructive text-xs">
          {used} {unit[1]} pour {limit} inclus{limit > 1 ? "es" : "e"} : changez de formule pour aller au-delà.
        </p>
      )}
    </li>
  );
}

function OffersCard({ offers }: Readonly<{ offers: BusinessStats["topOffers"] }>) {
  return (
    <Card className="lg:col-span-2" title="Offres à suivre" action={<CardLink href="/espace/offres">Toutes les offres</CardLink>}>
      {offers.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-muted-foreground text-sm">Vous n&apos;avez encore publié aucune offre.</p>
          <CardLink href="/espace/offres/nouvelle">Publier une offre</CardLink>
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
                    <span className={cn("rounded-full px-2 py-0.5 font-medium", STATUS[o.status].className)}>
                      {STATUS[o.status].label}
                    </span>
                    <span className="text-muted-foreground">
                      {o.applications} candidature{o.applications > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">
                    {Math.min(o.hired, o.quantity)}/{o.quantity} poste{o.quantity > 1 ? "s" : ""} pourvu{o.quantity > 1 ? "s" : ""}
                  </p>
                  <Bar value={Math.min(o.hired, o.quantity)} max={o.quantity} />
                </div>
                <span
                  className={cn(
                    "justify-self-start rounded-full px-2.5 py-1 font-medium text-xs sm:justify-self-end",
                    o.toReview > 0 ? "bg-chip-amber text-chip-amber-foreground" : "text-muted-foreground",
                  )}
                >
                  {o.toReview > 0 ? `${o.toReview} à examiner` : "À jour"}
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
  return (
    <Card title="Métiers les plus demandés">
      {categories.length === 0 ? (
        <p className="text-muted-foreground text-sm">Aucune candidature reçue sur la période.</p>
      ) : (
        <ul className="space-y-4">
          {categories.map((c) => (
            <li key={c.name} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-medium">{c.name}</span>
                <span className="shrink-0 tabular-nums">{c.applications}</span>
              </div>
              <Bar value={c.applications} max={max} />
            </li>
          ))}
        </ul>
      )}
      <p className="mt-auto text-muted-foreground text-xs">Candidatures reçues sur la période, par métier de l&apos;offre.</p>
    </Card>
  );
}

/** Setting up the account, shown until every step is done. */
function NextSteps({ business, subscription }: Readonly<{ business: MyBusiness; subscription: MySubscription }>) {
  const steps = [
    { label: "Ajouter le logo de votre organisation", done: !!business.logoUrl, href: "/espace/organisation" },
    {
      label: "Faire accepter vos documents",
      done:
        business.documents.length > 0 &&
        business.documents.every((d) => d.verificationStatus === "VERIFIED") &&
        business.missingDocuments.length === 0,
      href: "/espace/organisation",
    },
    { label: "Obtenir la vérification de l'organisation", done: business.verificationStatus === "VERIFIED", href: "/espace/organisation" },
    { label: "Choisir une formule", done: !!subscription.entitlements.plan, href: "/espace/abonnement" },
    {
      label: "Publier votre première offre",
      done: subscription.entitlements.activeOffers > 0,
      href: "/espace/offres/nouvelle",
    },
  ];
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;
  return (
    <Card title="Prochaines étapes" action={<span className="text-muted-foreground text-sm">{done}/{steps.length} faites</span>}>
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

/** « Bonjour Awa, voici… », or « Voici… » when no first name is known (never a lowercase start). */
function greeting(firstName: string | undefined, businessName: string | undefined, days: number): string {
  const what = `${businessName ? `le recrutement de ${businessName}` : "votre recrutement"} sur les ${days} derniers jours.`;
  return firstName?.trim() ? `Bonjour ${firstName.trim()}, voici ${what}` : `Voici ${what}`;
}
