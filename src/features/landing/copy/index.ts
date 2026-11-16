import { useMessages } from "next-intl";
import { getMessages } from "next-intl/server";

import type { Messages } from "#/i18n/messages";

export type SiteCopy = Messages["siteCopy"];

/**
 * The public site's long copy (features, feature pages, guides, FAQ,
 * mock-ups): the siteCopy messages, in the request's language. Only the
 * public site's layout hands them to the browser (see its
 * NextIntlClientProvider); the space never loads them.
 */
export function useSiteCopy(): SiteCopy {
  return (useMessages() as unknown as Messages).siteCopy;
}

/** The same, from an async server component. */
export async function getSiteCopy(): Promise<SiteCopy> {
  return ((await getMessages()) as unknown as Messages).siteCopy;
}
