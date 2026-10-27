import type { Metadata } from "next";

import { InterviewsPage } from "#/features/interviews/components/interviews-page";

export const metadata: Metadata = { title: "Entretiens" };

export default function Page() {
  return <InterviewsPage />;
}
