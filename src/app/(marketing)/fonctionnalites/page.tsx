import type { Metadata } from "next";
import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";

import { AtsPillars, PipelineSteps } from "#/features/landing/components/ats-section";
import { DemoBlock } from "#/features/landing/components/demo-block";
import { PageHero } from "#/features/landing/components/page-hero";
import { SectionHeading } from "#/features/landing/components/section-heading";
import { FEATURES } from "#/features/landing/content";
import { PipelineMockup } from "#/features/landing/mockups/ats-mockups";
import { marketingMetadata } from "#/lib/seo/marketing";

export function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    title: "Fonctionnalités",
    description:
      "Un ATS complet : rédaction et multidiffusion d'offres, analyse de CV, suivi des candidatures, entretiens, recrutement en équipe, contrats et tableau de bord.",
    path: "/fonctionnalites",
  });
}

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        kicker="Fonctionnalités"
        title="Un ATS complet, de l'offre au contrat"
        text="Rabotka Business réunit tout ce qu'un recrutement demande : diffuser l'offre, trier les candidatures, rencontrer les meilleurs et décider en équipe. Chaque outil fait gagner du temps à l'étape suivante."
        aside={<PipelineMockup />}
      />

      <section className="bg-card py-20 md:py-28">
        <div className="mx-auto w-full max-w-7xl space-y-12 px-4 sm:px-6">
          <SectionHeading
            kicker="Chaque étape a son outil"
            title="Tout ce que fait Rabotka Business"
            text="Ouvrez une fonctionnalité pour voir ce qu'elle fait, en détail."
          />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ id, href, label, description, icon: Icon, tone }) => (
              <li key={id}>
                <Link
                  href={href}
                  className="group flex h-full flex-col gap-4 rounded-3xl bg-page p-6 transition-colors hover:bg-page/70"
                >
                  <span className={`flex size-12 items-center justify-center rounded-2xl ${tone}`}>
                    <Icon className="size-5" />
                  </span>
                  <span className="flex-1 space-y-1.5">
                    <span className="block font-semibold text-lg">{label}</span>
                    <span className="block text-muted-foreground text-sm">{description}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-sm">
                    Découvrir
                    <IconArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="mx-auto w-full max-w-7xl space-y-12 px-4 sm:px-6">
          <SectionHeading
            kicker="ATS nouvelle génération"
            title="Six étapes, un seul pipeline"
            text="Chaque candidat avance de la diffusion de l'offre jusqu'au contrat, avec son statut et son historique."
          />
          <div className="rounded-[2rem] bg-card p-4 sm:p-6">
            <PipelineSteps />
          </div>
          <div className="rounded-[2rem] bg-card p-4 sm:p-6">
            <AtsPillars />
          </div>
        </div>
      </section>

      <DemoBlock />
    </>
  );
}
