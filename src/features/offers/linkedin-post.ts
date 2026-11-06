import type { LinkedinInfo, LinkedinPost } from "#/lib/api/linkedin-controller";
import type { EmploymentType, PaymentFlow } from "#/lib/api/offer-controller";
import { EMPLOYMENT_LABEL, PAYMENT_SUFFIX } from "./offer-labels";

/** What the LinkedIn post says about the offer. */
export type LinkedinOfferText = {
  title: string;
  companyName: string | null;
  employmentType: EmploymentType;
  isRemote: boolean;
  city: string | null;
  amount: number | null;
  paymentFlow: PaymentFlow | null;
  /** A mission's date, or the day applications close. */
  scheduledAt: string | null;
  description: string;
  categoryName: string | null;
  /** The careers page, where candidates apply (tagged ?source=linkedin). */
  url: string;
};

const fcfa = (n: number) => `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} FCFA`;

/** A hashtag from a name: « Brazzaville », « Nettoyage » ; none from punctuation alone. */
function hashtag(name: string | null | undefined): string | null {
  const word = (name ?? "")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
  return word ? `#${word}` : null;
}

/** The description's start, cut at a sentence (or a word) near `max` characters. */
export function descriptionExcerpt(text: string, max = 380): string {
  const flat = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const sentence = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf(".\n"), cut.lastIndexOf("!"), cut.lastIndexOf("?"));
  if (sentence > max * 0.5) return cut.slice(0, sentence + 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).trimEnd()}…`;
}

/**
 * The post's text before the recruiter edits it: who hires and what, the
 * essentials in one glance, the start of the description, and the link to
 * apply — the picture above carries no link of its own.
 */
export function defaultLinkedinText(o: LinkedinOfferText): string {
  const place = o.isRemote ? "Télétravail" : o.city?.trim();
  const facts = [
    place ? `📍 ${place}` : null,
    `💼 ${EMPLOYMENT_LABEL[o.employmentType]}`,
    o.amount && o.amount > 0 ? `💰 ${fcfa(o.amount)}${o.paymentFlow ? ` ${PAYMENT_SUFFIX[o.paymentFlow]}` : ""}` : null,
  ].filter(Boolean);
  const date = o.scheduledAt ? new Date(o.scheduledAt) : null;
  const when =
    date && !Number.isNaN(date.getTime())
      ? `📅 ${o.employmentType === "MISSION" ? "Mission le" : "Candidatures jusqu'au"} ${date.toLocaleDateString("fr", { day: "numeric", month: "long" })}`
      : null;
  const tags = ["#recrutement", "#emploi", hashtag(place), hashtag(o.categoryName)].filter((t, i, all): t is string => !!t && all.indexOf(t) === i);

  return [
    `🚀 ${o.companyName ? `${o.companyName} recrute` : "Nous recrutons"} : ${o.title}`,
    [facts.join(" · "), when].filter(Boolean).join("\n"),
    o.description.trim() ? descriptionExcerpt(o.description) : null,
    `👉 Postulez en ligne, sans créer de compte : ${o.url}`,
    tags.join(" "),
  ]
    .filter(Boolean)
    .join("\n\n");
}

/**
 * What the « Publier sur LinkedIn » dialog shows:
 * - `share`: Rabotka's LinkedIn app is not set up, only the share link;
 * - `connect` / `expired`: the person connects (again) first;
 * - `pending`: a post is on its way; `posted`: it is online;
 * - `ready`: write the text and publish.
 */
export type LinkedinDialogState = "share" | "connect" | "expired" | "pending" | "posted" | "ready";

export function linkedinDialogState(info: LinkedinInfo | undefined, posts: LinkedinPost[] | undefined): LinkedinDialogState {
  if (!info?.available) return "share";
  if (!info.account) return "connect";
  if (info.account.expired) return "expired";
  const latest = posts?.[0];
  if (latest?.status === "QUEUED") return "pending";
  if (posts?.some((p) => p.status === "PUBLISHED")) return "posted";
  return "ready";
}

/** An offer of the business space, as the LinkedIn post describes it. */
export function linkedinOffer(
  o: {
    id: string;
    reference: string;
    title: string;
    employmentType: EmploymentType;
    isRemote: boolean;
    city: string | null;
    amount: number | null;
    paymentFlow: PaymentFlow | null;
    scheduledAt: string | null;
    description: string;
  },
  companyName: string | null | undefined,
  categoryName: string | null | undefined,
) {
  return {
    id: o.id,
    reference: o.reference,
    title: o.title,
    companyName: companyName ?? null,
    employmentType: o.employmentType,
    isRemote: o.isRemote,
    city: o.city,
    amount: o.amount,
    paymentFlow: o.paymentFlow,
    scheduledAt: o.scheduledAt,
    description: o.description,
    categoryName: categoryName ?? null,
  };
}
