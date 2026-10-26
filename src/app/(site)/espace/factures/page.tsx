import type { Metadata } from "next";

import { InvoicesPage } from "#/features/invoices/components/invoices-page";

export const metadata: Metadata = { title: "Factures" };

export default function Page() {
  return <InvoicesPage />;
}
