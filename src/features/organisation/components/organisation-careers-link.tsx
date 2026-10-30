"use client";

import { IconCopy, IconExternalLink } from "@tabler/icons-react";
import { toast } from "sonner";

import { copyText } from "#/lib/clipboard";

/** The public page of the business, to share where its candidates are. */
export function OrganisationCareersLink({ slug }: Readonly<{ slug: string }>) {
  const path = `/carrieres/${slug}`;

  async function copy() {
    const copied = await copyText(`${window.location.origin}${path}`);
    if (copied) toast.success("Lien copié.");
    else toast.error("Le lien n'a pas pu être copié.");
  }

  return (
    <div className="space-y-2">
      <h2 className="font-semibold text-lg">Page carrières</h2>
      <p className="text-muted-foreground text-sm">
        Partagez ce lien : vos offres ouvertes y sont visibles, même par ceux qui ne sont pas sur Rabotka.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 font-medium text-sm text-white"
        >
          <IconCopy className="size-4" />
          Copier le lien
        </button>
        <a
          href={path}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-page px-4 font-medium text-sm"
        >
          <IconExternalLink className="size-4" />
          Voir la page
        </a>
      </div>
    </div>
  );
}
