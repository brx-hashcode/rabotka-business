import type { Metadata } from "next";
import { IconMessageCircle } from "@tabler/icons-react";

import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("discussions");
  return { title: t("list.title") };
}

/** Beside the list on desktop, until a conversation is chosen. */
export default async function Page() {
  const t = await getTranslations("discussions");
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-page">
        <IconMessageCircle className="size-7 text-muted-foreground" />
      </span>
      <p className="max-w-xs text-muted-foreground">{t("list.pick")}</p>
    </div>
  );
}
