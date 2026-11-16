import Link from "next/link";
import { useLocale } from "next-intl";
import type { ComponentProps } from "react";

import { localHref } from "#/i18n/routing";

/**
 * Next's Link, at the reader's language's URL for the public site's pages
 * (`/contact` → `/en/contact` in English); any other link as it is.
 */
export function LocalLink({ href, ...props }: Readonly<ComponentProps<typeof Link>>) {
  const locale = useLocale();
  return <Link href={typeof href === "string" ? localHref(href, locale) : href} {...props} />;
}
