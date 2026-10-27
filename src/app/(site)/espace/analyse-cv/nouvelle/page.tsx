import type { Metadata } from "next";

import { NewCvScreeningPage } from "#/features/cv-screening/components/new-cv-screening-page";

export const metadata: Metadata = { title: "Nouvelle analyse" };

export default function Page() {
  return <NewCvScreeningPage />;
}
