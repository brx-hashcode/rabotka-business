import { describe, expect, it } from "vitest";

import { officialIdentifiers, requiredDocuments } from "./required-documents";

const pme = {
  recommended: ["RCCM", "NIU"],
  optional: ["STATUTS", "PATENTE", "MANDATE"],
  required: [["RCCM"], ["NIU"]],
};

const school = {
  recommended: ["AUTORISATION_OUVERTURE", "AGREMENT"],
  optional: ["RCCM", "RECEPISSE", "ARRETE", "MANDATE"],
  required: [
    ["AUTORISATION_OUVERTURE", "AGREMENT"],
    ["RCCM", "RECEPISSE", "ARRETE"],
  ],
  requiredByLegalForm: {
    SARL: [["AUTORISATION_OUVERTURE", "AGREMENT"], ["RCCM"]],
    ASSOCIATION: [
      ["AUTORISATION_OUVERTURE", "AGREMENT"],
      ["RECEPISSE", "ARRETE"],
    ],
  },
};

const ALL = ["RCCM", "NIU", "STATUTS", "PATENTE", "RECEPISSE", "AGREMENT", "MANDATE", "OTHER"];
const other = { recommended: [], optional: ALL, required: [ALL] };

describe("requiredDocuments", () => {
  it("asks a company for each of its papers, and moves them out of the recommended", () => {
    const r = requiredDocuments(pme, "SARL", {});
    expect(r.groups).toEqual([["RCCM"], ["NIU"]]);
    expect(r.recommended).toEqual([]);
    expect(r.missing).toEqual([["RCCM"], ["NIU"]]);
    expect(requiredDocuments(pme, "SARL", { RCCM: {}, NIU: {} }).missing).toEqual([]);
  });

  it("follows a school's legal form, and any of its papers without one", () => {
    expect(requiredDocuments(school, "SARL", {}).groups[1]).toEqual(["RCCM"]);
    expect(requiredDocuments(school, "ASSOCIATION", {}).groups[1]).toEqual(["RECEPISSE", "ARRETE"]);
    expect(requiredDocuments(school, "", {}).groups[1]).toEqual(["RCCM", "RECEPISSE", "ARRETE"]);
    // One paper of each group is enough.
    expect(requiredDocuments(school, "ASSOCIATION", { AGREMENT: {}, ARRETE: {} }).missing).toEqual([]);
    expect(requiredDocuments(school, "SARL", { AGREMENT: {}, RECEPISSE: {} }).missing).toEqual([["RCCM"]]);
  });

  it("lets « Autre organisation » send any one paper", () => {
    const r = requiredDocuments(other, undefined, {});
    expect(r.anyPaper).toBe(true);
    expect(r.groups).toEqual([]);
    expect(r.optional).toEqual(ALL);
    expect(r.missing).toHaveLength(1);
    expect(requiredDocuments(other, undefined, { MANDATE: {} }).missing).toEqual([]);
  });
});

const congo = {
  registrationNumber: { label: "N° RCCM", placeholder: "CG-BZV-01-2024-B12-00123" },
  taxId: { label: "NIU" },
  statisticalId: { label: "SCIEN / SCIET" },
};
const association = {
  recommended: ["RECEPISSE", "STATUTS"],
  optional: ["AGREMENT", "NIU", "MANDATE"],
  required: [["RECEPISSE"], ["STATUTS"]],
};

describe("officialIdentifiers", () => {
  it("requires a company's numbers with its papers", () => {
    const f = officialIdentifiers({ ...pme, optional: [...pme.optional, "SCIEN_SCIET"] }, "SARL", congo);
    expect(f.registrationNumber).toMatchObject({ label: "N° RCCM", required: true });
    expect(f.taxId).toMatchObject({ label: "NIU", required: true });
    expect(f.statisticalId).toMatchObject({ required: false });
  });

  it("asks an association no N° RCCM, its tax number optionally", () => {
    const f = officialIdentifiers(association, undefined, congo);
    expect(f.registrationNumber).toBeNull();
    expect(f.taxId).toMatchObject({ required: false });
    expect(f.statisticalId).toBeNull();
  });

  it("follows a school's legal form, and the country's numbers", () => {
    expect(officialIdentifiers(school, "SARL", congo).registrationNumber?.required).toBe(true);
    expect(officialIdentifiers(school, "ASSOCIATION", congo).registrationNumber?.required).toBe(false);
    expect(officialIdentifiers(pme, "SARL", { ...congo, statisticalId: null }).statisticalId).toBeNull();
  });
});
