import { IconMapPin, IconPhone, IconVideo, type Icon } from "@tabler/icons-react";
import { useLocale, useTranslations } from "next-intl";

import { INTL_LOCALE, type Locale } from "#/i18n/config";
import type { Translator } from "#/i18n/translator";
import type { Interview, InterviewMode, InterviewStatus } from "#/lib/api/types";
import { cn } from "#/lib/utils";

/** The ways to meet; their names are interviews.mode.* . */
export const MODES: { key: InterviewMode; icon: Icon }[] = [
  { key: "IN_PERSON", icon: IconMapPin },
  { key: "PHONE", icon: IconPhone },
  { key: "VIDEO", icon: IconVideo },
];

/** Each status's chip colour; its words are interviews.status.* . */
export const STATUS_CHIP: Record<InterviewStatus, string> = {
  PENDING: "bg-chip-amber text-chip-amber-foreground",
  CONFIRMED: "bg-chip-green text-chip-green-foreground",
  DECLINED: "bg-destructive/10 text-destructive",
  RESCHEDULE_REQUESTED: "bg-chip-violet text-chip-violet-foreground",
  CANCELLED: "bg-foreground/[0.07] text-muted-foreground",
};

export type InterviewsT = Translator<"interviews">;

export function StatusChip({ status }: Readonly<{ status: InterviewStatus }>) {
  const t = useTranslations("interviews");
  return <span className={cn("rounded-full px-2.5 py-1 font-medium text-xs", STATUS_CHIP[status])}>{t(`status.${status}`)}</span>;
}

export function whenLabel(iso: string, t: InterviewsT, locale: Locale): string {
  const d = new Date(iso);
  const tag = INTL_LOCALE[locale];
  return t("at", {
    day: d.toLocaleDateString(tag, { weekday: "short", day: "numeric", month: "short" }),
    time: d.toLocaleTimeString(tag, { hour: "2-digit", minute: "2-digit" }),
  });
}

export function modeLabel(i: Pick<Interview, "mode" | "location">, t: InterviewsT): string {
  if (i.mode === "IN_PERSON") return i.location ?? t("mode.IN_PERSON");
  if (i.mode === "PHONE") return i.location ? t("phoneAt", { place: i.location }) : t("mode.PHONE");
  return t("mode.VIDEO");
}

/** The interview already planned with a candidate, as a small line on their card. */
export function InterviewLine({ interview }: Readonly<{ interview: Interview }>) {
  const t = useTranslations("interviews");
  const locale = useLocale() as Locale;
  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-sm">
      <span className="font-medium">{t("line", { when: whenLabel(interview.startsAt, t, locale) })}</span>
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
