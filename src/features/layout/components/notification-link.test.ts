import { describe, expect, it } from "vitest";

import { espaceLink } from "./notification-bell";

describe("espaceLink", () => {
  it("sends the employer notifications to their page in the space", () => {
    expect(espaceLink("/candidatures/a1")).toBe("/espace/candidatures?candidature=a1");
    expect(espaceLink("/missions/o1")).toBe("/espace/offres/o1");
    expect(espaceLink("/job-offers/o1")).toBe("/espace/offres/o1");
    expect(espaceLink("/discussions/c1")).toBe("/espace/discussions/c1");
    expect(espaceLink("/claims/new")).toBe("/espace/reclamations/nouvelle");
    expect(espaceLink("/claims/k1")).toBe("/espace/reclamations/k1");
    expect(espaceLink("/espace/abonnement")).toBe("/espace/abonnement");
  });
  it("has no page for the worker-side links", () => {
    expect(espaceLink("/portefeuille")).toBeNull();
    expect(espaceLink("/applications/a1")).toBeNull();
    expect(espaceLink(null)).toBeNull();
  });
});
