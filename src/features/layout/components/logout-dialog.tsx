"use client";

import { IconLogout } from "@tabler/icons-react";
import { useTranslations } from "next-intl";

import { ActionDialog } from "#/components/action-dialog";
import { useLogoutMutation } from "#/hooks/use-auth-mutations";

/** Asks before signing out; the mutation then leaves for the landing page. */
export function LogoutDialog({
  open,
  onOpenChange,
}: Readonly<{ open: boolean; onOpenChange: (open: boolean) => void }>) {
  const logout = useLogoutMutation();
  const t = useTranslations("layout.logout");

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      tone="warning"
      icon={<IconLogout className="size-5" />}
      title={t("title")}
      description={t("description")}
      confirmLabel={t("confirm")}
      pending={logout.isPending}
      onConfirm={() => logout.mutate(undefined, { onSettled: () => onOpenChange(false) })}
    />
  );
}
