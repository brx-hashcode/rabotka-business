import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";

import type { BusinessCountryName } from "#/lib/api/catalog-server";
import { STRIP_FEATURES } from "../content";
import { DemoButton, SignUpButton } from "./demo-button";
import { flagUrl } from "../globe/country-places";
import { HeroMockup } from "../mockups/mockups";

/**
 * The opening: an ATS, said plainly; the demo first and the account beside
 * it; the product itself on the right. Then the four steps of a hire as
 * cards, each a link to its feature page.
 */
export function LandingHero({ countries }: Readonly<{ countries: BusinessCountryName[] }>) {
  return (
    <section className="overflow-hidden bg-header text-header-foreground">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 pt-10 pb-14 sm:px-6 md:pt-16 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:pb-20">
        <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700">
          <p className="inline-flex rounded-full bg-black/5 px-3 py-1 font-medium text-sm">
            L&apos;ATS nouvelle génération des recruteurs africains
          </p>
          <h1 className="font-semibold text-4xl leading-[1.06] tracking-tight sm:text-5xl lg:text-[3.5rem]">
            Recevez, triez et rencontrez les bons candidats, au même endroit
          </h1>
          <p className="max-w-xl text-header-muted text-lg">
            Un logiciel de recrutement complet : des offres rédigées et diffusées partout, chaque CV lu et classé pour le
            poste, un pipeline suivi en équipe, et des entretiens qui arrivent tout seuls dans votre agenda.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <DemoButton />
            <SignUpButton />
          </div>
          {/* Where it is open, from the backend's list: not one country's tool. The map is further down. */}
          <a href="#pays" className="group inline-flex items-center gap-3 pt-2">
            <span className="flex -space-x-1.5">
              {countries.slice(0, 6).map((c) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={c.code}
                  src={flagUrl(c.code, 80)}
                  alt=""
                  className="size-6 rounded-full object-cover shadow-[0_0_0_2px_var(--header)]"
                />
              ))}
            </span>
            <span className="font-medium text-header-muted text-sm group-hover:text-header-foreground">
              Disponible dans {countries.length} pays d&apos;Afrique
            </span>
            <IconArrowRight className="size-4 text-header-muted transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>

        <div className="min-w-0 text-foreground motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-6 motion-safe:delay-150 motion-safe:duration-700 motion-safe:fill-mode-both">
          <HeroMockup />
        </div>
      </div>

      <div id="fonctionnalites" className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 pb-14 sm:px-6 lg:pb-20">
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {STRIP_FEATURES.map(({ id, href, label, description, icon: Icon, tone }) => (
            <li key={id}>
              <Link
                href={href}
                className="group flex h-full flex-col gap-3 rounded-3xl bg-card p-4 text-foreground transition-colors hover:bg-card/80"
              >
                <span className={`flex size-10 items-center justify-center rounded-2xl ${tone}`}>
                  <Icon className="size-5" />
                </span>
                <span className="space-y-1">
                  <span className="block font-semibold text-sm">{label}</span>
                  <span className="block text-muted-foreground text-xs leading-snug">{description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
