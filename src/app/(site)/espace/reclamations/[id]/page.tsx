import type { Metadata } from "next";

import { ClaimDetailPage } from "#/features/claims/components/claim-detail-page";

export const metadata: Metadata = { title: "Réclamation" };

export default async function Page({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <ClaimDetailPage id={id} />;
}
