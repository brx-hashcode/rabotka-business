"use client";

import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";

import { ActionDialog } from "#/components/action-dialog";
import { externalApplicationsKey } from "#/lib/api/careers-controller";
import { cvScreeningsKey, deleteCandidateCv, type CvTarget } from "#/lib/api/cv-screening-controller";
import { offersKey } from "#/lib/api/offer-controller";
import { useFriendlyError } from "#/lib/api/use-friendly-error";

/** « Supprimer le CV » of one candidate: what goes, what stays, for good. */
export function DeleteCvDialog({
  target,
  name,
  open,
  onOpenChange,
}: Readonly<{ target: CvTarget; name: string; open: boolean; onOpenChange: (open: boolean) => void }>) {
  const queryClient = useQueryClient();
  const t = useTranslations("cv.remove");
  const friendlyError = useFriendlyError();
  const remove = useMutation({
    mutationFn: () => deleteCandidateCv(target),
    onSuccess: () => {
      for (const queryKey of [offersKey, externalApplicationsKey, cvScreeningsKey]) {
        void queryClient.invalidateQueries({ queryKey });
      }
      onOpenChange(false);
      toast.success(t("done", { name }));
    },
    onError: (err) => toast.error(friendlyError(err, t("failed"))),
  });
  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<IconTrash className="size-5" />}
      tone="warning"
      title={t("title", { name })}
      description={t("text")}
      confirmLabel={t("confirm")}
      pending={remove.isPending}
      onConfirm={() => remove.mutate()}
    />
  );
}
