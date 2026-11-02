import type { DiscussionMessage } from "#/lib/api/discussions-controller";

/**
 * The live page and any loaded history, as one thread, oldest first.
 *
 * MERGED BY ID. The API paginates by offset over a conversation that keeps
 * growing, so a message that arrives between two page requests pushes every
 * older one down and the next page hands back something the previous page
 * already had. The drift only ever duplicates, never skips: new messages enter
 * at the newest end, and the window moves the other way.
 *
 * `live` is applied LAST so its copy wins. It is the page being polled, so it
 * carries the current read state — history keeps the `readAt` it was fetched
 * with, and on a message that is in both, that one is the stale one.
 *
 * Sorted by time rather than trusted from page order, so a duplicate landing on
 * a different page cannot reorder the conversation.
 */
export function mergeThread(
  history: readonly (readonly DiscussionMessage[])[],
  live: readonly DiscussionMessage[],
): DiscussionMessage[] {
  const byId = new Map<string, DiscussionMessage>();
  for (const page of history) {
    for (const message of page) byId.set(message.id, message);
  }
  for (const message of live) byId.set(message.id, message);

  return [...byId.values()].sort((a, b) => {
    const delta =
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    // Same millisecond: the id, so the order is stable between renders rather
    // than dependent on which page happened to arrive first.
    return delta !== 0 ? delta : a.id.localeCompare(b.id);
  });
}
