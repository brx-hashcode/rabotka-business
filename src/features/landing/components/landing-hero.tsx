import { IconArrowRight, IconWorld } from "@tabler/icons-react";

import { GoogleLogo, LinkedInLogo } from "#/components/brand-logos";

import type { BusinessCountryName } from "#/lib/api/catalog-server";
import { DemoButton, SignUpButton } from "./demo-button";
import { flagUrl } from "../globe/country-places";
import { HeroMockup } from "../mockups/mockups";
import { Highlighter } from "./highlighter";

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
          <h1 className="isolate font-semibold text-4xl leading-[1.12] tracking-tight sm:text-5xl lg:text-[3.5rem]">
            Recevez, triez et rencontrez{" "}
            <Highlighter action="underline" color="#FF9800" strokeWidth={3} delay={700}>
              les bons candidats
            </Highlighter>
            , au même endroit
          </h1>
          <p className="isolate max-w-lg text-header-muted text-lg">
            Le logiciel de recrutement complet : vos offres diffusées,{" "}
            <Highlighter action="highlight" color="#87CEFA" delay={1600}>
              chaque CV lu et classé
            </Highlighter>
            , vos entretiens en visio et
            leur compte rendu.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <DemoButton />
            <SignUpButton />
          </div>
          {/* One quiet line: where the offers go, and where Rabotka is open. */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-2 text-header-muted text-sm">
            <span className="inline-flex items-center gap-2">
              <span className="font-medium">Publiées sur</span>
              <span className="flex -space-x-1.5">
                {[
                  { label: "Google", icon: <GoogleLogo className="size-4" /> },
                  { label: "LinkedIn", icon: <LinkedInLogo className="size-4" /> },
                  { label: "Votre page carrières", icon: <IconWorld className="size-4 text-whatsapp-dark" /> },
                ].map((b) => (
                  <span
                    key={b.label}
                    title={b.label}
                    aria-label={b.label}
                    role="img"
                    className="flex size-7 items-center justify-center rounded-full bg-white shadow-[0_0_0_2px_var(--header)]"
                  >
                    {b.icon}
                  </span>
                ))}
              </span>
            </span>
            <span aria-hidden className="hidden h-4 w-px bg-header-foreground/20 sm:block" />
            {/* Where it is open, from the backend's list: not one country's tool. The map is further down. */}
            <a href="#pays" className="group inline-flex items-center gap-2">
              <span className="flex -space-x-1.5">
                {countries.slice(0, 5).map((c) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={c.code} src={flagUrl(c.code, 80)} alt="" className="size-6 rounded-full object-cover shadow-[0_0_0_2px_var(--header)]" />
                ))}
              </span>
              <span className="font-medium group-hover:text-header-foreground">{countries.length} pays d&apos;Afrique</span>
              <IconArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>

        <div className="min-w-0 text-foreground motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-6 motion-safe:delay-150 motion-safe:duration-700 motion-safe:fill-mode-both">
          <HeroMockup />
        </div>
      </div>

    </section>
  );
}
