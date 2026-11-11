import type { Metadata } from "next";

import { InterviewVisioPage } from "#/features/interviews/components/visio-page";

export const metadata: Metadata = { title: "Visio d'entretien" };

export default async function Page({ params }: Readonly<{ params: Promise<{ room: string }> }>) {
  const { room } = await params;
  return <InterviewVisioPage room={room} />;
}
