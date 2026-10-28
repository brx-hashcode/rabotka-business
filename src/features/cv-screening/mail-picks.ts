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

const CV_WORDS = /(?<![a-zà-ÿ])(cv(?![a-z])|c\.v\.|curriculum|r[ée]sum[ée]|candidat|postul)/i;
const OTHER_PAPERS = /lettre|motivation|cover|facture|invoice|devis|re[çc]u|attestation|dipl[oô]me|contrat|bulletin/i;

/**
 * A hint that an attachment is a CV. The file's own name decides first (a
 * « CV_Awa.pdf », or a « Lettre de motivation » that is not one); the subject
 * only speaks for a name that says nothing (« scan.jpg » in a « Candidature »).
 */
export function looksLikeCv(name: string, subject = ""): boolean {
  if (CV_WORDS.test(name)) return true;
  if (OTHER_PAPERS.test(name)) return false;
  return CV_WORDS.test(subject);
}

/** Up to two initials of a sender's name, for its avatar. */
export function initials(name: string): string {
  const parts = name.trim().split(/[\s._-]+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? "?").slice(0, 2)).toUpperCase();
}
