import type { Metadata } from "next";

import { AtsSection } from "#/features/landing/components/ats-section";
import { CountriesSection } from "#/features/landing/components/countries-section";
import { DemoBlock } from "#/features/landing/components/demo-block";
import { FeatureStages } from "#/features/landing/components/feature-stages";
import { LandingHero } from "#/features/landing/components/landing-hero";
import { AudiencesSection, FaqSection } from "#/features/landing/components/landing-sections";
import { businessCountriesServer } from "#/lib/api/catalog-server";
import { jsonLd, marketingMetadata, organizationLd } from "#/lib/seo/marketing";
import { siteOrigin } from "#/lib/seo/site";

export function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    title: "Rabotka Business — l'ATS nouvelle génération pour recruter en Afrique",
    description:
      "Logiciel de recrutement complet : offres rédigées et diffusées partout, CV lus et classés pour chaque poste, pipeline suivi en équipe, entretiens synchronisés avec votre agenda.",
    path: "/",
  });
}

/**
 * The landing: a summary that sends each visitor on — the ATS, its tools by
 * stage, where it is open, who it is for, the questions, the demo.
 * The detail lives on the other pages, never repeated here.
 */
export default async function LandingPage() {
  const [countries, { origin }] = await Promise.all([businessCountriesServer(), siteOrigin()]);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(organizationLd(origin)) }} />
      <LandingHero countries={countries} />
      <AtsSection />
      <FeatureStages />
      <CountriesSection countries={countries} />
      <AudiencesSection />
      <FaqSection countries={countries} />
      <DemoBlock />
    </>
  );
}
