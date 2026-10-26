import { DiscussionsShell } from "#/features/discussions/components/discussions-shell";

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <DiscussionsShell>{children}</DiscussionsShell>;
}
