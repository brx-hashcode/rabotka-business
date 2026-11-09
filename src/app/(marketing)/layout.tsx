import { LandingFooter } from "#/features/landing/components/landing-footer";
import { LandingHeader } from "#/features/landing/components/landing-header";

/** The public site's frame: the same header and footer on every page. */
export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <LandingHeader />
      <main>{children}</main>
      <LandingFooter />
    </>
  );
}
