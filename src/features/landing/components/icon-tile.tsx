import type { Icon } from "@tabler/icons-react";

import { cn } from "#/lib/utils";

const SIZES = {
  sm: { tile: "size-8 rounded-lg", icon: "size-4" },
  md: { tile: "size-10 rounded-xl", icon: "size-5" },
  lg: { tile: "size-12 rounded-2xl", icon: "size-6" },
} as const;

/**
 * Its fill, then on hover or focus: the row itself greys, so the tile lifts
 * to the other surface (a light touch, never a dark block).
 */
const SURFACES = {
  page: "bg-page group-hover:bg-card group-focus-visible:bg-card group-data-highlighted:bg-card",
  card: "bg-card group-hover:bg-page group-focus-visible:bg-page",
} as const;

const IDLE =
  "text-foreground group-hover:text-whatsapp-dark group-focus-visible:text-whatsapp-dark group-data-highlighted:text-whatsapp-dark";

/**
 * The site's one icon style: an ink icon on a quiet tile, the same for every
 * feature and link (no colour per item). Inside a `group`, hover and focus
 * swap its fill for the other surface and turn the icon green. `surface` is
 * the tile's own fill: `page` on white panels, `card` on grey ones; `active`
 * is for a selected (grey) row: white tile, green icon.
 */
export function IconTile({
  icon: Glyph,
  size = "md",
  surface = "page",
  active = false,
  className,
}: Readonly<{
  icon: Icon;
  size?: keyof typeof SIZES;
  surface?: keyof typeof SURFACES;
  active?: boolean;
  className?: string;
}>) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center transition-colors duration-300 ease-out",
        SIZES[size].tile,
        active ? "bg-card text-whatsapp-dark" : cn(SURFACES[surface], IDLE),
        className,
      )}
    >
      <Glyph className={SIZES[size].icon} stroke={1.75} />
    </span>
  );
}
