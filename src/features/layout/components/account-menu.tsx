"use client";

import { useState } from "react";
import Link from "next/link";
import { IconBuilding, IconChevronDown, IconCreditCard, IconLogout } from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";

import { useSessionUser } from "#/hooks/use-session-user";
import { getMyBusiness, myBusinessKey } from "#/lib/api/business-controller";
import { getInitials } from "#/lib/utils";
import { LogoutDialog } from "./logout-dialog";

/** The signed-in person in the header: avatar, name, email, sign-out. */
export function AccountMenu() {
  const { data: user } = useSessionUser();
  // The organisation, for its logo: the login's cache is gone after a reload.
  const { data: business } = useQuery({ queryKey: myBusinessKey, queryFn: getMyBusiness });
  const picture = user?.avatar_url ?? business?.logoUrl ?? null;
  const [confirmLogout, setConfirmLogout] = useState(false);
  const name = user ? `${user.first_name} ${user.last_name}`.trim() : "";

  const avatar = (size: string) => (
    <Avatar className={size}>
      {picture && <AvatarImage src={picture} alt={name} className="object-cover" />}
      <AvatarFallback className="rounded-[inherit] bg-brand-lime font-medium text-[#0f2414]">
        {name ? getInitials(name) : business?.name ? getInitials(business.name) : ""}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="group flex h-12 items-center gap-2.5 rounded-2xl bg-card pr-2 pl-1.5 outline-none transition-colors hover:bg-card/70 focus-visible:ring-2 focus-visible:ring-ink/40 sm:pr-3"
          aria-label="Mon compte"
        >
          {avatar("size-9 rounded-xl")}
          <span className="hidden min-w-0 flex-col text-left leading-tight md:flex">
            <span className="max-w-44 truncate font-medium text-sm">{name || business?.name || "Mon compte"}</span>
            <span className="max-w-44 truncate text-muted-foreground text-xs">{user?.email ?? "Compte entreprise"}</span>
          </span>
          <IconChevronDown className="hidden size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180 sm:block" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={10}
          // Closing by tap must not hand focus back to the trigger: on phones
          // that left a focus ring around the avatar.
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="w-80 rounded-3xl border-0 bg-card p-2 shadow-soft"
        >
          <div className="flex items-center gap-3 rounded-2xl bg-page p-3">
            {avatar("size-12")}
            <div className="min-w-0">
              <p className="truncate font-semibold">{name || "Mon compte"}</p>
              {user?.email && <p className="truncate text-muted-foreground text-sm">{user.email}</p>}
            </div>
          </div>

          <div aria-hidden className="mx-3 my-1 h-px bg-border/70" />

          <DropdownMenuItem asChild className="cursor-pointer gap-3 rounded-2xl px-3 py-2.5 text-sm focus:bg-page">
            <Link href="/espace/organisation">
              <span className="flex size-8 items-center justify-center rounded-full bg-page">
                <IconBuilding className="size-4" />
              </span>
              Mon organisation
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer gap-3 rounded-2xl px-3 py-2.5 text-sm focus:bg-page">
            <Link href="/espace/abonnement">
              <span className="flex size-8 items-center justify-center rounded-full bg-page">
                <IconCreditCard className="size-4" />
              </span>
              Abonnement
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={() => setConfirmLogout(true)}
            className="cursor-pointer gap-3 rounded-2xl px-3 py-2.5 text-sm focus:bg-page"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-page">
              <IconLogout className="size-4" />
            </span>
            Se déconnecter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <LogoutDialog open={confirmLogout} onOpenChange={setConfirmLogout} />
    </>
  );
}
