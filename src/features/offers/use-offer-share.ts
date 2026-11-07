"use client";

import { toast } from "sonner";

import { copyText } from "#/lib/clipboard";
import type { LinkedinOffer } from "./components/linkedin-post-dialog";
import { defaultLinkedinText } from "./linkedin-post";
import { offerShareLinks, offerShareUrl } from "./share-url";

/**
 * Sharing an offer outside Rabotka, each network with the offer's details
 * (place, contract, pay, date, description) and its tagged careers link:
 * - WhatsApp opens with the whole text written;
 * - Facebook's share box takes no text any more, and TikTok has none: the
 *   text is copied first, to paste there.
 */
export function useOfferShare(slug: string, offer: LinkedinOffer) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const url = (source?: string) => offerShareUrl(origin, slug, offer.reference, source);
  const text = (source: string, hashtags = true) => defaultLinkedinText({ ...offer, url: url(source) }, { hashtags });
  const open = (href: string) => window.open(href, "_blank", "noopener,noreferrer");
  const links = () => offerShareLinks(origin, slug, offer.reference, offer.title, text("whatsapp", false));

  /** Copy on the click, before the new tab takes the focus, then open it. */
  const copyThenOpen = (body: string, href: string, pasteWhere: string) => {
    const copied = copyText(body);
    open(href);
    void copied.then((ok) =>
      ok ? toast.success(`Texte de l'offre copié : collez-le dans votre publication ${pasteWhere}.`) : toast.error("Le texte n'a pas pu être copié."),
    );
  };

  return {
    whatsapp: () => open(links().whatsapp),
    facebook: () => copyThenOpen(text("facebook"), links().facebook, "Facebook"),
    tiktok: () => copyThenOpen(text("tiktok"), "https://www.tiktok.com/", "TikTok"),
    copyLink: async () => {
      const ok = await copyText(url());
      if (ok) toast.success("Lien de l'offre copié.");
      else toast.error("Le lien n'a pas pu être copié.");
    },
    linkedinShareBox: () => links().linkedin,
  };
}
