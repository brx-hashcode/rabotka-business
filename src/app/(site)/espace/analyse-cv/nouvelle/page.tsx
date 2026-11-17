import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { NewCvScreeningPage } from "#/features/cv-screening/components/new-cv-screening-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.titles");
  return { title: t("newCvAnalysis") };
}

export default function Page() {
  return <NewCvScreeningPage />;
}
