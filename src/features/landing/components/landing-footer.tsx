"use client";

import Link from "next/link";
import { IconMail, IconMapPin, IconPhone } from "@tabler/icons-react";

import { BrandLogo } from "#/components/brand-logo";
import { Button } from "#/components/ui/button";
import { useSupportContact } from "#/hooks/use-support-contact";
import type { SupportContact } from "#/lib/api/public-controller";
import {
  AUDIENCE_LINKS,
  PUBLIC_SITE,
  SIGN_IN_HREF,
  SIGN_UP_HREF,
  SOLUTION_LINKS,
  type NavLink,
} from "../content";

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
    <section id="contact" className="scroll-mt-20 px-4 pt-20 pb-20 sm:px-6 md:pt-28">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-header px-6 py-14 text-center text-header-foreground sm:py-20">
          <h2 className="max-w-2xl font-semibold text-3xl tracking-tight sm:text-5xl">
            Prêt à renforcer vos équipes ?
          </h2>
          <p className="max-w-xl text-header-muted text-lg">
            Ouvrez votre compte entreprise en quelques minutes avec
            l&apos;adresse e-mail professionnelle de votre organisation.
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

const FOOTER_COLUMNS: { title: string; links: NavLink[] }[] = [
  { title: "Solutions", links: SOLUTION_LINKS },
  { title: "Secteurs", links: AUDIENCE_LINKS },
  {
    title: "Ressources",
    links: [
      { href: "#demarche", label: "Notre démarche" },
      { href: "#faq", label: "Questions fréquentes" },
      { href: "#contact", label: "Contacter nos équipes" },
      { href: SIGN_IN_HREF, label: "Se connecter" },
      { href: SIGN_UP_HREF, label: "Ouvrir un compte entreprise" },
    ],
  },
  {
    title: "Rabotka",
    links: [
      { href: PUBLIC_SITE, label: "www.rabotka.work" },
      { href: `${PUBLIC_SITE}/terms`, label: "Conditions d'utilisation" },
      { href: `${PUBLIC_SITE}/privacy`, label: "Politique de confidentialité" },
    ],
  },
];

/**
 * The black footer: the brand with Rabotka's contact (as admins set it),
 * four columns of links, then the legal line.
 */
export function LandingFooter() {
  const { data: contact } = useSupportContact();
  const cards = contactCards(contact);

  return (
    <footer className="bg-[#0b0f0c] text-white">
      <div className="mx-auto w-full max-w-7xl px-4 pt-16 pb-10 sm:px-6 md:pt-20">
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-[1.4fr_repeat(4,1fr)] lg:gap-8">
          <div className="col-span-2 space-y-6 lg:col-span-1">
            <Link href="/" aria-label="Rabotka Business — accueil" className="inline-flex items-center gap-3">
              <BrandLogo tone="inverse" />
              <span aria-hidden className="h-6 w-px bg-white/25" />
              <span className="text-[17px]">Business</span>
            </Link>
            <p className="max-w-xs text-sm text-white/60">
              La plateforme de recrutement des entreprises, institutions et
              organisations : diffusion d&apos;offres, présélection de candidats
              vérifiés, recrutement accompagné.
            </p>
            {cards.length > 0 && (
              <ul className="space-y-3 text-sm">
                {cards.map((card) => (
                  <li key={card.label}>
                    <a
                      href={card.href}
                      {...(card.href.startsWith("https:") ? { target: "_blank", rel: "noreferrer" } : {})}
                      className="inline-flex items-center gap-3 text-white/80 transition-colors hover:text-white"
                    >
                      <card.icon className="size-4 shrink-0 text-header" />
                      {card.value}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <Button
              variant="ghost"
              render={<Link href={SIGN_UP_HREF} />}
              className="rounded-full bg-header px-5 text-header-foreground hover:bg-header/90"
            >
              Ouvrir un compte entreprise
            </Button>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title} className="space-y-4">
              <p className="font-semibold text-sm">{column.title}</p>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-white/60 transition-colors hover:text-white">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div aria-hidden className="mt-16 h-px bg-white/10" />
        <div className="flex flex-col gap-4 pt-8 text-sm text-white/50 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Rabotka. Tous droits réservés.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <a href={`${PUBLIC_SITE}/terms`} className="hover:text-white">
              Conditions d&apos;utilisation
            </a>
            <a href={`${PUBLIC_SITE}/privacy`} className="hover:text-white">
              Confidentialité
            </a>
            <a href={PUBLIC_SITE} className="hover:text-white">
              www.rabotka.work
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
