"use client";

import Link from "next/link";
import { IconCopy, IconMail, IconPhone } from "@tabler/icons-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import type { ContactedProfile } from "#/lib/api/types";
import { getInitials } from "#/lib/utils";

/**
 * A worker's unlocked details: who, how to reach them (call, write, copy),
 * through which offers, since when. On « Profils contactés » and in the
 * contact dialog of a hired candidate.
 */
export function ContactDetails({ contact: c }: Readonly<{ contact: ContactedProfile }>) {
  const name = `${c.firstName} ${c.lastName}`.trim();
  const subtitle = [c.categoryName, c.city].filter(Boolean).join(" · ");
  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="flex items-center gap-4">
        <Avatar className="size-14 rounded-2xl">
          {c.avatarUrl && <AvatarImage src={c.avatarUrl} alt="" className="object-cover" />}
          <AvatarFallback className="rounded-2xl bg-brand-lime font-semibold text-[#0f2414]">{getInitials(name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <Link href={`/espace/candidats/${c.workerId}`} className="block truncate font-semibold text-lg hover:underline">
            {name}
          </Link>
          {subtitle && <p className="truncate text-muted-foreground text-sm">{subtitle}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Channel icon={IconPhone} href={`tel:${c.phone.replace(/\s+/g, "")}`} value={c.phone} label="Téléphone" />
        {c.email && <Channel icon={IconMail} href={`mailto:${c.email}`} value={c.email} label="E-mail" />}
      </div>

      <div className="mt-auto space-y-2">
        {c.offers.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {c.offers.map((o) => (
              <Link
                key={o.id}
                href={`/espace/offres/${o.id}`}
                className="max-w-full truncate rounded-full bg-page px-2.5 py-1 font-medium text-xs hover:bg-page/70"
              >
                {o.title}
              </Link>
            ))}
          </div>
        )}
        <p className="text-muted-foreground text-xs">
          Débloqué le {new Date(c.unlockedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>
    </div>
  );
}

function Channel({
  icon: Icon,
  href,
  value,
  label,
}: Readonly<{ icon: typeof IconPhone; href: string; value: string; label: string }>) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copié.`);
    } catch {
      toast.error("La copie n'a pas fonctionné.");
    }
  }
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-page p-2 pl-3">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <a href={href} className="min-w-0 flex-1 truncate font-medium text-sm hover:underline">
        {value}
      </a>
      <button
        type="button"
        onClick={() => void copy()}
        aria-label={`Copier ${label.toLowerCase()}`}
        className="flex size-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-card hover:text-foreground"
      >
        <IconCopy className="size-4" />
      </button>
    </div>
  );
}
