import { AppShell } from "#/features/layout/components/app-shell";

/**
 * The business space: sidebar, top bar, page. The sign-in page sits outside
 * this group so it can fill the screen.
 */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>;
}
