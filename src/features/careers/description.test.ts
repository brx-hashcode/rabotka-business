import { describe, expect, it } from "vitest";

import { parseDescription } from "./description";

describe("parseDescription", () => {
  it("keeps paragraphs, and groups bullet lines into one list", () => {
    expect(parseDescription("Le poste.\n\n- Architecture : des backends\n- Du code propre")).toEqual([
      { kind: "text", text: "Le poste." },
      {
        kind: "list",
        items: [
          { label: "Architecture", text: "des backends" },
          { label: null, text: "Du code propre" },
        ],
      },
    ]);
  });

  it("does not take a long sentence for a label", () => {
    const line = "Vous travaillerez avec une équipe répartie dans plusieurs pays : un vrai défi";
    expect(parseDescription(`- ${line}`)).toEqual([{ kind: "list", items: [{ label: null, text: line }] }]);
  });
});
