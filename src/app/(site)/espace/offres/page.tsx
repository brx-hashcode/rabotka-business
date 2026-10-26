import type { Metadata } from "next";

import { OffersPage } from "#/features/offers/components/offers-page";

export const metadata: Metadata = { title: "Mes offres" };

export default function Page() {
  return <OffersPage />;
}
