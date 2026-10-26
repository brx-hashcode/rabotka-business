"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { IconCalendar, IconDownload, IconFileInvoice, IconReceipt } from "@tabler/icons-react";

import { Skeleton } from "#/components/ui/skeleton";
import { StatTile } from "#/features/home/components/stat-tile";
import { friendlyError } from "#/lib/api/friendly-error";
import { invoiceDownloadUrl, invoicesKey, listInvoices, type Invoice } from "#/lib/api/invoice-controller";
import { cn } from "#/lib/utils";

const REASON: Record<string, string> = {
  BUSINESS_SUBSCRIPTION: "Abonnement Rabotka Business",
  CONTACT_UNLOCK: "Déblocage de contact",
  PENALTY: "Régularisation",
  WALLET_TOP_UP: "Recharge du solde",
  OTHER: "Autre",
};

const fcfa = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;
const longDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
/** The number printed on the PDF's name: the id's head, upper case. */
const number = (id: string) => `F-${id.slice(0, 8).toUpperCase()}`;

/**
 * The account's invoices — the client app's endpoint, so the same documents:
 * one per payment (plan, contact unlock…), each as a PDF.
 */
export function InvoicesPage() {
  const queryClient = useQueryClient();
  const invoices = useQuery({ queryKey: invoicesKey, queryFn: listInvoices });
  const years = useMemo(
    () => [...new Set((invoices.data ?? []).map((i) => new Date(i.createdAt).getFullYear()))].sort((a, b) => b - a),
    [invoices.data],
  );
  const [year, setYear] = useState<number | "all">("all");
  const shown = (invoices.data ?? []).filter((i) => year === "all" || new Date(i.createdAt).getFullYear() === year);
  const total = shown.reduce((n, i) => n + Number(i.amount), 0);
  const latest = invoices.data?.[0];

  return (
    <div className="w-full space-y-6 pt-2">
      <div className="space-y-1.5">
        <h1 className="font-semibold text-3xl tracking-tight">Factures</h1>
        <p className="text-muted-foreground">Une facture par paiement — abonnement, déblocage de contact… — à télécharger en PDF.</p>
      </div>

      {invoices.isLoading ? (
        <Skeleton className="h-96 rounded-3xl" />
      ) : !invoices.data ? (
        <p className="rounded-3xl bg-card p-6 text-muted-foreground">{friendlyError(invoices.error, "Vos factures sont indisponibles pour le moment.")}</p>
      ) : invoices.data.length === 0 ? (
        <section className="flex flex-col items-center gap-3 rounded-3xl bg-card px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-page">
            <IconFileInvoice className="size-6 text-muted-foreground" />
          </span>
          <p className="font-medium">Aucune facture pour le moment</p>
          <p className="max-w-md text-muted-foreground text-sm">Chaque paiement — votre abonnement, un déblocage de contact — fait l&apos;objet d&apos;une facture ici.</p>
        </section>
      ) : (
        <>
          <section className="grid gap-4 rounded-3xl bg-card p-6 sm:grid-cols-3 sm:p-8">
            <StatTile icon={IconReceipt} label={year === "all" ? "Total facturé" : `Total ${year}`} value={fcfa(total)} />
            <StatTile icon={IconFileInvoice} label="Factures" value={String(shown.length)} />
            <StatTile icon={IconCalendar} label="Dernière facture" value={latest ? fcfa(Number(latest.amount)) : "—"} hint={latest ? longDate(latest.createdAt) : undefined} />
          </section>

          <section className="space-y-4 rounded-3xl bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold text-xl">Historique</h2>
              {years.length > 1 && (
                <div role="radiogroup" aria-label="Année" className="inline-flex rounded-full bg-page p-1">
                  {(["all", ...years] as const).map((y) => (
                    <button
                      key={y}
                      type="button"
                      role="radio"
                      aria-checked={year === y}
                      onClick={() => setYear(y)}
                      className={cn(
                        "rounded-full px-3.5 py-1.5 font-medium text-sm",
                        year === y ? "bg-brand-lime text-[#0f2414]" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {y === "all" ? "Toutes" : y}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <ul className="space-y-2">
              {shown.map((i) => (
                <InvoiceRow
                  key={i.id}
                  invoice={i}
                  // The server marks it downloaded: refresh once the file has gone.
                  onDownload={() => setTimeout(() => void queryClient.invalidateQueries({ queryKey: invoicesKey }), 2000)}
                />
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function InvoiceRow({ invoice: i, onDownload }: Readonly<{ invoice: Invoice; onDownload: () => void }>) {
  const fresh = i.status === "PENDING_DOWNLOAD";
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-page p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card">
        <IconFileInvoice className="size-5 text-muted-foreground" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{REASON[i.reason] ?? i.reason}</p>
        <p className="text-muted-foreground text-xs">
          {number(i.id)} · {longDate(i.createdAt)}
        </p>
      </div>
      {fresh && <span className="rounded-full bg-chip-green px-2.5 py-1 font-medium text-chip-green-foreground text-xs">Nouvelle</span>}
      <p className="w-32 text-right font-semibold tabular-nums">{fcfa(Number(i.amount))}</p>
      <a
        href={invoiceDownloadUrl(i.id)}
        download
        onClick={onDownload}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-card px-4 font-medium text-sm hover:bg-card/70"
      >
        <IconDownload className="size-4" />
        PDF
      </a>
    </li>
  );
}
