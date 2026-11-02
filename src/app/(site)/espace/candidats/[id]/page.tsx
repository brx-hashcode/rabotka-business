import type { Metadata } from "next";

import { CandidateProfile } from "#/features/candidates/components/candidate-profile";

export const metadata: Metadata = { title: "Profil candidat" };

/** A candidate's profile as a page (a hard load or a shared link). */
export default async function Page({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return (
    <div className="w-full pt-2">
      <CandidateProfile workerId={id} asPage />
    </div>
  );
}
