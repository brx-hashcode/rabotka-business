import { INTL_LOCALE, type Locale } from "#/i18n/config";
import type { LabelsT } from "#/i18n/translator";
import frLabels from "#/i18n/messages/fr/labels.json";
import type { EmploymentType, OfferStatus, PaymentFlow } from "#/lib/api/offer-controller";

/*
 * Words are in the `labels` messages (src/i18n/messages/fr/labels.json):
 * t(`employmentType.${type}`), t(`offerStatus.${status}`),
 * t(`applicationStatus.${status}`), t(`paymentFlow.${flow}`)… Here: the order,
 * the colours, and the helpers that put words together.
 */

export const EMPLOYMENT_TYPES: EmploymentType[] = ["MISSION", "CDD", "CDI", "STAGE", "CONSULTANT", "INTERIM", "APPRENTISSAGE", "VOLONTARIAT"];

/** What a business may publish: every type, the business closing all but a mission itself. */
export const AVAILABLE_EMPLOYMENT_TYPES: EmploymentType[] = ["MISSION", "CDD", "CDI", "STAGE", "CONSULTANT", "INTERIM", "APPRENTISSAGE", "VOLONTARIAT"];

export const PAYMENT_FLOWS: PaymentFlow[] = ["TASK", "HOURLY", "DAILY", "MONTHLY"];

/**
 * Words candidates read — careers pages, LinkedIn posts — are in the
 * business's language, not the reader's: French until a business can choose
 * (then these take the business's messages).
 */
export const EMPLOYMENT_LABEL: Record<EmploymentType, string> = frLabels.employmentType;
export const PAYMENT_SUFFIX: Record<PaymentFlow, string> = frLabels.paymentSuffix;

export const STATUS_CLASSNAME: Record<OfferStatus, string> = {
  DRAFT: "bg-page text-muted-foreground",
  ACTIVE: "bg-chip-green text-chip-green-foreground",
  PARTIALLY_FILLED: "bg-chip-violet text-chip-violet-foreground",
  FILLED: "bg-chip-violet text-chip-violet-foreground",
  IN_PROGRESS: "bg-chip-amber text-chip-amber-foreground",
  COMPLETED: "bg-page text-muted-foreground",
  EXPIRED: "bg-page text-muted-foreground",
  CANCELLED: "bg-page text-muted-foreground",
};

/** An offer's chip: the status, or « Fermée » when the employer ended it. */
export function offerChip(o: { status: OfferStatus; closedAt?: string | null }, t: LabelsT) {
  const closed = o.status === "EXPIRED" && !!o.closedAt;
  return {
    label: t(`offerStatus.${closed ? "CLOSED" : o.status}`),
    className: STATUS_CLASSNAME[o.status],
  };
}

/** Still taking decisions on candidates. */
export function isRecruiting(status: OfferStatus) {
  return status === "ACTIVE" || status === "PARTIALLY_FILLED";
}

const APPLICATION_STATUSES = [
  "PENDING",
  "VIEWED",
  /** Not a status: the business's « Présélectionnée » step (`pillStatus`). */
  "SHORTLISTED",
  "WAITING_PAYMENT",
  "ACCEPTED",
  "STARTED",
  "END",
  "REJECTED",
  "CANCELLED",
] as const;

/** An application's status in words; an unknown one as it comes. */
export function applicationStatusLabel(status: string, t: LabelsT): string {
  return (APPLICATION_STATUSES as readonly string[]).includes(status)
    ? t(`applicationStatus.${status as (typeof APPLICATION_STATUSES)[number]}`)
    : status;
}

/** Where an application stands, for the pipeline's tabs and its pill colour. */
export type ApplicationStage = "new" | "viewed" | "shortlisted" | "hired" | "closed";

/**
 * « Présélectionnée » is the business's own step: a waiting application it
 * set aside before deciding (the candidate is never told). Without
 * `shortlistedAt` (the inbox, which does not carry it), it reads by status.
 */
export function applicationStage(status: string, shortlistedAt?: string | null): ApplicationStage {
  if ((status === "PENDING" || status === "VIEWED") && shortlistedAt) return "shortlisted";
  if (status === "PENDING") return "new";
  if (status === "VIEWED") return "viewed";
  if (["ACCEPTED", "WAITING_PAYMENT", "STARTED", "END"].includes(status)) return "hired";
  return "closed";
}

/**
 * The pill colour of each status, so the steps after « retenue » read apart
 * (they share one tab): retained violet, on the mission green, done sky.
 */
export const STATUS_CLASS: Record<string, string> = {
  PENDING: "bg-chip-amber text-chip-amber-foreground",
  VIEWED: "bg-card text-foreground",
  SHORTLISTED: "bg-brand-lime text-ink",
  WAITING_PAYMENT: "bg-chip-amber text-chip-amber-foreground",
  ACCEPTED: "bg-chip-violet text-chip-violet-foreground",
  STARTED: "bg-chip-green text-chip-green-foreground",
  END: "bg-chip-sky text-chip-sky-foreground",
  REJECTED: "bg-card text-muted-foreground",
  CANCELLED: "bg-card text-muted-foreground",
};

/** The pill an application shows: its status, or « Présélectionnée » while shortlisted. */
export function pillStatus(status: string, shortlistedAt?: string | null): string {
  return applicationStage(status, shortlistedAt) === "shortlisted" ? "SHORTLISTED" : status;
}

export const statusClass = (status: string) => STATUS_CLASS[status] ?? "bg-card text-muted-foreground";

/** Whether the date is the day of the work (a mission) or a closing date. */
export const isDatedMission = (t: EmploymentType) => t === "MISSION";

export const fcfa = (n: number, locale: Locale = "fr") => `${n.toLocaleString(INTL_LOCALE[locale])} FCFA`;

export function offerDate(iso: string | null, type: EmploymentType, t: LabelsT, locale: Locale): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  const tag = INTL_LOCALE[locale];
  const day = d.toLocaleDateString(tag, { weekday: "short", day: "numeric", month: "long", year: "numeric" });
  const time = d.toLocaleTimeString(tag, { hour: "2-digit", minute: "2-digit", hour12: false });
  const withTime = time === "23:59" ? day : t("offer.dayAt", { day, time });
  return isDatedMission(type) ? withTime : t("offer.applicationsUntil", { day });
}

/**
 * The « Clôture » / « Mission » tile of an offer: where its end stands, in
 * words. An offer with no date stays open « until you close it » — saying so,
 * rather than a bare « Par vous » — and an ended one says how it ended, in
 * the words of its chip.
 */
export function closingTile(
  o: { employmentType: EmploymentType; status: OfferStatus; closedAt?: string | null },
  /** Days to its date (mission day, or closing day); null when it has none. */
  left: number | null,
  t: LabelsT,
  locale: Locale,
): { label: string; value: string; hint?: string } {
  const mission = isDatedMission(o.employmentType);
  const label = mission ? t("offer.mission") : t("offer.closing");
  if (!isRecruiting(o.status)) {
    // Ended: how, and when you closed it if you did.
    const closed = o.closedAt
      ? t("offer.closedOn", {
          date: new Date(o.closedAt).toLocaleDateString(INTL_LOCALE[locale], { day: "numeric", month: "long" }),
        })
      : undefined;
    return { label, value: o.closedAt ? t("offerStatus.CLOSED") : offerChip(o, t).label, hint: closed };
  }
  if (left === null) {
    return mission ? { label, value: "—" } : { label, value: t("offer.noDeadline"), hint: t("offer.untilYouClose") };
  }
  return {
    label,
    value: left > 0 ? t("offer.daysLeft", { n: left }) : left === 0 ? t("offer.today") : t("offer.past"),
  };
}
