"use client";

import Link from "next/link";
import { IconBrandWhatsapp, IconCopy, IconMail, IconPhone } from "@tabler/icons-react";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import type { ContactedProfile } from "#/lib/api/types";
import { cn, getInitials } from "#/lib/utils";

/**
 * A worker's unlocked details: who, how to reach them (call, write, copy),
 * through which offers, since when. On « Profils contactés » and in the
 * contact dialog of a hired candidate.
 */
export function ContactDetails({ contact: c }: Readonly<{ contact: ContactedProfile }>) {
  const name = `${c.firstName} ${c.lastName}`.trim();
  const subtitle = [c.categoryName, c.city].filter(Boolean).join(" · ");
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-5">
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
        {/* One number for both is the common case: one row, both ways. */}
        <Channel
          icon={IconBrandWhatsapp}
          tone="whatsapp"
          label={c.directPhone ? "WhatsApp" : "WhatsApp et appels"}
          value={readable(c.phone)}
          copyValue={c.phone}
          actions={[
            { label: "WhatsApp", icon: IconBrandWhatsapp, href: `https://wa.me/${digits(c.phone)}`, external: true, tone: "whatsapp" },
            ...(c.directPhone ? [] : [{ label: "Appeler", icon: IconPhone, href: `tel:${c.phone}` }]),
          ]}
        />
        {c.directPhone && (
          <Channel
            icon={IconPhone}
            label="Appel direct"
            value={readable(c.directPhone)}
            copyValue={c.directPhone}
            actions={[{ label: "Appeler", icon: IconPhone, href: `tel:${c.directPhone.replace(/\s+/g, "")}` }]}
          />
        )}
        {c.email && (
          <Channel
            icon={IconMail}
            label="E-mail"
            value={c.email}
            copyValue={c.email}
            actions={[{ label: "Écrire", icon: IconMail, href: `mailto:${c.email}` }]}
          />
        )}
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
          Obtenu le {new Date(c.unlockedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>
    </div>
  );
}

/** « +242 06 991 76 86 », as people read it; the raw value if it does not parse. */
const readable = (n: string) => parsePhoneNumberFromString(n)?.formatInternational() ?? n;
const digits = (n: string) => n.replace(/\D/g, "");

type ChannelAction = { label: string; icon: typeof IconPhone; href: string; external?: boolean; tone?: "whatsapp" };

/** One way to reach the worker: what it is, the value, its actions and a copy button. */
function Channel({
  icon: Icon,
  tone,
  label,
  value,
  copyValue,
  actions,
}: Readonly<{
  icon: typeof IconPhone;
  tone?: "whatsapp";
  label: string;
  value: string;
  copyValue: string;
  actions: ChannelAction[];
}>) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(copyValue);
      toast.success("Copié.");
    } catch {
      toast.error("La copie n'a pas fonctionné.");
    }
  }
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-2xl bg-page p-2 pl-4 sm:gap-3 sm:pl-2.5">
      <span
        className={cn(
          // Not on a phone: the room goes to the number, which must read whole.
          "hidden size-10 shrink-0 items-center justify-center rounded-xl sm:flex",
          tone === "whatsapp" ? "bg-[#25D366]/15 text-[#128C4B] dark:text-[#25D366]" : "bg-card text-muted-foreground",
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-muted-foreground text-xs">{label}</p>
        <p className="truncate font-medium text-[15px] tabular-nums">{value}</p>
      </div>
      <button
        type="button"
        onClick={() => void copy()}
        aria-label={`Copier : ${label}`}
        title="Copier"
        className="flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-card hover:text-foreground"
      >
        <IconCopy className="size-4" />
      </button>
      {actions.map((a) => (
        <a
          key={a.label}
          href={a.href}
          aria-label={a.label}
          title={a.label}
          {...(a.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className={cn(
            // Icon only on a phone, where the row has no room for words.
            "inline-flex size-9 shrink-0 items-center justify-center gap-1.5 rounded-full font-medium text-sm sm:w-auto sm:px-4",
            a.tone === "whatsapp" ? "bg-[#25D366] text-[#0f2414] hover:bg-[#25D366]/90" : "bg-ink text-white hover:bg-ink/90",
          )}
        >
          <a.icon className="size-4 sm:hidden" />
          <span className="hidden sm:inline">{a.label}</span>
        </a>
      ))}
    </div>
  );
}
