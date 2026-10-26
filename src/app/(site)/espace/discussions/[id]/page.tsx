import type { Metadata } from "next";

import { DiscussionThread } from "#/features/discussions/components/discussion-thread";

export const metadata: Metadata = { title: "Discussion" };

export default async function Page({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  // Keyed: another conversation is another thread, not this one's state reused.
  return <DiscussionThread key={id} id={id} />;
}
