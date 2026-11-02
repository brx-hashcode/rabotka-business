import type { Metadata } from "next";

import { DirectoryPage } from "#/features/careers/components/directory-page";
import { NOINDEX } from "#/lib/seo/indexed-host";
import { siteOrigin } from "#/lib/seo/site";

export async function generateMetadata(): Promise<Metadata> {
  const { indexed } = await siteOrigin();
  return {
    title: "Ils recrutent au Congo",
    description: "Les entreprises vérifiées qui recrutent en ce moment, et leurs offres d'emploi ouvertes.",
    robots: indexed ? { index: true, follow: true } : NOINDEX,
    alternates: { canonical: "/carrieres" },
  };
}

export default function Page() {
  return <DirectoryPage />;
}
