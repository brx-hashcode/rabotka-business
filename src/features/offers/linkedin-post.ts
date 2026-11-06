import type { LinkedinInfo, LinkedinPost } from "#/lib/api/linkedin-controller";
import type { EmploymentType } from "#/lib/api/offer-controller";
import { EMPLOYMENT_LABEL } from "./offer-labels";

/** The text above the offer's card on LinkedIn, before the recruiter edits it. */
export function defaultLinkedinText(title: string, type: EmploymentType, city: string | null): string {
  const what = [EMPLOYMENT_LABEL[type], city?.trim()].filter(Boolean).join(", ");
  return `Nous recrutons : ${title}${what ? ` (${what})` : ""}.\n\nPostulez directement sur notre page carrières 👇\n\n#recrutement #emploi`;
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
