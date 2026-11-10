import type { EmploymentType, OfferStatus, PaymentFlow } from "#/lib/api/offer-controller";

export const EMPLOYMENT_TYPES: { value: EmploymentType; label: string; hint: string }[] = [
  { value: "MISSION", label: "Mission", hint: "Un travail ponctuel, à une date donnée" },
  { value: "CDD", label: "CDD", hint: "Contrat à durée déterminée" },
  { value: "CDI", label: "CDI", hint: "Contrat à durée indéterminée" },
  { value: "STAGE", label: "Stage", hint: "Stage ou alternance" },
];

/** What a business may publish: every type, the business closing a CDD, CDI or stage itself. */
export const AVAILABLE_EMPLOYMENT_TYPES: EmploymentType[] = ["MISSION", "CDD", "CDI", "STAGE"];

export const EMPLOYMENT_LABEL: Record<EmploymentType, string> = {
  MISSION: "Mission",
  CDD: "CDD",
  CDI: "CDI",
  STAGE: "Stage",
};

export const PAYMENT_FLOWS: { value: PaymentFlow; label: string }[] = [
  { value: "TASK", label: "Par tâche" },
  { value: "HOURLY", label: "Par heure" },
  { value: "DAILY", label: "Par jour" },
  { value: "MONTHLY", label: "Par mois" },
];

export const PAYMENT_SUFFIX: Record<PaymentFlow, string> = {
  TASK: "la tâche",
  HOURLY: "/ heure",
  DAILY: "/ jour",
  MONTHLY: "/ mois",
};

export const STATUS: Record<OfferStatus, { label: string; className: string }> = {
  DRAFT: { label: "Brouillon", className: "bg-page text-muted-foreground" },
  ACTIVE: { label: "En ligne", className: "bg-chip-green text-chip-green-foreground" },
  PARTIALLY_FILLED: { label: "En partie pourvue", className: "bg-chip-violet text-chip-violet-foreground" },
  FILLED: { label: "Pourvue", className: "bg-chip-violet text-chip-violet-foreground" },
  IN_PROGRESS: { label: "En cours", className: "bg-chip-amber text-chip-amber-foreground" },
  COMPLETED: { label: "Terminée", className: "bg-page text-muted-foreground" },
  EXPIRED: { label: "Expirée", className: "bg-page text-muted-foreground" },
  CANCELLED: { label: "Annulée", className: "bg-page text-muted-foreground" },
};

/** An offer's chip: the status, or « Fermée » when the employer ended it. */
export function offerChip(o: { status: OfferStatus; closedAt?: string | null }) {
  return o.status === "EXPIRED" && o.closedAt ? { ...STATUS.EXPIRED, label: "Fermée" } : STATUS[o.status];
}

/** Still taking decisions on candidates. */
export function isRecruiting(status: OfferStatus) {
  return status === "ACTIVE" || status === "PARTIALLY_FILLED";
}

export const APPLICATION_STATUS: Record<string, string> = {
  PENDING: "Nouvelle",
  VIEWED: "Vue",
  /** Not a status: the business's « Présélectionnée » step (`pillStatus`). */
  SHORTLISTED: "Présélectionnée",
  WAITING_PAYMENT: "En attente du candidat",
  ACCEPTED: "Retenue",
  STARTED: "En mission",
  END: "Terminée",
  REJECTED: "Refusée",
  CANCELLED: "Annulée",
};

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

export const fcfa = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;

export function offerDate(iso: string | null, type: EmploymentType): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  const day = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const withTime = time === "23:59" ? day : `${day} à ${time}`;
  return isDatedMission(type) ? withTime : `Candidatures jusqu'au ${day}`;
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
): { label: string; value: string; hint?: string } {
  const mission = isDatedMission(o.employmentType);
  const label = mission ? "Mission" : "Clôture";
  if (!isRecruiting(o.status)) {
    // Ended: how, and when you closed it if you did.
    const closed = o.closedAt
      ? `le ${new Date(o.closedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`
      : undefined;
    return { label, value: o.closedAt ? "Fermée" : offerChip(o).label, hint: closed };
  }
  if (left === null) {
    return mission
      ? { label, value: "—" }
      : { label, value: "Sans date limite", hint: "jusqu'à ce que vous la fermiez" };
  }
  return { label, value: left > 0 ? `J-${left}` : left === 0 ? "Aujourd'hui" : "Passée" };
}
