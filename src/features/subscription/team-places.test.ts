import { describe, expect, it } from "vitest";

import { createTranslator } from "next-intl";

import { MESSAGES } from "#/i18n/messages";
import { teamLine } from "./team-places";

const fr = createTranslator({ locale: "fr", messages: MESSAGES.fr, namespace: "subscription" });
const en = createTranslator({ locale: "en", messages: MESSAGES.en, namespace: "subscription" });

describe("teamLine", () => {
  it("names each role the plan includes", () => {
    expect(teamLine({ recruitersLimit: 2, reviewersLimit: 1 }, fr)).toBe("Équipe : 2 recruteurs et 1 évaluateur");
    expect(teamLine({ recruitersLimit: null, reviewersLimit: 0 }, fr)).toBe("Équipe : recruteurs illimités");
    expect(teamLine({ recruitersLimit: 2, reviewersLimit: 1 }, en)).toBe("Team: 2 recruiters and 1 reviewer");
  });

  it("says nothing for a plan without a team, or a backend without the field", () => {
    expect(teamLine({ recruitersLimit: 0, reviewersLimit: 0 }, fr)).toBeNull();
    expect(teamLine({}, fr)).toBeNull();
  });
});
