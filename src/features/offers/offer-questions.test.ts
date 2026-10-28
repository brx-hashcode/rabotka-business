import { describe, expect, it } from "vitest";

import { blankQuestion, cleanQuestions, failedLabel, questionProblem, withKind } from "./offer-questions";

describe("offer questions", () => {
  it("drops what a new kind does not use", () => {
    const q = { ...blankQuestion("CHOICE"), label: "Langue", options: ["A", "B"], knockout: true, accepted: ["A"] };
    expect(withKind(q, "YES_NO")).toMatchObject({ options: [], accepted: [], knockout: true });
    expect(withKind(q, "SHORT_TEXT")).toMatchObject({ knockout: false });
  });

  it("cleans for the server, and keeps an « éliminatoire » question required", () => {
    const out = cleanQuestions([
      { ...blankQuestion("CHOICE"), label: " Langue ", options: [" Lingala", "Kituba", "", "Lingala"], knockout: true, accepted: ["Lingala", "Gone"], required: false },
      { ...blankQuestion(), label: "   " },
    ]);
    expect(out).toEqual([
      { kind: "CHOICE", label: "Langue", options: ["Lingala", "Kituba"], required: true, knockout: true, accepted: ["Lingala"] },
    ]);
  });

  it("says what blocks a question", () => {
    expect(questionProblem({ ...blankQuestion("CHOICE"), label: "Langue", options: ["A", ""] })).toMatch(/deux réponses/);
    expect(questionProblem({ ...blankQuestion("CHOICE"), label: "Langue", options: ["A", "B"], knockout: true, accepted: ["A", "B"] })).toMatch(/élimine personne/);
    expect(questionProblem({ ...blankQuestion(), label: "Permis ?", knockout: true })).toMatch(/réponse attendue/);
    expect(questionProblem({ ...blankQuestion(), label: "Permis B ?", knockout: true, accepted: ["yes"] })).toBeNull();
  });

  it("names the criteria a candidate does not meet", () => {
    expect(
      failedLabel([
        { label: "Avez-vous le permis B ?", kind: "YES_NO", value: "Non", passed: false },
        { label: "Langue", kind: "CHOICE", value: "Lingala", passed: true },
      ]),
    ).toBe("Avez-vous le permis B");
    expect(failedLabel([])).toBeNull();
  });
});
