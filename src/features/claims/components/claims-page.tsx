"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { IconChevronRight, IconMessageReport, IconPhoto, IconPlus } from "@tabler/icons-react";

import { Skeleton } from "#/components/ui/skeleton";
import { friendlyError } from "#/lib/api/friendly-error";
import { claimsKey, listClaims, type ClaimStatus } from "#/lib/api/claim-controller";
import { cn } from "#/lib/utils";
import { isClosed, StatusPill } from "./claim-bits";

const date = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/** The account's claims to the Rabotka team — the client app's endpoints — open ones first. */
export function ClaimsPage() {
  const claims = useQuery({ queryKey: claimsKey, queryFn: () => listClaims(1, 100) });
  const [tab, setTab] = useState<"open" | "closed">("open");
  const all = claims.data?.data ?? [];
  const open = all.filter((c) => !isClosed(c.status as ClaimStatus));
  const closed = all.filter((c) => isClosed(c.status as ClaimStatus));
  const shown = tab === "open" ? open : closed;

  return (
    <div className="w-full space-y-6 pt-2">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="font-semibold text-3xl tracking-tight">Réclamations</h1>
          <p className="text-muted-foreground">Un souci avec un candidat, un paiement, une facture ? L&apos;équipe Rabotka vous répond ici.</p>
        </div>
        <Link
          href="/espace/reclamations/nouvelle"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-5 font-medium text-white hover:bg-ink/90"
        >
          <IconPlus className="size-4" />
          Nouvelle réclamation
        </Link>
      </div>

      <section className="space-y-4 rounded-3xl bg-card p-6">
        <div role="tablist" className="inline-flex rounded-full bg-page p-1">
          {(
            [
              ["open", "En cours", open.length],
              ["closed", "Clôturées", closed.length],
            ] as const
          ).map(([key, label, n]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-medium text-sm",
                tab === key ? "bg-brand-lime text-[#0f2414]" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
              <span className="tabular-nums opacity-70">{n}</span>
            </button>
          ))}
        </div>

        {claims.isLoading ? (
          <Skeleton className="h-48 rounded-2xl" />
        ) : !claims.data ? (
          <p className="text-muted-foreground">{friendlyError(claims.error, "Vos réclamations sont indisponibles pour le moment.")}</p>
        ) : shown.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-page px-6 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-card">
              <IconMessageReport className="size-6 text-muted-foreground" />
            </span>
            <p className="font-medium">{tab === "open" ? "Aucune réclamation en cours" : "Aucune réclamation clôturée"}</p>
            {tab === "open" && (
              <p className="max-w-sm text-muted-foreground text-sm">Décrivez votre souci, joignez des photos si besoin : l&apos;équipe vous répond ici.</p>
            )}
          </div>
        ) : (
          <ul className="space-y-2">
            {shown.map((c) => (
              <li key={c.id}>
                <Link href={`/espace/reclamations/${c.id}`} className="flex items-center gap-4 rounded-2xl bg-page p-4 transition-colors hover:bg-page/70">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{c.title}</p>
                      <StatusPill status={c.status as ClaimStatus} />
                    </div>
                    <p className="line-clamp-1 text-muted-foreground text-sm">{c.description}</p>
                    <p className="flex items-center gap-3 text-muted-foreground text-xs">
                      <span>Envoyée le {date(c.createdAt)}</span>
                      {c.attachmentUrls.length > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <IconPhoto className="size-3.5" />
                          {c.attachmentUrls.length}
                        </span>
                      )}
                    </p>
                  </div>
                  <IconChevronRight className="size-5 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
