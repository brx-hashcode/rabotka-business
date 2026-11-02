import { describe, expect, it } from "vitest";

import { canHire, pageAllowed } from "./member-access";

describe("member access", () => {
  it("lets the administrator see every page", () => {
    for (const href of ["/espace/abonnement", "/espace/equipe", "/espace/organisation", "/espace/missions"]) {
      expect(pageAllowed("ADMIN", href)).toBe(true);
    }
  });

  it("keeps the account away from a recruiter, not the hiring", () => {
    expect(pageAllowed("RECRUITER", "/espace/factures")).toBe(false);
    expect(pageAllowed("RECRUITER", "/espace/page-carrieres")).toBe(false);
    expect(pageAllowed("RECRUITER", "/espace/equipe")).toBe(false);
    expect(pageAllowed("RECRUITER", "/espace/offres/nouvelle")).toBe(true);
    expect(pageAllowed("RECRUITER", "/espace/discussions")).toBe(true);
  });

  it("shows an evaluator the candidates only", () => {
    expect(pageAllowed("REVIEWER", "/espace/candidatures")).toBe(true);
    expect(pageAllowed("REVIEWER", "/espace/offres")).toBe(true);
    expect(pageAllowed("REVIEWER", "/espace/discussions")).toBe(false);
    expect(pageAllowed("REVIEWER", "/espace/missions/o1")).toBe(false);
    expect(canHire("REVIEWER")).toBe(false);
    expect(canHire("RECRUITER")).toBe(true);
  });

  it("matches a page, not a page that merely starts the same", () => {
    expect(pageAllowed("RECRUITER", "/espace/equipement")).toBe(true);
  });

  it("shows only what everyone sees while the role loads", () => {
    expect(pageAllowed(undefined, "/espace/abonnement")).toBe(false);
    expect(pageAllowed(undefined, "/espace")).toBe(true);
  });
});
