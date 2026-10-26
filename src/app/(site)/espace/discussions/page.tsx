import type { Metadata } from "next";
import { IconMessageCircle } from "@tabler/icons-react";

import { discussionsContent } from "#/features/discussions/content";

export const metadata: Metadata = { title: "Discussions" };

/** Beside the list on desktop, until a conversation is chosen. */
export default function Page() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-page">
        <IconMessageCircle className="size-7 text-muted-foreground" />
      </span>
      <p className="max-w-xs text-muted-foreground">{discussionsContent.list.pick}</p>
    </div>
  );
}
