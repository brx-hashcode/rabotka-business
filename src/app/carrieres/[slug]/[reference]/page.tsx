import type { Metadata } from "next";

import { OfferPage } from "#/features/careers/components/offer-page";

export const metadata: Metadata = { title: "Offre d'emploi", robots: { index: false, follow: false } };

export default async function Page({ params }: Readonly<{ params: Promise<{ slug: string; reference: string }> }>) {
  const { slug, reference } = await params;
  return <OfferPage slug={slug} reference={reference} />;
}
