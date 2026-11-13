"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IconBuilding,
  IconChevronDown,
  IconCreditCard,
  IconDiscountCheckFilled,
  IconLogout,
  IconMail,
  IconMapPin,
  IconUsersGroup,
} from "@tabler/icons-react";

import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { isAdmin } from "#/features/team/member-access";
import { useMember } from "#/features/team/use-member";
import { useSessionUser } from "#/hooks/use-session-user";
import { friendlyError } from "#/lib/api/friendly-error";
import { meKey, ROLE_LABEL, updateMe } from "#/lib/api/team-controller";
import { getMyBusiness, getMySubscription, myBusinessKey, mySubscriptionKey } from "#/lib/api/business-controller";
import type { SubscriptionStatus } from "#/lib/api/types";
import { cn, getInitials } from "#/lib/utils";
import { LogoutDialog } from "./logout-dialog";

const PLAN_STATUS: Partial<Record<SubscriptionStatus, { label: string; className: string }>> = {
  TRIAL: { label: "Essai gratuit", className: "bg-chip-violet text-chip-violet-foreground" },
  ACTIVE: { label: "Actif", className: "bg-chip-green text-chip-green-foreground" },
};

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

/** The signed-in person in the header: avatar, name, email, sign-out. */
export function AccountMenu() {
  const { data: user } = useSessionUser();
  // The organisation (its owner, name and plan): the login's cache is gone after a reload.
  const { data: business } = useQuery({ queryKey: myBusinessKey, queryFn: getMyBusiness });
  const [confirmLogout, setConfirmLogout] = useState(false);
  const { data: subscription } = useQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription });
  const { member, role } = useMember();
  const queryClient = useQueryClient();
  const emails = useMutation({
    mutationFn: (emailsOn: boolean) => updateMe({ emailsOn }),
    onSuccess: (me) => {
      queryClient.setQueryData(meKey, me);
      toast.success(me.emailsOn ? "Vous recevrez les e-mails de l'espace." : "Vous ne recevrez plus les e-mails de l'espace.");
    },
    onError: (err) => toast.error(friendlyError(err, "Le réglage n'a pas pu être enregistré.")),
  });
  // A team member is not the account's profile: its own name and address.
  const asMember = member && !member.isOwner;
  // The person, not the organisation: the holder's own row names them too.
  const profileName = user ? `${user.first_name} ${user.last_name}`.trim() : "";
  const name = member?.name?.trim() || profileName;
  // After a reload the session cache is empty: the owner comes with the organisation.
  const owner = business?.owner;
  const person = name || (owner ? `${owner.firstName} ${owner.lastName}`.trim() : "");
  const personEmail = asMember ? member.email : (user?.email ?? owner?.email ?? null);
  const admin = isAdmin(role);
  const place = [business?.categoryLabel, business?.city ?? business?.countryName].filter(Boolean).join(" · ");
  const plan = subscription?.entitlements;
  const planStatus = plan?.status ? PLAN_STATUS[plan.status] : undefined;

  // The person's initials, never a picture: the account's picture is the
  // organisation's logo, already at the top of the sidebar.
  const avatar = (size: string) => (
    <Avatar className={size}>
      <AvatarFallback className="rounded-[inherit] bg-brand-lime font-semibold text-[#0f2414]">
        {person ? getInitials(person) : business?.name ? getInitials(business.name) : ""}
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
            <span className="max-w-44 truncate text-muted-foreground text-xs">
              {asMember ? `${ROLE_LABEL[member.role]} · ${business?.name ?? ""}` : (personEmail ?? "Compte entreprise")}
            </span>
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
          <div className="space-y-3 rounded-2xl bg-page p-3">
            <div className="flex items-center gap-3">
              {avatar("size-12")}
              <div className="min-w-0">
                <p className="flex items-center gap-1 font-semibold">
                  <span className="truncate">{business?.name || person || "Mon compte"}</span>
                  {business?.verificationStatus === "VERIFIED" && (
                    <IconDiscountCheckFilled className="size-4 shrink-0 text-whatsapp" aria-label="Organisation vérifiée" />
                  )}
                </p>
                {place && (
                  <p className="flex items-center gap-1 text-muted-foreground text-xs">
                    <IconMapPin className="size-3.5 shrink-0" />
                    <span className="truncate">{place}</span>
                  </p>
                )}
                {business?.verificationStatus === "PENDING" && (
                  <p className="text-chip-amber-foreground text-xs">Vérification en cours</p>
                )}
              </div>
            </div>

            {(person || personEmail) && (
              <div className="flex min-w-0 items-center gap-2 rounded-xl bg-card px-3 py-2">
                <div className="min-w-0 flex-1">
                  {person && <p className="truncate font-medium text-sm">{person}</p>}
                  {personEmail && <p className="truncate text-muted-foreground text-xs">{personEmail}</p>}
                </div>
                {role && (
                  <span className="shrink-0 rounded-full bg-page px-2.5 py-0.5 font-medium text-xs">{ROLE_LABEL[role]}</span>
                )}
              </div>
            )}

            {admin && plan && (
              <Link
                href="/espace/abonnement"
                className="flex items-center justify-between gap-2 rounded-xl bg-card px-3 py-2 text-sm hover:bg-card/70"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{plan.plan ? `Plan ${plan.plan.name}` : "Aucun abonnement"}</span>
                  <span className="block truncate text-muted-foreground text-xs">
                    {plan.plan && plan.endsAt
                      ? `${plan.status === "TRIAL" ? "Essai jusqu'au" : "Jusqu'au"} ${shortDate(plan.endsAt)}`
                      : "Choisir une formule"}
                  </span>
                </span>
                {planStatus && (
                  <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 font-medium text-xs", planStatus.className)}>
                    {planStatus.label}
                  </span>
                )}
              </Link>
            )}
          </div>

          <div aria-hidden className="mx-3 my-1 h-px bg-border/70" />

          {member && (
            <DropdownMenuItem
              onSelect={(e) => {
                // A switch: the menu stays open to show the new state.
                e.preventDefault();
                if (!emails.isPending) emails.mutate(!member.emailsOn);
              }}
              role="menuitemcheckbox"
              aria-checked={member.emailsOn}
              className="cursor-pointer gap-3 rounded-2xl px-3 py-2.5 text-sm focus:bg-page"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-page">
                <IconMail className="size-4" />
              </span>
              <span className="flex-1">Recevoir les e-mails</span>
              <span className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", member.emailsOn ? "bg-whatsapp-dark" : "bg-foreground/15")}>
                <span
                  className={cn(
                    "absolute top-0.5 left-0 size-4 rounded-full bg-white transition-transform",
                    member.emailsOn ? "translate-x-4.5" : "translate-x-0.5",
                  )}
                />
              </span>
            </DropdownMenuItem>
          )}
          {admin && (
            <DropdownMenuItem asChild className="cursor-pointer gap-3 rounded-2xl px-3 py-2.5 text-sm focus:bg-page">
              <Link href="/espace/equipe">
                <span className="flex size-8 items-center justify-center rounded-full bg-page">
                  <IconUsersGroup className="size-4" />
                </span>
                Équipe
              </Link>
            </DropdownMenuItem>
          )}
          {admin && (
          <DropdownMenuItem asChild className="cursor-pointer gap-3 rounded-2xl px-3 py-2.5 text-sm focus:bg-page">
            <Link href="/espace/organisation">
              <span className="flex size-8 items-center justify-center rounded-full bg-page">
                <IconBuilding className="size-4" />
              </span>
              Organisation
            </Link>
          </DropdownMenuItem>
          )}
          {admin && (
          <DropdownMenuItem asChild className="cursor-pointer gap-3 rounded-2xl px-3 py-2.5 text-sm focus:bg-page">
            <Link href="/espace/abonnement">
              <span className="flex size-8 items-center justify-center rounded-full bg-page">
                <IconCreditCard className="size-4" />
              </span>
              Abonnement
            </Link>
          </DropdownMenuItem>
          )}

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
