"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { cn } from "#/lib/utils";

const INTERVAL_MS = 4500;


export function HeroCarousel({
  className,
  style,
  photos,
  sizes = "230px",
  imageClassName,
}: Readonly<{
  className?: string;
  style?: React.CSSProperties;
  photos: readonly string[];
  sizes?: string;
  imageClassName?: string;
}>) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        setIndex((i) => (i + 1) % photos.length);
      }
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [photos.length]);

  return (
    <div aria-hidden className={cn("pointer-events-none", className)} style={style}>
      {photos.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          sizes={sizes}
          priority={i === 0}
          // Not lazy: every slide must be loaded before it fades in, or the
          // frame shows its dark background until the photo arrives.
          loading={i === 0 ? undefined : "eager"}
          className={cn(
            "object-cover transition-opacity duration-1000 ease-in-out",
            imageClassName,
            i === index ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
    </div>
  );
}
