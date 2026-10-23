"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { cn } from "#/lib/utils";

/** The home hero's photos (640px squares). */
const HOME_PHOTOS = [1, 2, 3, 4, 5, 6].map((n) => `/hero/worker-${n}.jpg`);

const INTERVAL_MS = 4500;


export function HeroCarousel({
  className,
  style,
  photos = HOME_PHOTOS,
  sizes = "230px",
  imageClassName,
}: Readonly<{
  className?: string;
  style?: React.CSSProperties;
  photos?: readonly string[];
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
