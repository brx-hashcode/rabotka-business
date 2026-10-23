"use client";

import Link from "next/link";
import { IconMail, IconMapPin, IconPhone } from "@tabler/icons-react";

import { BrandLogo } from "#/components/brand-logo";
import { Button } from "#/components/ui/button";
import { useSupportContact } from "#/hooks/use-support-contact";
import type { SupportContact } from "#/lib/api/public-controller";
import { PUBLIC_SITE, SIGN_IN_HREF, SIGN_UP_HREF } from "../content";

function contactCards(contact: SupportContact | undefined) {
  if (!contact) return [];
  return [
    contact.email && {
      label: "Écrire à nos équipes",
      value: contact.email,
      href: `mailto:${contact.email}`,
      icon: IconMail,
    },
    contact.phone && {
      label: "Nous appeler",
      value: contact.phone,
      href: `tel:${contact.phone.replace(/\s/g, "")}`,
      icon: IconPhone,
    },
    contact.address && {
      label: "Nous rendre visite",
      value: contact.address,
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`,
      icon: IconMapPin,
    },
  ].filter((card) => !!card);
}

/** The closing call to action, then Rabotka's contact as admins set it. */
export function ClosingCta() {
  const { data: contact } = useSupportContact();

  return (
    <section id="contact" className="scroll-mt-20 px-4 pb-20 sm:px-6">
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-header px-6 py-14 text-center text-header-foreground sm:py-20">
          <h2 className="max-w-2xl font-semibold text-3xl tracking-tight sm:text-5xl">
            Prêt à renforcer vos équipes ?
          </h2>
          <p className="max-w-xl text-header-muted text-lg">
            Ouvrez votre compte entreprise en quelques minutes avec
            l&apos;adresse email professionnelle de votre organisation.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant="ghost"
              size="xl"
              render={<Link href={SIGN_UP_HREF} />}
              className="rounded-full bg-ink px-6 text-white hover:bg-ink/90"
            >
              Ouvrir un compte entreprise
            </Button>
            <Button
              variant="ghost"
              size="xl"
              render={<Link href={SIGN_IN_HREF} />}
              className="rounded-full bg-card/70 px-6 hover:bg-card"
            >
              J&apos;ai déjà un compte
            </Button>
          </div>
        </div>

        {/* Rabotka's contact as admins set it (GET public/config/contact):
            a card per field that is filled in, none of it in the code. */}
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="space-y-1 rounded-3xl bg-card p-6 md:flex-[1.2]">
            <h3 className="font-semibold text-lg">Besoin d&apos;un accompagnement ?</h3>
            <p className="text-muted-foreground text-sm">
              Nos équipes vous conseillent et vous accompagnent dans la mise en
              place de votre compte.
            </p>
          </div>
          {contactCards(contact).map((card) => (
            <a
              key={card.label}
              href={card.href}
              {...(card.href.startsWith("https:") ? { target: "_blank", rel: "noreferrer" } : {})}
              className="flex items-center gap-4 rounded-3xl bg-card p-6 transition-colors hover:bg-card/70 md:flex-1"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-page">
                <card.icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-medium">{card.label}</span>
                <span className="block truncate text-muted-foreground text-sm">{card.value}</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

const LEGAL_LINKS = [
  { href: PUBLIC_SITE, label: "www.rabotka.work" },
  { href: `${PUBLIC_SITE}/terms`, label: "Conditions d'utilisation" },
  { href: `${PUBLIC_SITE}/privacy`, label: "Confidentialité" },
];

export function LandingFooter() {
  return (
    <footer className="bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <BrandLogo />
        <nav aria-label="Liens" className="flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground text-sm">
          {LEGAL_LINKS.map((link) => (
            <a key={link.label} href={link.href} className="hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>
        <p className="text-muted-foreground text-sm">© {new Date().getFullYear()} Rabotka</p>
      </div>
    </footer>
  );
}
