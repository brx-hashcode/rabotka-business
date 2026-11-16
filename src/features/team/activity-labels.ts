import type { Translator } from "#/i18n/translator";

/**
 * How a line of « Activité » reads: the API logs `METHOD /route/:pattern`
 * (stable), the space words it. Ordered: the first rule that matches wins.
 * A change not listed here still shows, as « a fait une modification ».
 * The words are the `team.activity.did` messages.
 */
const RULES = [
  // Offers
  [/^POST \/job-offers$/, "offerPublished"],
  [/^POST \/job-offers\/:\w+\/close$/, "offerClosed"],
  [/^POST \/job-offers\/:\w+\/republish$/, "offerRepublished"],
  [/^PATCH \/profile\/job-offers\/:\w+$/, "offerEdited"],
  [/^DELETE \/profile\/job-offers\/:\w+$/, "offerDeleted"],
  [/^POST \/profile\/job-offers\/:\w+\/confirm-hire$/, "hireConfirmed"],
  // Candidates
  [/^POST \/profile\/applications\/:\w+\/accept$/, "candidateRetained"],
  [/^POST \/business\/me\/external-applications\/:\w+\/retain$/, "candidateRetained"],
  [/^POST \/profile\/applications\/:\w+\/reject$/, "candidateRefused"],
  [/^POST \/business\/me\/external-applications\/:\w+\/refuse$/, "candidateRefused"],
  [/^POST \/business\/me\/offers\/:\w+\/applications\/refuse$/, "candidatesRefused"],
  [/^POST \/profile\/applications\/:\w+\/rate$/, "candidateRated"],
  [/\/unlock\//, "contactObtained"],
  [/^POST \/business\/me\/contacts\/:\w+$/, "contactObtained"],
  [/^POST \/business\/me\/applications\/:\w+\/:\w+\/notes$/, "noteAdded"],
  [/^PATCH \/business\/me\/applications\/:\w+\/:\w+\/notes\/:\w+$/, "noteEdited"],
  [/^DELETE \/business\/me\/applications\/:\w+\/:\w+\/notes\/:\w+$/, "noteDeleted"],
  [/^PUT \/business\/me\/applications\/:\w+\/:\w+\/opinion$/, "opinionGiven"],
  [/^DELETE \/business\/me\/applications\/:\w+\/:\w+\/opinion$/, "opinionRemoved"],
  // Interviews
  [/^POST \/business\/me\/interviews\/calendar\/reset$/, "calendarReset"],
  [/^POST \/business\/me\/interviews$/, "interviewProposed"],
  [/^PATCH \/business\/me\/interviews\/:\w+$/, "interviewMoved"],
  [/^POST \/business\/me\/interviews\/:\w+\/cancel$/, "interviewCancelled"],
  // CVs and profiles
  [/^POST \/business\/me\/cv-screenings\/:\w+\/comparisons$/, "cvCompared"],
  [/^POST \/business\/me\/(cv-screenings|external-applications\/analyse)$/, "cvScreeningStarted"],
  [/^DELETE \/business\/me\/cv-screenings\/:\w+$/, "cvScreeningDeleted"],
  [/^PUT \/business\/me\/talents\/:\w+$/, "talentKept"],
  [/^DELETE \/business\/me\/talents\/:\w+$/, "talentRemoved"],
  [/^POST \/business\/me\/talents\/:\w+\/invite$/, "talentInvited"],
  [/^POST \/business\/me\/mailboxes\/:\w+\/connect$/, "mailboxConnected"],
  [/^DELETE \/business\/me\/mailboxes\/:\w+$/, "mailboxDisconnected"],
  // The account
  [/^POST \/business\/me\/team$/, "memberInvited"],
  [/^POST \/business\/me\/team\/:\w+\/resend$/, "inviteResent"],
  [/^PATCH \/business\/me\/team\/:\w+$/, "roleChanged"],
  [/^DELETE \/business\/me\/team\/:\w+$/, "memberRemoved"],
  [/^\w+ \/business\/me\/careers-page/, "careersPageEdited"],
  [/^POST \/business\/me\/documents$/, "documentSent"],
  [/^POST \/profile\/avatar$/, "logoChanged"],
  [/^PATCH \/business\/me$/, "organisationEdited"],
  [/^POST \/business\/me\/subscription/, "planChosen"],
] as const satisfies readonly (readonly [RegExp, string])[];

export type ActivityDid = (typeof RULES)[number][1] | "other";

/** Which change a logged action is. */
export function activityDid(action: string): ActivityDid {
  return RULES.find(([r]) => r.test(action))?.[1] ?? "other";
}

export function activityLabel(action: string, t: Translator<"team.activity">): string {
  return t(`did.${activityDid(action)}`);
}

/** The offer a line is about, to link to it; null when it is about something else. */
export function activityOfferId(action: string, targetId: string | null): string | null {
  if (!targetId) return null;
  return /^\w+ \/(job-offers|profile\/job-offers|business\/me\/offers)\/:\w+/.test(action) ? targetId : null;
}
