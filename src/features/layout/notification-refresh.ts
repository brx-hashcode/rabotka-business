import type { QueryClient, QueryKey } from "@tanstack/react-query";

/**
 * What a pushed notification is about, as the socket hands it over:
 * `metadata` is the notification's own input (applicationId, jobOfferId…).
 */
export type PushedNotification = {
  type?: string;
  metadata?: Record<string, unknown> | null;
};

// The same prefixes as the controllers' keys (offersKey, externalApplicationsKey…),
// spelled here so this stays a pure module the node tests can load.
const K = {
  notifications: ["notifications"],
  offers: ["offers"],
  outsiders: ["external-applications"],
  business: ["business", "me"],
  interviews: ["interviews"],
  opinions: ["offer-opinions"],
  team: ["candidate-team"],
  screenings: ["cv-screenings"],
  claims: ["claims"],
  invoices: ["invoices"],
  discussions: ["discussions"],
} as const;

const id = (n: PushedNotification, key: string) => {
  const v = n.metadata?.[key];
  return typeof v === "string" && v ? v : null;
};

/**
 * Every notification refreshes what it is about, so the page behind it is
 * never older than the bell. An unknown type refreshes the broad set the
 * socket always did: nothing is less fresh than before.
 */
export function refreshKeysFor(n: PushedNotification): QueryKey[] {
  const keys: QueryKey[] = [K.notifications];
  const application = id(n, "applicationId");
  const add = (...more: QueryKey[]) => keys.push(...more);
  switch (n.type) {
    // A candidate applied, from the app or the careers page: both lists, the
    // scores, the counts, the team's opinions on that offer.
    case "NEW_APPLICATION":
      add(K.offers, K.outsiders, K.business, K.opinions);
      break;
    case "APPLICATION_CANCELLED":
    case "CONTACT_UNLOCKED":
    case "MISSION_COMPLETED":
    case "MISSION_RATED":
    case "PAYMENT_SUCCEEDED":
    case "PAYMENT_FAILED":
      add(K.offers, K.business, K.invoices, K.interviews);
      if (application) add(["application", application]);
      break;
    case "INTERVIEW_ANSWERED":
    case "INTERVIEW_CANCELLED":
    case "INTERVIEW_INVITED":
      add(K.interviews, K.offers);
      break;
    case "CV_SCREENING_DONE":
      add(K.screenings, K.outsiders, K.offers);
      break;
    case "JOB_OFFER_EXPIRED":
    case "JOB_OFFER_EXPIRING":
    case "JOB_OFFER_UPDATED":
      add(K.offers, K.business);
      break;
    case "NEW_MESSAGE":
      add(K.discussions);
      break;
    case "CLAIM_STATUS_CHANGED":
    case "CLAIM_COMMENTED":
      add(K.claims);
      break;
    default:
      if (n.type?.startsWith("BUSINESS_")) {
        // Plan granted, ending, cancelled; organisation verified or not.
        add(K.business, K.invoices);
        break;
      }
      // Not known here: the broad set, as before.
      add(K.offers, K.outsiders, K.business, K.interviews);
  }
  return keys;
}

export function refreshFor(queryClient: QueryClient, n: PushedNotification): void {
  for (const queryKey of refreshKeysFor(n)) void queryClient.invalidateQueries({ queryKey });
}

/** A CV of a screening was read: the offer's cards show its score as it lands. */
export const SCREENING_PROGRESS_KEYS: QueryKey[] = [K.screenings, K.outsiders, K.offers];
