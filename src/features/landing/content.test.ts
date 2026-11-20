import { describe, expect, it } from "vitest";

import { PRODUCT_HUNT, productHuntBadgeUrl } from "./content";

describe("productHuntBadgeUrl", () => {
  it("points at the post's badge", () => {
    expect(productHuntBadgeUrl()).toContain(`post_id=${PRODUCT_HUNT.postId}`);
  });

  it("stays the same within 5 minutes and changes after", () => {
    const at = new Date("2026-11-20T12:00:00Z");
    const later = (ms: number) => productHuntBadgeUrl(new Date(at.getTime() + ms));
    expect(later(4 * 60 * 1000)).toBe(productHuntBadgeUrl(at));
    expect(later(5 * 60 * 1000)).not.toBe(productHuntBadgeUrl(at));
  });
});
