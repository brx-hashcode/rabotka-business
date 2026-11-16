import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { EditOfferPage } from "#/features/offers/components/edit-offer-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.titles");
  return { title: t("editOffer") };
}

export default async function Page({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <EditOfferPage id={id} />;
}
