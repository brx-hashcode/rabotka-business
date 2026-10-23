import { Suspense } from "react";
import Link from "next/link";
import { IconCheck } from "@tabler/icons-react";

import { BrandLogo } from "#/components/brand-logo";
import { SignInFlow } from "#/features/auth/components/sign-in-flow";
import { HeroCarousel } from "#/components/hero-carousel";

/**
 * Unsplash, in full colour, cross-fading like the home hero: chair maker
 * (photo-1688241320695-6ca991df8818), basket weaver (photo-1688240817677-
 * d28b8e232dd4), cook (photo-1784459996808-d44b40f78616), seamstresses
 * (photo-1790943780822-9918073fe9f1).
 */
const PHOTOS = ["craftsman", "weaver", "cook", "seamstresses"].map((n) => `/sign-in/${n}.jpg`);

const POINTS = [
  "Publiez vos offres depuis votre ordinateur",
  "Les profils qui correspondent à vos besoins",
  "Votre organisation vérifiée par Rabotka",
];

/**
 * The sign-in page itself: what a direct visit, a refresh or a shared link
 * shows. Links from inside the app are intercepted into the dialog instead
 * (src/app/@modal/(.)auth/sign-in).
 *
 * Full screen, no site header (it lives in the (site) group). Five columns on
 * large screens: the photo panel takes three, the form two. Below `lg` only
 * the form remains, with the logo above it.
 */
export default function SignInPage() {
  return (
    <div className="grid min-h-svh bg-card lg:grid-cols-5">
      <aside className="relative col-span-3 m-4 hidden overflow-hidden rounded-3xl bg-ink text-white lg:flex">
        <HeroCarousel
          className="absolute inset-0"
          photos={PHOTOS}
          sizes="60vw"
          imageClassName="object-[50%_30%]"
        />
        {/* Darkens the lower part only, for the text; the photo stays clear above. */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/90 via-black/65 to-transparent" />

        <Link
          href="/"
          aria-label="Rabotka — accueil"
          className="absolute top-6 left-6 z-10 rounded-full bg-card/95 py-1.5 pr-4 pl-2 text-foreground"
        >
          <BrandLogo />
        </Link>

        <div className="relative mt-auto flex max-w-xl flex-col gap-6 p-12">
          <h1 className="font-semibold text-4xl leading-tight tracking-tight">
            Rabotka pour les entreprises
          </h1>
          <p className="text-white/80">
            PME, écoles, ONG et administrations : recrutez les bons profils au
            Congo, depuis un seul espace.
          </p>
          <ul className="flex flex-col gap-3">
            {POINTS.map((point) => (
              <li key={point} className="flex items-center gap-3 text-sm">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-whatsapp text-white">
                  <IconCheck className="size-3.5" strokeWidth={3} />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section className="col-span-2 flex flex-col px-6 py-10 sm:px-12">
        {/* No header on this page: below lg the photo panel (and its logo) is hidden. */}
        <Link href="/" aria-label="Rabotka — accueil" className="self-start lg:hidden">
          <BrandLogo />
        </Link>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col pt-10 pb-10 lg:justify-center lg:py-10">
          <Suspense>
            <SignInFlow layout="split" />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
