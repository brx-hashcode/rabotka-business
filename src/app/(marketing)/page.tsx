import { LandingFooter, ClosingCta } from "#/features/landing/components/landing-footer";
import { LandingHeader } from "#/features/landing/components/landing-header";
import { LandingHero } from "#/features/landing/components/landing-hero";
import {
  AudiencesSection,
  FaqSection,
  SolutionsSection,
  StepsSection,
} from "#/features/landing/components/landing-sections";

/**
 * The public landing page. A signed-in business never sees it: src/proxy.ts
 * sends them on to their space.
 */
export default function LandingPage() {
  return (
    <>
      <LandingHeader />
      <main>
        <LandingHero />
        <SolutionsSection />
        <StepsSection />
        <AudiencesSection />
        <FaqSection />
        <ClosingCta />
      </main>
      <LandingFooter />
    </>
  );
}
