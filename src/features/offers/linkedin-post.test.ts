import { describe, expect, it } from "vitest";

import type { LinkedinInfo, LinkedinPost } from "#/lib/api/linkedin-controller";
import { defaultLinkedinText, linkedinDialogState } from "./linkedin-post";

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
});

describe("defaultLinkedinText", () => {
  it("says what, where, and where to apply", () => {
    const text = defaultLinkedinText("Comptable", "CDI", "Brazzaville");
    expect(text).toContain("Nous recrutons : Comptable (CDI, Brazzaville).");
    expect(text).toContain("page carrières");
    expect(text).toContain("#recrutement");
    expect(defaultLinkedinText("Comptable", "STAGE", null)).toContain("Comptable (Stage).");
  });
});

describe("linkedinDialogState", () => {
  it("falls back to the share link when LinkedIn is not set up", () => {
    expect(linkedinDialogState(undefined, undefined)).toBe("share");
    expect(linkedinDialogState({ available: false, account: null }, [])).toBe("share");
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
