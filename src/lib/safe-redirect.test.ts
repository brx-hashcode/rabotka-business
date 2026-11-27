import { describe, expect, it } from "vitest";

import { safeRedirectPath } from "./safe-redirect";

describe("safeRedirectPath", () => {
  it("keeps a path on this site, with its query and hash", () => {
    expect(safeRedirectPath("/jobs/abc?tab=1#top")).toBe("/jobs/abc?tab=1#top");
  });

  it.each([
    ["absolute URL", "https://evil.com/jobs"],
    ["protocol-relative URL", "//evil.com"],
    ["backslash trick", "/\\evil.com"],
    ["dot segment before a double slash", "/.//evil.com"],
    ["parent segment before a double slash", "/a/..//evil.com"],
    ["encoded dot segment", "/%2e//evil.com"],
    ["relative path", "jobs/abc"],
    ["javascript URL", "javascript:alert(1)"],
    ["empty", ""],
    ["missing", null],
  ])("rejects a %s", (_, raw) => {
    expect(safeRedirectPath(raw)).toBeNull();
  });

  it("refuses to send the agent back to sign-in", () => {
    expect(safeRedirectPath("/auth/sign-in?next=/")).toBeNull();
    expect(safeRedirectPath("/auth")).toBeNull();
  });
});
