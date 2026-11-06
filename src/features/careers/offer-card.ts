import type { CareersOffer } from "#/lib/api/careers-controller";
import { EMPLOYMENT_LABEL, PAYMENT_SUFFIX } from "#/features/offers/offer-labels";

export type OfferCardChip = { icon: "place" | "type" | "pay"; text: string };

/** Thousands with a plain space: the card's font has no narrow one. */
const fcfa = (n: number) => `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} FCFA`;

const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

/**
 * What the share image says under the title: where, what contract, how much
 * (three chips at most, so they fit on one line), and until when.
 */
export function offerCardFacts(
  o: Pick<CareersOffer, "isRemote" | "city" | "employmentType" | "amount" | "paymentFlow" | "closesAt">,
): { chips: OfferCardChip[]; closes: string | null } {
  const chips: OfferCardChip[] = [];
  const place = o.isRemote ? "Télétravail" : o.city?.trim();
  if (place) chips.push({ icon: "place", text: place.length > 22 ? `${place.slice(0, 21)}…` : place });
  chips.push({ icon: "type", text: EMPLOYMENT_LABEL[o.employmentType] });
  if (o.amount !== null && o.amount > 0) {
    chips.push({ icon: "pay", text: `${fcfa(o.amount)}${o.paymentFlow ? ` ${PAYMENT_SUFFIX[o.paymentFlow]}` : ""}` });
  }
  let closes: string | null = null;
  if (o.closesAt) {
    const d = new Date(o.closesAt);
    if (!Number.isNaN(d.getTime())) closes = `Jusqu'au ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
  }
  return { chips, closes };
}

/** The title as large as it fits in two lines of the 1200 px card. */
export function offerCardTitleSize(title: string): number {
  const n = title.length;
  if (n <= 26) return 88;
  if (n <= 40) return 76;
  if (n <= 60) return 64;
  return 54;
}
