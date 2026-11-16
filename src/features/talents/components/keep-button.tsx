"use client";

import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconBookmark, IconBookmarkFilled } from "@tabler/icons-react";
import { toast } from "sonner";

import { useFriendlyError } from "#/lib/api/use-friendly-error";
import { listTalents, removeTalent, saveTalent, talentsKey } from "#/lib/api/talent-controller";
import { cn } from "#/lib/utils";
import { canHire } from "#/features/team/member-access";
import { useMember } from "#/features/team/use-member";

/**
 * Keeps a worker in the business's talent pool, or lets them go — a
 * bookmark wherever a worker shows (search, profile).
 */
export function KeepButton({ workerId, name, className }: Readonly<{ workerId: string; name: string; className?: string }>) {
  const queryClient = useQueryClient();
  const t = useTranslations("talents.keep");
  const friendlyError = useFriendlyError();
  const talents = useQuery({ queryKey: talentsKey, queryFn: listTalents });
  const kept = !!talents.data?.some((t) => t.workerId === workerId && t.saved);
  const hire = canHire(useMember().role);

  const toggle = useMutation({
    mutationFn: () => (kept ? removeTalent(workerId) : saveTalent(workerId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: talentsKey });
      toast.success(kept ? t("removed", { name }) : t("added", { name }));
    },
    onError: (err) => toast.error(friendlyError(err, t("failed"))),
  });

  // Keeping a profile is the hiring side's: an Évaluateur was refused it.
  if (!hire) return null;
  return (
    <button
      type="button"
      onClick={() => toggle.mutate()}
      disabled={talents.isLoading || toggle.isPending}
      aria-pressed={kept}
      aria-label={kept ? t("ariaRemove", { name }) : t("ariaKeep", { name })}
      title={kept ? t("titleKept") : t("titleKeep")}
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-50",
        kept ? "bg-brand-lime text-[#0f2414]" : "bg-card text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {kept ? <IconBookmarkFilled className="size-4" /> : <IconBookmark className="size-4" />}
    </button>
  );
}
