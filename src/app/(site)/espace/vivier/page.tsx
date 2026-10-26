import type { Metadata } from "next";

import { TalentsPage } from "#/features/talents/components/talents-page";

export const metadata: Metadata = { title: "Vivier" };

export default function Page() {
  return <TalentsPage />;
}
