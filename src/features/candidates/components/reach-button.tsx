"use client";

import { offersKey } from "#/lib/api/offer-controller";
import { useTranslations } from "next-intl";
import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconAddressBook, IconLockOpen } from "@tabler/icons-react";
import { toast } from "sonner";

import { ActionDialog } from "#/components/action-dialog";
import { Skeleton } from "#/components/ui/skeleton";
import { ContactDialog } from "#/features/contacts/components/contact-dialog";
import {
  getMyContacts,
  getMySubscription,
  myContactsKey,
  mySubscriptionKey,
  unlockWorkerContact,
} from "#/lib/api/business-controller";
import { useFriendlyError } from "#/lib/api/use-friendly-error";
import { cn } from "#/lib/utils";

const button = "inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 font-medium text-sm transition-colors";

/**
 * « Contact » for a worker already unlocked; otherwise « Débloquer », which
 * spends one contact of the plan after saying so — then shows the details.
 */
/** `className`: sizing where it stands alone (a page header) rather than in a card. */
export function ReachButton({ workerId, name, className }: Readonly<{ workerId: string; name: string; className?: string }>) {
  const queryClient = useQueryClient();
  const t = useTranslations("candidates.reach");
  const friendlyError = useFriendlyError();
  const contacts = useQuery({ queryKey: myContactsKey, queryFn: getMyContacts });
  const [confirm, setConfirm] = useState(false);
  const [show, setShow] = useState(false);
  const unlocked = contacts.data?.some((x) => x.workerId === workerId);

  const unlock = useMutation({
    mutationFn: () => unlockWorkerContact(workerId),
    onSuccess: ({ spent }) => {
      void queryClient.invalidateQueries({ queryKey: myContactsKey });
      void queryClient.invalidateQueries({ queryKey: mySubscriptionKey });
      // An unlocked contact opens the « CV joint » on its applications.
      void queryClient.invalidateQueries({ queryKey: offersKey });
      // And the CV on their profile.
      void queryClient.invalidateQueries({ queryKey: ["candidate", workerId, "cv"] });
      setConfirm(false);
      setShow(true);
      if (spent) toast.success(t("obtained", { name }));
    },
    onError: (err) => toast.error(friendlyError(err, t("failed"))),
  });

  return (
    <>
      {unlocked ? (
        <button type="button" onClick={() => setShow(true)} className={cn(button, "bg-ink text-white hover:bg-ink/90", className)}>
          <IconAddressBook className="size-4 shrink-0" />
          {t("contact")}
        </button>
      ) : (
        <button
          type="button"
          disabled={contacts.isLoading}
          onClick={() => setConfirm(true)}
          className={cn(button, "bg-ink text-white hover:bg-ink/90 disabled:opacity-50", className)}
        >
          <IconLockOpen className="size-4 shrink-0" />
          {t("obtain")}
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
  const t = useTranslations("candidates.reach");
  const sub = useQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription, enabled: open });
  const e = sub.data?.entitlements;
  const left = e?.unlocksRemaining;
  const covered = !!e?.plan && (left === null || (left ?? 0) > 0);
  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<IconLockOpen className="size-5" />}
      title={t("confirmTitle", { name })}
      description={t("confirmText")}
      confirmLabel={t("obtain")}
      confirmDisabled={!covered}
      pending={pending}
      onConfirm={onConfirm}
    >
      {!e ? (
        <Skeleton className="h-14 rounded-2xl" />
      ) : covered ? (
        <p className="rounded-2xl bg-chip-green p-4 text-chip-green-foreground text-sm">
          {left === null ? t("includedUnlimited", { plan: e.plan!.name }) : t("includedLeft", { plan: e.plan!.name, count: left! - 1 })}
        </p>
      ) : (
        <p className="rounded-2xl bg-chip-amber p-4 text-chip-amber-foreground text-sm">
          {e.plan ? t("usedUp") : t("needPlan")}{" "}
          <Link href="/espace/abonnement" className="font-medium underline">
            {t("seePlans")}
          </Link>
        </p>
      )}
    </ActionDialog>
  );
}
