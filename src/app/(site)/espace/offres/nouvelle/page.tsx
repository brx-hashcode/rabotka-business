import type { Metadata } from "next";

import { NewOfferPage } from "#/features/offers/components/new-offer-page";

export const metadata: Metadata = { title: "Nouvelle offre" };

export default function Page() {
  return <NewOfferPage />;
}
