import { IconMapPin, IconPhone, IconVideo, type Icon } from "@tabler/icons-react";

import type { Interview, InterviewMode, InterviewStatus } from "#/lib/api/types";
import { cn } from "#/lib/utils";

export const MODES: { key: InterviewMode; label: string; icon: Icon }[] = [
  { key: "IN_PERSON", label: "En personne", icon: IconMapPin },
  { key: "PHONE", label: "Téléphone", icon: IconPhone },
  { key: "VIDEO", label: "Visio", icon: IconVideo },
];

export const STATUS: Record<InterviewStatus, { label: string; chip: string }> = {
  PENDING: { label: "En attente de réponse", chip: "bg-chip-amber text-chip-amber-foreground" },
  CONFIRMED: { label: "Confirmé", chip: "bg-chip-green text-chip-green-foreground" },
  DECLINED: { label: "Décliné", chip: "bg-destructive/10 text-destructive" },
  RESCHEDULE_REQUESTED: { label: "Autre moment demandé", chip: "bg-chip-violet text-chip-violet-foreground" },
  CANCELLED: { label: "Annulé", chip: "bg-foreground/[0.07] text-muted-foreground" },
};

export function StatusChip({ status }: Readonly<{ status: InterviewStatus }>) {
  return <span className={cn("rounded-full px-2.5 py-1 font-medium text-xs", STATUS[status].chip)}>{STATUS[status].label}</span>;
}

export function whenLabel(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} à ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
}

export function modeLabel(i: Pick<Interview, "mode" | "location">): string {
  if (i.mode === "IN_PERSON") return i.location ?? "En personne";
  if (i.mode === "PHONE") return i.location ? `Téléphone · ${i.location}` : "Téléphone";
  return "Visio";
}

/** The interview already planned with a candidate, as a small line on their card. */
export function InterviewLine({ interview }: Readonly<{ interview: Interview }>) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-sm">
      <span className="font-medium">Entretien {whenLabel(interview.startsAt)}</span>
      <StatusChip status={interview.status} />
    </span>
  );
}

/** A candidate's interview to show: the latest one not cancelled. */
export function latestInterview(all: Interview[] | undefined, mine: (i: Interview) => boolean): Interview | undefined {
  return (all ?? [])
    .filter((i) => mine(i) && i.status !== "CANCELLED")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}
