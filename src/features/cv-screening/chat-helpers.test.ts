import { describe, expect, it } from "vitest";

import { parseChartSpec } from "./chart-spec";
import { shortNames } from "./short-names";

describe("shortNames", () => {
  it("keeps the first name and the last name's initial", () => {
    expect(shortNames(["Glody Mbutwile", "Awa Mabiala"])).toEqual(["Glody M.", "Awa M."]);
  });

  it("says more of a name only where two would read the same", () => {
    expect(shortNames(["Glody Mbutwile", "Fariol Blondeau N.", "Fariol Blondeau NZIODZIAMI"])).toEqual([
      "Glody M.",
      "Fariol Blondeau N.",
      "Fariol Blondeau NZIODZIAMI",
    ]);
    expect(shortNames(["Fariol Blondeau", "Fariol Nziodziami"])).toEqual(["Fariol B.", "Fariol N."]);
    expect(shortNames(["Jean Paul Mavoungou", "Jean Pierre Mavoungou"])).toEqual(["Jean Paul Mavoungou", "Jean Pierre Mavoungou"]);
  });

  it("leaves a one-word name as it is", () => {
    expect(shortNames(["cv-scan.pdf", "Awa Mabiala"])).toEqual(["cv-scan.pdf", "Awa M."]);
  });
});

const spec = {
  v: 1,
  kind: "bar",
  layout: "vertical",
  title: "Scores par critère",
  unit: "/100",
  categories: ["Compétences", "Expérience"],
  series: [
    { name: "Glody M.", values: [90, 85] },
    { name: "Awa M.", values: [70, null] },
  ],
};

describe("parseChartSpec", () => {
  it("reads a chart the server wrote", () => {
    expect(parseChartSpec(JSON.stringify(spec))).toEqual(spec);
  });

  it("draws nothing for a block still being written or malformed", () => {
    expect(parseChartSpec(JSON.stringify(spec).slice(0, 40))).toBeNull();
    expect(parseChartSpec(JSON.stringify({ ...spec, v: 2 }))).toBeNull();
    expect(parseChartSpec(JSON.stringify({ ...spec, series: [{ name: "x", values: [1] }] }))).toBeNull();
    expect(parseChartSpec(JSON.stringify({ ...spec, series: [{ name: "x", values: ["1", 2] }] }))).toBeNull();
    expect(parseChartSpec("null")).toBeNull();
  });
});
