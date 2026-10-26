import type { Redaction } from "#/lib/api/discussions-controller";

export type Segment = {
  text: string;
  /** Withheld: rendered struck through, and only ever in the author's own bubble. */
  withheld: boolean;
};

/**
 * Splits a message around the fragments that were withheld.
 *
 * ONLY EVER RUNS ON A MESSAGE THIS PROFILE SENT. The recipient's `body` arrives
 * already redacted from the server and carries no offsets at all, so nothing
 * here can reconstruct what was hidden — this cuts text the reader typed
 * themselves, to show them which of it did not go through.
 *
 * Offsets are UTF-16 indices into `body`, the units `String.slice` uses, so
 * they apply directly. They come from the database, which holds them under a
 * CHECK constraint (non-negative, end after start) — but this still tolerates a
 * span that falls outside the body rather than throwing. A message is not worth
 * a blank screen, and a row written before a bug was fixed would otherwise take
 * the whole thread down with it.
 */
export function redactionSegments(
  body: string,
  redactions: readonly Redaction[],
): Segment[] {
  if (redactions.length === 0) return [{ text: body, withheld: false }];

  const clamped = redactions
    .map((span) => ({
      start: Math.max(0, Math.min(span.start, body.length)),
      end: Math.max(0, Math.min(span.end, body.length)),
    }))
    .filter((span) => span.end > span.start)
    .sort((a, b) => a.start - b.start);

  const out: Segment[] = [];
  let cursor = 0;

  for (const span of clamped) {
    // Overlapping spans should not exist — the server merges them before
    // storing — but a span that starts behind the cursor must not emit
    // backwards text, which would duplicate characters on screen.
    if (span.end <= cursor) continue;
    const start = Math.max(span.start, cursor);

    if (start > cursor) {
      out.push({ text: body.slice(cursor, start), withheld: false });
    }
    out.push({ text: body.slice(start, span.end), withheld: true });
    cursor = span.end;
  }

  if (cursor < body.length) {
    out.push({ text: body.slice(cursor), withheld: false });
  }
  return out;
}
