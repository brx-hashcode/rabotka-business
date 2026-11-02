// @vitest-environment node
// Pure list surgery over paginated messages — no DOM, no React runtime.
import { describe, expect, it } from "vitest";

import { mergeThread } from "./merge-thread";
import type { DiscussionMessage } from "#/lib/api/discussions-controller";

function message(
  id: string,
  minute: number,
  extra: Partial<DiscussionMessage> = {},
): DiscussionMessage {
  return {
    id,
    conversationId: "c-1",
    senderId: "p-1",
    mine: true,
    body: id,
    status: "CLEAN",
    redactions: [],
    reported: false,
    deletedAt: null,
    createdAt: `2026-09-23T10:${String(minute).padStart(2, "0")}:00.000Z`,
    readAt: null,
    ...extra,
  };
}

const ids = (list: DiscussionMessage[]) => list.map((m) => m.id);

describe("mergeThread", () => {
  it("reads oldest first, whichever order the pages arrived in", () => {
    // Both pages come back newest-first, and history is the OLDER half.
    const live = [message("m-4", 40), message("m-3", 30)];
    const history = [[message("m-2", 20), message("m-1", 10)]];

    expect(ids(mergeThread(history, live))).toEqual([
      "m-1",
      "m-2",
      "m-3",
      "m-4",
    ]);
  });

  it("keeps one copy of a message that offset drift put on two pages", () => {
    // A message arrived between the two requests, so page 2 starts one too
    // early and repeats m-3 — the exact failure this merge exists for.
    const live = [message("m-4", 40), message("m-3", 30)];
    const history = [[message("m-3", 30), message("m-2", 20)]];

    expect(ids(mergeThread(history, live))).toEqual(["m-2", "m-3", "m-4"]);
  });

  it("prefers the live copy of a duplicate, which is the fresher one", () => {
    // History was fetched before the other side opened the thread; the polled
    // page knows the message has been read.
    const stale = message("m-1", 10, { readAt: null });
    const fresh = message("m-1", 10, { readAt: "2026-09-23T11:00:00.000Z" });

    expect(mergeThread([[stale]], [fresh])[0].readAt).toBe(
      "2026-09-23T11:00:00.000Z",
    );
  });

  it("orders messages of the same millisecond stably", () => {
    const a = message("a", 10);
    const b = message("b", 10);

    expect(ids(mergeThread([[b]], [a]))).toEqual(["a", "b"]);
    expect(ids(mergeThread([[a]], [b]))).toEqual(["a", "b"]);
  });

  it("is just the live page when no history has been opened", () => {
    const live = [message("m-2", 20), message("m-1", 10)];
    expect(ids(mergeThread([], live))).toEqual(["m-1", "m-2"]);
  });

  it("holds several pages of history in order", () => {
    const live = [message("m-5", 50)];
    const history = [
      [message("m-4", 40), message("m-3", 30)],
      [message("m-2", 20), message("m-1", 10)],
    ];

    expect(ids(mergeThread(history, live))).toEqual([
      "m-1",
      "m-2",
      "m-3",
      "m-4",
      "m-5",
    ]);
  });
});
