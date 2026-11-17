import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SubscriptionPage } from "#/features/subscription/components/subscription-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.titles");
  return { title: t("subscription") };
}

export default function Page() {
  // Suspense: the page reads its tab from the URL (?onglet=packs).
  return (
    <Suspense>
      <SubscriptionPage />
    </Suspense>
  );
}
