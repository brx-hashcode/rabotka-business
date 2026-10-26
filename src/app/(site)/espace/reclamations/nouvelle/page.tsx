import type { Metadata } from "next";

import { NewClaimPage } from "#/features/claims/components/new-claim-page";

export const metadata: Metadata = { title: "Nouvelle réclamation" };

export default function Page() {
  return <NewClaimPage />;
}
