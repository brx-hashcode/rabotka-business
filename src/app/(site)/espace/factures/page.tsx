import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { InvoicesPage } from "#/features/invoices/components/invoices-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.titles");
  return { title: t("invoices") };
}

export default function Page() {
  return <InvoicesPage />;
}
