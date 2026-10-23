"use client";

import { useEffect, useState } from "react";

import { BrandLoader } from "#/components/brand-loader";
import { cn } from "#/lib/utils";

/**
 * Covers the server-rendered page on first load until the app is interactive
 * (hydrated), then fades out. Client-side navigations never show it: it only
 * lives once, in the root layout. A CSS fail-safe hides it after 8 s even if
 * the JavaScript never starts.
 */
export function SplashScreen() {
  const [phase, setPhase] = useState<"shown" | "leaving" | "gone">("shown");

  useEffect(() => {
    const leave = requestAnimationFrame(() => setPhase("leaving"));
    const remove = setTimeout(() => setPhase("gone"), 450);
    return () => {
      cancelAnimationFrame(leave);
      clearTimeout(remove);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      role="status"
      aria-label="Chargement"
      className={cn(
        "splash-failsafe fixed inset-0 z-[100] flex items-center justify-center bg-header transition-opacity duration-300",
        phase === "leaving" && "pointer-events-none opacity-0",
      )}
    >
      <BrandLoader />
    </div>
  );
}
