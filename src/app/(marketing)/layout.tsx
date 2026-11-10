import { LandingFooter } from "#/features/landing/components/landing-footer";
import { LandingHeader } from "#/features/landing/components/landing-header";
import { businessCountriesServer } from "#/lib/api/catalog-server";

/** The public site's frame: the same header and footer on every page. */
export default async function MarketingLayout({ children }: LayoutProps<"/">) {
  const countries = await businessCountriesServer();
  return (
    <>
      <LandingHeader />
      <main>{children}</main>
      <LandingFooter countries={countries} />
    </>
  );
}
