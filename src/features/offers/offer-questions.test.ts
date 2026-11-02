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

describe("numbers, dates and long answers", () => {
  const base = { label: "Années d'expérience", options: [], required: true, knockout: true, accepted: [] as string[] };

  it("asks for the minimum of an « éliminatoire » number", () => {
    expect(questionProblem({ ...base, kind: "NUMBER" })).toBe("Indiquez le minimum accepté.");
    expect(questionProblem({ ...base, kind: "NUMBER", accepted: ["2,5"] })).toBeNull();
  });

  it("asks for the latest date of an « éliminatoire » date", () => {
    expect(questionProblem({ ...base, kind: "DATE" })).toBe("Indiquez la date limite acceptée.");
    expect(questionProblem({ ...base, kind: "DATE", accepted: ["2026-12-01"] })).toBeNull();
  });

  it("drops « éliminatoire » when a question becomes a free answer", () => {
    expect(withKind({ ...base, kind: "NUMBER", accepted: ["3"] }, "LONG_TEXT")).toMatchObject({ knockout: false, accepted: [] });
  });
});
