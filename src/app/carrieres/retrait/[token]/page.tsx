import type { Metadata } from "next";

import { PoolWithdrawPage } from "#/features/careers/components/pool-withdraw-page";

export const metadata: Metadata = { title: "Retirer ma candidature", robots: { index: false, follow: false } };

/** « Retirer ma candidature de sa liste », from the confirmation e-mail. */
export default async function Page({ params }: Readonly<{ params: Promise<{ token: string }> }>) {
  const { token } = await params;
  return <PoolWithdrawPage token={token} />;
}
