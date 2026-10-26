import type { Metadata } from "next";

import { ClaimsPage } from "#/features/claims/components/claims-page";

export const metadata: Metadata = { title: "Réclamations" };

export default function Page() {
  return <ClaimsPage />;
}
