import type { Metadata } from "next";

import { ApplyPage } from "#/features/careers/components/apply-page";

export const metadata: Metadata = { title: "Postuler", robots: { index: false, follow: false } };

export default async function Page({ params }: Readonly<{ params: Promise<{ slug: string; reference: string }> }>) {
  const { slug, reference } = await params;
  return <ApplyPage slug={slug} reference={reference} />;
}
