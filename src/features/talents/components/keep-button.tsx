"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconBookmark, IconBookmarkFilled } from "@tabler/icons-react";
import { toast } from "sonner";

import { friendlyError } from "#/lib/api/friendly-error";
import { listTalents, removeTalent, saveTalent, talentsKey } from "#/lib/api/talent-controller";
import { cn } from "#/lib/utils";

/**
 * Keeps a worker in the business's talent pool, or lets them go — a
 * bookmark wherever a worker shows (search, profile).
 */
export function KeepButton({ workerId, name, className }: Readonly<{ workerId: string; name: string; className?: string }>) {
  const queryClient = useQueryClient();
  const talents = useQuery({ queryKey: talentsKey, queryFn: listTalents });
  const kept = !!talents.data?.some((t) => t.workerId === workerId && t.saved);

  const toggle = useMutation({
    mutationFn: () => (kept ? removeTalent(workerId) : saveTalent(workerId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: talentsKey });
      toast.success(kept ? `Profil de ${name} retiré de « Mes profils ».` : `Profil de ${name} ajouté à « Mes profils ».`);
    },
    onError: (err) => toast.error(friendlyError(err, "Vos profils n'ont pas pu être mis à jour.")),
  });

  return (
    <button
      type="button"
      onClick={() => toggle.mutate()}
      disabled={talents.isLoading || toggle.isPending}
      aria-pressed={kept}
      aria-label={kept ? `Retirer ${name} de mes profils` : `Garder ${name} dans mes profils`}
      title={kept ? "Dans « Mes profils »" : "Garder dans « Mes profils »"}
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
