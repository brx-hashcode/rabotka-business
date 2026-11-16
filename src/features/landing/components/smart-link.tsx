import type { ComponentProps } from "react";

import { LocalLink } from "#/components/local-link";

/** The site's own pages in the reader's language, a plain anchor for another site. */
export function SmartLink({ href, ...props }: Readonly<ComponentProps<"a"> & { href: string }>) {
  if (/^https?:\/\//.test(href)) return <a href={href} {...props} />;
  return <LocalLink href={href} {...props} />;
}
