"use client";

import { IconBrandFacebook, IconBrandWhatsapp, IconExternalLink, IconLink, IconShare2 } from "@tabler/icons-react";
import { toast } from "sonner";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "#/components/ui/dropdown-menu";

const ITEM = "flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm focus:bg-page";

/**
 * « Partager » : the offer's public page on www.rabotka.work — readable
 * without an account, shown with its title and pay in WhatsApp and Facebook
 * previews, and listed by Google — sent where candidates are.
 */
export function ShareOfferButton({ url, title }: Readonly<{ url: string; title: string }>) {
  const text = `${title}\nPostulez sur Rabotka : ${url}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Lien de l'offre copié.");
    } catch {
      toast.error("Le lien n'a pas pu être copié.");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-10 items-center gap-2 rounded-full bg-page px-4 font-medium text-sm outline-none hover:bg-page/70">
        <IconShare2 className="size-4" />
        Partager
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-2xl border-0 bg-card p-1.5 shadow-soft">
        <DropdownMenuItem asChild className={ITEM}>
          <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">
            <IconBrandWhatsapp className="size-4 text-whatsapp-dark" />
            WhatsApp
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={ITEM}>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer">
            <IconBrandFacebook className="size-4 text-[#1877F2]" />
            Facebook
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void copy()} className={ITEM}>
          <IconLink className="size-4" />
          Copier le lien
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={ITEM}>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <IconExternalLink className="size-4" />
            Voir la page publique
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
