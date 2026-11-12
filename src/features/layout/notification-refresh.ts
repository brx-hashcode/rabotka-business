import type { QueryClient, QueryKey } from "@tanstack/react-query";

/**
 * What a pushed notification is about, as the socket hands it over:
 * `metadata` is the notification's own input (applicationId, jobOfferId…).
 */
export type PushedNotification = {
  type?: string;
  metadata?: Record<string, unknown> | null;
};

// The same keys as the controllers' (offersKey, externalApplicationsKey…),
// spelled here so this stays a pure module the node tests can load.
const K = {
  notifications: ["notifications"],
  offers: ["offers"],
  offerLists: ["offers", "list"],
  received: ["offers", "received"],
  outsiders: ["external-applications"],
  business: ["business", "me"],
  stats: ["business", "me", "stats"],
  subscription: ["business", "me", "subscription"],
  interviews: ["interviews"],
  interviewReports: ["interview-report"],
  opinions: ["offer-opinions"],
  team: ["candidate-team"],
  screenings: ["cv-screenings"],
  screeningList: ["cv-screenings", "list"],
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
 * never older than the bell — and only that: an offer id narrows « all the
 * offers » to that offer, its lists and the inbox. An unknown type refreshes
 * the broad set the socket always did: nothing is less fresh than before.
 * (Only the queries on screen refetch; the others are just marked stale.)
 */
export function refreshKeysFor(n: PushedNotification): QueryKey[] {
  const keys: QueryKey[] = [K.notifications];
  const application = id(n, "applicationId");
  const offer = id(n, "jobOfferId");
  const add = (...more: QueryKey[]) => keys.push(...more);
  // The offer itself (detail, applicants, scores), the lists' counts, the inbox.
  const offerKeys = (): QueryKey[] => (offer ? [["offers", offer], K.offerLists, K.received] : [K.offers]);
  switch (n.type) {
    // A candidate applied, from the app or the careers page: both lists, the
    // scores, the counts, the team's opinions on that offer.
    case "NEW_APPLICATION":
      add(...offerKeys(), K.outsiders, K.stats, offer ? ["offer-opinions", offer] : K.opinions);
      break;
    case "APPLICATION_CANCELLED":
    case "MISSION_COMPLETED":
    case "MISSION_RATED":
      add(...offerKeys(), K.stats, K.interviews);
      if (application) add(["application", application]);
      break;
    // A contact obtained or a payment: the plan's counters and the invoices too.
    case "CONTACT_UNLOCKED":
    case "PAYMENT_SUCCEEDED":
    case "PAYMENT_FAILED":
      add(K.offers, K.stats, K.subscription, K.invoices, K.interviews);
      if (application) add(["application", application]);
      break;
    case "INTERVIEW_ANSWERED":
    case "INTERVIEW_CANCELLED":
    case "INTERVIEW_INVITED":
      add(K.interviews, K.offers, K.outsiders);
      break;
    // Written in the background: the open « Compte rendu » fills in.
    case "INTERVIEW_REPORT_READY":
      add(K.interviewReports, K.interviews);
      break;
    case "CV_SCREENING_DONE": {
      const screening = id(n, "screeningId");
      add(screening ? ["cv-screenings", screening] : K.screenings, K.screeningList, K.outsiders, K.offers, K.subscription);
      break;
    }
    case "JOB_OFFER_EXPIRED":
    case "JOB_OFFER_EXPIRING":
    case "JOB_OFFER_UPDATED":
      add(...offerKeys(), K.stats);
      break;
    case "NEW_MESSAGE":
      add(K.discussions);
      break;
    // Posted (or not) on LinkedIn: the offer's « Publier sur LinkedIn » follows.
    case "LINKEDIN_POST":
      add(offer ? ["business", "me", "linkedin", "posts", offer] : ["business", "me", "linkedin"]);
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

/** What the socket says as a screening's CVs are read. */
export type ScreeningProgress = { screeningId?: string; offerId?: string; done?: number; total?: number };

/**
 * A screening's CVs, as they are read: that screening refreshes at once, the
 * rest (list counts, careers candidates, offer cards) at most every `wait` ms
 * — a 40-CV batch no longer refetches every offer 40 times — and all of it
 * when the last CV is in.
 */
export function createProgressRefresh(invalidate: (queryKey: QueryKey) => void, wait = 2000) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending = new Set<string>();
  const flush = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    for (const key of pending) invalidate(JSON.parse(key) as QueryKey);
    pending = new Set();
  };
  return (event: ScreeningProgress = {}) => {
    const screening = typeof event.screeningId === "string" && event.screeningId ? event.screeningId : null;
    invalidate(screening ? ["cv-screenings", screening] : K.screenings);
    const offer = typeof event.offerId === "string" && event.offerId ? event.offerId : null;
    for (const key of [K.screeningList, K.outsiders, offer ? ["offers", offer] : K.offers]) pending.add(JSON.stringify(key));
    if (event.total !== undefined && event.done !== undefined && event.done >= event.total) {
      pending.add(JSON.stringify(K.subscription));
      flush();
    } else {
      timer ??= setTimeout(flush, wait);
    }
  };
}
