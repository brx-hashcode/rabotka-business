import { describe, expect, it, vi } from "vitest";

import type { MailPick } from "./mail-picks";
import { chunkCvBatch, sendRest } from "./send-cv-batch";

const file = (name: string, mb: number) => ({ name, size: mb * 1024 * 1024 }) as File;
const mail = (name: string, mb: number) => ({ name, size: mb * 1024 * 1024 }) as MailPick;

describe("chunkCvBatch", () => {
  it("cuts by count, in order", () => {
    const files = Array.from({ length: 19 }, (_, i) => file(`f${i}`, 1));
    const chunks = chunkCvBatch(files, []);
    expect(chunks.map((c) => c.files.length)).toEqual([8, 8, 3]);
    expect(chunks[0].files[0].name).toBe("f0");
  });

  it("cuts by size, a mailbox CV counting its own size", () => {
    const chunks = chunkCvBatch([file("a", 25), file("b", 20)], [mail("m", 10)]);
    expect(chunks.map((c) => [c.files.length, c.mails.length])).toEqual([
      [1, 0],
      [1, 1],
    ]);
  });

  it("keeps a single file larger than the cap in a chunk of its own", () => {
    expect(chunkCvBatch([file("big", 45)], [])).toHaveLength(1);
  });
});

describe("sendRest", () => {
  it("tries a chunk twice and reports those that still failed", async () => {
    const chunks = chunkCvBatch(
      Array.from({ length: 16 }, (_, i) => file(`f${i}`, 1)),
      [],
    );
    let calls = 0;
    const send = vi.fn(async (c: { files: File[] }) => {
      calls++;
      if (c.files[0].name === "f8") throw new Error("down");
    });
    const sent: number[] = [];
    const failed = await sendRest(chunks, send, (n) => sent.push(n));
    expect(failed).toHaveLength(1);
    expect(sent).toEqual([8]);
    expect(calls).toBe(3);
  });
});
