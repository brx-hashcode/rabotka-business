import type { Metadata } from "next";

import { ApplyPage } from "#/features/careers/components/apply-page";
import { OfferLanguage } from "#/features/careers/components/offer-language";
import { careersOfferServer } from "#/lib/api/careers-server";

type Params = { params: Promise<{ slug: string; reference: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, reference } = await params;
  const page = await careersOfferServer(slug, reference);
  return { title: page?.offer.language === "en" ? "Apply" : "Postuler", robots: { index: false, follow: false } };
}

/** The form speaks the offer's language, as its page does. */
export default async function Page({ params }: Params) {
  const { slug, reference } = await params;
  const page = await careersOfferServer(slug, reference);
  return (
    <OfferLanguage language={page?.offer.language}>
      <ApplyPage slug={slug} reference={reference} />
    </OfferLanguage>
  );
}
