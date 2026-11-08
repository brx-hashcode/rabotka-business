import { describe, expect, it } from "vitest";

import { versionLabel } from "./app-version";

describe("versionLabel", () => {
  it("names the build day and the commit", () => {
    expect(versionLabel("2026-11-08T00:30:00Z", "a79d169")).toBe("Version 8 nov. 2026 · a79d169");
  });

  it("keeps the commit alone without a build date", () => {
    expect(versionLabel(undefined, "dev")).toBe("Version dev");
    expect(versionLabel("not a date", "a79d169")).toBe("Version a79d169");
  });
});
