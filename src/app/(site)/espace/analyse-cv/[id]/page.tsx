import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { CvScreeningPage } from "#/features/cv-screening/components/cv-screening-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.titles");
  return { title: t("cvAnalysis") };
}

export default async function Page({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <CvScreeningPage id={id} />;
}
