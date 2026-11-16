import { describe, expect, it } from "vitest";

import { captionLine } from "./call-captions";

const chunk = (messageID: string, final: string | undefined, participant = { id: "p2", name: "Awa Diop" }) => ({
  data: { messageID, final, participant },
});

describe("the call's captions, relayed to the transcript", () => {
  it("takes each finished sentence once, with who said it", () => {
    const seen = new Set<string>();
    expect(captionLine(chunk("m1", "Bonjour", { id: "me", name: "Paul" }), "me", seen)).toMatchObject({
      text: "Bonjour",
      speaker: "Paul",
      self: true,
    });
    expect(captionLine(chunk("m2", "  Bonjour Paul  "), "me", seen)).toMatchObject({
      text: "Bonjour Paul",
      speaker: "Awa Diop",
      self: false,
    });
    // The same sentence again (another event for it): not twice.
    expect(captionLine(chunk("m2", "Bonjour Paul"), "me", seen)).toBeNull();
  });

  it("leaves out what is still being recognised", () => {
    const seen = new Set<string>();
    expect(captionLine(chunk("m3", undefined), "me", seen)).toBeNull();
    expect(captionLine(chunk("m3", "   "), "me", seen)).toBeNull();
    expect(captionLine(undefined, "me", seen)).toBeNull();
    // Not taken yet: its final version still counts.
    expect(captionLine(chunk("m3", "Enfin"), "me", seen)?.text).toBe("Enfin");
  });

  it("is never « me » before the call says who I am", () => {
    expect(captionLine(chunk("m4", "Oui", { id: "me", name: "Paul" }), null, new Set())?.self).toBe(false);
  });
});
