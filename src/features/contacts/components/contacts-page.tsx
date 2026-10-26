"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { IconSearch, IconUserCheck } from "@tabler/icons-react";

import { Input } from "#/components/ui/input";
import { CardGridSkeleton } from "#/components/page-skeletons";
import { getMyContacts, myContactsKey } from "#/lib/api/business-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import type { ContactedProfile } from "#/lib/api/types";
import { ContactDetails } from "./contact-details";

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
            Les candidats dont vous avez obtenu le contact : appelez-les ou écrivez-leur directement.
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
        <CardGridSkeleton kind="contact" />
      ) : !contacts.data ? (
        <p className="rounded-3xl bg-card p-6 text-muted-foreground">
          {friendlyError(contacts.error, "Vos contacts sont indisponibles pour le moment.")}
        </p>
      ) : contacts.data.length === 0 ? (
        <section className="flex flex-col items-center gap-3 rounded-3xl bg-card px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-page">
            <IconUserCheck className="size-6 text-muted-foreground" />
          </span>
          <p className="font-medium">Aucun contact obtenu pour le moment</p>
          <p className="max-w-md text-muted-foreground text-sm">
            Retenez un candidat sur l&apos;une de vos offres : ses coordonnées apparaissent ici dès qu&apos;il a confirmé.
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
  return (
    <li
      id={`w-${c.workerId}`}
      // The one an offer's candidate pointed at (`#w-<id>`) stands out.
      className="flex flex-col rounded-3xl bg-card p-6 target:ring-2 target:ring-whatsapp-dark"
    >
      <ContactDetails contact={c} />
    </li>
  );
}
