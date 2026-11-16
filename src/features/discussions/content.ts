import { useMessages } from "next-intl";

import type fr from "#/i18n/messages/fr/discussions.json";

type Content = Pick<typeof fr, "list" | "thread" | "warning">;

/**
 * The discussions' words (messages `discussions`), in the reader's language.
 * The client app's, except where a business differs: it gets a candidate's
 * details by retaining them on an offer — never over WhatsApp.
 */
export function useDiscussionsContent(): Content {
  return (useMessages() as unknown as { discussions: Content }).discussions;
}
