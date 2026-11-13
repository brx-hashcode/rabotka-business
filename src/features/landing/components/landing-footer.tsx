"use client";

import Link from "next/link";
import {
  IconArrowRight,
  IconArrowUp,
  IconArrowUpRight,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandTiktok,
  IconBrandWhatsapp,
  IconBrandX,
  IconBrandYoutube,
  IconMail,
  IconMapPin,
  IconPhone,
  type Icon,
} from "@tabler/icons-react";

import { BrandLogo } from "#/components/brand-logo";
import { useSupportContact } from "#/hooks/use-support-contact";
import type { BusinessCountryName } from "#/lib/api/catalog-server";
import type { SocialNetwork, SupportContact } from "#/lib/api/public-controller";
import { flagUrl } from "../globe/country-places";
import {
  COMPANY_LINKS,
  PUBLIC_SITE,
  RESOURCE_LINKS,
  SIGN_IN_HREF,
  SIGN_UP_HREF,
  SOLUTION_LINKS,
  type NavLink,
} from "../content";
import { SmartLink } from "./smart-link";

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

/**
 * Rabotka's contact as admins set it (GET public/config/contact): a card per
 * field that is filled in, none of it in the code. On the home page and on
 * /contact.
 */
export function ContactCards({ title = "Besoin d'un accompagnement ?", text = "Nos équipes vous conseillent et vous accompagnent dans la mise en place de votre compte." }: Readonly<{ title?: string; text?: string }>) {
  const { data: contact } = useSupportContact();

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      <div className="space-y-1 rounded-3xl bg-card p-6 md:flex-[1.2]">
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-muted-foreground text-sm">{text}</p>
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
  );
}

/** Where to follow Rabotka: the networks admins set a link for, in the backend's order. */
const SOCIALS: Record<SocialNetwork, { label: string; icon: Icon }> = {
  facebook: { label: "Facebook", icon: IconBrandFacebook },
  instagram: { label: "Instagram", icon: IconBrandInstagram },
  linkedin: { label: "LinkedIn", icon: IconBrandLinkedin },
  tiktok: { label: "TikTok", icon: IconBrandTiktok },
  x: { label: "X", icon: IconBrandX },
  youtube: { label: "YouTube", icon: IconBrandYoutube },
  whatsapp: { label: "WhatsApp", icon: IconBrandWhatsapp },
};

/** Every link once; the demo block above every page asks for the demo. */
const FOOTER_COLUMNS: { title: string; links: NavLink[] }[] = [
  { title: "Fonctionnalités", links: SOLUTION_LINKS },
  { title: "Ressources", links: RESOURCE_LINKS },
  { title: "Entreprise", links: COMPANY_LINKS },
  {
    title: "Compte",
    links: [
      { href: SIGN_UP_HREF, label: "Ouvrir un compte entreprise" },
      { href: SIGN_IN_HREF, label: "Se connecter" },
      { href: PUBLIC_SITE, label: "Je cherche un emploi" },
    ],
  },
];

/** Flags shown side by side before « +N ». */
const MAX_FLAGS = 7;

/**
 * The footer, a dark panel set in the page: a statement with where Rabotka is
 * open, how to reach the team and where to follow it (as admins set it), the links in four
 * columns, the legal line, then the name in large outlined capitals.
 */
export function LandingFooter({ countries }: Readonly<{ countries: BusinessCountryName[] }>) {
  const { data: contact } = useSupportContact();
  const cards = contactCards(contact);
  // Only networks this build knows an icon for.
  const socials = (contact?.socials ?? []).filter((s) => s.network in SOCIALS);
  const flags = countries.slice(0, MAX_FLAGS);
  const more = countries.length - flags.length;

  return (
    <div className="bg-page px-2 pb-2 sm:px-3 sm:pb-3">
      <footer className="relative isolate overflow-hidden rounded-[2rem] bg-[#0b0f0c] text-white sm:rounded-[2.5rem]">
        {/* A low lime glow rising behind the name. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 -z-10 h-112 bg-[radial-gradient(60%_70%_at_50%_100%,rgba(203,255,165,0.14),transparent_70%)]"
        />

        <div className="mx-auto w-full max-w-7xl px-5 pt-14 sm:px-8 md:pt-20">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:gap-16">
            <div className="space-y-6">
              <Link href="/" aria-label="Rabotka Business — accueil" className="inline-flex items-center gap-3">
                <BrandLogo tone="inverse" />
                <span aria-hidden className="h-6 w-px bg-white/25" />
                <span className="text-[17px]">Business</span>
              </Link>
              <p className="max-w-xl font-semibold text-3xl leading-tight tracking-tight sm:text-4xl">
                Publier, trier, recevoir, décider.{" "}
                <span className="text-white/40">Tout votre recrutement, au même endroit.</span>
              </p>
            </div>

            <div className="space-y-5 lg:justify-self-end">
              {countries.length > 0 && (
                <Link href="/#pays" className="group flex items-center gap-4">
                  <span className="flex -space-x-2">
                    {flags.map((c) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={c.code}
                        src={flagUrl(c.code, 80)}
                        alt=""
                        title={c.name}
                        loading="lazy"
                        className="size-8 rounded-full object-cover ring-2 ring-[#0b0f0c]"
                      />
                    ))}
                    {more > 0 && (
                      <span className="flex size-8 items-center justify-center rounded-full bg-white/10 font-semibold text-[11px] ring-2 ring-[#0b0f0c]">
                        +{more}
                      </span>
                    )}
                  </span>
                  <span className="text-sm">
                    <span className="block font-medium">Disponible dans {countries.length} pays</span>
                    <span className="inline-flex items-center gap-1 text-white/50 transition-colors group-hover:text-white">
                      Voir la carte
                      <IconArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </span>
                </Link>
              )}
              {cards.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {cards.map((card) => (
                    <li key={card.label}>
                      <a
                        href={card.href}
                        {...(card.href.startsWith("https:") ? { target: "_blank", rel: "noreferrer" } : {})}
                        className="inline-flex items-center gap-2 rounded-full bg-white/6 px-4 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/12 hover:text-white"
                      >
                        <card.icon className="size-4 text-header" />
                        {card.value}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              {socials.length > 0 && (
                <ul aria-label="Suivez Rabotka" className="flex flex-wrap items-center gap-2">
                  {socials.map(({ network, url }) => {
                    const { label, icon: Glyph } = SOCIALS[network];
                    return (
                      <li key={network}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Rabotka sur ${label}`}
                          title={label}
                          className="flex size-10 items-center justify-center rounded-full bg-white/6 text-white/80 transition-colors hover:bg-header hover:text-header-foreground"
                        >
                          <Glyph className="size-[18px]" stroke={1.75} />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div aria-hidden className="mt-14 h-px bg-white/10" />

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-12 md:grid-cols-4">
            {FOOTER_COLUMNS.map((group) => (
              <nav key={group.title} aria-label={group.title} className="space-y-4">
                <p className="font-medium text-[11px] text-white/40 uppercase tracking-[0.16em]">{group.title}</p>
                <ul className="space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <SmartLink
                        href={link.href}
                        className="group inline-flex items-center gap-1 text-sm text-white/70 transition-colors hover:text-white"
                      >
                        {link.label}
                        {link.href.startsWith("https:") && (
                          <IconArrowUpRight className="size-3.5 opacity-50 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" />
                        )}
                      </SmartLink>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <div aria-hidden className="h-px bg-white/10" />
          <div className="flex flex-col gap-4 py-6 text-sm text-white/50 md:flex-row md:items-center md:justify-between">
            <p>© {new Date().getFullYear()} Rabotka. Tous droits réservés.</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <a href={`${PUBLIC_SITE}/terms`} className="transition-colors hover:text-white">
                Conditions d&apos;utilisation
              </a>
              <a href={`${PUBLIC_SITE}/privacy`} className="transition-colors hover:text-white">
                Politique de confidentialité
              </a>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0 })}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/6 py-1.5 pr-3 pl-2.5 text-white/70 transition-colors hover:bg-white/12 hover:text-white"
              >
                <IconArrowUp className="size-4" />
                Haut de page
              </button>
            </div>
          </div>
        </div>

        {/* The name in large capitals drawn with a dashed outline (SVG: CSS
            cannot dash a text stroke), cut by the bottom edge and fading out
            towards the top.
            textLength spreads it over the width whatever the font's metrics.
            The font builds some letters from overlapping pieces, whose outlines
            crossed inside them: the same text, filled with the footer's own
            colour, is laid over the outline and hides those inner lines, the
            outer edge and the holes (R, A, B, O) staying drawn. */}
        <svg
          aria-hidden
          viewBox="0 0 1000 160"
          className="pointer-events-none mx-auto block w-full max-w-7xl select-none px-5 pt-2 mask-[linear-gradient(to_top,black_35%,transparent_100%)] sm:px-8"
        >
          {(["outline", "cover"] as const).map((layer) => (
            <text
              key={layer}
              x="500"
              y="172"
              textAnchor="middle"
              textLength="980"
              lengthAdjust="spacing"
              fontSize="200"
              fontWeight="800"
              className={layer === "outline" ? "fill-none stroke-white/30 font-sans" : "fill-[#0b0f0c] font-sans"}
              {...(layer === "outline"
                ? { strokeWidth: 4, strokeDasharray: "8 6", strokeLinecap: "round" as const, vectorEffect: "non-scaling-stroke" }
                : {})}
            >
              RABOTKA
            </text>
          ))}
        </svg>
      </footer>
    </div>
  );
}
