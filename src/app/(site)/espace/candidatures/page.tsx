import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ApplicationsPage } from "#/features/applications/components/applications-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.titles");
  return { title: t("applications") };
}

export default function Page() {
  // Suspense: the page reads `?candidature=` (opened from a notification).
  return (
    <Suspense>
      <ApplicationsPage />
    </Suspense>
  );
}
