"use client";

import { useState } from "react";
import {
  IconChevronDown,
  IconDownload,
  IconFileCertificate,
  IconFileSpreadsheet,
  IconFileText,
  IconLock,
  IconTable,
  IconUsersGroup,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { appConfig } from "#/config";
import { getMySubscription, mySubscriptionKey } from "#/lib/api/business-controller";
import { downloadFile } from "#/lib/api/download";
import type { StatsPeriod } from "#/lib/api/types";

const ITEM = "cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 focus:bg-page";

/**
 * The dashboard's period to take away: the PDF report (read in the drawer),
 * or its figures as an Excel workbook or a CSV, downloaded.
 */
export function ReportExportMenu({ days, onOpenPdf }: Readonly<{ days: StatsPeriod; onOpenPdf: () => void }>) {
  const [pending, setPending] = useState<string | null>(null);
  const router = useRouter();
  const { data: subscription } = useQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription });
  // « Exports RH »: a plan service; without it, the entries say where to get it.
  const hrExports = !!subscription?.entitlements.hrExports;

  async function download(ext: "xlsx" | "csv") {
    await fetchFile(`${appConfig.apiUrl}/business/me/report.${ext}?days=${days}`, `rapport-recrutement.${ext}`);
  }

  function hrExport(path: string, name: string) {
    if (!hrExports) {
      router.push("/espace/abonnement");
      return;
    }
    void fetchFile(`${appConfig.apiUrl}/business/me/exports/${path}`, name);
  }

  async function fetchFile(url: string, name: string) {
    setPending(name);
    try {
      await downloadFile(url, name);
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

        <DropdownMenuSeparator className="my-1.5" />
        <DropdownMenuLabel className="flex items-center gap-1.5 px-3 pt-1 pb-1.5 font-medium text-[11px] text-muted-foreground uppercase tracking-wider">
          Exports RH
          {!hrExports && <IconLock className="size-3.5" />}
        </DropdownMenuLabel>
        <DropdownMenuItem className={ITEM} onSelect={() => hrExport("staff-register", "registre-du-personnel.xlsx")}>
          <IconUsersGroup className="mt-0.5 size-4 shrink-0" />
          <span className="flex flex-col">
            <span className="font-medium text-sm">Registre du personnel</span>
            <span className="text-muted-foreground text-xs">
              {hrExports ? "Les personnes recrutées, en Excel" : "Inclus dans les formules supérieures"}
            </span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem className={ITEM} onSelect={() => hrExport("acpe", "offres-acpe.xlsx")}>
          <IconFileCertificate className="mt-0.5 size-4 shrink-0" />
          <span className="flex flex-col">
            <span className="font-medium text-sm">Offres à déclarer (ACPE)</span>
            <span className="text-muted-foreground text-xs">
              {hrExports ? "Toutes vos offres, prêtes à déclarer" : "Inclus dans les formules supérieures"}
            </span>
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
