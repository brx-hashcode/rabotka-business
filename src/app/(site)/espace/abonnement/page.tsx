import type { Metadata } from "next";

import { SubscriptionPage } from "#/features/subscription/components/subscription-page";

export const metadata: Metadata = { title: "Abonnement" };

export default function Page() {
  return <SubscriptionPage />;
}
