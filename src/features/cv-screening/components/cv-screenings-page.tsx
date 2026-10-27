"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { IconChevronRight, IconFileSearch, IconPlus } from "@tabler/icons-react";

import { Bone, ClaimRowsSkeleton } from "#/components/page-skeletons";
import { getMySubscription, mySubscriptionKey } from "#/lib/api/business-controller";
import { cvScreeningsKey, listCvScreenings } from "#/lib/api/cv-screening-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import type { CvScreeningSummary } from "#/lib/api/types";
import { CvAllowance, ScoreRing, VerdictChip } from "./cv-bits";

const date = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/** « Tri des CV »: what the plan covers, then the analyses, newest first. */
export function CvScreeningsPage() {
  const subscription = useQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription });
  const screenings = useQuery({ queryKey: [...cvScreeningsKey, "list"], queryFn: () => listCvScreenings(0, 50) });
  const e = subscription.data?.entitlements;
  const locked = e?.cvQuota === 0;
  const items = screenings.data?.items ?? [];

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

      {subscription.isLoading ? <Bone className="h-28 rounded-3xl" /> : e && <CvAllowance e={e} />}

      {(!locked || items.length > 0) && (
        <section className="space-y-4 rounded-3xl bg-card p-6">
          <h2 className="font-semibold">Vos analyses</h2>
          {screenings.isLoading ? (
            <ClaimRowsSkeleton />
          ) : !screenings.data ? (
            <p className="text-muted-foreground">{friendlyError(screenings.error, "Vos analyses sont indisponibles pour le moment.")}</p>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-page px-6 py-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-card">
                <IconFileSearch className="size-6 text-muted-foreground" />
              </span>
              <p className="font-medium">Aucune analyse pour le moment</p>
              <p className="max-w-sm text-muted-foreground text-sm">
                Choisissez une offre, ajoutez les CV (PDF, Word ou photo) : le classement arrive en quelques secondes par CV.
              </p>
            </div>
          ) : (
            <ul className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((s) => (
                <ScreeningCard key={s.id} s={s} />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

/** One analysis: the best score up front, what was read, when. */
function ScreeningCard({ s }: Readonly<{ s: CvScreeningSummary }>) {
  const running = s.status === "PROCESSING";
  const unread = running ? 0 : s.total - s.scored;
  return (
    <li>
      <Link
        href={`/espace/tri-cv/${s.id}`}
        className="group flex h-full flex-col gap-4 rounded-3xl bg-page p-5 transition-colors hover:bg-page/70"
      >
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

        <dl className="grid grid-cols-3 gap-2 text-center">
          <Stat label="CV" value={s.total} />
          <Stat label={s.scored > 1 ? "Classés" : "Classé"} value={running ? s.done : s.scored} />
          <Stat label={unread > 1 ? "Non lus" : "Non lu"} value={unread} />
        </dl>

        <div className="mt-auto flex items-center justify-between gap-3 text-muted-foreground text-xs">
          <span>Le {date(s.createdAt)}</span>
          <IconChevronRight className="size-4 shrink-0" />
        </div>
      </Link>
    </li>
  );
}

function Stat({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <div className="rounded-2xl bg-card px-2 py-2.5">
      <dd className="font-semibold text-lg tabular-nums leading-none">{value}</dd>
      <dt className="mt-1 text-muted-foreground text-xs">{label}</dt>
    </div>
  );
}
