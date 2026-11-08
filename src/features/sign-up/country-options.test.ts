import { describe, expect, it } from "vitest";

import { countryOptions } from "./components/organisation-step";

const open = [
  { code: "CG", name: "Congo-Brazzaville" },
  { code: "KE", name: "Kenya" },
];

describe("countryOptions", () => {
  it("lists the open countries", () => {
    expect(countryOptions(open, "KE")).toEqual([
      { value: "CG", label: "Congo-Brazzaville" },
      { value: "KE", label: "Kenya" },
    ]);
  });

  it("keeps an organisation's country that sign-up has closed since", () => {
    expect(countryOptions(open, "TD").at(-1)).toEqual({ value: "TD", label: "Tchad" });
  });
});
