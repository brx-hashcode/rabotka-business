import { Suspense } from "react";
import type { Metadata } from "next";

import { CvScreeningsPage } from "#/features/cv-screening/components/cv-screenings-page";

export const metadata: Metadata = { title: "Analyse de CV" };

export default function Page() {
  // Suspense: the page reads its tab from the URL (?onglet=).
  return (
    <Suspense>
      <CvScreeningsPage />
    </Suspense>
  );
}
