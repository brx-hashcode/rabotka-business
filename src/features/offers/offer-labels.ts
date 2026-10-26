import type { EmploymentType, OfferStatus, PaymentFlow } from "#/lib/api/offer-controller";

export const EMPLOYMENT_TYPES: { value: EmploymentType; label: string; hint: string }[] = [
  { value: "MISSION", label: "Mission", hint: "Un travail ponctuel, à une date donnée" },
  { value: "CDD", label: "CDD", hint: "Contrat à durée déterminée" },
  { value: "CDI", label: "CDI", hint: "Contrat à durée indéterminée" },
  { value: "STAGE", label: "Stage", hint: "Stage ou alternance" },
];

/** Only missions can be published from the space for now; the others show as coming. */
export const AVAILABLE_EMPLOYMENT_TYPES: EmploymentType[] = ["MISSION"];

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
  ACTIVE: { label: "Active", className: "bg-chip-green text-chip-green-foreground" },
  PARTIALLY_FILLED: { label: "En partie pourvue", className: "bg-chip-violet text-chip-violet-foreground" },
  FILLED: { label: "Pourvue", className: "bg-chip-violet text-chip-violet-foreground" },
  IN_PROGRESS: { label: "En cours", className: "bg-chip-amber text-chip-amber-foreground" },
  COMPLETED: { label: "Terminée", className: "bg-page text-muted-foreground" },
  EXPIRED: { label: "Expirée", className: "bg-page text-muted-foreground" },
  CANCELLED: { label: "Annulée", className: "bg-page text-muted-foreground" },
};

export const APPLICATION_STATUS: Record<string, string> = {
  PENDING: "Nouvelle",
  VIEWED: "Vue",
  WAITING_PAYMENT: "Déblocage en cours",
  ACCEPTED: "Acceptée",
  STARTED: "En mission",
  END: "Terminée",
  REJECTED: "Refusée",
  CANCELLED: "Annulée",
};

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
