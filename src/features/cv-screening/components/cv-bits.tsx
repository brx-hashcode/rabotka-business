"use client";

import Link from "next/link";
import { IconLock } from "@tabler/icons-react";
import { useLocale, useTranslations } from "next-intl";

import { INTL_LOCALE, type Locale } from "#/i18n/config";
import type { Translator } from "#/i18n/translator";
import type { CvCriterion, CvExperience } from "#/lib/api/types";
import { cn } from "#/lib/utils";
import { PACKS_HREF } from "#/features/subscription/packs";

/**
 * A CV being read: the selected-chip look, with three dots hopping in turn
 * (still under reduced motion). Said once to a screen reader.
 */
export function AnalysingChip({ className }: Readonly<{ className?: string }>) {
  const t = useTranslations("offers.candidate");
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn("inline-flex h-7 w-fit items-center gap-2 rounded-full bg-ink px-3 font-medium text-white text-xs", className)}
    >
      {t("analysing")}
      <span aria-hidden className="flex items-center gap-[3px] pt-0.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="dot-bounce size-1 rounded-full bg-current" style={{ animationDelay: `${i * 140}ms` }} />
        ))}
      </span>
    </span>
  );
}

/** The analysis's criteria, in order; their names are labels.criterion.* . */
export const CRITERIA: { key: CvCriterion }[] = [
  { key: "skills" },
  { key: "experience" },
  { key: "training" },
  { key: "location" },
  { key: "languages" },
];

type Band = { level: "high" | "good" | "partial" | "low"; chip: string; ring: string };

/** How well a score fits the job, in words (labels.verdict.<level>): the number alone says little. */
export function band(score: number): Band {
  if (score >= 80) return { level: "high", chip: "bg-chip-green text-chip-green-foreground", ring: "text-whatsapp-dark" };
  if (score >= 60) return { level: "good", chip: "bg-brand-lime text-[#0f2414]", ring: "text-whatsapp-dark" };
  if (score >= 40) return { level: "partial", chip: "bg-chip-amber text-chip-amber-foreground", ring: "text-chip-amber-foreground" };
  return { level: "low", chip: "bg-foreground/[0.07] text-muted-foreground", ring: "text-muted-foreground" };
}

export function VerdictChip({ score }: Readonly<{ score: number }>) {
  const t = useTranslations("labels.verdict");
  const b = band(score);
  return <span className={cn("rounded-full px-2.5 py-1 font-medium text-xs", b.chip)}>{t(b.level)}</span>;
}

/** The score out of 100 as a ring, the number in the middle. */
export function ScoreRing({ score, size = 56 }: Readonly<{ score: number; size?: number }>) {
  const t = useTranslations("cv");
  // A small ring (a board's card, a mock-up) keeps its number legible inside.
  const small = size < 34;
  const stroke = small ? 2 : 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-foreground/[0.08]" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          className={band(score).ring}
        />
      </svg>
      <span className={cn("absolute font-semibold tabular-nums", small ? "text-[7.5px]" : "text-sm")} aria-label={t("outOf100", { score })}>
        {score}
      </span>
    </span>
  );
}

/** One criterion's mark, as a thin bar. */
export function CriterionBar({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-card">
        <div className={cn("h-full rounded-full bg-current", band(value).ring)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function CvLocked({ trial = false, packOnSale = false }: Readonly<{ trial?: boolean; packOnSale?: boolean }>) {
  const t = useTranslations("cv");
  return (
    <section className="flex flex-col items-center gap-3 rounded-3xl bg-card px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-page">
        <IconLock className="size-6 text-muted-foreground" />
      </span>
      <p className="font-medium">
        {trial ? t("lockedTrial") : t("locked")}
      </p>
      <p className="max-w-md text-muted-foreground text-sm">
        {trial && t("notInTrial")}
        {t("lockedText")}
      </p>
      <CvWayOut packOnSale={packOnSale && !trial} />
    </section>
  );
}

/** All the « CV inclus » of the period used: until when, and the way to more. */
export function CvUsedUp({ until, packOnSale = false }: Readonly<{ until: string | null; packOnSale?: boolean }>) {
  const t = useTranslations("cv");
  const locale = useLocale() as Locale;
  const day = until ? new Date(until).toLocaleDateString(INTL_LOCALE[locale], { day: "numeric", month: "long" }) : "none";
  return (
    <section className="flex flex-col items-center gap-3 rounded-3xl bg-card px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-page">
        <IconLock className="size-6 text-muted-foreground" />
      </span>
      <p className="font-medium">{t("usedUp", { date: day })}</p>
      <p className="max-w-md text-muted-foreground text-sm">{t("usedUpText", { date: day, pack: packOnSale ? "yes" : "no" })}</p>
      <CvWayOut packOnSale={packOnSale} />
    </section>
  );
}

/**
 * One line for a CV the plan cannot analyse now (no analysis in the plan, or
 * its « CV inclus » used up), and the one way out: a pack, else the plans.
 */
export function CvBlockedNote({
  block,
  prefix,
  compact = false,
  className,
}: Readonly<{
  block: { kind: "locked" | "usedUp"; trial: boolean; until: string | null; packOnSale: boolean };
  /** Before the reason: « 2 CV pas encore analysés : ». */
  prefix?: string;
  /** On a card, one of many: the way out as a link, not a button. */
  compact?: boolean;
  className?: string;
}>) {
  const t = useTranslations("cv");
  const locale = useLocale() as Locale;
  const day = block.until ? new Date(block.until).toLocaleDateString(INTL_LOCALE[locale], { day: "numeric", month: "long" }) : "none";
  const reason = block.kind === "locked" ? (block.trial ? t("lockedTrial") : t("locked")) : t("usedUp", { date: day });
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <p className="flex min-w-0 items-start gap-2 text-sm">
        <IconLock className="mt-0.5 size-4 shrink-0 text-chip-amber-foreground" />
        <span>
          {prefix}
          {/* After « 2 CV pas encore analysés : », the reason goes on in lower case. */}
          {prefix ? reason.charAt(0).toLocaleLowerCase(locale) + reason.slice(1) : reason}
        </span>
      </p>
      <Link
        href={block.packOnSale ? PACKS_HREF : "/espace/abonnement"}
        className={
          compact
            ? "shrink-0 font-medium text-sm underline underline-offset-2 hover:text-foreground/80"
            : "inline-flex h-10 shrink-0 items-center rounded-full bg-ink px-4 font-medium text-sm text-white hover:bg-ink/90"
        }
      >
        {block.packOnSale ? t("buyPack") : t("seePlans")}
      </Link>
    </div>
  );
}

/** « Voir les formules », and the pack of CVs when one is on sale. */
function CvWayOut({ packOnSale }: Readonly<{ packOnSale: boolean }>) {
  const t = useTranslations("cv");
  return (
    <div className="mt-1 flex flex-wrap justify-center gap-2">
      {packOnSale && (
        <Link href={PACKS_HREF} className="inline-flex h-11 items-center rounded-full bg-ink px-5 font-medium text-sm text-white hover:bg-ink/90">
          {t("buyPack")}
        </Link>
      )}
      <Link
        href="/espace/abonnement"
        className={cn(
          "inline-flex h-11 items-center rounded-full px-5 font-medium text-sm",
          packOnSale ? "bg-page hover:bg-page/70" : "bg-ink text-white hover:bg-ink/90",
        )}
      >
        {t("seePlans")}
      </Link>
    </div>
  );
}

export type CvT = Translator<"cv">;

export const fileSize = (bytes: number, t: CvT, locale: Locale) =>
  bytes < 1024 * 1024
    ? t("kb", { n: Math.max(1, Math.round(bytes / 1024)) })
    : t("mb", { n: (bytes / 1024 / 1024).toLocaleString(INTL_LOCALE[locale], { minimumFractionDigits: 1, maximumFractionDigits: 1 }) });

/** `3 ans et 4 mois`, `8 mois`. */
export function duration(months: number, t: CvT): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years && rest) return t("and", { a: t("years", { n: years }), b: t("months", { n: rest }) });
  if (years) return t("years", { n: years });
  if (rest) return t("months", { n: rest });
  return t("underMonth");
}

const RELEVANCE_DOT: Record<CvExperience["relevance"], string> = {
  HIGH: "bg-whatsapp-dark",
  PARTIAL: "bg-chip-amber-foreground",
  NONE: "bg-muted-foreground/40",
};

const month = (iso: string, locale: Locale) => {
  const [y, m] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, 1)).toLocaleDateString(INTL_LOCALE[locale], { month: "short", year: "numeric", timeZone: "UTC" });
};

/**
 * The career the analysis read: each job with its period, real duration, kind
 * of contract and how close it is to the post, and what it adds up to.
 */
export function Career({
  experiences,
  totalMonths,
  relevantMonths,
}: Readonly<{ experiences: CvExperience[]; totalMonths: number | null; relevantMonths: number | null }>) {
  const t = useTranslations("cv");
  const locale = useLocale() as Locale;
  return (
    <section className="space-y-3 rounded-2xl bg-page p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-medium text-sm">{t("career")}</p>
        {totalMonths !== null && relevantMonths !== null && (
          <p className="text-muted-foreground text-xs">
            {t("total", { total: duration(totalMonths, t) })} ·{" "}
            <span className="font-medium text-foreground">{t("relevant", { relevant: duration(relevantMonths, t) })}</span>
          </p>
        )}
      </div>
      <ol className="space-y-2">
        {experiences.map((e, i) => {
          const type = e.type === "UNKNOWN" ? null : t(`type.${e.type}`);
          return (
            <li key={`${e.title}-${i}`} className="flex gap-3 rounded-xl bg-card px-3.5 py-2.5">
              <span aria-hidden className={cn("mt-1.5 size-2 shrink-0 rounded-full", RELEVANCE_DOT[e.relevance])} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">
                  {e.title}
                  {e.employer && <span className="font-normal text-muted-foreground"> · {e.employer}</span>}
                </p>
                <p className="text-muted-foreground text-xs">
                  {e.start ? `${month(e.start, locale)} – ${e.current ? t("now") : e.end ? month(e.end, locale) : "?"}` : t("noDates")}
                  {e.months !== null && ` · ${duration(e.months, t)}`}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 text-xs">
                {type && <span className="rounded-full bg-page px-2 py-0.5">{type}</span>}
                <span className="text-muted-foreground">{t(`relevance.${e.relevance}`)}</span>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="text-muted-foreground text-xs">
        {t("careerNote")}
      </p>
    </section>
  );
}

/** Strong points or points to check, as a short list. */
export function Points({ title, items, tone }: Readonly<{ title: string; items: string[]; tone: "good" | "gap" }>) {
  const t = useTranslations("cv");
  return (
    <div className="space-y-2">
      <p className="font-medium text-sm">{title}</p>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("none")}</p>
      ) : (
        <ul className="space-y-1.5 text-sm">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden className={cn("mt-2 size-1.5 shrink-0 rounded-full", tone === "good" ? "bg-whatsapp-dark" : "bg-chip-amber-foreground")} />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
