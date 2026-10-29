import { Suspense } from "react";
import type { Metadata } from "next";

import { OffersPage } from "#/features/offers/components/offers-page";

export const metadata: Metadata = { title: "Offres" };

export default function Page() {
  // Suspense: the page reads its tab from the URL (?onglet=).
  return (
    <Suspense>
      <OffersPage />
    </Suspense>
  );
}
