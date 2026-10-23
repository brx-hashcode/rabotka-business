import Image from "next/image";
import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";

import { Button } from "#/components/ui/button";
import { HERO_PHOTO, HIRING_PATHS, SIGN_UP_HREF } from "../content";

/**
 * The opening: headline and one call to action beside a photo, then the two
 * hiring paths — occasional and regular — each with its own way in.
 */
export function LandingHero() {
  return (
    <section className="bg-header text-header-foreground">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 pt-10 pb-16 sm:px-6 md:grid-cols-2 md:pt-16 md:pb-24">
        <div className="space-y-6">
          <span className="inline-flex rounded-full bg-ink/10 px-3 py-1 font-medium text-xs">
            Solutions de recrutement pour les organisations
          </span>
          <h1 className="font-semibold text-4xl leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            Recrutez les talents qui font avancer votre organisation
          </h1>
          <p className="max-w-lg text-header-muted text-lg">
            Diffusez vos offres, accédez à des profils qualifiés et vérifiés,
            et pilotez l&apos;ensemble de vos recrutements depuis une
            plateforme unique.
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
            <a href="#solutions" className="rounded-full px-4 py-2 font-medium text-sm underline-offset-4 hover:underline">
              Découvrir nos solutions
            </a>
          </div>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-ink md:aspect-[5/4]">
          <Image
            src={HERO_PHOTO}
            alt=""
            fill
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover object-center"
          />
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 pb-16 sm:px-6 md:-mt-8 md:grid-cols-2 md:pb-20">
        {HIRING_PATHS.map((path) => (
          <div key={path.title} className="flex flex-col gap-4 overflow-hidden rounded-3xl bg-card text-foreground sm:flex-row">
            <div className="relative aspect-[16/9] shrink-0 sm:aspect-auto sm:w-2/5">
              <Image src={path.photo} alt="" fill sizes="(min-width: 768px) 30vw, 100vw" className="object-cover" />
            </div>
            <div className="flex flex-1 flex-col gap-4 p-6 pt-2 sm:p-7">
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
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
