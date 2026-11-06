import type { Metadata } from "next";

import { DirectoryPage } from "#/features/careers/components/directory-page";
import { careersCompaniesServer } from "#/lib/api/careers-server";
import { NOINDEX } from "#/lib/seo/indexed-host";
import { siteOrigin } from "#/lib/seo/site";

export async function generateMetadata(): Promise<Metadata> {
  const { indexed } = await siteOrigin();
  return {
    // Not only the Congo: Rabotka Business is open in several countries.
    title: "Ils recrutent",
    description: "Les entreprises vérifiées qui recrutent en ce moment, et leurs offres d'emploi ouvertes.",
    robots: indexed ? { index: true, follow: true } : NOINDEX,
    alternates: { canonical: "/carrieres" },
  };
}

export default async function Page() {
  const companies = await careersCompaniesServer();
  return <DirectoryPage initial={companies ?? undefined} />;
}
