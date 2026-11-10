import type { Metadata } from "next";

import { DemoBlock } from "#/features/landing/components/demo-block";
import { FeatureTabs } from "#/features/landing/components/feature-tabs";
import { PageHero } from "#/features/landing/components/page-hero";
import { SectionHeading } from "#/features/landing/components/section-heading";
import { marketingMetadata } from "#/lib/seo/marketing";

export function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    title: "Fonctionnalités",
    description:
      "Un ATS complet : rédaction et multidiffusion d'offres, analyse de CV, suivi des candidatures, entretiens, recrutement en équipe, contrats et tableau de bord.",
    path: "/fonctionnalites",
  });
}

/** Every tool, one at a time: the « Fonctionnalités clés » tabs, then the demo. */
export default function FeaturesPage() {
  return (
    <>
      <PageHero
        title="Un ATS complet, de l'offre au contrat"
        text="Rabotka Business réunit tout ce qu'un recrutement demande : diffuser l'offre, trier les candidatures, rencontrer les meilleurs et décider en équipe."
      />
      <section className="bg-card py-20 md:py-28">
        <div className="mx-auto w-full max-w-7xl space-y-12 px-4 sm:px-6">
          <SectionHeading
            kicker="Fonctionnalités clés"
            title="Choisissez un outil, voyez ce qu'il fait"
            text="Les outils sont rangés dans l'ordre d'un recrutement : de l'offre qui attire les candidats au contrat du candidat retenu."
          />
          <FeatureTabs />
        </div>
      </section>
      <DemoBlock />
    </>
  );
}
