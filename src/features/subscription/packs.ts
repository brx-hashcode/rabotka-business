import type { MySubscription, PackKind } from "#/lib/api/types";

type Entitlements = MySubscription["entitlements"];

/** Where the packs are bought: the « Packs » tab of the Abonnement page. */
export const PACKS_HREF = "/espace/abonnement?onglet=packs";

/** The packs, in the order the page shows them. */
export const PACK_KINDS: PackKind[] = ["CV", "OFFER", "CONTACT", "OFFER_DRAFT"];

/** Each pack's name on its card. */
export const PACK_TITLE: Record<PackKind, string> = {
  CV: "Pack CV",
  OFFER: "Pack offres",
  CONTACT: "Pack contacts",
  OFFER_DRAFT: "Pack rédactions IA",
};

/** « 50 CV à analyser », « 1 offre à publier »… as the backend says it (invoice, e-mail, bell). */
export function packUnits(kind: PackKind, n: number): string {
  const s = n > 1 ? "s" : "";
  switch (kind) {
    case "CV":
      return `${n} CV à analyser`;
    case "OFFER":
      return `${n} offre${s} à publier`;
    case "CONTACT":
      return `${n} contact${s} à obtenir`;
    case "OFFER_DRAFT":
      return `${n} offre${s} rédigée${s} par l’IA`;
  }
}

const CREDIT_KEY = { CV: "cv", OFFER: "offers", CONTACT: "contacts", OFFER_DRAFT: "offerDrafts" } as const;

/** What is left of the packs bought, of one kind (0 on a backend before packs). */
export function packCredits(e: Entitlements | undefined, kind: PackKind): number {
  return e?.credits?.[CREDIT_KEY[kind]] ?? 0;
}

/**
 * A pack's payment, from its description: « Pack Rabotka Business — 100 CV à
 * analyser » → « 100 CV à analyser ». Null for a plan's.
 */
export function readPackDescription(description: string | null | undefined): string | null {
  const m = description?.match(/^Pack Rabotka Business\s+[—-]\s+(.+)$/);
  return m ? m[1] : null;
}

/**
 * CV analysis is out of reach: the plan leaves it out and no pack is left,
 * or the trial leaves it out (its quota and what remains both read 0 then).
 */
export function cvOutOfReach(e: Entitlements | undefined): boolean {
  return !e || (e.cvQuota === 0 && !e.cvRemaining);
}

/** The same for the offers written by the AI. */
export function offerWriterOutOfReach(e: Entitlements | undefined): boolean {
  return !e || (e.offerDraftsQuota === 0 && !e.offerDraftsRemaining);
}

/**
 * Of what remains, the part the plan itself gives this period (the rest
 * comes from packs, and outlives the period): null when unlimited.
 */
export function planShare(remaining: number | null | undefined, credits: number): number | null {
  if (remaining === null || remaining === undefined) return null;
  return Math.max(0, remaining - credits);
}
