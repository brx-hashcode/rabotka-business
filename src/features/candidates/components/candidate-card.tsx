"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconAddressBook, IconBriefcase, IconLockOpen, IconShieldCheck, IconStarFilled } from "@tabler/icons-react";
import { toast } from "sonner";

import { ActionDialog } from "#/components/action-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Skeleton } from "#/components/ui/skeleton";
import { ContactDialog } from "#/features/contacts/components/contact-dialog";
import { KeepButton } from "#/features/talents/components/keep-button";
import {
  getMyContacts,
  getMySubscription,
  myContactsKey,
  mySubscriptionKey,
  unlockWorkerContact,
} from "#/lib/api/business-controller";
import type { Candidate } from "#/lib/api/candidate-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import { cn, getInitials } from "#/lib/utils";

const button = "inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 font-medium text-sm transition-colors";

/**
 * A worker as the search shows them — who, their trade, how they did — with
 * the profile (dialog) and the way to reach them. Never a contact detail on
 * the card itself.
 */
export function CandidateCard({ candidate: c, compact }: Readonly<{ candidate: Candidate; compact?: boolean }>) {
  const name = `${c.firstName} ${c.lastName}`.trim();
  return (
    <li className={cn("flex flex-col gap-4 rounded-3xl bg-page p-5", compact && "gap-3 p-4")}>
      <div className="flex items-start gap-3.5">
        <Link href={`/espace/candidats/${c.id}`} className="shrink-0">
          <Avatar className={cn("rounded-2xl", compact ? "size-12" : "size-14")}>
            {c.avatarUrl && <AvatarImage src={c.avatarUrl} alt="" className="object-cover" />}
            <AvatarFallback className="rounded-2xl bg-brand-lime font-semibold text-[#0f2414]">{getInitials(name)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/espace/candidats/${c.id}`} className="flex items-center gap-1.5 hover:underline">
            <span className="truncate font-semibold">{name}</span>
            {c.isVerified && <BadgeCheck aria-label="Identité vérifiée" className="size-4 shrink-0 text-whatsapp" />}
          </Link>
          {c.categoryName && <p className="truncate text-muted-foreground text-sm">{c.categoryName}</p>}
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
            {c.ratingAvg !== null && c.ratingCount > 0 && (
              <span className="inline-flex items-center gap-1 font-medium">
                <IconStarFilled className="size-3.5 text-amber-400" />
                {Number(c.ratingAvg).toFixed(1)}
                <span className="font-normal text-muted-foreground">({c.ratingCount})</span>
              </span>
            )}
            {c.reliabilityScore !== null && (
              <span className="inline-flex items-center gap-1 font-medium">
                <IconShieldCheck className="size-3.5 text-whatsapp-dark" />
                {c.reliabilityScore}/100
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <IconBriefcase className="size-3.5" />
              {c.completedMissions} mission{c.completedMissions > 1 ? "s" : ""}
            </span>
          </p>
        </div>
        <KeepButton workerId={c.id} name={name} />
      </div>
      {!compact && c.description && <p className="line-clamp-2 text-muted-foreground text-sm leading-relaxed">{c.description}</p>}
      <div className="mt-auto flex gap-2">
        <Link href={`/espace/candidats/${c.id}`} className={cn(button, "bg-card hover:bg-card/70")}>
          Voir le profil
        </Link>
        <ReachButton workerId={c.id} name={name} />
      </div>
    </li>
  );
}

/**
 * « Contact » for a worker already unlocked; otherwise « Débloquer », which
 * spends one contact of the plan after saying so — then shows the details.
 */
export function ReachButton({ workerId, name }: Readonly<{ workerId: string; name: string }>) {
  const queryClient = useQueryClient();
  const contacts = useQuery({ queryKey: myContactsKey, queryFn: getMyContacts });
  const [confirm, setConfirm] = useState(false);
  const [show, setShow] = useState(false);
  const unlocked = contacts.data?.some((x) => x.workerId === workerId);

  const unlock = useMutation({
    mutationFn: () => unlockWorkerContact(workerId),
    onSuccess: ({ spent }) => {
      void queryClient.invalidateQueries({ queryKey: myContactsKey });
      void queryClient.invalidateQueries({ queryKey: mySubscriptionKey });
      setConfirm(false);
      setShow(true);
      if (spent) toast.success(`Contact de ${name} débloqué.`);
    },
    onError: (err) => toast.error(friendlyError(err, "Le contact n'a pas pu être débloqué.")),
  });

  return (
    <>
      {unlocked ? (
        <button type="button" onClick={() => setShow(true)} className={cn(button, "bg-ink text-white hover:bg-ink/90")}>
          <IconAddressBook className="size-4 shrink-0" />
          Contact
        </button>
      ) : (
        <button
          type="button"
          disabled={contacts.isLoading}
          onClick={() => setConfirm(true)}
          className={cn(button, "bg-ink text-white hover:bg-ink/90 disabled:opacity-50")}
        >
          <IconLockOpen className="size-4 shrink-0" />
          Débloquer
        </button>
      )}

      <UnlockConfirm
        open={confirm}
        name={name}
        pending={unlock.isPending}
        onOpenChange={setConfirm}
        onConfirm={() => unlock.mutate()}
      />
      <ContactDialog workerId={workerId} name={name} open={show} onOpenChange={setShow} />
    </>
  );
}

function UnlockConfirm({
  open,
  name,
  pending,
  onOpenChange,
  onConfirm,
}: Readonly<{ open: boolean; name: string; pending: boolean; onOpenChange: (o: boolean) => void; onConfirm: () => void }>) {
  const sub = useQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription, enabled: open });
  const e = sub.data?.entitlements;
  const left = e?.unlocksRemaining;
  const covered = !!e?.plan && (left === null || (left ?? 0) > 0);
  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<IconLockOpen className="size-5" />}
      title={`Débloquer le contact de ${name} ?`}
      description="Son téléphone et son e-mail s'affichent aussitôt. Le candidat n'a rien à régler."
      confirmLabel="Débloquer"
      confirmDisabled={!covered}
      pending={pending}
      onConfirm={onConfirm}
    >
      {!e ? (
        <Skeleton className="h-14 rounded-2xl" />
      ) : covered ? (
        <p className="rounded-2xl bg-chip-green p-4 text-chip-green-foreground text-sm">
          Compté sur votre formule {e.plan!.name}
          {left === null ? " (contacts illimités)." : ` : il vous restera ${left! - 1} contact${left! - 1 > 1 ? "s" : ""} sur cette période.`}
        </p>
      ) : (
        <p className="rounded-2xl bg-chip-amber p-4 text-chip-amber-foreground text-sm">
          {e.plan ? "Le quota de contacts de votre formule est épuisé pour cette période." : "Il faut une formule pour débloquer des contacts."}{" "}
          <Link href="/espace/abonnement" className="font-medium underline">
            Voir les formules
          </Link>
        </p>
      )}
    </ActionDialog>
  );
}
