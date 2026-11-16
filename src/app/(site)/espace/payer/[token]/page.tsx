import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PayPage } from "#/features/subscription/components/pay-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.titles");
  return { title: t("payment") };
}

export default async function Page({ params }: Readonly<{ params: Promise<{ token: string }> }>) {
  const { token } = await params;
  return <PayPage token={token} />;
}
