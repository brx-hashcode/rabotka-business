import { describe, expect, it } from "vitest";

import { de } from "../french";

describe("de", () => {
  it("elides before a vowel, accented or not", () => {
    expect(de("Essentiel E2E")).toBe("d'Essentiel E2E");
    expect(de("Élite")).toBe("d'Élite");
  });

  it("keeps « de » before a consonant", () => {
    expect(de("Pro")).toBe("de Pro");
    expect(de("ZuaFood Plan")).toBe("de ZuaFood Plan");
  });
});
