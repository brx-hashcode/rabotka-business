"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { IconFileSearch, IconFileText, IconLockOpen, IconMinus, IconPlus, IconWand } from "@tabler/icons-react";
import { Loader } from "lucide-react";
import { toast } from "sonner";

import { buyPack } from "#/lib/api/business-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import type { MySubscription, PackKind } from "#/lib/api/types";
import { PACK_KINDS, PACK_TITLE, packUnits } from "../packs";
import { usePacks } from "../use-packs";

const ICON: Record<PackKind, typeof IconFileSearch> = {
  CV: IconFileSearch,
  OFFER: IconFileText,
  CONTACT: IconLockOpen,
  OFFER_DRAFT: IconWand,
};

const MAX_COUNT = 10;

const fcfa = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;
const date = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/**
 * « Packs »: more CVs, offers, contacts or AI-written offers on top of the
 * plan, without changing it. Kept 12 months, used once the plan's own are,
 * paid on the dashboard's pay page. Shown with a plan running (the packs
 * only add to one), and only what is on sale.
 */
export function PacksSection({ data }: Readonly<{ data: MySubscription }>) {
  const { data: packs } = usePacks();
  const onSale = PACK_KINDS.flatMap((kind) => packs?.onSale.find((p) => p.kind === kind) ?? []);
  const bought = packs?.credits ?? [];
  if (!data.entitlements.plan || (onSale.length === 0 && bought.length === 0)) return null;

  return (
    <section id="packs" className="scroll-mt-24 space-y-5">
      <div className="space-y-1">
        <h2 className="font-semibold text-xl">Packs</h2>
        <p className="text-muted-foreground text-sm">
          Besoin de plus cette période ? Ajoutez-en à votre formule sans en changer. Valables 12 mois, ils servent une fois ceux de
          votre formule utilisés.
        </p>
      </div>

      {onSale.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {onSale.map((p) => (
            <PackCard key={p.kind} kind={p.kind} quantity={p.quantity} priceFcfa={p.priceFcfa} />
          ))}
        </div>
      )}

      {bought.length > 0 && (
        <div className="space-y-2 rounded-3xl bg-card p-6">
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Vos packs</p>
          <ul className="divide-y divide-foreground/5">
            {bought.map((c) => {
              const Icon = ICON[c.kind];
              return (
                <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-page">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-sm">{packUnits(c.kind, c.left)}</span>
                    <span className="block text-muted-foreground text-xs">
                      {c.left < c.quantity ? `Sur ${c.quantity} · ` : ""}jusqu&apos;au {date(c.expiresAt)}
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
  const router = useRouter();
  const [count, setCount] = useState(1);
  const Icon = ICON[kind];
  const buy = useMutation({
    mutationFn: () => buyPack(kind, count),
    onSuccess: ({ token }) => router.push(`/espace/payer/${token}`),
    onError: (err) => toast.error(friendlyError(err, "Le paiement n'a pas pu être préparé. Réessayez.")),
  });

  return (
    <article className="flex flex-col gap-5 rounded-3xl bg-card p-6">
      <div className="space-y-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-lime text-[#0f2414]">
          <Icon className="size-5" />
        </span>
        <div className="space-y-0.5">
          <h3 className="font-semibold text-lg">{PACK_TITLE[kind]}</h3>
          <p className="text-muted-foreground text-sm">{packUnits(kind, quantity)}</p>
        </div>
      </div>
      <p className="flex items-end gap-1.5">
        <span className="font-semibold text-2xl tracking-tight">{fcfa(priceFcfa)}</span>
        <span className="mb-0.5 text-muted-foreground text-sm">/ pack</span>
      </p>
      <div className="mt-auto space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-page p-1.5">
          <button
            type="button"
            aria-label="Un pack de moins"
            disabled={count <= 1 || buy.isPending}
            onClick={() => setCount((n) => Math.max(1, n - 1))}
            className="flex size-9 items-center justify-center rounded-xl bg-card hover:bg-card/70 disabled:opacity-40"
          >
            <IconMinus className="size-4" />
          </button>
          <span className="text-center text-sm tabular-nums">
            <span className="font-semibold">{count}</span> pack{count > 1 ? "s" : ""}
          </span>
          <button
            type="button"
            aria-label="Un pack de plus"
            disabled={count >= MAX_COUNT || buy.isPending}
            onClick={() => setCount((n) => Math.min(MAX_COUNT, n + 1))}
            className="flex size-9 items-center justify-center rounded-xl bg-card hover:bg-card/70 disabled:opacity-40"
          >
            <IconPlus className="size-4" />
          </button>
        </div>
        {count > 1 && <p className="text-center text-muted-foreground text-xs">{packUnits(kind, quantity * count)}</p>}
        <button
          type="button"
          onClick={() => buy.mutate()}
          disabled={buy.isPending}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink px-6 font-medium text-[15px] text-white transition-colors hover:bg-ink/90 disabled:opacity-60"
        >
          {buy.isPending ? <Loader className="size-5 animate-spin text-white" /> : `Acheter · ${fcfa(priceFcfa * count)}`}
        </button>
      </div>
    </article>
  );
}
