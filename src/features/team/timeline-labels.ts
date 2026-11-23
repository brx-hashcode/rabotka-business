import { INTL_LOCALE, type Locale } from "#/i18n/config";
import type { Translator } from "#/i18n/translator";
import type { TimelineEvent } from "#/lib/api/candidate-notes-controller";

/** One line of a candidate's history, in the space's words. */
export function timelineLabel(e: TimelineEvent, t: Translator<"team.timeline">, locale: Locale): string {
  const who = e.member?.name;
  const day = (at: Date) => at.toLocaleDateString(INTL_LOCALE[locale], { day: "numeric", month: "long" });
  switch (e.kind) {
    case "APPLIED":
      return t("applied");
    case "IMPORTED":
      return t("imported");
    case "ANALYSED":
      return typeof e.score === "number" ? t("analysedScore", { score: e.score }) : t("analysed");
    case "VIEWED":
      return t("viewed");
    case "SHORTLISTED":
      return who ? t("shortlistedBy", { who }) : t("shortlisted");
    case "RETAINED":
      return who ? t("retainedBy", { who }) : t("retained");
    case "REFUSED":
      return who ? t("refusedBy", { who }) : t("refused");
    case "WITHDRAWN":
      // Only the candidate « retire » : the offer closing or a cancelled hire read otherwise.
      return e.cancelledBy === "EMPLOYER" ? t("hireCancelled") : e.cancelledBy === "SYSTEM" ? t("offerClosed") : t("withdrawn");
    case "INTERVIEW": {
      const at = e.interview ? new Date(e.interview.startsAt) : null;
      return at
        ? t("interviewAt", {
            date: day(at),
            time: at.toLocaleTimeString(INTL_LOCALE[locale], { hour: "2-digit", minute: "2-digit" }),
          })
        : t("interview");
    }
    case "REPORT": {
      const at = e.interview ? new Date(e.interview.startsAt) : null;
      return at ? t("reportOf", { date: day(at) }) : t("report");
    }
    case "NOTE":
      return who ? t("noteBy", { who }) : t("noteFormer");
    case "OPINION": {
      const verdict = t(`verdict.${e.verdict ?? "none"}`);
      return who ? t("opinionBy", { who, verdict }) : t("opinionFormer", { verdict });
    }
  }
}
