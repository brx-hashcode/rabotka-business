"use client";

import { useEffect } from "react";
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

/** Only the icon links not already on `href`, so writing one starts no new round. */
export function pointStrayIconsAt(links: Iterable<HTMLLinkElement>, href: string): () => void {
  return pointIconsAt(
    Array.from(links).filter((link) => link.getAttribute("href") !== href),
    href,
  );
}

/**
 * The tab shows the organisation's logo while it is signed in, Rabotka's icon
 * without one. Next owns these links and writes them again on navigation, at
 * a moment of its own, sometimes after a page's effects: so they are watched
 * rather than set once per page.
 */
export function useOrganisationFavicon() {
  const { data: business } = useQuery({ queryKey: myBusinessKey, queryFn: getMyBusiness });
  const logoUrl = business?.logoUrl;

  useEffect(() => {
    if (!logoUrl) return;
    const undo: (() => void)[] = [];
    const apply = () => undo.push(pointStrayIconsAt(document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]'), logoUrl));
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { childList: true, subtree: true, attributes: true, attributeFilter: ["href"] });
    return () => {
      observer.disconnect();
      // Oldest last: it holds Next's own address.
      undo.reverse().forEach((restore) => restore());
    };
  }, [logoUrl]);
}
