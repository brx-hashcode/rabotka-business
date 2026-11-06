"use client";

import { IconBrandFacebook, IconBrandLinkedin, IconBrandWhatsapp, IconConfetti, IconLink, IconX } from "@tabler/icons-react";
import { toast } from "sonner";

import { copyText } from "#/lib/clipboard";
import { offerShareLinks, offerShareUrl } from "../share-url";

const BUTTON = "inline-flex h-10 items-center gap-2 rounded-full px-4 font-medium text-sm transition-colors";

/**
 * Right after publishing: the moment to make the offer known. LinkedIn first —
 * its candidates land on the careers page and apply there, counted as
 * « LinkedIn ». An offer of a business not yet verified is not on the careers
 * page: the card says when it will be, instead of links that lead nowhere.
 */
export function PublishedShareCard({
  slug,
  reference,
  title,
  isPublic,
  onDismiss,
}: Readonly<{ slug: string | null; reference: string; title: string; isPublic: boolean; onDismiss: () => void }>) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const links = slug ? offerShareLinks(origin, slug, reference, title) : null;
  const open = (href: string) => window.open(href, "_blank", "noopener,noreferrer");

  const copy = async () => {
    if (!slug) return;
    const copied = await copyText(offerShareUrl(origin, slug, reference));
    if (copied) toast.success("Lien de l'offre copié.");
    else toast.error("Le lien n'a pas pu être copié.");
  };

  return (
    <section className="relative flex flex-col gap-4 rounded-3xl bg-card p-5 sm:flex-row sm:items-center sm:p-6">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-chip-green text-whatsapp-dark">
        <IconConfetti className="size-6" />
      </span>
      <div className="min-w-0 flex-1 space-y-1 pr-8">
        <h2 className="font-semibold">Votre offre est en ligne : faites-la connaître</h2>
        <p className="text-muted-foreground text-sm">
          {isPublic
            ? "Partagez-la sur LinkedIn ou ailleurs : les candidats postulent directement sur votre page carrières."
            : "Elle sera sur votre page carrières, et pourra être partagée, dès que votre organisation sera vérifiée."}
        </p>
      </div>
      {isPublic && links && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => open(links.linkedin)} className={`${BUTTON} bg-[#0a66c2] text-white hover:bg-[#0a66c2]/90`}>
            <IconBrandLinkedin className="size-4" />
            LinkedIn
          </button>
          <button type="button" onClick={() => open(links.whatsapp)} className={`${BUTTON} bg-page hover:bg-page/70`}>
            <IconBrandWhatsapp className="size-4" />
            WhatsApp
          </button>
          <button type="button" onClick={() => open(links.facebook)} className={`${BUTTON} bg-page hover:bg-page/70`}>
            <IconBrandFacebook className="size-4" />
            Facebook
          </button>
          <button type="button" onClick={() => void copy()} className={`${BUTTON} bg-page hover:bg-page/70`}>
            <IconLink className="size-4" />
            Copier le lien
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fermer"
        className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-page hover:text-foreground"
      >
        <IconX className="size-4" />
      </button>
    </section>
  );
}
