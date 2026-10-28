import { appConfig } from "#/config";
import { BusinessBaseController } from "./base-controller";

export type MailProviderSlug = "gmail" | "outlook";

export type Mailbox = {
  id: string;
  provider: MailProviderSlug;
  email: string;
  connectedAt: string;
  /** The provider stopped answering: it must be connected again. */
  expired: boolean;
};

export type Mailboxes = {
  /** Which mail services can be connected (configured on the server). */
  available: Record<MailProviderSlug, boolean>;
  mailboxes: Mailbox[];
};

export type CvMailAttachment = { id: string; name: string; size: number; mime: string };

/** A mail with at least one CV attached; the sender by name only. */
export type CvMail = {
  id: string;
  fromName: string;
  subject: string;
  date: string;
  attachments: CvMailAttachment[];
};

/** One CV ticked in a mail, sent with the analysis. */
export type MailAttachmentRef = { mailboxId: string; messageId: string; attachmentId: string };

/** The mailboxes « Analyse de CV » picks CVs from (Gmail, Outlook). */
class MailboxController extends BusinessBaseController {
  list(): Promise<Mailboxes> {
    return this.get("/business/me/mailboxes");
  }

  /** The consent screen to open in a popup. */
  connect(provider: MailProviderSlug): Promise<{ url: string }> {
    return this.post(`/business/me/mailboxes/${provider}/connect`);
  }

  mails(id: string, params: { q?: string; page?: string } = {}): Promise<{ mails: CvMail[]; next: string | null }> {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
    return this.get(`/business/me/mailboxes/${encodeURIComponent(id)}/mails${qs.size ? `?${qs}` : ""}`);
  }

  disconnect(id: string): Promise<unknown> {
    return this.delete(`/business/me/mailboxes/${encodeURIComponent(id)}`);
  }
}

const controller = new MailboxController();

export const mailboxesKey = ["business", "me", "mailboxes"] as const;
export const listMailboxes = controller.list.bind(controller);
export const connectMailbox = controller.connect.bind(controller);
export const listMailCvs = controller.mails.bind(controller);
export const disconnectMailbox = controller.disconnect.bind(controller);

/** One attachment, served inline for a preview (PDF or photo). */
export function mailAttachmentUrl(ref: MailAttachmentRef): string {
  const { mailboxId, messageId, attachmentId } = ref;
  return `${appConfig.apiUrl}/business/me/mailboxes/${encodeURIComponent(mailboxId)}/mails/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachmentId)}`;
}

export const PROVIDER_LABEL: Record<MailProviderSlug, string> = { gmail: "Gmail", outlook: "Outlook" };
