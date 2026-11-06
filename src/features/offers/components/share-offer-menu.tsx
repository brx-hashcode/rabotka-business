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

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { PreviewSheet } from "#/components/preview-sheet";
import { appConfig } from "#/config";
import { useOfferShare } from "../use-offer-share";
import { LinkedinPostDialog, type LinkedinOffer } from "./linkedin-post-dialog";

const ITEM = "cursor-pointer gap-2.5 rounded-xl px-3 py-2.5 text-sm focus:bg-page";

/**
 * Where the offer's public page goes, for anyone not on Rabotka. Each network's
 * link says where it was shared, so the candidates it brings are counted there.
 */
export function ShareOfferMenu({ slug, offer }: Readonly<{ slug: string; offer: LinkedinOffer }>) {
  const { id: offerId, reference, title } = offer;
  // Each network with the offer's details and its tagged link (use-offer-share.ts).
  const share = useOfferShare(slug, offer);

  const [posterOpen, setPosterOpen] = useState(false);
  // LinkedIn: published from the recruiter's account, or its share box (the dialog decides).
  const [linkedinOpen, setLinkedinOpen] = useState(false);

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
            onSelect={() => setLinkedinOpen(true)}
          >
            <IconBrandLinkedin className="size-4 text-[#0a66c2]" />
            LinkedIn
          </DropdownMenuItem>
          <DropdownMenuItem
            className={ITEM}
            onSelect={share.whatsapp}
          >
            <IconBrandWhatsapp className="size-4 text-[#1ebe5b]" />
            WhatsApp
          </DropdownMenuItem>
          <DropdownMenuItem
            className={ITEM}
            onSelect={share.facebook}
          >
            <IconBrandFacebook className="size-4 text-[#1877f2]" />
            Facebook
          </DropdownMenuItem>
          <DropdownMenuItem className={ITEM} onSelect={share.tiktok}>
            <IconBrandTiktok className="size-4" />
            TikTok
          </DropdownMenuItem>
          <DropdownMenuItem className={ITEM} onSelect={() => void share.copyLink()}>
            <IconLink className="size-4" />
            Copier le lien
          </DropdownMenuItem>
          <DropdownMenuItem className={ITEM} onSelect={() => setPosterOpen(true)}>
            <IconPrinter className="size-4" />
            Affiche à imprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <LinkedinPostDialog
        open={linkedinOpen}
        onOpenChange={setLinkedinOpen}
        slug={slug}
        offer={offer}
      />
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
