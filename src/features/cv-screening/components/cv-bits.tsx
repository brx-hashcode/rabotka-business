"use client";

import Link from "next/link";
import { IconLock } from "@tabler/icons-react";

import type { CvCriterion, CvExperience } from "#/lib/api/types";
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

export function CvLocked() {
  return (
    <section className="flex flex-col items-center gap-3 rounded-3xl bg-card px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-page">
        <IconLock className="size-6 text-muted-foreground" />
      </span>
      <p className="font-medium">L&apos;analyse de CV n&apos;est pas incluse dans votre formule</p>
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

/** `3 ans et 4 mois`, `8 mois`. */
export function duration(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts = [years ? `${years} an${years > 1 ? "s" : ""}` : "", rest ? `${rest} mois` : ""].filter(Boolean);
  return parts.join(" et ") || "moins d'un mois";
}

const TYPE_LABEL: Record<CvExperience["type"], string | null> = {
  FULL_TIME: "Temps plein",
  PART_TIME: "Temps partiel",
  INTERNSHIP: "Stage",
  FREELANCE: "Indépendant",
  VOLUNTEER: "Bénévolat",
  UNKNOWN: null,
};

const RELEVANCE: Record<CvExperience["relevance"], { label: string; dot: string }> = {
  HIGH: { label: "En lien direct", dot: "bg-whatsapp-dark" },
  PARTIAL: { label: "En lien partiel", dot: "bg-chip-amber-foreground" },
  NONE: { label: "Sans lien", dot: "bg-muted-foreground/40" },
};

const month = (iso: string) => {
  const [y, m] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, 1)).toLocaleDateString("fr-FR", { month: "short", year: "numeric", timeZone: "UTC" });
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
  return (
    <section className="space-y-3 rounded-2xl bg-page p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-medium text-sm">Parcours</p>
        {totalMonths !== null && relevantMonths !== null && (
          <p className="text-muted-foreground text-xs">
            {duration(totalMonths)} au total · <span className="font-medium text-foreground">{duration(relevantMonths)} en lien avec le poste</span>
          </p>
        )}
      </div>
      <ol className="space-y-2">
        {experiences.map((e, i) => {
          const rel = RELEVANCE[e.relevance];
          const type = TYPE_LABEL[e.type];
          return (
            <li key={`${e.title}-${i}`} className="flex gap-3 rounded-xl bg-card px-3.5 py-2.5">
              <span aria-hidden className={cn("mt-1.5 size-2 shrink-0 rounded-full", rel.dot)} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">
                  {e.title}
                  {e.employer && <span className="font-normal text-muted-foreground"> · {e.employer}</span>}
                </p>
                <p className="text-muted-foreground text-xs">
                  {e.start ? `${month(e.start)} – ${e.current ? "aujourd'hui" : e.end ? month(e.end) : "?"}` : "Dates non précisées"}
                  {e.months !== null && ` · ${duration(e.months)}`}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 text-xs">
                {type && <span className="rounded-full bg-page px-2 py-0.5">{type}</span>}
                <span className="text-muted-foreground">{rel.label}</span>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="text-muted-foreground text-xs">
        Les emplois tenus en même temps ne comptent qu&apos;une fois ; un temps partiel ou un stage compte pour moitié.
      </p>
    </section>
  );
}

/** Strong points or points to check, as a short list. */
export function Points({ title, items, tone }: Readonly<{ title: string; items: string[]; tone: "good" | "gap" }>) {
  return (
    <div className="space-y-2">
      <p className="font-medium text-sm">{title}</p>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">Aucun.</p>
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
