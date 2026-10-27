"use client";

import Link from "next/link";
import { IconFileSearch, IconLock } from "@tabler/icons-react";

import type { CvCriterion, MySubscription } from "#/lib/api/types";
import { cn } from "#/lib/utils";

export const CRITERIA: { key: CvCriterion; label: string }[] = [
  { key: "skills", label: "Compétences" },
  { key: "experience", label: "Expérience" },
  { key: "training", label: "Formation" },
  { key: "location", label: "Lieu" },
  { key: "languages", label: "Langues" },
];

type Band = { label: string; chip: string; ring: string };

/** How well a score fits the job, in words: the number alone says little. */
export function band(score: number): Band {
  if (score >= 80) return { label: "Très adapté", chip: "bg-chip-green text-chip-green-foreground", ring: "text-whatsapp-dark" };
  if (score >= 60) return { label: "Adapté", chip: "bg-brand-lime text-[#0f2414]", ring: "text-whatsapp-dark" };
  if (score >= 40) return { label: "Partiel", chip: "bg-chip-amber text-chip-amber-foreground", ring: "text-chip-amber-foreground" };
  return { label: "Peu adapté", chip: "bg-foreground/[0.07] text-muted-foreground", ring: "text-muted-foreground" };
}

export function VerdictChip({ score }: Readonly<{ score: number }>) {
  const b = band(score);
  return <span className={cn("rounded-full px-2.5 py-1 font-medium text-xs", b.chip)}>{b.label}</span>;
}

/** The score out of 100 as a ring, the number in the middle. */
export function ScoreRing({ score, size = 56 }: Readonly<{ score: number; size?: number }>) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-page" />
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
      <span className="absolute font-semibold text-sm tabular-nums" aria-label={`${score} sur 100`}>
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

const longDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/** What the plan still covers, or why the page is closed. */
export function CvAllowance({ e }: Readonly<{ e: MySubscription["entitlements"] }>) {
  if (e.cvQuota === 0) return <CvLocked />;
  const pct = e.cvQuota === null ? 0 : Math.min(100, Math.round((e.cvUsed / e.cvQuota) * 100));
  return (
    <section className="space-y-3 rounded-3xl bg-card p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="flex items-center gap-2 font-medium">
          <IconFileSearch className="size-5" />
          CV inclus
        </p>
        <p className="text-sm tabular-nums">
          {e.cvQuota === null ? `${e.cvUsed} analysés · illimité` : `${e.cvUsed} / ${e.cvQuota}`}
          {e.endsAt && <span className="text-muted-foreground"> · jusqu&apos;au {longDate(e.endsAt)}</span>}
        </p>
      </div>
      {e.cvQuota !== null && (
        <div className="h-2 overflow-hidden rounded-full bg-page">
          <div className={cn("h-full rounded-full", pct >= 100 ? "bg-destructive" : "bg-ink")} style={{ width: `${pct}%` }} />
        </div>
      )}
      <p className="text-muted-foreground text-xs">
        Jusqu&apos;à {e.cvBatchMax} CV par analyse, {e.cvFileMaxMb} Mo chacun. Un CV illisible n&apos;est pas décompté.
        {e.cvRemaining === 0 && " Tous vos CV inclus sont utilisés : changez de formule pour en analyser davantage."}
      </p>
    </section>
  );
}

export function CvLocked() {
  return (
    <section className="flex flex-col items-center gap-3 rounded-3xl bg-card px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-page">
        <IconLock className="size-6 text-muted-foreground" />
      </span>
      <p className="font-medium">Le tri des CV n&apos;est pas inclus dans votre formule</p>
      <p className="max-w-md text-muted-foreground text-sm">
        Envoyez les CV reçus pour un poste : Rabotka les lit, même scannés ou pris en photo, et les classe du plus adapté au moins adapté.
      </p>
      <Link href="/espace/abonnement" className="mt-1 inline-flex h-11 items-center rounded-full bg-ink px-5 font-medium text-sm text-white hover:bg-ink/90">
        Voir les formules
      </Link>
    </section>
  );
}

export const fileSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} Ko` : `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`;
