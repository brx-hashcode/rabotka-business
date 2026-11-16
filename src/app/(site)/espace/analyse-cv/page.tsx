import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { CvScreeningsPage } from "#/features/cv-screening/components/cv-screenings-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.titles");
  return { title: t("cvAnalysis") };
}

export default function Page() {
  // Suspense: the page reads its tab from the URL (?onglet=).
  return (
    <Suspense>
      <CvScreeningsPage />
    </Suspense>
  );
}
