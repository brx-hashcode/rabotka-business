import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { OfferDetailPage } from "#/features/offers/components/offer-detail-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.titles");
  return { title: t("offer") };
}

export default async function Page({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  // Suspense: the page reads its tab from the URL (?onglet=).
  return (
    <Suspense>
      <OfferDetailPage id={id} />
    </Suspense>
  );
}
