import type { Metadata } from "next";

import { OffersPage } from "#/features/offers/components/offers-page";

export const metadata: Metadata = { title: "Offres" };

export default function Page() {
  return <OffersPage />;
}
