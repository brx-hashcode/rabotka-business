import { describe, expect, it } from "vitest";

import { byFit, type Rankable } from "./rank-candidates";

const c = (name: string, score: number | null, over: Partial<Rankable["a"]> = {}) => ({
  name,
  score,
  a: { createdAt: "2026-11-04T10:00:00Z", ...over },
});

describe("byFit", () => {
  it("puts the best score first, whichever page they applied from", () => {
    const rabotka = c("Fariol (Rabotka)", 90);
    const careers = c("Glody (page carrières)", 91);
    expect([rabotka, careers].sort(byFit).map((x) => x.name)).toEqual(["Glody (page carrières)", "Fariol (Rabotka)"]);
  });

  it("lists those not scored yet after, newest first", () => {
    const old = c("ancien", null, { createdAt: "2026-11-01T00:00:00Z" });
    const recent = c("récent", null, { createdAt: "2026-11-03T00:00:00Z" });
    const scored = c("noté", 20);
    expect([old, recent, scored].sort(byFit).map((x) => x.name)).toEqual(["noté", "récent", "ancien"]);
  });

  it("puts those who fail an « éliminatoire » last, whatever their score", () => {
    const out = c("éliminé", 99, { knockedOut: true });
    const ok = c("retenu", 10);
    expect([out, ok].sort(byFit).map((x) => x.name)).toEqual(["retenu", "éliminé"]);
  });
});
