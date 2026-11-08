import { businessCountriesServer } from "#/lib/api/catalog-server";
import { LandingFooter, ClosingCta } from "#/features/landing/components/landing-footer";
import { LandingHeader } from "#/features/landing/components/landing-header";
import { LandingHero } from "#/features/landing/components/landing-hero";
import { CountriesSection } from "#/features/landing/components/countries-section";
import {
  AudiencesSection,
  FaqSection,
  FeaturesSection,
  StepsSection,
  TrustSection,
} from "#/features/landing/components/landing-sections";

/**
 * The public landing page. A signed-in business never sees it: src/proxy.ts
 * sends them on to their space.
 */
export default async function LandingPage() {
  const countries = await businessCountriesServer();
  return (
    <>
      <LandingHeader />
      <main>
        <LandingHero countries={countries} />
        <FeaturesSection />
        <CountriesSection countries={countries} />
        <TrustSection />
        <StepsSection />
        <AudiencesSection />
        <FaqSection countries={countries} />
        <ClosingCta />
      </main>
      <LandingFooter />
    </>
  );
}
