import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PartnersStrip } from "#/features/careers/components/board/partners-strip";
import { AtsSection } from "#/features/landing/components/ats-section";
import { CountriesSection } from "#/features/landing/components/countries-section";
import { DemoBlock } from "#/features/landing/components/demo-block";
import { FeatureStages } from "#/features/landing/components/feature-stages";
import { InterviewsSpotlight } from "#/features/landing/components/interviews-spotlight";
import { LandingHero } from "#/features/landing/components/landing-hero";
import { AudiencesSection, FaqSection } from "#/features/landing/components/landing-sections";
import { businessCountriesServer } from "#/lib/api/catalog-server";
import { careersPartnersServer } from "#/lib/api/careers-server";
import { jsonLd, marketingMetadata, organizationLd } from "#/lib/seo/marketing";
import { siteOrigin } from "#/lib/seo/site";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("site.pages.home");
  return marketingMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/",
    keywords: t.raw("keywords") as string[],
  });
}

/**
 * The landing: a summary that sends each visitor on — the ATS, its tools by
 * stage, where it is open, who it is for, the questions, the demo.
 * The detail lives on the other pages, never repeated here.
 */
export default async function LandingPage() {
  const [countries, { origin }, partners, t] = await Promise.all([
    businessCountriesServer(),
    siteOrigin(),
    careersPartnersServer(),
    getTranslations("site.pages.seo"),
  ]);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(organizationLd(origin, t("orgDescription"))) }} />
      <LandingHero countries={countries} />
      <PartnersStrip partners={partners} className="py-14" />
      <AtsSection />
      <FeatureStages />
      <InterviewsSpotlight />
      <CountriesSection countries={countries} />
      <AudiencesSection />
      <FaqSection countries={countries} />
      <DemoBlock />
    </>
  );
}
