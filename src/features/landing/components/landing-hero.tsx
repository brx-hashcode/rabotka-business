import { IconArrowRight, IconWorld } from "@tabler/icons-react";

import { GoogleLogo, LinkedInLogo } from "#/components/brand-logos";

import type { BusinessCountryName } from "#/lib/api/catalog-server";
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
          {/* Where the offers go: the brands a business recognises at a glance. */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="mr-1 font-medium text-header-muted text-sm">Vos offres publiées sur</span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 font-semibold text-[#1f1f1f] text-sm shadow-[0_1px_0_rgba(0,0,0,0.04)]">
              <GoogleLogo className="size-[18px]" />
              Google
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 font-semibold text-[#1f1f1f] text-sm shadow-[0_1px_0_rgba(0,0,0,0.04)]">
              <LinkedInLogo className="size-[18px]" />
              LinkedIn
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 font-semibold text-[#1f1f1f] text-sm shadow-[0_1px_0_rgba(0,0,0,0.04)]">
              <IconWorld className="size-[18px] text-whatsapp-dark" />
              Votre page carrières
            </span>
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

    </section>
  );
}
