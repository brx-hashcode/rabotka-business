import type { Metadata } from "next";

import { CountriesSection } from "#/features/landing/components/countries-section";
import { DemoBlock } from "#/features/landing/components/demo-block";
import { AudiencesSection, TrustSection } from "#/features/landing/components/landing-sections";
import { PageHero } from "#/features/landing/components/page-hero";
import { SectionHeading } from "#/features/landing/components/section-heading";
import { businessCountriesServer } from "#/lib/api/catalog-server";
import { jsonLd, marketingMetadata, organizationLd } from "#/lib/seo/marketing";
import { siteOrigin } from "#/lib/seo/site";

export function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    title: "À propos",
    description:
      "Rabotka Business est l'espace de recrutement de Rabotka pour les entreprises et organisations : un ATS pensé pour le marché de l'emploi africain.",
    path: "/a-propos",
  });
}

const BELIEFS = [
  {
    title: "Le bon candidat existe souvent déjà",
    text: "Il est dans la pile de CV, dans votre messagerie ou sur WhatsApp. Notre travail : qu'il ne passe plus inaperçu.",
  },
  {
    title: "Un recrutement se décide en équipe",
    text: "Le responsable du poste, les RH, la direction : chacun doit voir les mêmes candidats et donner son avis au même endroit.",
  },
  {
    title: "Des outils faits pour ici",
    text: "Les pièces officielles de votre pays, le paiement par mobile money, les candidats joints là où ils sont : sur leur téléphone.",
  },
];

export default async function AboutPage() {
  const [countries, { origin }] = await Promise.all([businessCountriesServer(), siteOrigin()]);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(organizationLd(origin)) }} />
      <PageHero
        kicker="À propos"
        title="Le recrutement des organisations africaines, enfin outillé"
        text="Rabotka met en relation les personnes qui cherchent un emploi et celles qui recrutent, jusque sur WhatsApp. Rabotka Business est son espace pour les entreprises, institutions et organisations : un ATS complet, pensé pour le marché de l'emploi africain."
      />

      <section className="bg-card py-20 md:py-28">
        <div className="mx-auto w-full max-w-7xl space-y-12 px-4 sm:px-6">
          <SectionHeading
            kicker="Ce qui nous guide"
            title="Trois convictions derrière chaque fonctionnalité"
          />
          <div className="grid gap-4 md:grid-cols-3">
            {BELIEFS.map((b, i) => (
              <div key={b.title} className="space-y-4 rounded-3xl bg-page p-6 sm:p-8">
                <span className="flex size-10 items-center justify-center rounded-full bg-header font-semibold text-header-foreground">
                  {i + 1}
                </span>
                <h3 className="font-semibold text-xl">{b.title}</h3>
                <p className="text-muted-foreground text-sm">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CountriesSection countries={countries} />
      <TrustSection />
      <AudiencesSection />
      <DemoBlock />
    </>
  );
}
