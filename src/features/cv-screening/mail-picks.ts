import type { CvMailAttachment, MailAttachmentRef } from "#/lib/api/mailbox-controller";

/** A CV ticked in a mail: its reference, plus what the file list shows. */
export type MailPick = MailAttachmentRef & { name: string; size: number; fromName: string };

export const pickKey = (p: MailAttachmentRef) => `${p.mailboxId}:${p.messageId}:${p.attachmentId}`;

/** A file's kind from its name, as the drop zone tiles show it. */
export function kindFromName(name: string): "pdf" | "docx" | "image" {
  if (/\.pdf$/i.test(name)) return "pdf";
  if (/\.docx$/i.test(name)) return "docx";
  return "image";
}

/** The picks once a mail's attachment is ticked or unticked, never past `room` in all. */
export function togglePick(
  picks: MailPick[],
  pick: MailPick,
  room: number,
): MailPick[] {
  const key = pickKey(pick);
  if (picks.some((p) => pickKey(p) === key)) return picks.filter((p) => pickKey(p) !== key);
  return picks.length >= room ? picks : [...picks, pick];
}

/** The attachment as a pick, from the mail it belongs to. */
export function toPick(mailboxId: string, mail: { id: string; fromName: string }, a: CvMailAttachment): MailPick {
  return { mailboxId, messageId: mail.id, attachmentId: a.id, name: a.name, size: a.size, fromName: mail.fromName };
}
