import type { Metadata } from "next";

import { OrganisationPage } from "#/features/organisation/components/organisation-page";

export const metadata: Metadata = { title: "Mon organisation" };

export default function Page() {
  return <OrganisationPage />;
}
