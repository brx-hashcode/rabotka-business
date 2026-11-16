"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "#/components/ui/dialog";
import { CandidateProfile } from "./candidate-profile";

/**
 * /espace/candidats/[id] reached from inside the space (the search): the
 * profile in a dialog over the page. Closing goes back to where it was.
 */
export function CandidateDialog({ workerId }: Readonly<{ workerId: string }>) {
  const router = useRouter();
  const t = useTranslations("candidates.dialog");
  return (
    <Dialog open onOpenChange={(open) => !open && router.back()}>
      <DialogContent
        // Clicks on the photo panel (portalled outside) are not « outside ».
        onInteractOutside={(e) => {
          if ((e.target as HTMLElement | null)?.closest("[data-preview-sheet]")) e.preventDefault();
        }}
        className="max-h-[90svh] w-[calc(100vw-2rem)] gap-0 overflow-y-auto rounded-3xl border-0 bg-card p-6 shadow-soft sm:max-w-3xl sm:p-8">
        <DialogTitle className="sr-only">{t("title")}</DialogTitle>
        <DialogDescription className="sr-only">{t("description")}</DialogDescription>
        <CandidateProfile workerId={workerId} />
      </DialogContent>
    </Dialog>
  );
}
