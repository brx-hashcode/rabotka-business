import type { Metadata } from "next";

import { TeamPage } from "#/features/team/components/team-page";

export const metadata: Metadata = { title: "Équipe" };

export default function Page() {
  return <TeamPage />;
}
