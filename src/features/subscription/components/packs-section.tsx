"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { IconFileSearch, IconFileText, IconLockOpen, IconMinus, IconPlus, IconWand } from "@tabler/icons-react";
import { Loader } from "lucide-react";
import { toast } from "sonner";

import { buyPack } from "#/lib/api/business-controller";
import { INTL_LOCALE, type Locale } from "#/i18n/config";
import { useFriendlyError } from "#/lib/api/use-friendly-error";
import { useWhyNot } from "#/lib/use-why-not";
import type { MySubscription, PackKind } from "#/lib/api/types";
import { PACK_KINDS, packUnits } from "../packs";
import { usePacks } from "../use-packs";
import { Bone } from "#/components/page-skeletons";
import { useDisplayCurrency } from "#/features/money/use-display-currency";

const ICON: Record<PackKind, typeof IconFileSearch> = {
  CV: IconFileSearch,
  OFFER: IconFileText,
  CONTACT: IconLockOpen,
  OFFER_DRAFT: IconWand,
};

const MAX_COUNT = 10;

const date = (iso: string, locale: Locale) => new Date(iso).toLocaleDateString(INTL_LOCALE[locale], { day: "numeric", month: "long", year: "numeric" });

/**
 * The « Packs » tab: more CVs, offers, contacts or AI-written offers on top
 * of the plan, without changing it. Kept 12 months, used once the plan's own
 * are, paid on the dashboard's pay page. Shown with a plan running (the packs
 * only add to one), and only what is on sale.
 */
export function PacksSection({ data }: Readonly<{ data: MySubscription }>) {
  const t = useTranslations("subscription");
  const locale = useLocale();
  const { data: packs } = usePacks();
  const onSale = PACK_KINDS.flatMap((kind) => packs?.onSale.find((p) => p.kind === kind) ?? []);
  const bought = packs?.credits ?? [];
  if (!data.entitlements.plan || (onSale.length === 0 && bought.length === 0)) return null;

  return (
    <section className="space-y-5">
      {onSale.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {onSale.map((p) => (
            <PackCard key={p.kind} kind={p.kind} quantity={p.quantity} priceFcfa={p.priceFcfa} />
          ))}
        </div>
      )}

      {bought.length > 0 && (
        <div className="space-y-2 rounded-3xl bg-card p-6">
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">{t("packs.yours")}</p>
          <ul className="divide-y divide-foreground/5">
            {bought.map((c) => {
              const Icon = ICON[c.kind];
              return (
                <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-page">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-sm">{packUnits(c.kind, c.left, t)}</span>
                    <span className="block text-muted-foreground text-xs">
                      {t("packs.validity", {
                        partial: c.left < c.quantity ? "yes" : "no",
                        quantity: c.quantity,
                        date: date(c.expiresAt, locale),
                      })}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

function PackCard({ kind, quantity, priceFcfa }: Readonly<{ kind: PackKind; quantity: number; priceFcfa: number }>) {
  // In the organisation's country's currency; the total converted as a
  // whole, as checkout charges it, not unit by unit.
  const t = useTranslations("subscription");
  const whyNot = useWhyNot();
  const friendlyError = useFriendlyError();
  const { price, ready } = useDisplayCurrency();
  const router = useRouter();
  const [count, setCount] = useState(1);
  const Icon = ICON[kind];
  const buy = useMutation({
    mutationFn: () => buyPack(kind, count),
    onSuccess: ({ token }) => router.push(`/espace/payer/${token}`),
    onError: (err) => toast.error(friendlyError(err, t("page.payFailed"))),
  });

  return (
    <article className="flex flex-col gap-5 rounded-3xl bg-card p-6">
      <div className="space-y-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-lime text-[#0f2414]">
          <Icon className="size-5" />
        </span>
        <div className="space-y-0.5">
          <h3 className="font-semibold text-lg">{t(`packs.title.${kind}`)}</h3>
          <p className="text-muted-foreground text-sm">{packUnits(kind, quantity, t)}</p>
        </div>
      </div>
      <div className="flex items-end gap-1.5">
        {ready ? <span className="font-semibold text-2xl tracking-tight">{price(priceFcfa)}</span> : <Bone className="h-7 w-24" />}
        <span className="mb-0.5 text-muted-foreground text-sm">{t("packs.perPack")}</span>
      </div>
      <div className="mt-auto space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-page p-1.5">
          <button
            type="button"
            aria-label={t("packs.less")}
            disabled={count <= 1 || buy.isPending}
            title={whyNot([buy.isPending, "wait"], [count <= 1, "min"])}
            onClick={() => setCount((n) => Math.max(1, n - 1))}
            className="flex size-9 items-center justify-center rounded-xl bg-card hover:bg-card/70 disabled:opacity-40"
          >
            <IconMinus className="size-4" />
          </button>
          {/* What the packs add up to, inside the stepper: always there, so the card keeps its height. */}
          <span className="flex min-w-0 flex-col items-center text-center tabular-nums leading-tight">
            <span className="text-sm">
              {t.rich("packs.count", { count, b: (chunks) => <span className="font-semibold">{chunks}</span> })}
            </span>
            <span className="truncate text-muted-foreground text-xs">{packUnits(kind, quantity * count, t)}</span>
          </span>
          <button
            type="button"
            aria-label={t("packs.more")}
            disabled={count >= MAX_COUNT || buy.isPending}
            title={whyNot([buy.isPending, "wait"], [count >= MAX_COUNT, "max"])}
            onClick={() => setCount((n) => Math.min(MAX_COUNT, n + 1))}
            className="flex size-9 items-center justify-center rounded-xl bg-card hover:bg-card/70 disabled:opacity-40"
          >
            <IconPlus className="size-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => buy.mutate()}
          disabled={buy.isPending}
          title={whyNot([buy.isPending, "wait"])}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink px-6 font-medium text-[15px] text-white transition-colors hover:bg-ink/90 disabled:opacity-60"
        >
          {buy.isPending ? <Loader className="size-5 animate-spin text-white" /> : ready ? t("packs.buyFor", { price: price(priceFcfa * count) }) : t("packs.buy")}
        </button>
      </div>
    </article>
  );
}
