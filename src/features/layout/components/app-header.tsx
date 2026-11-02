"use client";

import { IconMenu2 } from "@tabler/icons-react";

import { AccountMenu } from "./account-menu";
import { CommandSearch } from "./command-search";
import { NotificationBell } from "./notification-bell";
import { ThemeToggle } from "./theme-toggle";

/** The space's top bar: page search, theme, notifications, account. */
export function AppHeader({ onOpenMenu }: Readonly<{ onOpenMenu: () => void }>) {
  return (
    <header className="sticky top-0 z-30 bg-page/80 backdrop-blur">
      <div className="flex h-20 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Ouvrir le menu"
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-card lg:hidden"
        >
          <IconMenu2 className="size-5" />
        </button>
        <div className="min-w-0 flex-1">
          <CommandSearch />
        </div>
        <div className="hidden sm:block">
          <ThemeToggle />
        </div>
        <NotificationBell />
        <AccountMenu />
      </div>
    </header>
  );
}
