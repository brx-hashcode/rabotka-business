"use client";

import dynamic from "next/dynamic";

/**
 * The globe, fetched with three.js only in the browser and after the rest of
 * the page: until then, a plain disc of the same size.
 */
export const LazyGlobe = dynamic(() => import("./globe"), {
  ssr: false,
  loading: () => (
    <div aria-hidden className="flex aspect-square w-full items-center justify-center">
      <div className="aspect-square w-[78%] rounded-full bg-[#17351f]" />
    </div>
  ),
});
