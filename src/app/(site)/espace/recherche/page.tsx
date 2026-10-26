import { Suspense } from "react";
import type { Metadata } from "next";

import { SearchPage } from "#/features/search/components/search-page";

export const metadata: Metadata = { title: "Trouver des profils" };

export default function Page() {
  // The filters read the URL (an offer opens it preset): that needs a boundary.
  return (
    <Suspense>
      <SearchPage />
    </Suspense>
  );
}
