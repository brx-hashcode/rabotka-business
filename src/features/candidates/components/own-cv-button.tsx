"use client";

import { useState } from "react";
import { IconFileText, IconLock } from "@tabler/icons-react";

import { PreviewSheet, previewKindOf } from "#/components/preview-sheet";
import { applicationCvUrl } from "#/lib/api/offer-controller";
import { cn } from "#/lib/utils";

/**
 * « CV joint » : the CV the candidate uploaded and sent with this application.
 * It carries their phone and e-mail, so until the contact is unlocked (or the
 * application retained) it stays shut, and its contents only reach the score.
 */
export function OwnCvButton({
  applicationId,
  name,
  cv,
  className,
}: Readonly<{
  applicationId: string;
  name: string;
  cv: { fileName: string; mimeType: string; available: boolean };
  className?: string;
}>) {
  const [open, setOpen] = useState(false);

  if (!cv.available) {
    return (
      <span
        title="Le CV joint par le candidat s'ouvre une fois son contact débloqué ou sa candidature retenue."
        className={cn(
          "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-card px-3.5 font-medium text-muted-foreground text-sm",
          className,
        )}
      >
        <IconLock className="size-4" />
        CV joint · après déblocage
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-card px-3.5 font-medium text-sm hover:bg-card/70",
          className,
        )}
      >
        <IconFileText className="size-4" />
        CV joint
      </button>
      <PreviewSheet
        open={open}
        onOpenChange={setOpen}
        title={`CV de ${name}`}
        subtitle="Joint par le candidat à sa candidature"
        src={applicationCvUrl(applicationId)}
        kind={previewKindOf(cv.mimeType) ?? "pdf"}
        fileName={cv.fileName}
        unavailable="Ce CV n'a pas pu être chargé."
      />
    </>
  );
}
