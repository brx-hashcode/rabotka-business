"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { IconArrowRight, IconSparkles } from "@tabler/icons-react";

import { getMySubscription, mySubscriptionKey } from "#/lib/api/business-controller";
import { cn } from "#/lib/utils";

const SOON_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * On the home page: what to do about the plan, only when something is to do —
 * no plan, a trial running, or a period ending within a week.
 */
export function SubscriptionBanner({ className }: Readonly<{ className?: string }>) {
  const { data } = useQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription });
  // Read once per mount: the banner need not tick.
  const [now] = useState(() => Date.now());
  if (!data) return null;
  const e = data.entitlements;
  const ends = e.endsAt ? new Date(e.endsAt) : null;
  const queued = data.upcoming.length > 0;
  const day = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

  let text: string | null = null;
  if (!e.plan) text = "Choisissez une formule pour publier vos offres et débloquer vos contacts inclus.";
  else if (e.status === "TRIAL" && ends) text = `Votre essai gratuit de la formule ${e.plan.name} se termine le ${day(ends)}.`;
  else if (ends && !queued && ends.getTime() - now < SOON_MS)
    text = `Votre abonnement ${e.plan.name} se termine le ${day(ends)}. Renouvelez-le pour garder vos avantages.`;
  if (!text) return null;

  return (
    <Link
      href="/espace/abonnement"
      className={cn(
        "flex items-center gap-4 rounded-3xl bg-chip-violet p-5 text-chip-violet-foreground transition-opacity hover:opacity-90",
        className,
      )}
    >
      <IconSparkles className="size-6 shrink-0" />
      <p className="flex-1 font-medium text-sm">{text}</p>
      <IconArrowRight className="size-5 shrink-0" />
    </Link>
  );
}
