import { Suspense } from "react";
import type { Metadata } from "next";

import { InterviewsPage } from "#/features/interviews/components/interviews-page";

export const metadata: Metadata = { title: "Entretiens" };

export default function Page() {
  // Suspense: the page reads its tab from the URL (?onglet=).
  return (
    <Suspense>
      <InterviewsPage />
    </Suspense>
  );
}
