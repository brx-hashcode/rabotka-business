import { describe, expect, it } from "vitest";

import { renderTemplate } from "#/lib/api/message-templates-controller";

describe("renderTemplate (the preview, as the server fills it)", () => {
  it("fills the placeholders, any case or spacing, and leaves other braces", () => {
    expect(
      renderTemplate("Bonjour {prenom}, pour « {Poste} » chez { entreprise } {autre}", {
        prenom: "Awa",
        poste: "Caissière",
        entreprise: "KAMOA",
      }),
    ).toBe("Bonjour Awa, pour « Caissière » chez KAMOA {autre}");
  });
});
