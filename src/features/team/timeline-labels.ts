import type { TimelineEvent } from "#/lib/api/candidate-notes-controller";

const VERDICT = { YES: "oui", MAYBE: "peut-être", NO: "non" } as const;

/** One line of a candidate's history, in the space's words. */
export function timelineLabel(e: TimelineEvent): string {
  const who = e.member?.name;
  switch (e.kind) {
    case "APPLIED":
      return "A postulé";
    case "VIEWED":
      return "Candidature vue";
    case "RETAINED":
      return who ? `Retenu par ${who}` : "Retenu";
    case "REFUSED":
      return who ? `Refusé par ${who}` : "Refusé";
    case "WITHDRAWN":
      // Only the candidate « retire » : the offer closing or a cancelled hire read otherwise.
      return e.cancelledBy === "EMPLOYER"
        ? "Recrutement annulé"
        : e.cancelledBy === "SYSTEM"
          ? "Offre fermée ou expirée"
          : "A retiré sa candidature";
    case "INTERVIEW": {
      const at = e.interview ? new Date(e.interview.startsAt) : null;
      return at
        ? `Entretien proposé pour le ${at.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} à ${at.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
        : "Entretien proposé";
    }
    case "NOTE":
      return who ? `Note de ${who}` : "Note d'un ancien membre";
    case "OPINION":
      return `${who ? `Avis de ${who}` : "Avis d'un ancien membre"} : ${e.verdict ? VERDICT[e.verdict] : "—"}`;
  }
}
