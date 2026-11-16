import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import { LandingFooter } from "#/features/landing/components/landing-footer";
import { LandingHeader } from "#/features/landing/components/landing-header";
import { businessCountriesServer } from "#/lib/api/catalog-server";

/** The public site's frame: the same header and footer on every page. */
export default async function MarketingLayout({ children }: LayoutProps<"/">) {
  const [countries, messages] = await Promise.all([businessCountriesServer(), getMessages()]);
  return (
    // All messages here, the site's long copy (siteCopy) included: the root
    // layout leaves it out so the space never downloads it.
    <NextIntlClientProvider messages={messages}>
      <LandingHeader />
      <main>{children}</main>
      <LandingFooter countries={countries} />
    </NextIntlClientProvider>
  );
}
