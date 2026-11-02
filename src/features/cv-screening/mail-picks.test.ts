import { describe, expect, it } from "vitest";

import { initials, kindFromName, looksLikeCv, pickKey, togglePick, toPick } from "./mail-picks";

const mail = { id: "m1", fromName: "Awa" };
const a = (id: string) => toPick("mb", mail, { id, name: `cv-${id}.pdf`, size: 10, mime: "application/pdf" });

describe("mail picks", () => {
  it("ticks and unticks an attachment", () => {
    const one = togglePick([], a("1"), 5);
    expect(one.map(pickKey)).toEqual(["mb:m1:1"]);
    expect(togglePick(one, a("1"), 5)).toEqual([]);
  });

  it("stops at the room left", () => {
    const two = togglePick(togglePick([], a("1"), 2), a("2"), 2);
    expect(togglePick(two, a("3"), 2)).toBe(two);
    // Unticking still works when full.
    expect(togglePick(two, a("1"), 2).map(pickKey)).toEqual(["mb:m1:2"]);
  });

  it("tells the kind by the name", () => {
    expect(kindFromName("CV.PDF")).toBe("pdf");
    expect(kindFromName("cv.docx")).toBe("docx");
    expect(kindFromName("scan.jpeg")).toBe("image");
  });
});

describe("hints", () => {
  it("spots a CV by its name or the subject", () => {
    expect(looksLikeCv("CV Awa.pdf")).toBe(true);
    expect(looksLikeCv("scan.jpg", "Candidature serveuse")).toBe(true);
    expect(looksLikeCv("Mon_Resume_2026.docx")).toBe(true);
    expect(looksLikeCv("facture_Luc_cae1b73f.pdf", "Votre facture — Abonnement")).toBe(false);
    expect(looksLikeCv("cvent-badge.pdf")).toBe(false);
    expect(looksLikeCv("Lettre de motivation.docx", "Candidature serveuse")).toBe(false);
    expect(looksLikeCv("CV_Awa.pdf", "Votre facture")).toBe(true);
  });

  it("makes initials", () => {
    expect(initials("Awa Mbemba")).toBe("AM");
    expect(initials("Jean-Baptiste Kiminou")).toBe("JK");
    expect(initials("rabotka")).toBe("RA");
    expect(initials("")).toBe("?");
  });
});
