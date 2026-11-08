"use client";

import { useRouter } from "next/navigation";
import { IconMessageCircle } from "@tabler/icons-react";
import { Loader } from "lucide-react";
import { toast } from "sonner";

import { useOpenDiscussionWithProfile } from "#/features/discussions/use-discussions";
import { canHire } from "#/features/team/member-access";
import { useMember } from "#/features/team/use-member";
import { friendlyError } from "#/lib/api/friendly-error";
import { cn } from "#/lib/utils";

const button =
  "inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 font-medium text-sm transition-colors";

/**
 * « Envoyer un message » to a worker, with or without an application between
 * you: opens the pair's one conversation (or finds it) and goes there.
 * Messages are moderated server-side, so this never hands out a contact —
 * that stays what « Obtenir le contact » sells. Not for an Évaluateur, who
 * has no messages.
 */
export function MessageButton({ workerId, name, className }: Readonly<{ workerId: string; name: string; className?: string }>) {
  const router = useRouter();
  const { role } = useMember();
  const open = useOpenDiscussionWithProfile();
  if (!canHire(role)) return null;

  return (
    <button
      type="button"
      disabled={open.isPending}
      onClick={() =>
        open.mutate(workerId, {
          onSuccess: ({ conversation }) => router.push(`/espace/discussions/${conversation.id}`),
          onError: (err) => toast.error(friendlyError(err, "La conversation n'a pas pu être ouverte.")),
        })
      }
      aria-label={`Envoyer un message à ${name}`}
      className={cn(button, "bg-brand-lime text-ink hover:brightness-95 active:scale-[0.98] disabled:opacity-60", className)}
    >
      {open.isPending ? (
        <Loader className="size-4 shrink-0 animate-spin" />
      ) : (
        <IconMessageCircle className="size-4 shrink-0" strokeWidth={2.25} />
      )}
      {open.isPending ? "Ouverture…" : "Envoyer un message"}
    </button>
  );
}
