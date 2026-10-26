import type { Metadata } from "next";

import { EditOfferPage } from "#/features/offers/components/edit-offer-page";

export const metadata: Metadata = { title: "Modifier l'offre" };

export default async function Page({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <EditOfferPage id={id} />;
}
