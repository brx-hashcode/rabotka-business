import type { MailAttachmentRef } from "#/lib/api/mailbox-controller";
import type { MailPick } from "./mail-picks";

/**
 * A batch of CVs sent in several requests: the business site takes 50 MB a
 * request, and a plan may allow up to 100 CVs per analysis. The first chunk
 * opens the screening, the others are added to it — each one starts being
 * read as soon as it lands.
 */

/** At most this many CVs, and this many bytes, per request. */
export const CHUNK_MAX_FILES = 8;
export const CHUNK_MAX_BYTES = 40 * 1024 * 1024;

export type CvChunk = { files: File[]; mails: MailPick[] };

/** Splits the batch in order, by count and by size (a mailbox CV weighs its own size). */
export function chunkCvBatch(
  files: File[],
  mails: MailPick[],
  limits = { maxFiles: CHUNK_MAX_FILES, maxBytes: CHUNK_MAX_BYTES },
): CvChunk[] {
  const items: ({ kind: "file"; file: File; size: number } | { kind: "mail"; mail: MailPick; size: number })[] = [
    ...files.map((file) => ({ kind: "file" as const, file, size: file.size })),
    ...mails.map((mail) => ({ kind: "mail" as const, mail, size: mail.size })),
  ];
  const chunks: CvChunk[] = [];
  let current: CvChunk = { files: [], mails: [] };
  let bytes = 0;
  for (const item of items) {
    const count = current.files.length + current.mails.length;
    if (count > 0 && (count >= limits.maxFiles || bytes + item.size > limits.maxBytes)) {
      chunks.push(current);
      current = { files: [], mails: [] };
      bytes = 0;
    }
    if (item.kind === "file") current.files.push(item.file);
    else current.mails.push(item.mail);
    bytes += item.size;
  }
  if (current.files.length + current.mails.length > 0) chunks.push(current);
  return chunks;
}

export const mailRefs = (mails: MailPick[]): MailAttachmentRef[] =>
  mails.map(({ mailboxId, messageId, attachmentId }) => ({ mailboxId, messageId, attachmentId }));

/**
 * Runs `send` on each chunk after the first, two at a time, each tried twice;
 * returns the chunks that still failed. `onSent` counts the CVs that landed.
 */
export async function sendRest(
  chunks: CvChunk[],
  send: (chunk: CvChunk) => Promise<unknown>,
  onSent: (count: number) => void,
  parallel = 2,
): Promise<CvChunk[]> {
  const failed: CvChunk[] = [];
  let next = 0;
  const worker = async () => {
    while (next < chunks.length) {
      const chunk = chunks[next++];
      const size = chunk.files.length + chunk.mails.length;
      try {
        await send(chunk).catch(() => send(chunk));
        onSent(size);
      } catch {
        failed.push(chunk);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(parallel, chunks.length) }, worker));
  return failed;
}
