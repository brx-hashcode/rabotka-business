import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { DiscussionThread } from "#/features/discussions/components/discussion-thread";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.titles");
  return { title: t("conversation") };
}

export default async function Page({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  // Keyed: another conversation is another thread, not this one's state reused.
  return <DiscussionThread key={id} id={id} />;
}
