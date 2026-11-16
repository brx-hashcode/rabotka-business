import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { CareersEditorPage } from "#/features/careers-editor/components/careers-editor-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.titles");
  return { title: t("careersPage") };
}

export default function Page() {
  return <CareersEditorPage />;
}
