import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { OrganisationPage } from "#/features/organisation/components/organisation-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.titles");
  return { title: t("organisation") };
}

export default function Page() {
  return <OrganisationPage />;
}
