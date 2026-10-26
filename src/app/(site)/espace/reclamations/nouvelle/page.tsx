import type { Metadata } from "next";

import { NewClaimPage } from "#/features/claims/components/new-claim-page";

export const metadata: Metadata = { title: "Nouvelle demande" };

export default function Page() {
  return <NewClaimPage />;
}
