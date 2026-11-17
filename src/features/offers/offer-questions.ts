import type { ApplicantAnswer, OfferQuestion, QuestionKind } from "#/lib/api/offer-controller";

export const MAX_QUESTIONS = 5;

/*
 * The kinds' names and hints are offers.questions.kind.* / .hint.*; the
 * suggestions' words offers.questions.suggestions, in this order.
 */

/** Kinds whose answer can set an application aside. */
export const CAN_KNOCK_OUT: QuestionKind[] = ["YES_NO", "CHOICE", "NUMBER", "DATE"];

/** Ready-made questions, offered while the offer has none; their words come from the messages. */
const SUGGESTION_SHAPES: Omit<OfferQuestion, "label" | "options">[] = [
  { kind: "YES_NO", required: true, knockout: true, accepted: ["yes"] },
  { kind: "LONG_TEXT", required: false, knockout: false, accepted: [] },
  { kind: "NUMBER", required: true, knockout: false, accepted: [] },
  { kind: "CHOICE", required: true, knockout: false, accepted: [] },
  { kind: "YES_NO", required: true, knockout: false, accepted: [] },
  { kind: "YES_NO", required: true, knockout: false, accepted: [] },
  { kind: "SHORT_TEXT", required: false, knockout: false, accepted: [] },
];

export function suggestions(words: { label: string; options: string[] }[]): OfferQuestion[] {
  return SUGGESTION_SHAPES.map((shape, i) => ({ ...shape, ...words[i] }));
}

/** Why a question cannot be saved yet: a key of offers.questions.problem. */
export type QuestionProblem = "tooShort" | "twoAnswers" | "tickAccepted" | "allAccepted" | "expected" | "minimum" | "deadline";

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
    knockout: CAN_KNOCK_OUT.includes(kind) ? q.knockout : false,
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
export function questionProblem(q: OfferQuestion): QuestionProblem | null {
  const label = q.label.trim();
  if (label.length > 0 && label.length < 3) return "tooShort";
  if (!label) return null;
  if (q.kind === "CHOICE") {
    const options = new Set(q.options.map((o) => o.trim()).filter(Boolean));
    if (options.size < 2) return "twoAnswers";
    if (q.knockout) {
      const ok = q.accepted.filter((a) => options.has(a));
      if (ok.length === 0) return "tickAccepted";
      if (ok.length === options.size) return "allAccepted";
    }
  }
  if (q.kind === "YES_NO" && q.knockout && q.accepted.length === 0) return "expected";
  if (q.kind === "NUMBER" && q.knockout && !/^\d+([.,]\d{1,2})?$/.test(q.accepted[0] ?? "")) return "minimum";
  if (q.kind === "DATE" && q.knockout && !q.accepted[0]) return "deadline";
  return null;
}

/** « Ne remplit pas : Permis B », from the answers that failed. */
export function failedLabel(answers: ApplicantAnswer[]): string | null {
  const failed = answers.filter((a) => a.passed === false).map((a) => a.label.replace(/\s*\?$/, ""));
  return failed.length ? failed.join(" · ") : null;
}
