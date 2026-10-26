import type { Metadata } from "next";

import { TalentsPage } from "#/features/talents/components/talents-page";

export const metadata: Metadata = { title: "Mes profils" };

export default function Page() {
  return <TalentsPage />;
}
