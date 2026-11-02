import { describe, expect, it } from "vitest";

import { teamLine } from "./team-places";

describe("teamLine", () => {
  it("names each role the plan includes", () => {
    expect(teamLine({ recruitersLimit: 2, reviewersLimit: 1 })).toBe("Équipe : 2 recruteurs et 1 évaluateur");
    expect(teamLine({ recruitersLimit: null, reviewersLimit: 0 })).toBe("Équipe : recruteurs illimités");
  });

  it("says nothing for a plan without a team, or a backend without the field", () => {
    expect(teamLine({ recruitersLimit: 0, reviewersLimit: 0 })).toBeNull();
    expect(teamLine({})).toBeNull();
  });
});
