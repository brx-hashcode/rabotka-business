import type { Metadata } from "next";

import { MissionsPage } from "#/features/missions/components/missions-page";

export const metadata: Metadata = { title: "Missions" };

export default function Page() {
  return <MissionsPage />;
}
