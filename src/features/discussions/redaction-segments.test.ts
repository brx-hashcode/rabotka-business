// @vitest-environment node
// Pure string splitting — no DOM, no React runtime.
import { describe, expect, it } from "vitest";

import { redactionSegments } from "./redaction-segments";
import type { Redaction } from "#/lib/api/discussions-controller";

const span = (start: number, end: number): Redaction => ({
  start,
  end,
  category: "PHONE",
});

/** What the reader sees, as one string — the invariant every case shares. */
const joined = (body: string, spans: Redaction[]) =>
  redactionSegments(body, spans)
    .map((s) => s.text)
    .join("");

describe("redactionSegments", () => {
  it("returns the whole body untouched when nothing was withheld", () => {
    expect(redactionSegments("bonjour", [])).toEqual([
      { text: "bonjour", withheld: false },
    ]);
  });

  it("cuts the fragment out on exactly the right characters", () => {
    const body = "appelle moi au 06 12 34 56 78 stp";
    const segments = redactionSegments(body, [span(15, 29)]);

    expect(segments).toEqual([
      { text: "appelle moi au ", withheld: false },
      { text: "06 12 34 56 78", withheld: true },
      { text: " stp", withheld: false },
    ]);
  });

  it.each([
    ["at the start", "0612345678 voila", [span(0, 10)]],
    ["at the end", "voila 0612345678", [span(6, 16)]],
    ["the whole body", "0612345678", [span(0, 10)]],
    ["two fragments", "a 0612345678 b 0698765432 c", [span(2, 12), span(15, 25)]],
  ])("never loses or duplicates a character — %s", (_label, body, spans) => {
    // The one property that matters: whatever the spans, the author still reads
    // their own message back, exactly as typed.
    expect(joined(body, spans)).toBe(body);
  });

  it("marks every withheld fragment and nothing else", () => {
    const body = "a 0612345678 b 0698765432 c";
    const withheld = redactionSegments(body, [span(2, 12), span(15, 25)])
      .filter((s) => s.withheld)
      .map((s) => s.text);

    expect(withheld).toEqual(["0612345678", "0698765432"]);
  });

  it("tolerates spans arriving out of order", () => {
    const body = "a 0612345678 b 0698765432 c";
    expect(joined(body, [span(15, 25), span(2, 12)])).toBe(body);
  });

  describe("refusing to take the thread down", () => {
    // These rows should not exist — the server merges spans, and a CHECK
    // constraint keeps them non-negative and forward. But a message is not
    // worth a blank screen, and a row written before some future bug was fixed
    // must not break every thread it sits in.
    it.each([
      ["a span past the end", "court", [span(2, 999)]],
      ["a span entirely past the end", "court", [span(50, 60)]],
      ["a negative start", "court", [span(-5, 3)]],
      ["a reversed span", "court", [span(4, 1)]],
      ["an empty span", "court", [span(2, 2)]],
      ["overlapping spans", "0612345678", [span(0, 6), span(3, 10)]],
    ])("survives %s", (_label, body, spans) => {
      expect(() => redactionSegments(body, spans)).not.toThrow();
      expect(joined(body, spans)).toBe(body);
    });
  });

  it("handles an emoji without splitting it in half", () => {
    // Offsets are UTF-16 indices, so an emoji is two units. A span that lands
    // after it must still cut where the server said.
    const body = "🎉 0612345678";
    const segments = redactionSegments(body, [span(3, 13)]);

    expect(joined(body, [span(3, 13)])).toBe(body);
    expect(segments.find((s) => s.withheld)?.text).toBe("0612345678");
  });
});
