import { describe, expect, it } from "vitest";

import { phonePlaceholder } from "../phone-placeholder";

describe("phonePlaceholder", () => {
  it("shows the prefix of the Congolese network picked", () => {
    expect(phonePlaceholder("MTN_MOMO_COG", "242")).toBe("06 123 45 67");
    expect(phonePlaceholder("AIRTEL_COG", "242")).toBe("05 123 45 67");
  });

  it("falls back on the country when the network has no known example", () => {
    expect(phonePlaceholder(null, "242")).toBe("06 123 45 67");
    expect(phonePlaceholder("MTN_MOMO_CMR", "237")).toBe("Numéro");
  });
});
