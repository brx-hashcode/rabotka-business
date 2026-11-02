import { Suspense } from "react";
import type { Metadata } from "next";

import { ClaimsPage } from "#/features/claims/components/claims-page";

export const metadata: Metadata = { title: "Aide" };

export default function Page() {
  // Suspense: the page reads its tab from the URL (?onglet=).
  return (
    <Suspense>
      <ClaimsPage />
    </Suspense>
  );
}
