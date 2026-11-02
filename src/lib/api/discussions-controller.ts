import { BusinessBaseController } from "./base-controller";

export type MessageStatus = "CLEAN" | "REDACTED" | "HELD";

export type RedactionCategory =
  | "PHONE"
  | "EMAIL"
  | "MESSAGING_HANDLE"
  | "URL"
  | "OBFUSCATED_DIGITS";

/**
 * One withheld fragment, as OFFSETS INTO `body`.
 *
 * Only ever present on a message this profile SENT. The server strips them for
 * the other side, because positions would say exactly where to ask "what did
 * you write there?".
 *
 * Nothing here reconstructs a body from these. `body` already holds whatever
 * this reader is entitled to see — the server built both views. These offsets
 * are for HIGHLIGHTING the author's own text, and that is all.
 */
export type Redaction = {
  start: number;
  end: number;
  category: RedactionCategory;
};

export type DiscussionMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  /** Sent by this profile. Drives the bubble side and whether redactions exist. */
  mine: boolean;
  /** Already redacted by the server when this profile is not the author. */
  body: string;
  /** Widened: a status added server-side must still render. */
  status: MessageStatus | (string & {});
  redactions: Redaction[];
  /**
   * This profile has already reported this message — the author's own flag,
   * like `redactions`. Server-side, so "déjà signalé" survives leaving the
   * thread; component state alone put the link back on every remount.
   */
  reported: boolean;
  /**
   * Taken back by its author. The server then sends a tombstone — empty body,
   * no offsets — to BOTH sides, and the bubble draws "Ce message a été
   * supprimé" in its place. The row itself is not emptied server-side, so
   * moderation still reads what was written.
   */
  deletedAt: string | null;
  createdAt: string;
  readAt: string | null;
};

export type Discussion = {
  id: string;
  counterpartId: string;
  counterpartName: string;
  counterpartAvatarUrl: string | null;
  /** Connected right now. Fails closed server-side: false also means "unknown". */
  counterpartOnline: boolean;
  jobTitle: string | null;
  applicationId: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  /** The viewer's own — the list prefixes it with ticks. */
  lastMessageMine: boolean;
  lastMessageRead: boolean;
  /** Own message held back whole: it never arrived. */
  lastMessageHeld: boolean;
  unreadCount: number;
  closed: boolean;
};

export type Page<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

/**
 * The client app's messaging endpoints (`profile/discussions/*`), unchanged:
 * the server moderates and redacts every message there — the other side's
 * text arrives already masked, and only the author's own carries offsets — so
 * the business space gets exactly the same rules by going through them.
 */
class DiscussionsController extends BusinessBaseController {
  list(page = 1, limit = 20): Promise<Page<Discussion>> {
    return this.get<Page<Discussion>>(
      `/profile/discussions?page=${page}&limit=${limit}`,
    );
  }

  /** One conversation, including one nobody has written in yet. */
  one(id: string): Promise<{ conversation: Discussion }> {
    return this.get<{ conversation: Discussion }>(`/profile/discussions/${id}`);
  }

  messages(id: string, page = 1, limit = 50): Promise<Page<DiscussionMessage>> {
    return this.get<Page<DiscussionMessage>>(
      `/profile/discussions/${id}/messages?page=${page}&limit=${limit}`,
    );
  }

  /**
   * Idempotent server-side — a unique index on the application makes a second
   * call return the first result — so the screen may call it on every entry
   * without guarding.
   */
  open(applicationId: string): Promise<{ conversation: { id: string } }> {
    return this.post<{ conversation: { id: string } }>(
      `/profile/discussions/applications/${applicationId}`,
    );
  }

  /**
   * Opens a conversation with a profile that has no application between you —
   * an employer writing to a recommended worker.
   *
   * Idempotent, like `open`, but capped server-side: this is the one call that
   * reaches somebody who never asked to be reached, so it can legitimately
   * fail with "trop de discussions aujourd'hui". The caller shows the message
   * rather than swallowing it.
   */
  openWithProfile(profileId: string): Promise<{ conversation: { id: string } }> {
    return this.post<{ conversation: { id: string } }>(
      `/profile/discussions/profiles/${profileId}`,
    );
  }

  send(id: string, body: string): Promise<{ message: DiscussionMessage }> {
    return this.post<{ message: DiscussionMessage }>(
      `/profile/discussions/${id}/messages`,
      { body },
    );
  }

  /**
   * "Supprimer la discussion" — for THIS side only. Nothing is deleted
   * server-side: the other party keeps their history, and a new message brings
   * the conversation back from that point on.
   */
  hide(id: string): Promise<{ ok: boolean }> {
    return this.delete<{ ok: boolean }>(`/profile/discussions/${id}`);
  }

  markRead(id: string): Promise<{ ok: boolean; count: number }> {
    return this.post<{ ok: boolean; count: number }>(
      `/profile/discussions/${id}/read`,
    );
  }

  /**
   * Takes one of your own messages back, for BOTH sides — unlike `hide`, which
   * clears a whole conversation for you alone.
   *
   * What is left is a tombstone, not a gap: the other party keeps seeing that
   * something was there and is gone. Server-side the row survives with its
   * text, so moderation can still answer "did they send a number and then
   * delete it?".
   */
  deleteMessage(messageId: string): Promise<{ ok: boolean }> {
    return this.delete<{ ok: boolean }>(
      `/profile/discussions/messages/${messageId}`,
    );
  }

  /** « Ce n'était pas un numéro » — only the author of a message may say it. */
  report(messageId: string, note?: string): Promise<{ ok: boolean }> {
    return this.post<{ ok: boolean }>(
      `/profile/discussions/messages/${messageId}/report`,
      note ? { note } : {},
    );
  }
}

const controller = new DiscussionsController();
export const listDiscussions = controller.list.bind(controller);
export const listDiscussionMessages = controller.messages.bind(controller);
export const getDiscussion = controller.one.bind(controller);
export const openDiscussion = controller.open.bind(controller);
export const openDiscussionWithProfile =
  controller.openWithProfile.bind(controller);
export const sendDiscussionMessage = controller.send.bind(controller);
export const markDiscussionRead = controller.markRead.bind(controller);
export const hideDiscussion = controller.hide.bind(controller);
export const deleteDiscussionMessage =
  controller.deleteMessage.bind(controller);
export const reportRedaction = controller.report.bind(controller);
