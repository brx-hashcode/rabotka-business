"use client";

import { IconLogout } from "@tabler/icons-react";

import { ActionDialog } from "#/components/action-dialog";
import { useLogoutMutation } from "#/hooks/use-auth-mutations";

/** Asks before signing out; the mutation then leaves for the sign-in page. */
export function LogoutDialog({
  open,
  onOpenChange,
}: Readonly<{ open: boolean; onOpenChange: (open: boolean) => void }>) {
  const logout = useLogoutMutation();

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      tone="warning"
      icon={<IconLogout className="size-5" />}
      title="Se déconnecter ?"
      description="Vous devrez saisir à nouveau votre email et un code pour revenir."
      confirmLabel="Se déconnecter"
      pending={logout.isPending}
      onConfirm={() => logout.mutate(undefined, { onSettled: () => onOpenChange(false) })}
    />
  );
}
