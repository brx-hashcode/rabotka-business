import { describe, expect, it } from "vitest";

import { allPages } from "./all-pages";

describe("allPages", () => {
  it("reads on until it has them all", async () => {
    const pages = [[1, 2], [3]];
    const result = await allPages(async (page) => ({ items: pages[page], total: 3 }));
    expect(result.items).toEqual([1, 2, 3]);
  });

  it("stops on an empty page even if the total says more", async () => {
    const result = await allPages(async () => ({ items: [] as number[], total: 5 }));
    expect(result.items).toEqual([]);
  });
});
