"use client";

import { useState } from "react";
import { IconPhoto } from "@tabler/icons-react";

import { cn } from "#/lib/utils";

/**
 * A remote image (storage, any size: not for next/image) that says so when
 * the file is gone rather than leaving a blank space.
 */
export function SafeImage({
  src,
  className,
  fallbackClassName,
  eager,
}: Readonly<{ src: string; className?: string; fallbackClassName?: string; eager?: boolean }>) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className={cn("flex flex-col items-center justify-center gap-1 text-muted-foreground text-xs", fallbackClassName ?? "size-full")}>
        <IconPhoto className="size-6" />
        Image indisponible
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" loading={eager ? "eager" : "lazy"} onError={() => setFailed(true)} className={className} />
  );
}

