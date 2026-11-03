"use client";

import {
  IconBrandFacebook,
  IconBrandLinkedin,
  IconBrandTiktok,
  IconPrinter,
  IconBrandWhatsapp,
  IconLink,
  IconShare,
} from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { PreviewSheet } from "#/components/preview-sheet";
import { appConfig } from "#/config";
import { copyText } from "#/lib/clipboard";

const ITEM = "cursor-pointer gap-2.5 rounded-xl px-3 py-2.5 text-sm focus:bg-page";

/**
 * Where the offer's public page goes, for anyone not on Rabotka. Each network's
 * link says where it was shared, so the candidates it brings are counted there.
 */
export function ShareOfferMenu({
  offerId,
  slug,
  reference,
  title,
}: Readonly<{ offerId: string; slug: string; reference: string; title: string }>) {
  const url = (source?: string) =>
    `${window.location.origin}/carrieres/${slug}/${reference}${source ? `?source=${source}` : ""}`;
  const open = (href: string) => window.open(href, "_blank", "noopener,noreferrer");

  const copy = async () => {
    const copied = await copyText(url());
    if (copied) toast.success("Lien de l'offre copié.");
    else toast.error("Le lien n'a pas pu être copié.");
  };

  // TikTok has no share link: the offer's link is copied, to paste there.
  const shareOnTiktok = async () => {
    const copied = await copyText(url("tiktok"));
    if (copied) toast.success("Lien copié. Collez-le sur TikTok.");
    else toast.error("Le lien n'a pas pu être copié.");
    window.open("https://www.tiktok.com/", "_blank", "noopener,noreferrer");
  };

  const [posterOpen, setPosterOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex h-10 items-center gap-2 rounded-full bg-page px-4 font-medium text-sm outline-none hover:bg-page/70">
          <IconShare className="size-4" />
          Partager
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-2xl border-0 bg-card p-1.5 shadow-soft">
          <DropdownMenuItem
            className={ITEM}
            onSelect={() => open(`https://wa.me/?text=${encodeURIComponent(`${title}\n${url("whatsapp")}`)}`)}
          >
            <IconBrandWhatsapp className="size-4" />
            WhatsApp
          </DropdownMenuItem>
          <DropdownMenuItem
            className={ITEM}
            onSelect={() => open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url("facebook"))}`)}
          >
            <IconBrandFacebook className="size-4" />
            Facebook
          </DropdownMenuItem>
          <DropdownMenuItem
            className={ITEM}
            onSelect={() => open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url("linkedin"))}`)}
          >
            <IconBrandLinkedin className="size-4" />
            LinkedIn
          </DropdownMenuItem>
          <DropdownMenuItem className={ITEM} onSelect={() => void shareOnTiktok()}>
            <IconBrandTiktok className="size-4" />
            TikTok
          </DropdownMenuItem>
          <DropdownMenuItem className={ITEM} onSelect={() => void copy()}>
            <IconLink className="size-4" />
            Copier le lien
          </DropdownMenuItem>
          <DropdownMenuItem className={ITEM} onSelect={() => setPosterOpen(true)}>
            <IconPrinter className="size-4" />
            Affiche à imprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Read, downloaded and printed from the drawer, like the dashboard's report. */}
      <PreviewSheet
        open={posterOpen}
        onOpenChange={setPosterOpen}
        title="Affiche à imprimer"
        subtitle={title}
        src={`${appConfig.apiUrl}/business/me/job-offers/${encodeURIComponent(offerId)}/poster.pdf`}
        kind="pdf"
        fileName={`affiche-${reference}.pdf`}
        unavailable="L'affiche n'a pas pu être créée. Réessayez dans un instant."
      />
    </>
  );
}
