import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";

import { Button } from "#/components/ui/button";
import { SIGN_UP_HREF, STRIP_FEATURES } from "../content";
import { HeroMockup } from "../mockups/mockups";

/**
 * The opening: what Rabotka does for a recruiter, one way in, and the product
 * itself beside it. Then the four steps of a hire as cards, each a link to
 * its section.
 */
export function LandingHero() {
  return (
    <section className="overflow-hidden bg-header text-header-foreground">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 pt-10 pb-14 sm:px-6 md:pt-16 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:pb-20">
        <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700">
          <span className="inline-flex rounded-full bg-ink/10 px-3 py-1 font-medium text-xs">
            Le recrutement des organisations, de l&apos;offre à l&apos;entretien
          </span>
          <h1 className="font-semibold text-4xl leading-[1.06] tracking-tight sm:text-5xl lg:text-[3.5rem]">
            Recevez, triez et rencontrez les bons candidats, au même endroit
          </h1>
          <p className="max-w-xl text-header-muted text-lg">
            Des offres rédigées en quelques mots, des CV lus et classés pour chaque poste, même depuis votre messagerie, et
            des entretiens qui arrivent tout seuls dans votre agenda.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="ghost"
              size="xl"
              render={<Link href={SIGN_UP_HREF} />}
              className="rounded-full bg-ink px-6 text-white hover:bg-ink/90"
            >
              Ouvrir un compte entreprise
              <IconArrowRight />
            </Button>
            <a href="#fonctionnalites" className="rounded-full px-4 py-2 font-medium text-sm underline-offset-4 hover:underline">
              Voir comment ça marche
            </a>
          </div>
        </div>

        <div className="min-w-0 text-foreground motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-6 motion-safe:delay-150 motion-safe:duration-700 motion-safe:fill-mode-both">
          <HeroMockup />
        </div>
      </div>

      <div id="fonctionnalites" className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 pb-14 sm:px-6 lg:pb-20">
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {STRIP_FEATURES.map(({ id, href, label, description, icon: Icon, tone }) => (
            <li key={id}>
              <a
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
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
