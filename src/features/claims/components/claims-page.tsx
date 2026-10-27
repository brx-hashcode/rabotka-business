"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { IconArrowUpRight, IconHelp, IconMessageReport, IconPhoto, IconPlus } from "@tabler/icons-react";

import { Bone } from "#/components/page-skeletons";
import { friendlyError } from "#/lib/api/friendly-error";
import { claimsKey, listClaims, type Claim, type ClaimStatus } from "#/lib/api/claim-controller";
import { cn } from "#/lib/utils";
import { isClosed, splitTitle, StatusPill } from "./claim-bits";

const date = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/** « il y a 3 jours », for the last change on a request. */
function ago(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 60) return minutes <= 1 ? "à l'instant" : `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return days === 1 ? "hier" : `il y a ${days} jours`;
  return `le ${date(iso)}`;
}

/** The account's claims to the Rabotka team — the client app's endpoints — as cards, open ones first. */
export function ClaimsPage() {
  const claims = useQuery({ queryKey: claimsKey, queryFn: () => listClaims(1, 100) });
  const [tab, setTab] = useState<"open" | "closed">("open");
  const all = claims.data?.data ?? [];
  const open = all.filter((c) => !isClosed(c.status as ClaimStatus));
  const closed = all.filter((c) => isClosed(c.status as ClaimStatus));
  const shown = tab === "open" ? open : closed;
  const waiting = open.filter((c) => c.status === "CREATED").length;

  return (
    <div className="w-full space-y-6 pt-2">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="font-semibold text-3xl tracking-tight">Aide</h1>
          <p className="text-muted-foreground">Un souci avec un candidat, un paiement, une facture ? L&apos;équipe Rabotka vous répond ici.</p>
        </div>
        <Link
          href="/espace/reclamations/nouvelle"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-5 font-medium text-white hover:bg-ink/90"
        >
          <IconPlus className="size-4" />
          Nouvelle demande
        </Link>
      </div>

      {claims.data && all.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Stat value={open.length} label="En cours" />
          <Stat value={waiting} label="En attente de l'équipe" />
          <Stat value={closed.length} label="Terminées" />
        </div>
      )}

      <div role="tablist" className="inline-flex rounded-full bg-card p-1">
        {(
          [
            ["open", "En cours", open.length],
            ["closed", "Terminées", closed.length],
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
              tab === key ? "bg-selected text-selected-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
            <span className="tabular-nums opacity-70">{n}</span>
          </button>
        ))}
      </div>

      {claims.isLoading ? (
        <CardsSkeleton />
      ) : !claims.data ? (
        <p className="rounded-3xl bg-card p-6 text-muted-foreground">{friendlyError(claims.error, "Vos demandes sont indisponibles pour le moment.")}</p>
      ) : shown.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-card px-6 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-page">
            <IconMessageReport className="size-6 text-muted-foreground" />
          </span>
          <p className="font-medium">{tab === "open" ? "Aucune demande en cours" : "Aucune demande terminée"}</p>
          {tab === "open" && (
            <p className="max-w-sm text-muted-foreground text-sm">Décrivez votre souci, joignez des photos si besoin : l&apos;équipe vous répond ici.</p>
          )}
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((c) => (
            <li key={c.id}>
              <ClaimCard claim={c} />
            </li>
          ))}
          {tab === "open" && (
            <li>
              <Link
                href="/espace/reclamations/nouvelle"
                className="flex h-full min-h-48 flex-col items-center justify-center gap-3 rounded-3xl bg-card/60 p-5 text-center text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
              >
                <span className="flex size-11 items-center justify-center rounded-2xl bg-page">
                  <IconHelp className="size-5" />
                </span>
                <span className="font-medium text-sm">Un autre souci ?</span>
                <span className="text-xs">Ouvrez une nouvelle demande</span>
              </Link>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function Stat({ value, label }: Readonly<{ value: number; label: string }>) {
  return (
    <div className="rounded-3xl bg-card px-5 py-4">
      <p className="font-semibold text-2xl tabular-nums">{value}</p>
      <p className="text-muted-foreground text-sm">{label}</p>
    </div>
  );
}

function ClaimCard({ claim: c }: Readonly<{ claim: Claim }>) {
  const { topic, subject } = splitTitle(c.title);
  const Icon = topic?.icon ?? IconMessageReport;
  const updated = c.updatedAt !== c.createdAt;
  return (
    <Link
      href={`/espace/reclamations/${c.id}`}
      className="group flex h-full min-h-48 flex-col gap-4 rounded-3xl bg-card p-5 transition-colors hover:bg-card/70"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-page">
            <Icon className="size-5" />
          </span>
          <span className="truncate text-muted-foreground text-sm">{topic?.label ?? "Demande"}</span>
        </div>
        <StatusPill status={c.status as ClaimStatus} />
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="line-clamp-2 font-semibold leading-snug">{subject}</p>
        <p className="line-clamp-3 text-muted-foreground text-sm">{c.description}</p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl bg-page px-3.5 py-2.5 text-muted-foreground text-xs">
        <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <span>Envoyée le {date(c.createdAt)}</span>
          {updated && <span>Mise à jour {ago(c.updatedAt)}</span>}
          {c.attachmentUrls.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <IconPhoto className="size-3.5" />
              {c.attachmentUrls.length}
            </span>
          )}
        </span>
        <IconArrowUpRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </Link>
  );
}

function CardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex min-h-48 flex-col gap-4 rounded-3xl bg-card p-5">
          <div className="flex items-center justify-between">
            <Bone className="size-11 rounded-2xl" />
            <Bone className="h-6 w-20 rounded-full" />
          </div>
          <Bone className="h-4 w-2/3" />
          <Bone className="h-3.5 w-full" />
          <Bone className="mt-auto h-9 w-full rounded-2xl" />
        </div>
      ))}
    </div>
  );
}
