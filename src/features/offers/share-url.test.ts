import { describe, expect, it } from "vitest";

import { offerShareLinks, offerShareUrl } from "./share-url";

describe("offerShareUrl", () => {
  it("points to the careers page, tagged with where it was shared", () => {
    expect(offerShareUrl("https://business.rabotka.work/", "akieni", "OF-12")).toBe(
      "https://business.rabotka.work/carrieres/akieni/OF-12",
    );
    expect(offerShareUrl("https://business.rabotka.work", "akieni", "OF-12", "linkedin")).toBe(
      "https://business.rabotka.work/carrieres/akieni/OF-12?source=linkedin",
    );
  });
});

describe("offerShareLinks", () => {
  it("opens each network on the offer's tagged link", () => {
    const links = offerShareLinks("https://b.rabotka.work", "akieni", "OF-12", "Comptable");
    expect(links.linkedin).toBe(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://b.rabotka.work/carrieres/akieni/OF-12?source=linkedin")}`,
    );
    expect(decodeURIComponent(links.whatsapp)).toContain("Comptable\nhttps://b.rabotka.work/carrieres/akieni/OF-12?source=whatsapp");
    expect(decodeURIComponent(links.facebook)).toContain("?source=facebook");
  });
});
