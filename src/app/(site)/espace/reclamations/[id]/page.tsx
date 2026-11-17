import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ClaimDetailPage } from "#/features/claims/components/claim-detail-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.titles");
  return { title: t("claim") };
}

export default async function Page({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <ClaimDetailPage id={id} />;
}
