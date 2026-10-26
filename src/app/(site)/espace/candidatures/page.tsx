import type { Metadata } from "next";

import { ApplicationsPage } from "#/features/applications/components/applications-page";

export const metadata: Metadata = { title: "Candidatures" };

export default function Page() {
  return <ApplicationsPage />;
}
