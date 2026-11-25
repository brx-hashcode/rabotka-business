"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

import { isPublicSitePath, stripLocalePrefix } from "#/i18n/routing";

/**
 * The phone browser's bars follow the page shown: the lime of the site's
 * header, else the theme's. The two metas of layout.tsx follow the device,
 * which is wrong once the other theme is chosen. Keep equal to --chrome.
 */
export function ThemeColor() {
  const { resolvedTheme } = useTheme();
  // A navigation may write the metas again.
  const pathname = usePathname();
  useEffect(() => {
    if (!resolvedTheme) return;
    const color = resolvedTheme === "dark" && !isPublicSitePath(stripLocalePrefix(pathname) ?? pathname) ? "#060606" : "#cbffa5";
    for (const meta of document.querySelectorAll('meta[name="theme-color"]')) meta.setAttribute("content", color);
  }, [resolvedTheme, pathname]);
  return null;
}
