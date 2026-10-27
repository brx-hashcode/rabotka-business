import type { Metadata } from "next";

import { NewCvScreeningPage } from "#/features/cv-screening/components/new-cv-screening-page";

export const metadata: Metadata = { title: "Nouveau tri" };

export default function Page() {
  return <NewCvScreeningPage />;
}
