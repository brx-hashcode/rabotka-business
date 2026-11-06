import { describe, expect, it } from "vitest";

import type { LinkedinInfo, LinkedinPost } from "#/lib/api/linkedin-controller";
import { defaultLinkedinText, descriptionExcerpt, linkedinDialogState } from "./linkedin-post";

const account = (expired = false): LinkedinInfo => ({
  available: true,
  account: { name: "Awa", pictureUrl: null, connectedAt: "", expired },
});
const post = (status: LinkedinPost["status"]): LinkedinPost => ({
  id: "p",
  status,
  authorName: "Awa",
  url: null,
  error: null,
  createdAt: "",
  publishedAt: null,
  imageUrl: null,
});

const offer = {
  title: "Agent d'entretien de bureaux",
  companyName: "ZuaFood",
  employmentType: "MISSION" as const,
  isRemote: false,
  city: "Brazzaville",
  amount: 1000,
  paymentFlow: "HOURLY" as const,
  scheduledAt: "2026-11-14T08:00:00.000Z",
  description: "Entretien des bureaux et des sanitaires. Horaires du matin, du lundi au vendredi.",
  categoryName: "Nettoyage",
  url: "https://business.rabotka.work/carrieres/zuafood/RBT-YWK78?source=linkedin",
};

describe("defaultLinkedinText", () => {
  it("says who hires, the essentials, the description and where to apply", () => {
    expect(defaultLinkedinText(offer)).toBe(
      [
        "🚀 ZuaFood recrute : Agent d'entretien de bureaux",
        "📍 Brazzaville · 💼 Mission · 💰 1 000 FCFA / heure\n📅 Mission le 14 novembre",
        "Entretien des bureaux et des sanitaires. Horaires du matin, du lundi au vendredi.",
        "👉 Postulez en ligne, sans créer de compte : https://business.rabotka.work/carrieres/zuafood/RBT-YWK78?source=linkedin",
        "#recrutement #emploi #Brazzaville #Nettoyage",
      ].join("\n\n"),
    );
  });

  it("leaves out what the offer does not say, and closes a CDI by its date", () => {
    const text = defaultLinkedinText({ ...offer, employmentType: "CDI", amount: null, city: null, categoryName: null, description: "" });
    expect(text).toContain("💼 CDI\n📅 Candidatures jusqu'au 14 novembre");
    expect(text).not.toContain("💰");
    expect(text).toMatch(/#recrutement #emploi$/);
  });
});

describe("descriptionExcerpt", () => {
  it("cuts a long description at a sentence, else at a word", () => {
    const long = `${"Une phrase assez longue pour remplir. ".repeat(15)}`;
    expect(descriptionExcerpt(long, 100).endsWith(".")).toBe(true);
    expect(descriptionExcerpt("mot ".repeat(60), 50)).toMatch(/mot…$/);
  });
});

describe("linkedinDialogState", () => {
  it("falls back to the share link when LinkedIn is not set up", () => {
    expect(linkedinDialogState(undefined, undefined)).toBe("share");
    expect(linkedinDialogState({ available: false, account: null }, [])).toBe("share");
  });

  it("points to the plans when the plan leaves LinkedIn out", () => {
    expect(linkedinDialogState({ available: true, included: false, account: null }, [])).toBe("upgrade");
  });

  it("asks to connect, or to connect again", () => {
    expect(linkedinDialogState({ available: true, account: null }, [])).toBe("connect");
    expect(linkedinDialogState(account(true), [])).toBe("expired");
  });

  it("follows the offer's posts", () => {
    expect(linkedinDialogState(account(), [])).toBe("ready");
    expect(linkedinDialogState(account(), [post("QUEUED")])).toBe("pending");
    expect(linkedinDialogState(account(), [post("FAILED"), post("PUBLISHED")])).toBe("posted");
    expect(linkedinDialogState(account(), [post("FAILED")])).toBe("ready");
  });
});
