import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { NewOfferPage } from "#/features/offers/components/new-offer-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.titles");
  return { title: t("newOffer") };
}

export default function Page() {
  return <NewOfferPage />;
}
