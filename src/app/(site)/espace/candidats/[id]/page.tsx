import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { CandidateProfile } from "#/features/candidates/components/candidate-profile";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.titles");
  return { title: t("candidate") };
}

/** A candidate's profile as a page (a hard load or a shared link). */
export default async function Page({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return (
    <div className="w-full pt-2">
      <CandidateProfile workerId={id} asPage />
    </div>
  );
}
