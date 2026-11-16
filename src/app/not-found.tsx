import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { BusinessLockup } from "#/components/business-lockup";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.notFound");
  return { title: t("title") };
}

export default async function NotFound() {
  const t = await getTranslations("pages.notFound");
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-page px-4 py-10 text-center">
      <BusinessLockup />
      <section className="w-full max-w-md space-y-3 rounded-3xl bg-card p-8">
        <h1 className="font-semibold text-2xl tracking-tight">{t("title")}</h1>
        <p className="text-foreground/70">{t("text")}</p>
        <Link href="/" className="inline-flex h-11 items-center rounded-full bg-ink px-6 font-medium text-sm text-white">
          {t("home")}
        </Link>
      </section>
    </main>
  );
}
