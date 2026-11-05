"use client";

import { useState } from "react";
import { IconFileCv } from "@tabler/icons-react";

import { PreviewSheet } from "#/components/preview-sheet";
import { candidateResumeUrl } from "#/lib/api/candidate-controller";
import { cn } from "#/lib/utils";

/**
 * « CV » : the candidate's Rabotka CV — trades, missions done, ratings — as
 * they download it themselves, without their contact details.
 */
export function ResumeButton({
  workerId,
  name,
  className,
  open: controlled,
  onOpenChange,
}: Readonly<{
  workerId: string;
  name: string;
  className?: string;
  /** Opened from elsewhere (a « ⋯ » menu): no button of its own then. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}>) {
  const [own, setOwn] = useState(false);
  const open = controlled ?? own;
  const setOpen = onOpenChange ?? setOwn;
  return (
    <>
      {controlled === undefined && (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-card px-3.5 font-medium text-sm hover:bg-card/70", className)}
      >
        <IconFileCv className="size-4" />
        CV Rabotka
      </button>
      )}
      <PreviewSheet
        open={open}
        onOpenChange={setOpen}
        title={`CV de ${name}`}
        subtitle="Généré par Rabotka à partir de son profil et de ses missions"
        src={candidateResumeUrl(workerId)}
        kind="pdf"
        fileName={`CV ${name}.pdf`}
        unavailable="Le CV n'a pas pu être chargé."
      />
    </>
  );
}
