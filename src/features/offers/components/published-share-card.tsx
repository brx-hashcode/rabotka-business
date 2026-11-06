"use client";

import { IconBrandFacebook, IconBrandLinkedin, IconBrandWhatsapp, IconConfetti, IconLink, IconX } from "@tabler/icons-react";
import { useState } from "react";

import { useOfferShare } from "../use-offer-share";
import { LinkedinPostDialog, type LinkedinOffer } from "./linkedin-post-dialog";

const BUTTON = "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 font-medium text-sm transition-colors";

/**
 * Right after publishing: the moment to make the offer known. LinkedIn first —
 * its candidates land on the careers page and apply there, counted as
 * « LinkedIn ». An offer of a business not yet verified is not on the careers
 * page: the card says when it will be, instead of links that lead nowhere.
 */
export function PublishedShareCard({
  slug,
  offer,
  isPublic,
  onDismiss,
}: Readonly<{ slug: string | null; offer: LinkedinOffer; isPublic: boolean; onDismiss: () => void }>) {
  const [linkedinOpen, setLinkedinOpen] = useState(false);
  // Each network with the offer's details and its tagged link (use-offer-share.ts).
  const share = useOfferShare(slug ?? "", offer);

  return (
    <section className="relative space-y-5 rounded-3xl bg-card p-5 sm:p-6">
      <div className="flex items-start gap-4 pr-10">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-chip-green text-whatsapp-dark">
          <IconConfetti className="size-6" />
        </span>
        <div className="min-w-0 space-y-1 pt-0.5">
          <h2 className="font-semibold">Votre offre est en ligne : faites-la connaître</h2>
          <p className="text-muted-foreground text-sm">
            {isPublic
              ? "Partagez-la sur LinkedIn ou ailleurs : les candidats postulent directement sur votre page carrières."
              : "Elle sera sur votre page carrières, et pourra être partagée, dès que votre organisation sera vérifiée."}
          </p>
        </div>
      </div>
      {isPublic && slug && (
        // Each network in its own colours, so it is found at a glance.
        <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap">
          <button type="button" onClick={() => setLinkedinOpen(true)} className={`${BUTTON} bg-[#0a66c2] text-white hover:bg-[#004182]`}>
            <IconBrandLinkedin className="size-[18px]" />
            LinkedIn
          </button>
          <button type="button" onClick={share.whatsapp} className={`${BUTTON} bg-[#25d366] text-[#0b3d20] hover:bg-[#1ebe5b]`}>
            <IconBrandWhatsapp className="size-[18px]" />
            WhatsApp
          </button>
          <button type="button" onClick={share.facebook} className={`${BUTTON} bg-[#1877f2] text-white hover:bg-[#0c63d4]`}>
            <IconBrandFacebook className="size-[18px]" />
            Facebook
          </button>
          <button type="button" onClick={() => void share.copyLink()} className={`${BUTTON} bg-page text-foreground hover:bg-page/70`}>
            <IconLink className="size-[18px]" />
            Copier le lien
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fermer"
        className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-page hover:text-foreground"
      >
        <IconX className="size-4" />
      </button>
      {slug && <LinkedinPostDialog open={linkedinOpen} onOpenChange={setLinkedinOpen} slug={slug} offer={offer} />}
    </section>
  );
}
