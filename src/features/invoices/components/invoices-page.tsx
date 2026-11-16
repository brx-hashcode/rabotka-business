"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { IconCalendar, IconDownload, IconEye, IconFileInvoice, IconReceipt } from "@tabler/icons-react";

import { PreviewSheet } from "#/components/preview-sheet";
import { RowsSkeleton, TilesSkeleton } from "#/components/page-skeletons";
import { StatTile } from "#/features/home/components/stat-tile";
import { INTL_LOCALE, type Locale } from "#/i18n/config";
import { useFriendlyError } from "#/lib/api/use-friendly-error";
import { invoiceDownloadUrl, invoicesKey, listInvoices, type Invoice } from "#/lib/api/invoice-controller";
import { formatMoney } from "#/features/money/money";
import { cn } from "#/lib/utils";

const REASONS = ["BUSINESS_SUBSCRIPTION", "BUSINESS_CREDIT_PACK", "CONTACT_UNLOCK", "PENALTY", "WALLET_TOP_UP", "OTHER"] as const;
type Reason = (typeof REASONS)[number];
const isReason = (r: string): r is Reason => (REASONS as readonly string[]).includes(r);

/**
 * What an invoice cost, as it left the account: in the currency its network
 * was charged in (« 8,50 $ » in the DRC), else the XAF price.
 */
const paid = (i: Invoice, locale: Locale) =>
  i.chargedCurrency && i.chargedAmount !== null
    ? formatMoney(Number(i.chargedAmount), i.chargedCurrency, locale)
    : formatMoney(Number(i.amount), "XAF", locale);

/**
 * The total of invoices paid in ONE currency, in it; FCFA, the books', when
 * they were paid in several.
 */
function totalOf(list: Invoice[], locale: Locale): string {
  const currencies = new Set(list.map((i) => i.chargedCurrency ?? "XAF"));
  if (currencies.size === 1) {
    const [only] = currencies;
    if (only !== "XAF") {
      return formatMoney(
        list.reduce((n, i) => n + Number(i.chargedAmount ?? 0), 0),
        only,
        locale,
      );
    }
  }
  return formatMoney(
    list.reduce((n, i) => n + Number(i.amount), 0),
    "XAF",
    locale,
  );
}
const longDate = (iso: string, locale: Locale) => new Date(iso).toLocaleDateString(INTL_LOCALE[locale], { day: "numeric", month: "long", year: "numeric" });
/** The number printed on the PDF's name: the id's head, upper case. */
const number = (id: string) => `F-${id.slice(0, 8).toUpperCase()}`;

/**
 * The account's invoices — the client app's endpoint, so the same documents:
 * one per payment (plan, contact unlock…), each as a PDF.
 */
export function InvoicesPage() {
  const queryClient = useQueryClient();
  const t = useTranslations("subscription.invoices");
  const locale = useLocale();
  const friendlyError = useFriendlyError();
  const invoices = useQuery({ queryKey: invoicesKey, queryFn: listInvoices });
  const years = useMemo(
    () => [...new Set((invoices.data ?? []).map((i) => new Date(i.createdAt).getFullYear()))].sort((a, b) => b - a),
    [invoices.data],
  );
  const [year, setYear] = useState<number | "all">("all");
  const shown = (invoices.data ?? []).filter((i) => year === "all" || new Date(i.createdAt).getFullYear() === year);
  const latest = invoices.data?.[0];

  return (
    <div className="w-full space-y-6 pt-2">
      <div className="space-y-1.5">
        <h1 className="font-semibold text-3xl tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("intro")}</p>
      </div>

      {invoices.isLoading ? (
        <>
          <div className="rounded-3xl bg-card p-6 sm:p-8">
            <TilesSkeleton count={3} />
          </div>
          <div className="rounded-3xl bg-card p-6">
            <RowsSkeleton count={4} />
          </div>
        </>
      ) : !invoices.data ? (
        <p className="rounded-3xl bg-card p-6 text-muted-foreground">{friendlyError(invoices.error, t("loadFailed"))}</p>
      ) : invoices.data.length === 0 ? (
        <section className="flex flex-col items-center gap-3 rounded-3xl bg-card px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-page">
            <IconFileInvoice className="size-6 text-muted-foreground" />
          </span>
          <p className="font-medium">{t("emptyTitle")}</p>
          <p className="max-w-md text-muted-foreground text-sm">{t("emptyText")}</p>
        </section>
      ) : (
        <>
          <section className="grid gap-4 rounded-3xl bg-card p-6 sm:grid-cols-3 sm:p-8">
            <StatTile icon={IconReceipt} label={year === "all" ? t("total") : t("totalYear", { year: String(year) })} value={totalOf(shown, locale)} />
            <StatTile icon={IconFileInvoice} label={t("count")} value={String(shown.length)} />
            <StatTile icon={IconCalendar} label={t("latest")} value={latest ? paid(latest, locale) : "—"} hint={latest ? longDate(latest.createdAt, locale) : undefined} />
          </section>

          <section className="space-y-4 rounded-3xl bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold text-xl">{t("history")}</h2>
              {years.length > 1 && (
                <div role="radiogroup" aria-label={t("year")} className="inline-flex rounded-full bg-page p-1">
                  {(["all", ...years] as const).map((y) => (
                    <button
                      key={y}
                      type="button"
                      role="radio"
                      aria-checked={year === y}
                      onClick={() => setYear(y)}
                      className={cn(
                        "rounded-full px-3.5 py-1.5 font-medium text-sm",
                        year === y ? "bg-selected text-selected-foreground" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {y === "all" ? t("allYears") : y}
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
  const t = useTranslations("subscription.invoices");
  const locale = useLocale();
  const fresh = i.status === "PENDING_DOWNLOAD";
  const reason = isReason(i.reason) ? t(`reason.${i.reason}`) : i.reason;
  const [preview, setPreview] = useState(false);
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-page p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card">
        <IconFileInvoice className="size-5 text-muted-foreground" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{reason}</p>
        <p className="text-muted-foreground text-xs">
          {number(i.id)} · {longDate(i.createdAt, locale)}
        </p>
      </div>
      {fresh && <span className="rounded-full bg-chip-green px-2.5 py-1 font-medium text-chip-green-foreground text-xs">{t("fresh")}</span>}
      <p className="w-32 text-right font-semibold tabular-nums">{paid(i, locale)}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setPreview(true);
            onDownload();
          }}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 font-medium text-sm text-white hover:bg-ink/90"
        >
          <IconEye className="size-4" />
          {t("preview")}
        </button>
        <a
          href={invoiceDownloadUrl(i.id)}
          download
          onClick={onDownload}
          aria-label={t("download")}
          title={t("download")}
          className="flex size-10 items-center justify-center rounded-full bg-card hover:bg-card/70"
        >
          <IconDownload className="size-4" />
        </a>
      </div>
      <PreviewSheet
        open={preview}
        onOpenChange={setPreview}
        title={reason}
        subtitle={`${number(i.id)} · ${longDate(i.createdAt, locale)} · ${paid(i, locale)}`}
        src={invoiceDownloadUrl(i.id)}
        kind="pdf"
        fileName={t("fileName", { number: number(i.id) })}
      />
    </li>
  );
}
