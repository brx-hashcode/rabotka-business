import type { Metadata } from "next";

import { InvitationPage } from "#/features/interviews/components/invitation-page";

export const metadata: Metadata = { title: "Invitation à un entretien", robots: { index: false, follow: false } };

export default async function Page({ params }: Readonly<{ params: Promise<{ token: string }> }>) {
  const { token } = await params;
  return <InvitationPage token={token} />;
}
