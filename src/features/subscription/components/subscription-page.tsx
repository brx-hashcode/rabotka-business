"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { IconCheck, IconClock, IconFileSearch, IconFileText, IconLockOpen, IconWand } from "@tabler/icons-react";
import { Loader } from "lucide-react";
import { toast } from "sonner";

import { Bone } from "#/components/page-skeletons";
import { getMySubscription, mySubscriptionKey, subscribeToPlan } from "#/lib/api/business-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import type { BusinessPlan, MySubscription, SubscriptionStatus } from "#/lib/api/types";
import { cn } from "#/lib/utils";

type Period = "MONTHLY" | "ANNUAL";

const STATUS: Record<SubscriptionStatus, { label: string; className: string }> = {
  TRIAL: { label: "Essai gratuit", className: "bg-chip-violet text-chip-violet-foreground" },
  ACTIVE: { label: "Actif", className: "bg-chip-green text-chip-green-foreground" },
  EXPIRED: { label: "Terminé", className: "bg-page text-muted-foreground" },
  CANCELLED: { label: "Annulé", className: "bg-page text-muted-foreground" },
};

const fcfa = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;
const date = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/**
 * « Abonnement »: the plan the organisation has now, what it used, and the
 * plans it can choose (monthly or yearly). Choosing one opens the dashboard's
 * pay page; the period starts when the payment succeeds — after the running
 * one when renewing early, so no day is lost.
 */
export function SubscriptionPage() {
  const { data, isLoading, error } = useQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription });

  return (
    <div className="w-full space-y-8 pt-2">
      <div className="space-y-1.5">
        <h1 className="font-semibold text-3xl tracking-tight">Abonnement</h1>
        <p className="text-muted-foreground">Votre formule Rabotka Business, son utilisation et son renouvellement.</p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="space-y-5 rounded-3xl bg-card p-6 sm:p-8">
            <Bone className="h-7 w-40" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Bone className="h-20 rounded-2xl" />
              <Bone className="h-20 rounded-2xl" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-4 rounded-3xl bg-card p-6">
                <Bone className="h-6 w-28" />
                <Bone className="h-10 w-40" />
                <Bone className="h-4 w-3/4" />
                <Bone className="h-4 w-2/3" />
                <Bone className="h-12 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ) : !data ? (
        <p className="rounded-3xl bg-card p-6 text-muted-foreground">
          {friendlyError(error, "Votre abonnement n'a pas pu être chargé.")}
        </p>
      ) : (
        <>
          <CurrentPlan data={data} />
          <PlanChooser data={data} />
        </>
      )}
    </div>
  );
}

function CurrentPlan({ data }: Readonly<{ data: MySubscription }>) {
  const e = data.entitlements;
  if (!e.plan || !e.status) {
    return (
      <section className="space-y-2 rounded-3xl bg-card p-6">
        <h2 className="font-semibold text-lg">Aucune formule en cours</h2>
        <p className="text-muted-foreground text-sm">
          Choisissez une formule pour publier vos offres. Sans formule, chaque contact est payant.
        </p>
      </section>
    );
  }
  const status = STATUS[e.status];
  // Contacts, CVs and AI drafts count per period; online offers do not.
  const renews = e.endsAt ? `Pour la période, jusqu'au ${date(e.endsAt)}.` : undefined;
  return (
    <section className="space-y-6 rounded-3xl bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-2xl tracking-tight">{e.plan.name}</h2>
            <span className={cn("rounded-full px-2.5 py-1 font-medium text-xs", status.className)}>{status.label}</span>
          </div>
          {e.endsAt && (
            <p className="flex items-center gap-1.5 text-muted-foreground text-sm">
              <IconClock className="size-4" />
              {e.status === "TRIAL" ? "Essai jusqu'au" : "Jusqu'au"} {date(e.endsAt)}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Meter
          icon={IconLockOpen}
          label="Contacts inclus"
          used={e.unlocksUsed}
          limit={e.unlocksQuota}
          hint={
            e.unlocksRemaining === 0
              ? "Tous vos contacts inclus sont utilisés : les suivants sont payants."
              : renews
          }
        />
        <Meter
          icon={IconFileText}
          label="Offres en ligne"
          used={e.activeOffers}
          limit={e.activeOffersLimit}
          hint={
            e.activeOffersLimit !== null && e.activeOffers > e.activeOffersLimit
              ? "En même temps. Les offres déjà en ligne le restent : terminez-en pour en publier."
              : "En même temps : ce nombre ne repart pas à zéro à chaque période."
          }
        />
        {e.cvQuota !== 0 && (
          <Meter icon={IconFileSearch} label="CV inclus" used={e.cvUsed} limit={e.cvQuota} hint={renews} />
        )}
        {/* Absent from a backend older than AI writing. */}
        {e.offerDraftsQuota !== undefined && e.offerDraftsQuota !== 0 && (
          <Meter
            icon={IconWand}
            label="Rédactions IA"
            used={e.offerDraftsQuota === null ? 0 : e.offerDraftsQuota - (e.offerDraftsRemaining ?? 0)}
            limit={e.offerDraftsQuota}
            hint={renews}
          />
        )}
      </div>

      {(e.includesPreselection || e.includesFieldAgents || e.priorityVisibility) && (
        <ul className="flex flex-wrap gap-2">
          {e.includesPreselection && <Feature>Recherche de profils</Feature>}
          {e.includesFieldAgents && <Feature>Aide d&apos;un agent sur le terrain</Feature>}
          {e.priorityVisibility && <Feature>Offres affichées en premier</Feature>}
        </ul>
      )}

      {data.upcoming.length > 0 && (
        <p className="rounded-2xl bg-page px-4 py-3 text-sm">
          À suivre : {data.upcoming.map((p) => `${p.planName} du ${date(p.startsAt)} au ${date(p.endsAt)}`).join(" ; ")}, déjà payé.
        </p>
      )}
    </section>
  );
}

/** « Analyse de CV » as a plan line; nothing when the plan leaves it out. */
export function cvLine(plan: BusinessPlan): string | null {
  if (plan.cvScreeningsPerPeriod === 0) return null;
  return plan.cvScreeningsPerPeriod === null ? "Analyse de CV illimitée" : `Analyse de CV : ${plan.cvScreeningsPerPeriod} CV inclus`;
}

function Meter({
  icon: Icon,
  label,
  used,
  limit,
  hint,
}: Readonly<{ icon: typeof IconLockOpen; label: string; used: number; limit: number | null; hint?: string }>) {
  const pct = limit === null || limit === 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));
  return (
    <div className="space-y-3 rounded-2xl bg-page p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-medium text-sm">
          <Icon className="size-4" />
          {label}
        </span>
        <span className="shrink-0 whitespace-nowrap text-sm tabular-nums">{limit === null ? `${used} · illimité` : `${used} / ${limit}`}</span>
      </div>
      {limit !== null && (
        <div className="h-2 overflow-hidden rounded-full bg-card">
          <div className={cn("h-full rounded-full", pct >= 100 ? "bg-destructive" : "bg-ink")} style={{ width: `${pct}%` }} />
        </div>
      )}
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}

function Feature({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <li className="inline-flex items-center gap-1.5 rounded-full bg-page px-3 py-1.5 text-sm">
      <IconCheck className="size-4 text-whatsapp-dark" />
      {children}
    </li>
  );
}

function PlanChooser({ data }: Readonly<{ data: MySubscription }>) {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("MONTHLY");
  const current = data.entitlements.status === "ACTIVE" ? data.entitlements.plan?.id : null;
  const currentPlan = data.plans.find((p) => p.id === current) ?? null;
  // Where a queued period would start: after the running one and anything already paid.
  const lastEnd = [data.entitlements.endsAt, ...data.upcoming.map((p) => p.endsAt)]
    .filter((d): d is string => !!d)
    .sort()
    .at(-1);
  const scheduled = new Set(data.upcoming.map((p) => p.planName));

  const buy = useMutation({
    mutationFn: (plan: BusinessPlan) => subscribeToPlan(plan.id, period),
    onSuccess: ({ token }) => router.push(`/espace/payer/${token}`),
    onError: (err) => toast.error(friendlyError(err, "Le paiement n'a pas pu être préparé. Réessayez.")),
  });

  if (data.plans.length === 0) return null;
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-semibold text-xl">{current ? "Renouveler ou changer de formule" : "Choisir une formule"}</h2>
          <p className="text-muted-foreground text-sm">
            {current
              ? "Payée par mobile money. Une formule supérieure démarre tout de suite ; un renouvellement ou une formule inférieure prend la suite de la formule en cours."
              : "Payée par mobile money, active dès le paiement."}
          </p>
        </div>
        <div role="radiogroup" aria-label="Période" className="inline-flex rounded-full bg-card p-1">
          {(
            [
              ["MONTHLY", "Mensuel"],
              ["ANNUAL", "Annuel"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={period === value}
              onClick={() => setPeriod(value)}
              className={cn(
                "h-10 rounded-full px-5 font-medium text-sm transition-colors",
                period === value ? "bg-ink text-white" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.plans.map((plan) => {
          const price = period === "ANNUAL" ? plan.annualPriceFcfa : plan.monthlyPriceFcfa;
          const isCurrent = plan.id === current;
          const change = !currentPlan || isCurrent ? null : plan.monthlyPriceFcfa > currentPlan.monthlyPriceFcfa ? "up" : "down";
          const when = isCurrent
            ? lastEnd && `S'ajoute à la suite, à partir du ${date(lastEnd)}.`
            : change === "up"
              ? `Démarre aujourd'hui. Les jours restants de ${currentPlan?.name} sont convertis en jours de ${plan.name}.`
              : change === "down"
                ? lastEnd &&
                  `Démarre le ${date(lastEnd)}, ${data.upcoming.length > 0 ? "après les périodes déjà payées" : "à la fin de votre formule actuelle"}.`
                : null;
          const pending = buy.isPending && buy.variables?.id === plan.id;
          return (
            <article key={plan.id} className={cn("flex flex-col gap-5 rounded-3xl bg-card p-6", isCurrent && "ring-2 ring-ink")}>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  {isCurrent ? (
                    <span className="rounded-full bg-chip-green px-2.5 py-1 font-medium text-chip-green-foreground text-xs">
                      Votre formule
                    </span>
                  ) : (
                    scheduled.has(plan.name) && (
                      <span className="rounded-full bg-page px-2.5 py-1 font-medium text-muted-foreground text-xs">Programmée</span>
                    )
                  )}
                </div>
                {plan.description && <p className="text-muted-foreground text-sm">{plan.description}</p>}
              </div>
              <p className="flex items-end gap-1.5">
                <span className="font-semibold text-3xl tracking-tight">{fcfa(price)}</span>
                <span className="mb-1 text-muted-foreground text-sm">/ {period === "ANNUAL" ? "an" : "mois"}</span>
              </p>
              <ul className="flex-1 space-y-2.5 text-sm">
                <PlanLine>
                  {plan.unlocksPerPeriod === null
                    ? "Contacts illimités"
                    : `${plan.unlocksPerPeriod} contact${plan.unlocksPerPeriod > 1 ? "s" : ""} inclus`}
                </PlanLine>
                <PlanLine>
                  {plan.activeOffersLimit === null ? "Offres en ligne illimitées" : `${plan.activeOffersLimit} offre${plan.activeOffersLimit > 1 ? "s" : ""} en ligne`}
                </PlanLine>
                {cvLine(plan) && <PlanLine>{cvLine(plan)}</PlanLine>}
                {plan.includesPreselection && <PlanLine>Recherche de profils</PlanLine>}
                {plan.includesFieldAgents && <PlanLine>Aide d&apos;un agent sur le terrain</PlanLine>}
                {plan.priorityVisibility && <PlanLine>Offres affichées en premier</PlanLine>}
              </ul>
              {when && <p className="text-muted-foreground text-xs">{when}</p>}
              <button
                type="button"
                onClick={() => buy.mutate(plan)}
                disabled={buy.isPending || price <= 0}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-6 font-medium text-[15px] text-white transition-colors hover:bg-ink/90 disabled:opacity-60"
              >
                {pending ? <Loader className="size-5 animate-spin text-white" /> : isCurrent ? "Renouveler" : change === "up" ? `Passer à ${plan.name}` : change === "down" ? "Programmer" : "Choisir"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function PlanLine({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <li className="flex items-start gap-2">
      <IconCheck className="mt-0.5 size-4 shrink-0 text-whatsapp-dark" />
      <span>{children}</span>
    </li>
  );
}
