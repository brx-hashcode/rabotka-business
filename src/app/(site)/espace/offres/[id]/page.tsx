import type { Metadata } from "next";

import { OfferDetailPage } from "#/features/offers/components/offer-detail-page";

export const metadata: Metadata = { title: "Offre" };

export default async function Page({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <OfferDetailPage id={id} />;
}
