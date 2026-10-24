"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { IconHelpCircle, IconLogout } from "@tabler/icons-react";

import { BusinessLockup } from "#/components/business-lockup";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { useSupportContact } from "#/hooks/use-support-contact";
import { getMyBusiness, myBusinessKey } from "#/lib/api/business-controller";
import { cn, getInitials } from "#/lib/utils";
import { LogoutDialog } from "./logout-dialog";
import { isActive, NAV_ITEMS } from "./nav-items";

/**
 * The space's white rail: the brand, the pages (the ones still to come
 * greyed « Bientôt »), help, and the organisation's card with sign-out.
 * `onNavigate` closes the mobile sheet after a tap.
 */
export function AppSidebar({ onNavigate }: Readonly<{ onNavigate?: () => void }>) {
  const pathname = usePathname();
  const { data: business } = useQuery({ queryKey: myBusinessKey, queryFn: getMyBusiness });
  const { data: contact } = useSupportContact();
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <div className="flex h-full flex-col rounded-3xl bg-card p-5">
      <Link href="/espace" onClick={onNavigate} className="px-2 py-2" aria-label="Rabotka Business — tableau de bord">
        {/* The dark-text lockup on white; the white one in the dark theme. */}
        <span className="dark:hidden">
          <BusinessLockup />
        </span>
        <span className="hidden dark:inline">
          <BusinessLockup inverse />
        </span>
      </Link>

      <p className="mt-8 mb-3 px-3 text-muted-foreground text-sm">Navigation</p>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon, soon }) => {
          if (soon) {
            return (
              <span
                key={href}
                aria-disabled
                className="flex h-12 cursor-not-allowed items-center gap-3 rounded-2xl px-3 text-[15px] text-muted-foreground/60"
              >
                <Icon className="size-5" />
                <span className="flex-1">{label}</span>
                <span className="rounded-full bg-page px-2 py-0.5 text-[11px] text-muted-foreground">Bientôt</span>
              </span>
            );
          }
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-12 items-center gap-3 rounded-2xl px-3 font-medium text-[15px] transition-colors",
                active ? "bg-brand-lime text-[#0f2414]" : "text-muted-foreground hover:bg-page hover:text-foreground",
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1 pt-6">
        <a
          href={contact?.email ? `mailto:${contact.email}` : "mailto:contact@rabotka.work"}
          className="flex h-12 items-center gap-3 rounded-2xl px-3 text-[15px] text-muted-foreground transition-colors hover:bg-page hover:text-foreground"
        >
          <IconHelpCircle className="size-5" />
          Aide
        </a>

        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-page p-3">
          <Avatar className="size-10 rounded-xl">
            {business?.logoUrl && <AvatarImage src={business.logoUrl} alt="" className="object-cover" />}
            <AvatarFallback className="rounded-xl bg-brand-lime font-semibold text-[#0f2414]">
              {business?.name ? getInitials(business.name) : ""}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-sm">{business?.name ?? "Mon organisation"}</p>
            <p className="truncate text-muted-foreground text-xs">Compte entreprise</p>
          </div>
          <button
            type="button"
            onClick={() => setConfirmLogout(true)}
            aria-label="Se déconnecter"
            className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          >
            <IconLogout className="size-5" />
          </button>
        </div>
      </div>
      <LogoutDialog open={confirmLogout} onOpenChange={setConfirmLogout} />
    </div>
  );
}
