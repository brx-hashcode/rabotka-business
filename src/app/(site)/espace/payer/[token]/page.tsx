import type { Metadata } from "next";

import { PayPage } from "#/features/subscription/components/pay-page";

export const metadata: Metadata = { title: "Paiement" };

export default async function Page({ params }: Readonly<{ params: Promise<{ token: string }> }>) {
  const { token } = await params;
  return <PayPage token={token} />;
}
