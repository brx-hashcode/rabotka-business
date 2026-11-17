"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { IconArrowRight } from "@tabler/icons-react";

import { getMySubscription, mySubscriptionKey } from "#/lib/api/business-controller";
import { INTL_LOCALE } from "#/i18n/config";
import { cn } from "#/lib/utils";

const SOON_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * On the home page: what to do about the plan, only when something is to do —
 * no plan, a trial running, or a period ending within a week.
 */
export function SubscriptionBanner({ className }: Readonly<{ className?: string }>) {
  const t = useTranslations("subscription.banner");
  const locale = useLocale();
  const { data } = useQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription });
  // Read once per mount: the banner need not tick.
  const [now] = useState(() => Date.now());
  if (!data) return null;
  const e = data.entitlements;
  const ends = e.endsAt ? new Date(e.endsAt) : null;
  const queued = data.upcoming.length > 0;
  const day = (d: Date) => d.toLocaleDateString(INTL_LOCALE[locale], { day: "numeric", month: "long" });

  let text: string | null = null;
  if (!e.plan) text = t("noPlan");
  else if (e.status === "TRIAL" && ends) text = t("trial", { plan: e.plan.name, date: day(ends) });
  else if (ends && !queued && ends.getTime() - now < SOON_MS)
    text = t("ending", { plan: e.plan.name, date: day(ends) });
  if (!text) return null;

  return (
    <Link
      href="/espace/abonnement"
      className={cn(
        "flex items-center gap-4 rounded-3xl bg-chip-violet p-5 text-chip-violet-foreground transition-opacity hover:opacity-90",
        className,
      )}
    >
      <p className="flex-1 font-medium text-sm">{text}</p>
      <IconArrowRight className="size-5 shrink-0" />
    </Link>
  );
}
