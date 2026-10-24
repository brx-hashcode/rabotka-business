import { AppShell } from "#/features/layout/components/app-shell";

/**
 * The business space: sidebar, top bar, page. The sign-in page sits outside
 * this group so it can fill the screen — while the sign-in dialog, opened over
 * a page when the session expires, keeps that page and its shell behind it.
 */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>;
}
