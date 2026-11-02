import { CandidateDialog } from "#/features/candidates/components/candidate-dialog";

/** /espace/candidats/[id] reached by a link inside the app: a dialog over the page. */
export default async function CandidateModal({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <CandidateDialog workerId={id} />;
}
