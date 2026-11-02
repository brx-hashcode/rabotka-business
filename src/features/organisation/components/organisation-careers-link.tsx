"use client";

import { IconCopy, IconExternalLink } from "@tabler/icons-react";
import { toast } from "sonner";

import { copyText } from "#/lib/clipboard";
import { cn } from "#/lib/utils";

/**
 * The public page of the business, to share where its candidates are, and
 * whether its offers also go to Google and the job sites.
 */
export function OrganisationCareersLink({
  slug,
  distribute,
  pending,
  onDistributeChange,
}: Readonly<{ slug: string; distribute: boolean; pending: boolean; onDistributeChange: (on: boolean) => void }>) {
  const path = `/carrieres/${slug}`;

  async function copy() {
    const copied = await copyText(`${window.location.origin}${path}`);
    if (copied) toast.success("Lien copié.");
    else toast.error("Le lien n'a pas pu être copié.");
  }

  return (
    <div className="space-y-4">
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

      <button
        type="button"
        role="switch"
        aria-checked={distribute}
        disabled={pending}
        onClick={() => onDistributeChange(!distribute)}
        className="flex w-full items-start gap-3 rounded-2xl bg-page p-4 text-left disabled:opacity-60"
      >
        <span
          className={cn(
            "relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors",
            distribute ? "bg-whatsapp-dark" : "bg-foreground/15",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0 size-4 rounded-full bg-white transition-transform",
              distribute ? "translate-x-4.5" : "translate-x-0.5",
            )}
          />
        </span>
        <span className="space-y-0.5">
          <span className="block font-medium text-sm">Diffuser mes offres sur Google et les sites d&apos;emploi</span>
          <span className="block text-muted-foreground text-xs">
            Vos offres ouvertes apparaissent dans les recherches d&apos;emploi. Les candidatures arrivent ici, comme les autres.
          </span>
        </span>
      </button>
    </div>
  );
}
