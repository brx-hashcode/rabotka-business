import type { Metadata } from "next";
import Link from "next/link";

import { BusinessLockup } from "#/components/business-lockup";

export const metadata: Metadata = { title: "Page introuvable" };

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-page px-4 py-10 text-center">
      <BusinessLockup />
      <section className="w-full max-w-md space-y-3 rounded-3xl bg-card p-8">
        <h1 className="font-semibold text-2xl tracking-tight">Page introuvable</h1>
        <p className="text-foreground/70">Ce lien n&apos;existe pas ou n&apos;est plus valable.</p>
        <Link href="/" className="inline-flex h-11 items-center rounded-full bg-ink px-6 font-medium text-sm text-white">
          Retour à l&apos;accueil
        </Link>
      </section>
    </main>
  );
}
