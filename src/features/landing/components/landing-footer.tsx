"use client";

import Link from "next/link";
import { IconMail, IconPhone } from "@tabler/icons-react";

import { BrandLogo } from "#/components/brand-logo";
import { Button } from "#/components/ui/button";
import { useSupportContact } from "#/hooks/use-support-contact";
import { PUBLIC_SITE, SIGN_IN_HREF, SIGN_UP_HREF } from "../content";

/** The closing call to action, then Rabotka's contact as admins set it. */
export function ClosingCta() {
  const { data: contact } = useSupportContact();

  return (
    <section id="contact" className="scroll-mt-20 px-4 pb-20 sm:px-6">
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-header px-6 py-14 text-center text-header-foreground sm:py-20">
          <h2 className="max-w-2xl font-semibold text-3xl tracking-tight sm:text-5xl">
            Prêt à recruter ?
          </h2>
          <p className="max-w-xl text-header-muted text-lg">
            Créez votre espace en quelques minutes avec l&apos;adresse email de
            votre organisation.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant="ghost"
              size="xl"
              render={<Link href={SIGN_UP_HREF} />}
              className="rounded-full bg-ink px-6 text-white hover:bg-ink/90"
            >
              Créer mon espace entreprise
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

        <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_1fr]">
          <div className="space-y-1 rounded-3xl bg-card p-6">
            <h3 className="font-semibold text-lg">Une question avant de vous lancer ?</h3>
            <p className="text-muted-foreground text-sm">
              Notre équipe vous répond et vous aide à créer votre espace.
            </p>
          </div>
          {contact?.email && (
            <a href={`mailto:${contact.email}`} className="flex items-center gap-4 rounded-3xl bg-card p-6 transition-colors hover:bg-card/70">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-page">
                <IconMail className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-medium">Écrivez-nous</span>
                <span className="block truncate text-muted-foreground text-sm">{contact.email}</span>
              </span>
            </a>
          )}
          {contact?.phone && (
            <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="flex items-center gap-4 rounded-3xl bg-card p-6 transition-colors hover:bg-card/70">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-page">
                <IconPhone className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-medium">Appelez-nous</span>
                <span className="block truncate text-muted-foreground text-sm">{contact.phone}</span>
              </span>
            </a>
          )}
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
