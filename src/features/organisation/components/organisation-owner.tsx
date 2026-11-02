"use client";

import { IconCalendar, IconMail, IconPhone, IconUser, type Icon as TablerIcon } from "@tabler/icons-react";
import { parsePhoneNumberFromString } from "libphonenumber-js";

import type { MyBusiness } from "#/lib/api/types";
import { getInitials } from "#/lib/utils";

const readable = (n: string) => parsePhoneNumberFromString(n)?.formatInternational() ?? n;

/**
 * The person behind the account: who opened it, how they sign in and are
 * reached. Read only here — the e-mail is the login, so a change goes
 * through the team.
 */
export function OrganisationOwner({ owner }: Readonly<{ owner: NonNullable<MyBusiness["owner"]> }>) {
  const name = `${owner.firstName} ${owner.lastName}`.trim();
  return (
    <section className="space-y-4 rounded-3xl bg-card p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-lime font-semibold text-[#0f2414]">
          {getInitials(name) || <IconUser className="size-5" />}
        </span>
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs">Responsable du compte</p>
          <h2 className="truncate font-semibold text-lg">{name}</h2>
        </div>
      </div>
      <dl className="space-y-2">
        {owner.email && <Row icon={IconMail} label="E-mail de connexion" value={owner.email} />}
        <Row icon={IconPhone} label="Téléphone" value={readable(owner.phone)} />
        {owner.directPhone && owner.directPhone !== owner.phone && (
          <Row icon={IconPhone} label="Appel direct" value={readable(owner.directPhone)} />
        )}
        <Row
          icon={IconCalendar}
          label="Compte créé le"
          value={new Date(owner.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        />
      </dl>
    </section>
  );
}

function Row({ icon: Icon, label, value }: Readonly<{ icon: TablerIcon; label: string; value: string }>) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-page p-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card">
        <Icon className="size-4 text-muted-foreground" />
      </span>
      <div className="min-w-0">
        <dt className="text-muted-foreground text-xs">{label}</dt>
        <dd className="truncate font-medium text-sm">{value}</dd>
      </div>
    </div>
  );
}
