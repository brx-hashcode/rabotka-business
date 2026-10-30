"use client";

import {
  IconBrandFacebook,
  IconBrandTiktok,
  IconBrandWhatsapp,
  IconLink,
  IconShare,
} from "@tabler/icons-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { copyText } from "#/lib/clipboard";

const ITEM = "cursor-pointer gap-2.5 rounded-xl px-3 py-2.5 text-sm focus:bg-page";

/** Where the offer's public page goes, for anyone not on Rabotka. */
export function ShareOfferMenu({
  slug,
  reference,
  title,
}: Readonly<{ slug: string; reference: string; title: string }>) {
  const url = () => `${window.location.origin}/carrieres/${slug}/${reference}`;

  const copy = async () => {
    const copied = await copyText(url());
    if (copied) toast.success("Lien de l'offre copié.");
    else toast.error("Le lien n'a pas pu être copié.");
  };

  // TikTok has no share link: the offer's link is copied, to paste there.
  const shareOnTiktok = async () => {
    const copied = await copyText(url());
    if (copied) toast.success("Lien copié. Collez-le sur TikTok.");
    else toast.error("Le lien n'a pas pu être copié.");
    window.open("https://www.tiktok.com/", "_blank", "noopener,noreferrer");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-10 items-center gap-2 rounded-full bg-page px-4 font-medium text-sm outline-none hover:bg-page/70">
        <IconShare className="size-4" />
        Partager
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl border-0 bg-card p-1.5 shadow-soft">
        <DropdownMenuItem
          className={ITEM}
          onSelect={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${title}\n${url()}`)}`, "_blank", "noopener,noreferrer")}
        >
          <IconBrandWhatsapp className="size-4" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem
          className={ITEM}
          onSelect={() =>
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`, "_blank", "noopener,noreferrer")
          }
        >
          <IconBrandFacebook className="size-4" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem className={ITEM} onSelect={() => void shareOnTiktok()}>
          <IconBrandTiktok className="size-4" />
          TikTok
        </DropdownMenuItem>
        <DropdownMenuItem className={ITEM} onSelect={() => void copy()}>
          <IconLink className="size-4" />
          Copier le lien
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
