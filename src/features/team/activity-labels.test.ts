import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";

import { MESSAGES } from "#/i18n/messages";

import { activityLabel, activityOfferId } from "./activity-labels";

const t = createTranslator({ locale: "fr", messages: MESSAGES.fr, namespace: "team.activity" });
const en = createTranslator({ locale: "en", messages: MESSAGES.en, namespace: "team.activity" });

describe("activity labels", () => {
  it.each([
    ["POST /job-offers", "a publié une offre"],
    ["POST /job-offers/:id/close", "a fermé une offre"],
    ["POST /profile/applications/:id/accept", "a retenu un candidat"],
    ["POST /business/me/external-applications/:id/refuse", "a refusé un candidat"],
    ["POST /profile/applications/:id/unlock/pay-wallet", "a obtenu un contact"],
    ["PUT /business/me/applications/:kind/:id/opinion", "a donné son avis"],
    ["POST /business/me/interviews/calendar/reset", "a changé le lien de l'agenda"],
    ["POST /business/me/interviews", "a proposé un entretien"],
    ["DELETE /business/me/careers-page/photos/:index", "a modifié la page carrières"],
    ["PATCH /business/me", "a modifié l'organisation"],
    ["POST /business/me/team", "a invité un membre"],
  ])("%s → %s", (action, label) => {
    expect(activityLabel(action, t)).toBe(label);
  });

  it("still shows a change nobody worded yet", () => {
    expect(activityLabel("POST /business/me/something-new", t)).toBe("a fait une modification");
  });

  it("words them in English too", () => {
    expect(activityLabel("POST /job-offers", en)).toBe("published a job");
  });

  it("links a line to its offer only when it is about one", () => {
    expect(activityOfferId("POST /job-offers/:id/close", "o-1")).toBe("o-1");
    expect(activityOfferId("POST /profile/applications/:id/accept", "a-1")).toBeNull();
    expect(activityOfferId("POST /job-offers", null)).toBeNull();
  });
});
