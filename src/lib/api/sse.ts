/** One server-sent event: its name and its JSON data. */
export type SseEvent = { event: string; data: Record<string, unknown> };

/**
 * The complete events at the start of `buffer`, and what is left of it (an
 * event cut in two by the network waits for the next chunk).
 */
export function parseSse(buffer: string): { events: SseEvent[]; rest: string } {
  const events: SseEvent[] = [];
  let rest = buffer;
  for (let end = rest.indexOf("\n\n"); end >= 0; end = rest.indexOf("\n\n")) {
    const block = rest.slice(0, end);
    rest = rest.slice(end + 2);
    let event = "message";
    const data: string[] = [];
    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
    }
    if (!data.length) continue;
    try {
      events.push({ event, data: JSON.parse(data.join("\n")) as Record<string, unknown> });
    } catch {
      // A malformed event is skipped, not fatal: the next one may be fine.
    }
  }
  return { events, rest };
}
