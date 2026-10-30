"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { getMyBusiness, myBusinessKey } from "#/lib/api/business-controller";

/** Points these icon links at `href`; the function returned puts them back. */
export function pointIconsAt(links: Iterable<HTMLLinkElement>, href: string): () => void {
  const undo = Array.from(links).map((link) => {
    const previous = { href: link.getAttribute("href"), type: link.getAttribute("type") };
    link.setAttribute("href", href);
    // The default icon's type (image/png) may not be the logo's.
    link.removeAttribute("type");
    return () => {
      if (previous.href !== null) link.setAttribute("href", previous.href);
      if (previous.type !== null) link.setAttribute("type", previous.type);
    };
  });
  return () => undo.forEach((restore) => restore());
}

/**
 * The tab shows the organisation's logo while it is signed in, Rabotka's icon
 * without one. Next owns these links and can write them again on navigation,
 * so the swap runs again on each page.
 */
export function useOrganisationFavicon() {
  const pathname = usePathname();
  const { data: business } = useQuery({ queryKey: myBusinessKey, queryFn: getMyBusiness });
  const logoUrl = business?.logoUrl;

  useEffect(() => {
    if (!logoUrl) return;
    return pointIconsAt(document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]'), logoUrl);
  }, [logoUrl, pathname]);
}
