import Link from "next/link";
import type { ComponentProps } from "react";

/** Next's Link for the site's own pages, a plain anchor for another site. */
export function SmartLink({ href, ...props }: Readonly<ComponentProps<"a"> & { href: string }>) {
  if (/^https?:\/\//.test(href)) return <a href={href} {...props} />;
  return <Link href={href} {...props} />;
}
