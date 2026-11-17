"use client";

import { useState } from "react";

import { ImageGallerySheet } from "#/components/image-gallery-sheet";
import { cn } from "#/lib/utils";

/**
 * Each photo's tile, by how many photos there are (the editor allows six).
 * The first is the large one; the others fill around it so no row is left
 * half empty. On phones, two columns: the first across both, the rest in
 * pairs, an odd last one across both.
 */
const TILES: Record<number, string[]> = {
  1: ["sm:col-span-4 sm:row-span-2"],
  2: ["sm:col-span-2 sm:row-span-2", "sm:col-span-2 sm:row-span-2"],
  3: ["sm:col-span-2 sm:row-span-2", "sm:col-span-2", "sm:col-span-2"],
  4: ["sm:col-span-2 sm:row-span-2", "sm:col-span-2", "sm:col-span-1", "sm:col-span-1"],
  5: ["sm:col-span-2 sm:row-span-2", "sm:col-span-1", "sm:col-span-1", "sm:col-span-1", "sm:col-span-1"],
  6: ["sm:col-span-2 sm:row-span-2", "sm:col-span-1", "sm:col-span-1", "sm:col-span-2", "sm:col-span-2", "sm:col-span-2"],
};

/** A business's photos as a bento grid; a photo opens full size, the others a swipe away. */
export function PhotoBento({ photos, title }: Readonly<{ photos: string[]; title: string }>) {
  const [open, setOpen] = useState<number | null>(null);
  const shown = photos.slice(0, 6);
  const tiles = TILES[shown.length] ?? [];
  // Phones: the first across, then pairs; an odd last one across too.
  const wide = (i: number) => i === 0 || (i === shown.length - 1 && (shown.length - 1) % 2 === 1);

  return (
    <>
      <div className="grid auto-rows-[9rem] grid-cols-2 gap-2 sm:auto-rows-[10rem] sm:grid-cols-4">
        {shown.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setOpen(i)}
            className={cn(
              "group relative overflow-hidden rounded-2xl bg-page outline-none focus-visible:ring-2 focus-visible:ring-ink/40",
              wide(i) && "col-span-2",
              i === 0 && "row-span-2",
              tiles[i],
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- the business's own upload, any host */}
            <img
              src={src}
              alt=""
              loading={i === 0 ? "eager" : "lazy"}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </button>
        ))}
      </div>
      {open !== null && <ImageGallerySheet images={shown} index={open} title={title} onClose={() => setOpen(null)} />}
    </>
  );
}
