"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { IconChevronRight, IconFileSearch, IconPlus } from "@tabler/icons-react";

import { Bone, ClaimRowsSkeleton } from "#/components/page-skeletons";
import { getMySubscription, mySubscriptionKey } from "#/lib/api/business-controller";
import { cvScreeningsKey, listCvScreenings } from "#/lib/api/cv-screening-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import type { CvScreeningSummary } from "#/lib/api/types";
import { CvAllowance, VerdictChip } from "./cv-bits";

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
            <ul className="space-y-2">
              {items.map((s) => (
                <ScreeningRow key={s.id} s={s} />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function ScreeningRow({ s }: Readonly<{ s: CvScreeningSummary }>) {
  const running = s.status === "PROCESSING";
  return (
    <li>
      <Link href={`/espace/tri-cv/${s.id}`} className="flex items-center gap-4 rounded-2xl bg-page p-4 transition-colors hover:bg-page/70">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium">{s.jobTitle}</p>
            {running ? (
              <span className="rounded-full bg-chip-amber px-2.5 py-1 font-medium text-chip-amber-foreground text-xs">
                En cours · {s.done}/{s.total}
              </span>
            ) : (
              s.bestScore !== null && <VerdictChip score={s.bestScore} />
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            {s.total} CV
            {!running && s.bestScore !== null && ` · meilleur score ${s.bestScore}/100`}
            {!running && s.scored < s.total && ` · ${s.total - s.scored} non lu${s.total - s.scored > 1 ? "s" : ""}`}
          </p>
          <p className="text-muted-foreground text-xs">Le {date(s.createdAt)}</p>
        </div>
        <IconChevronRight className="size-5 shrink-0 text-muted-foreground" />
      </Link>
    </li>
  );
}
