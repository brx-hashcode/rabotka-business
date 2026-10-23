import { SiteHeader } from "#/features/layout/components/site-header";

/**
 * Pages under the header. The sign-in page sits outside this group so it can
 * fill the screen without it — while the sign-in dialog, opened over a page
 * when the session expires, keeps that page's header behind it.
 */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
    </>
  );
}
