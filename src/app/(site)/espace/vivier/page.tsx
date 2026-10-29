import { Suspense } from "react";
import type { Metadata } from "next";

import { TalentsPage } from "#/features/talents/components/talents-page";

export const metadata: Metadata = { title: "Mes profils" };

export default function Page() {
  // Suspense: the page reads its tab from the URL (?onglet=).
  return (
    <Suspense>
      <TalentsPage />
    </Suspense>
  );
}
