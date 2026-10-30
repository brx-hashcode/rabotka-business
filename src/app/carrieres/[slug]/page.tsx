import type { Metadata } from "next";

import { CompanyPage } from "#/features/careers/components/company-page";

export const metadata: Metadata = { title: "Offres d'emploi", robots: { index: false, follow: false } };

export default async function Page({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  return <CompanyPage slug={slug} />;
}
