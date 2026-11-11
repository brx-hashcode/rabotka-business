import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { VisioPage } from "#/features/interviews/components/visio-page";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "#/lib/auth/cookies";

export const metadata: Metadata = { title: "Visio d'entretien", robots: { index: false, follow: false } };

export default async function Page({
  params,
  searchParams,
}: Readonly<{ params: Promise<{ room: string }>; searchParams: Promise<{ invite?: string }> }>) {
  const { room } = await params;
  const { invite } = await searchParams;
  // Signed in to the business space: the call opens inside it, as the host.
  // `?invite=1` joins as a guest anyway (someone else's interview).
  const jar = await cookies();
  if (!invite && (jar.has(ACCESS_COOKIE) || jar.has(REFRESH_COOKIE))) {
    redirect(`/espace/entretiens/visio/${encodeURIComponent(room)}`);
  }
  return <VisioPage room={room} />;
}
