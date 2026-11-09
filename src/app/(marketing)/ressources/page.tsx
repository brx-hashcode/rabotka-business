import type { Metadata } from "next";
import Link from "next/link";
import { IconArrowRight, IconClock } from "@tabler/icons-react";

import { DemoBlock } from "#/features/landing/components/demo-block";
import { FaqSection } from "#/features/landing/components/landing-sections";
import { PageHero } from "#/features/landing/components/page-hero";
import { SectionHeading } from "#/features/landing/components/section-heading";
import { GUIDES } from "#/features/landing/site-content";
import { businessCountriesServer } from "#/lib/api/catalog-server";
import { marketingMetadata } from "#/lib/seo/marketing";

export function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    title: "Ressources",
    description:
      "Guides pratiques pour recruter mieux et plus vite, et réponses aux questions fréquentes sur Rabotka Business.",
    path: "/ressources",
  });
}

export default async function ResourcesPage() {
  const countries = await businessCountriesServer();
  return (
    <>
      <PageHero
        kicker="Ressources"
        title="Recruter mieux, plus vite"
        text="Des guides concrets pour rédiger vos offres, trier vos candidatures et mener vos entretiens, et les réponses aux questions que l'on nous pose le plus."
        actions={false}
      />

      <section id="guides" className="scroll-mt-20 py-20 md:py-28">
        <div className="mx-auto w-full max-w-7xl space-y-12 px-4 sm:px-6">
          <SectionHeading kicker="Guides du recruteur" title="Des méthodes, pas des promesses" />
          <ul className="grid gap-4 md:grid-cols-3">
            {GUIDES.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/ressources/${g.slug}`}
                  className="group flex h-full flex-col gap-4 rounded-3xl bg-card p-6 transition-colors hover:bg-card/70"
                >
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-page px-2.5 py-1 text-muted-foreground text-xs">
                    <IconClock className="size-3.5" />
                    {g.minutes} min de lecture
                  </span>
                  <span className="flex-1 space-y-2">
                    <span className="block font-semibold text-xl tracking-tight">{g.title}</span>
                    <span className="block text-muted-foreground text-sm">{g.description}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-sm">
                    Lire le guide
                    <IconArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FaqSection countries={countries} />

      <DemoBlock />
    </>
  );
}
