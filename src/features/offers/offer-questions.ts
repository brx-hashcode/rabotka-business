import type { ApplicantAnswer, OfferQuestion, QuestionKind } from "#/lib/api/offer-controller";

export const MAX_QUESTIONS = 5;

export const KIND_LABEL: Record<QuestionKind, string> = {
  YES_NO: "Oui / Non",
  CHOICE: "Choix",
  SHORT_TEXT: "Réponse courte",
};

/** Ready-made questions, offered while the offer has none. */
export const SUGGESTIONS: OfferQuestion[] = [
  { kind: "YES_NO", label: "Avez-vous le permis B ?", options: [], required: true, knockout: true, accepted: ["yes"] },
  {
    kind: "CHOICE",
    label: "Quand pouvez-vous commencer ?",
    options: ["Immédiatement", "Sous 2 semaines", "Dans plus d'un mois"],
    required: true,
    knockout: false,
    accepted: [],
  },
  { kind: "YES_NO", label: "Parlez-vous lingala ?", options: [], required: true, knockout: false, accepted: [] },
  { kind: "YES_NO", label: "Avez-vous déjà occupé ce poste ?", options: [], required: true, knockout: false, accepted: [] },
  { kind: "SHORT_TEXT", label: "Quelles sont vos prétentions salariales ?", options: [], required: false, knockout: false, accepted: [] },
];

export function blankQuestion(kind: QuestionKind = "YES_NO"): OfferQuestion {
  return {
    kind,
    label: "",
    options: kind === "CHOICE" ? ["", ""] : [],
    required: true,
    knockout: false,
    accepted: [],
  };
}

/** A question once its kind changes: what no longer applies is dropped. */
export function withKind(q: OfferQuestion, kind: QuestionKind): OfferQuestion {
  return {
    ...q,
    kind,
    options: kind === "CHOICE" ? (q.options.length >= 2 ? q.options : ["", ""]) : [],
    knockout: kind === "SHORT_TEXT" ? false : q.knockout,
    accepted: [],
  };
}

/** The questions as the server takes them: trimmed, blanks dropped, accepted answers that still exist. */
export function cleanQuestions(questions: OfferQuestion[]): OfferQuestion[] {
  return questions
    .map((q) => {
      const options = q.kind === "CHOICE" ? [...new Set(q.options.map((o) => o.trim()).filter(Boolean))] : [];
      const accepted = !q.knockout ? [] : q.kind === "CHOICE" ? q.accepted.filter((a) => options.includes(a)) : q.accepted.slice(0, 1);
      return { ...q, label: q.label.trim(), options, accepted, required: q.knockout ? true : q.required };
    })
    .filter((q) => q.label.length > 0);
}

/** Why a question cannot be saved yet, in words; null when it can. */
export function questionProblem(q: OfferQuestion): string | null {
  const label = q.label.trim();
  if (label.length > 0 && label.length < 3) return "La question est trop courte.";
  if (!label) return null;
  if (q.kind === "CHOICE") {
    const options = new Set(q.options.map((o) => o.trim()).filter(Boolean));
    if (options.size < 2) return "Proposez au moins deux réponses.";
    if (q.knockout) {
      const ok = q.accepted.filter((a) => options.has(a));
      if (ok.length === 0) return "Cochez les réponses acceptées.";
      if (ok.length === options.size) return "Toutes les réponses sont acceptées : la question n'élimine personne.";
    }
  }
  if (q.kind === "YES_NO" && q.knockout && q.accepted.length === 0) return "Indiquez la réponse attendue.";
  return null;
}

/** « Ne remplit pas : Permis B », from the answers that failed. */
export function failedLabel(answers: ApplicantAnswer[]): string | null {
  const failed = answers.filter((a) => a.passed === false).map((a) => a.label.replace(/\s*\?$/, ""));
  return failed.length ? failed.join(" · ") : null;
}
