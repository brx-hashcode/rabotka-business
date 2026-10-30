import type { Metadata } from "next";

import { DirectoryPage } from "#/features/careers/components/directory-page";

export const metadata: Metadata = { title: "Ils recrutent", robots: { index: false, follow: false } };

export default function Page() {
  return <DirectoryPage />;
}
