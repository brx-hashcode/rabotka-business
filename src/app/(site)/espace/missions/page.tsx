import { Suspense } from "react";
import type { Metadata } from "next";

import { MissionsPage } from "#/features/missions/components/missions-page";

export const metadata: Metadata = { title: "Missions" };

export default function Page() {
  // Suspense: the page reads its tab from the URL (?onglet=).
  return (
    <Suspense>
      <MissionsPage />
    </Suspense>
  );
}
