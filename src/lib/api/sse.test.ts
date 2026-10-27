import { describe, expect, it } from "vitest";

import { parseSse } from "./sse";

describe("parseSse", () => {
  it("reads complete events and keeps a cut one for later", () => {
    const { events, rest } = parseSse('event: delta\ndata: {"text":"Bon"}\n\nevent: delta\ndata: {"te');
    expect(events).toEqual([{ event: "delta", data: { text: "Bon" } }]);
    expect(rest).toBe('event: delta\ndata: {"te');
    const next = parseSse(`${rest}xt":"jour"}\n\nevent: done\ndata: {"remaining":3}\n\n`);
    expect(next.events).toEqual([
      { event: "delta", data: { text: "jour" } },
      { event: "done", data: { remaining: 3 } },
    ]);
    expect(next.rest).toBe("");
  });

  it("keeps newlines inside the text, and skips what it cannot read", () => {
    const { events } = parseSse('event: delta\ndata: {"text":"- un\\n- deux"}\n\ndata: oops\n\n');
    expect(events).toEqual([{ event: "delta", data: { text: "- un\n- deux" } }]);
  });
});
