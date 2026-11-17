import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { InterviewsPage } from "#/features/interviews/components/interviews-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.titles");
  return { title: t("interviews") };
}

export default function Page() {
  // Suspense: the page reads its tab from the URL (?onglet=).
  return (
    <Suspense>
      <InterviewsPage />
    </Suspense>
  );
}
