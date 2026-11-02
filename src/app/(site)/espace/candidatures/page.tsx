import { Suspense } from "react";
import type { Metadata } from "next";

import { ApplicationsPage } from "#/features/applications/components/applications-page";

export const metadata: Metadata = { title: "Candidatures" };

export default function Page() {
  // Suspense: the page reads `?candidature=` (opened from a notification).
  return (
    <Suspense>
      <ApplicationsPage />
    </Suspense>
  );
}
