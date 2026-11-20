import { describe, expect, it } from "vitest";

import { PRODUCT_HUNT, parseProductHuntVotes, productHuntBadgeUrl } from "./content";

/** Product Hunt's badge as served, trimmed to the parts the parser reads. */
const badge = (count: string) => `
  <svg><g>
    <text><tspan x="53" y="20">FIND US ON</tspan></text>
    <text><tspan x="52" y="40">Product Hunt</tspan></text>
    <g transform="translate(201.000000, 13.000000)" fill="#4B587C">
      <g>
        <polygon points="26.0024997 10 15 10 20.5012498 0"></polygon>
        <text font-family="Helvetica-Bold, Helvetica" font-size="13" font-weight="bold" line-spacing="20">
          <tspan x="15.7" y="27">${count}</tspan>
        </text>
      </g>
    </g>
  </g></svg>`;

describe("productHuntBadgeUrl", () => {
  it("points at the post's badge", () => {
    expect(productHuntBadgeUrl()).toContain(`post_id=${PRODUCT_HUNT.postId}`);
  });

  it("stays the same within 2 minutes and changes after", () => {
    const at = new Date("2026-11-20T12:00:00Z");
    const later = (ms: number) => productHuntBadgeUrl(new Date(at.getTime() + ms));
    expect(later(60 * 1000)).toBe(productHuntBadgeUrl(at));
    expect(later(2 * 60 * 1000)).not.toBe(productHuntBadgeUrl(at));
  });
});

describe("parseProductHuntVotes", () => {
  it("reads the count under the ▲", () => {
    expect(parseProductHuntVotes(badge("3"))).toBe(3);
    expect(parseProductHuntVotes(badge("1,204"))).toBe(1204);
  });

  it("has no count while Product Hunt hides it", () => {
    expect(parseProductHuntVotes(badge("???"))).toBeNull();
  });

  it("has no count when the badge changed shape", () => {
    expect(parseProductHuntVotes("<svg></svg>")).toBeNull();
  });
});
