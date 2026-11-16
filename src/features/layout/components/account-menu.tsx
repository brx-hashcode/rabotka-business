"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IconBuilding,
  IconLanguage,
  IconChevronDown,
  IconCreditCard,
  IconDiscountCheckFilled,
  IconLogout,
  IconMail,
  IconMapPin,
  IconUsersGroup,
} from "@tabler/icons-react";

import { LanguageSwitch } from "#/components/language-switch";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { INTL_LOCALE, OFFERED_LOCALES, type Locale } from "#/i18n/config";
import { isAdmin } from "#/features/team/member-access";
import { useMember } from "#/features/team/use-member";
import { useSessionUser } from "#/hooks/use-session-user";
import { useFriendlyError } from "#/lib/api/use-friendly-error";
import { meKey, updateMe } from "#/lib/api/team-controller";
import { getMyBusiness, getMySubscription, myBusinessKey, mySubscriptionKey } from "#/lib/api/business-controller";
import type { SubscriptionStatus } from "#/lib/api/types";
import { cn, getInitials } from "#/lib/utils";
import { LogoutDialog } from "./logout-dialog";

const PLAN_STATUS: Partial<Record<SubscriptionStatus, { label: "trial" | "active"; className: string }>> = {
  TRIAL: { label: "trial", className: "bg-chip-violet text-chip-violet-foreground" },
  ACTIVE: { label: "active", className: "bg-chip-green text-chip-green-foreground" },
};

const shortDate = (iso: string, locale: Locale) =>
  new Date(iso).toLocaleDateString(INTL_LOCALE[locale], { day: "numeric", month: "short" });

/** The signed-in person in the header: avatar, name, email, sign-out. */
export function AccountMenu() {
  const { data: user } = useSessionUser();
  // The organisation (its owner, name and plan): the login's cache is gone after a reload.
  const { data: business } = useQuery({ queryKey: myBusinessKey, queryFn: getMyBusiness });
  const [confirmLogout, setConfirmLogout] = useState(false);
  const { data: subscription } = useQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription });
  const { member, role } = useMember();
  const queryClient = useQueryClient();
  const tLanguage = useTranslations("common.language");
  const t = useTranslations("layout.account");
  const tNav = useTranslations("layout.nav");
  const tLabels = useTranslations("labels");
  const locale = useLocale();
  const friendlyError = useFriendlyError();
  const emails = useMutation({
    mutationFn: (emailsOn: boolean) => updateMe({ emailsOn }),
    onSuccess: (me) => {
      queryClient.setQueryData(meKey, me);
      toast.success(me.emailsOn ? t("emailsOn") : t("emailsOff"));
    },
    onError: (err) => toast.error(friendlyError(err, t("emailsFailed"))),
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
  const avatar = (
    <Avatar className="size-9 rounded-xl">
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
          aria-label={t("myAccount")}
        >
          {avatar}
          <span className="hidden min-w-0 flex-col text-left leading-tight md:flex">
            <span className="max-w-44 truncate font-medium text-sm">{name || business?.name || t("myAccount")}</span>
            <span className="max-w-44 truncate text-muted-foreground text-xs">
              {asMember ? `${tLabels(`role.${member.role}`)} · ${business?.name ?? ""}` : (personEmail ?? t("businessAccount"))}
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
          {/* Who the menu is for, once: the organisation and the reader's role. Their name and address are on the button that opens it. */}
          <div className="rounded-2xl bg-page px-3.5 py-3">
            <div className="flex items-center gap-2">
              <p className="flex min-w-0 flex-1 items-center gap-1 font-semibold">
                <span className="truncate">{business?.name || person || t("myAccount")}</span>
                {business?.verificationStatus === "VERIFIED" && (
                  <IconDiscountCheckFilled className="size-4 shrink-0 text-whatsapp" aria-label={t("verified")} />
                )}
              </p>
              {role && (
                <span className="shrink-0 rounded-full bg-card px-2.5 py-0.5 font-medium text-xs">{tLabels(`role.${role}`)}</span>
              )}
            </div>
            {place && (
              <p className="mt-0.5 flex items-center gap-1 text-muted-foreground text-xs">
                <IconMapPin className="size-3.5 shrink-0" />
                <span className="truncate">{place}</span>
              </p>
            )}
            {business?.verificationStatus === "PENDING" && <p className="mt-0.5 text-chip-amber-foreground text-xs">{t("verifying")}</p>}
            {/* On a phone the button shows the initials only: the name and address are said here. */}
            {(person || personEmail) && (
              <p className="mt-1 truncate text-muted-foreground text-xs md:hidden">{[person, personEmail].filter(Boolean).join(" · ")}</p>
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
              <span className="flex-1">{t("emails")}</span>
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
                {tNav("team")}
              </Link>
            </DropdownMenuItem>
          )}
          {admin && (
          <DropdownMenuItem asChild className="cursor-pointer gap-3 rounded-2xl px-3 py-2.5 text-sm focus:bg-page">
            <Link href="/espace/organisation">
              <span className="flex size-8 items-center justify-center rounded-full bg-page">
                <IconBuilding className="size-4" />
              </span>
              {tNav("organisation")}
            </Link>
          </DropdownMenuItem>
          )}
          {admin && (
            <DropdownMenuItem asChild className="cursor-pointer gap-3 rounded-2xl px-3 py-2.5 text-sm focus:bg-page">
              <Link href="/espace/abonnement">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-page">
                  <IconCreditCard className="size-4" />
                </span>
                {/* The plan is said on its own line: one place for the subscription. */}
                <span className="min-w-0 flex-1">
                  <span className="block">{tNav("subscription")}</span>
                  {plan && (
                    <span className="block truncate text-muted-foreground text-xs">
                      {plan.plan
                        ? [
                            plan.plan.name,
                            plan.endsAt && t(plan.status === "TRIAL" ? "trialUntil" : "until", { date: shortDate(plan.endsAt, locale) }),
                          ]
                            .filter(Boolean)
                            .join(" · ")
                        : t("choosePlan")}
                    </span>
                  )}
                </span>
                {planStatus && (
                  <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 font-medium text-xs", planStatus.className)}>
                    {t(planStatus.label)}
                  </span>
                )}
              </Link>
            </DropdownMenuItem>
          )}

          {OFFERED_LOCALES.length > 1 && (
            // Not a menu item: the pill's own buttons are the choices.
            <div className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm">
              <span className="flex size-8 items-center justify-center rounded-full bg-page">
                <IconLanguage className="size-4" />
              </span>
              <span className="flex-1">{tLanguage("label")}</span>
              <LanguageSwitch />
            </div>
          )}

          <DropdownMenuItem
            onSelect={() => setConfirmLogout(true)}
            className="cursor-pointer gap-3 rounded-2xl px-3 py-2.5 text-sm focus:bg-page"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-page">
              <IconLogout className="size-4" />
            </span>
            {t("signOut")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <LogoutDialog open={confirmLogout} onOpenChange={setConfirmLogout} />
    </>
  );
}
