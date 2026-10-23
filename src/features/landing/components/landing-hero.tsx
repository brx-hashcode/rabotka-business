import Link from "next/link";
import { IconArrowRight, IconCheck } from "@tabler/icons-react";

import { HeroCarousel } from "#/components/hero-carousel";
import { Button } from "#/components/ui/button";
import { HIRING_PATHS, SIGN_UP_HREF } from "../content";

/** The client's home photos, so the solution rows below do not repeat them. */
const HERO_PHOTOS = [1, 2, 3, 4, 5, 6].map((n) => `/hero/worker-${n}.jpg`);

/**
 * The opening: headline and one call to action beside a photo, then the two
 * hiring paths — occasional and regular — each with its own way in.
 */
export function LandingHero() {
  return (
    <section className="bg-header text-header-foreground">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pt-10 pb-16 sm:px-6 md:grid-cols-2 md:pt-16 md:pb-24">
        <div className="space-y-6">
          <span className="inline-flex rounded-full bg-ink/10 px-3 py-1 font-medium text-xs">
            Pour les entreprises et organisations du Congo
          </span>
          <h1 className="font-semibold text-4xl leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Recrutez les bonnes personnes, près de chez vous
          </h1>
          <p className="max-w-lg text-header-muted text-lg">
            PME, écoles, ONG, administrations : publiez vos offres, recevez des
            profils vérifiés et recrutez depuis un seul espace.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="ghost"
              size="xl"
              render={<Link href={SIGN_UP_HREF} />}
              className="rounded-full bg-ink px-6 text-white hover:bg-ink/90"
            >
              Créer mon espace entreprise
              <IconArrowRight />
            </Button>
            <a href="#solutions" className="rounded-full px-4 py-2 font-medium text-sm underline-offset-4 hover:underline">
              Découvrir les solutions
            </a>
          </div>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-ink md:aspect-[5/4]">
          <HeroCarousel
            className="absolute inset-0"
            photos={HERO_PHOTOS}
            sizes="(min-width: 768px) 50vw, 100vw"
            imageClassName="object-cover"
          />
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 pb-16 sm:px-6 md:-mt-8 md:grid-cols-2 md:pb-20">
        {HIRING_PATHS.map((path) => (
          <div key={path.title} className="flex flex-col gap-4 rounded-3xl bg-card p-6 text-foreground sm:p-8">
            <div className="space-y-2">
              <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                {path.kicker}
              </p>
              <h2 className="font-semibold text-2xl tracking-tight">{path.title}</h2>
              <p className="text-muted-foreground">{path.text}</p>
            </div>
            <div className="mt-auto flex flex-wrap items-center gap-4">
              <Button
                size="lg"
                render={<Link href={SIGN_UP_HREF} />}
                className="rounded-full px-5"
              >
                {path.cta}
              </Button>
              <a href="#solutions" className="inline-flex items-center gap-1 font-medium text-sm hover:underline">
                <IconCheck className="size-4 text-whatsapp-dark" />
                Voir ce qui est inclus
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
