"use client";

import { useState } from "react";
import { IconChevronDown, IconDownload, IconFileSpreadsheet, IconFileText, IconTable } from "@tabler/icons-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { appConfig } from "#/config";
import { downloadFile } from "#/lib/api/download";
import type { StatsPeriod } from "#/lib/api/types";

const ITEM = "cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 focus:bg-page";

/**
 * The dashboard's period to take away: the PDF report (read in the drawer),
 * or its figures as an Excel workbook or a CSV, downloaded.
 */
export function ReportExportMenu({ days, onOpenPdf }: Readonly<{ days: StatsPeriod; onOpenPdf: () => void }>) {
  const [pending, setPending] = useState<"xlsx" | "csv" | null>(null);

  async function download(ext: "xlsx" | "csv") {
    setPending(ext);
    try {
      await downloadFile(`${appConfig.apiUrl}/business/me/report.${ext}?days=${days}`, `rapport-recrutement.${ext}`);
    } catch (err) {
      toast.error(
        (err instanceof Error && err.message) || "L'export n'a pas pu être créé. Réessayez dans un instant.",
      );
    } finally {
      setPending(null);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pending !== null}
        className="inline-flex h-11 items-center gap-2 rounded-full bg-page px-4 font-medium text-sm outline-none hover:bg-page/70 disabled:opacity-60"
      >
        <IconDownload className="size-4" />
        {pending ? "Export en cours…" : "Exporter"}
        <IconChevronDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-2xl border-0 bg-card p-1.5 shadow-soft">
        <DropdownMenuItem className={ITEM} onSelect={onOpenPdf}>
          <IconFileText className="mt-0.5 size-4 shrink-0" />
          <span className="flex flex-col">
            <span className="font-medium text-sm">Rapport PDF</span>
            <span className="text-muted-foreground text-xs">À lire, imprimer ou envoyer</span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem className={ITEM} onSelect={() => void download("xlsx")}>
          <IconFileSpreadsheet className="mt-0.5 size-4 shrink-0" />
          <span className="flex flex-col">
            <span className="font-medium text-sm">Excel (.xlsx)</span>
            <span className="text-muted-foreground text-xs">Un onglet par section, toutes les offres</span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem className={ITEM} onSelect={() => void download("csv")}>
          <IconTable className="mt-0.5 size-4 shrink-0" />
          <span className="flex flex-col">
            <span className="font-medium text-sm">CSV</span>
            <span className="text-muted-foreground text-xs">Les mêmes chiffres, pour tout autre outil</span>
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
