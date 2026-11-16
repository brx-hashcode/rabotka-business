import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SearchPage } from "#/features/search/components/search-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.titles");
  return { title: t("search") };
}

export default function Page() {
  // The filters read the URL (an offer opens it preset): that needs a boundary.
  return (
    <Suspense>
      <SearchPage />
    </Suspense>
  );
}
