import { describe, expect, it } from "vitest";

import { isIndexedHost } from "./indexed-host";

describe("isIndexedHost", () => {
  it("lists production only", () => {
    expect(isIndexedHost("business.rabotka.work")).toBe(true);
    expect(isIndexedHost("Business.Rabotka.work:443")).toBe(true);
  });

  it("keeps develop and local out of search engines", () => {
    expect(isIndexedHost("business-rabotka.hashcode.digital")).toBe(false);
    expect(isIndexedHost("localhost:3500")).toBe(false);
    expect(isIndexedHost(null)).toBe(false);
  });
});
