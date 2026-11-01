import { describe, expect, it } from "vitest";

import { spreadIntoColumns } from "./spread-into-columns";

describe("spreadIntoColumns", () => {
  it("deals items left to right", () => {
    expect(spreadIntoColumns([1, 2, 3, 4], 3)).toEqual([[1, 4], [2], [3]]);
  });

  it("keeps everything in one column on a phone", () => {
    expect(spreadIntoColumns([1, 2], 1)).toEqual([[1, 2]]);
  });

  it("leaves no empty column", () => {
    expect(spreadIntoColumns([1], 3)).toEqual([[1]]);
  });
});
