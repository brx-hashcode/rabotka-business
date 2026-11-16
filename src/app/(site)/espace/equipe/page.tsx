import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { TeamPage } from "#/features/team/components/team-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.titles");
  return { title: t("team") };
}

export default function Page() {
  return <TeamPage />;
}
