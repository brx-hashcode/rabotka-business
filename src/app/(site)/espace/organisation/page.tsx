import type { Metadata } from "next";

import { OrganisationPage } from "#/features/organisation/components/organisation-page";

export const metadata: Metadata = { title: "Organisation" };

export default function Page() {
  return <OrganisationPage />;
}
