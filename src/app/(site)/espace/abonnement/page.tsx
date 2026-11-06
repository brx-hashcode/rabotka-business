import { Suspense } from "react";
import type { Metadata } from "next";

import { SubscriptionPage } from "#/features/subscription/components/subscription-page";

export const metadata: Metadata = { title: "Abonnement" };

export default function Page() {
  // Suspense: the page reads its tab from the URL (?onglet=packs).
  return (
    <Suspense>
      <SubscriptionPage />
    </Suspense>
  );
}
