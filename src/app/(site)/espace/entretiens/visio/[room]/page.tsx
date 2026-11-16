import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { InterviewVisioPage } from "#/features/interviews/components/visio-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.titles");
  return { title: t("visio") };
}

export default async function Page({ params }: Readonly<{ params: Promise<{ room: string }> }>) {
  const { room } = await params;
  return <InterviewVisioPage room={room} />;
}
