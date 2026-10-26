import type { Metadata } from "next";

import { ContactsPage } from "#/features/contacts/components/contacts-page";

export const metadata: Metadata = { title: "Profils contactés" };

export default function Page() {
  return <ContactsPage />;
}
