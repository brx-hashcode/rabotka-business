import type { Metadata } from "next";
import { cookies } from "next/headers";

import { VisioPage } from "#/features/interviews/components/visio-page";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "#/lib/auth/cookies";

export const metadata: Metadata = { title: "Visio d'entretien", robots: { index: false, follow: false } };

export default async function Page({ params }: Readonly<{ params: Promise<{ room: string }> }>) {
  const { room } = await params;
  // Signed in to the business space: tried as the host first.
  const jar = await cookies();
  const signedIn = jar.has(ACCESS_COOKIE) || jar.has(REFRESH_COOKIE);
  return <VisioPage room={room} signedIn={signedIn} />;
}
