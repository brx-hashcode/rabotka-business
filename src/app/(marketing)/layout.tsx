import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { cookies } from "next/headers";

import { isProductHuntLaunchDay, isProductHuntLaunched, PH_BANNER_COOKIE_PREFIX } from "#/features/landing/content";
import { LandingFooter } from "#/features/landing/components/landing-footer";
import { LandingHeader } from "#/features/landing/components/landing-header";
import { ProductHuntBanner } from "#/features/landing/components/product-hunt-banner";
import { businessCountriesServer } from "#/lib/api/catalog-server";

/** The public site's frame: the same header and footer on every page. */
export default async function MarketingLayout({ children }: LayoutProps<"/">) {
  const [countries, messages, jar] = await Promise.all([businessCountriesServer(), getMessages(), cookies()]);
  // The top bar runs during the launch window only: a nudge before, a live
  // call during. The dismissal cookie is read here so a dismissed banner
  // never renders — no post-hydration flash on reload.
  const launchDay = isProductHuntLaunchDay();
  const variant = launchDay ? "live" : "soon";
  const bannerDismissed = jar.has(`${PH_BANNER_COOKIE_PREFIX}${variant}`);
  const showBanner = (launchDay || !isProductHuntLaunched()) && !bannerDismissed;
  return (
    // All messages here, the site's long copy (siteCopy) included: the root
    // layout leaves it out so the space never downloads it.
    <NextIntlClientProvider messages={messages}>
      {/* Banner + header travel as one sticky group: no overlap as the header pins on scroll. */}
      <div className="sticky top-0 z-40">
        {showBanner && <ProductHuntBanner variant={variant} />}
        <LandingHeader />
      </div>
      <main>{children}</main>
      <LandingFooter countries={countries} />
    </NextIntlClientProvider>
  );
}
