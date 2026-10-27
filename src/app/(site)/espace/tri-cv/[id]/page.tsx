import type { Metadata } from "next";

import { CvScreeningPage } from "#/features/cv-screening/components/cv-screening-page";

export const metadata: Metadata = { title: "Tri des CV" };

export default async function Page({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <CvScreeningPage id={id} />;
}
