import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { NewClaimPage } from "#/features/claims/components/new-claim-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.titles");
  return { title: t("newClaim") };
}

export default function Page() {
  return <NewClaimPage />;
}
