import type { Metadata } from "next";

import { ClaimsPage } from "#/features/claims/components/claims-page";

export const metadata: Metadata = { title: "Aide" };

export default function Page() {
  return <ClaimsPage />;
}
