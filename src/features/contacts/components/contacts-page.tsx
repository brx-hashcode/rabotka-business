"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { IconCopy, IconMail, IconPhone, IconSearch, IconUserCheck } from "@tabler/icons-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Input } from "#/components/ui/input";
import { Skeleton } from "#/components/ui/skeleton";
import { getMyContacts, myContactsKey } from "#/lib/api/business-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import type { ContactedProfile } from "#/lib/api/types";
import { getInitials } from "#/lib/utils";

const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/**
 * The workers whose contact the business unlocked, with the phone and email
 * the unlock paid for — a business gets no WhatsApp, so this is where it
 * reads them. `#w-<workerId>` (from an offer's candidate) scrolls to one.
 */
export function ContactsPage() {
  const contacts = useQuery({ queryKey: myContactsKey, queryFn: getMyContacts });
  const [q, setQ] = useState("");

  const shown = useMemo(() => {
    const needle = fold(q.trim());
    if (!needle) return contacts.data ?? [];
    return (contacts.data ?? []).filter((c) =>
      fold([c.firstName, c.lastName, c.categoryName, c.city, c.phone, c.email, ...c.offers.map((o) => o.title)].join(" ")).includes(
        needle,
      ),
    );
  }, [contacts.data, q]);

  useEffect(() => {
    if (!contacts.data) return;
    const id = globalThis.location.hash.slice(1);
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [contacts.data]);

  return (
    <div className="w-full space-y-6 pt-2">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="font-semibold text-3xl tracking-tight">Profils contactés</h1>
          <p className="text-muted-foreground">
            Les coordonnées des candidats dont le contact est débloqué : appelez-les ou écrivez-leur directement.
          </p>
        </div>
        {(contacts.data?.length ?? 0) > 0 && (
          <div className="relative w-full sm:w-80">
            <IconSearch className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nom, métier, ville, offre…"
              className="h-12 rounded-full border-0 bg-card pl-11 shadow-none"
            />
          </div>
        )}
      </div>

      {contacts.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-56 rounded-3xl" />
          ))}
        </div>
      ) : !contacts.data ? (
        <p className="rounded-3xl bg-card p-6 text-muted-foreground">
          {friendlyError(contacts.error, "Vos contacts sont indisponibles pour le moment.")}
        </p>
      ) : contacts.data.length === 0 ? (
        <section className="flex flex-col items-center gap-3 rounded-3xl bg-card px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-page">
            <IconUserCheck className="size-6 text-muted-foreground" />
          </span>
          <p className="font-medium">Aucun contact débloqué pour le moment</p>
          <p className="max-w-md text-muted-foreground text-sm">
            Retenez un candidat sur l&apos;une de vos offres : ses coordonnées apparaissent ici dès que le déblocage est réglé.
          </p>
          <Link href="/espace/offres" className="mt-2 font-medium text-sm text-whatsapp-dark hover:underline">
            Voir mes offres
          </Link>
        </section>
      ) : shown.length === 0 ? (
        <p className="rounded-3xl bg-card p-6 text-muted-foreground">Aucun contact ne correspond à « {q} ».</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {shown.map((c) => (
            <ContactCard key={c.workerId} contact={c} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ContactCard({ contact: c }: Readonly<{ contact: ContactedProfile }>) {
  const name = `${c.firstName} ${c.lastName}`.trim();
  const subtitle = [c.categoryName, c.city].filter(Boolean).join(" · ");
  return (
    <li
      id={`w-${c.workerId}`}
      // The one an offer's candidate pointed at (`#w-<id>`) stands out.
      className="flex flex-col gap-5 rounded-3xl bg-card p-6 target:ring-2 target:ring-whatsapp-dark"
    >
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
    </li>
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
