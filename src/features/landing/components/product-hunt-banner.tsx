"use client";

import { IconArrowRight, IconX } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { PH_BANNER_COOKIE_PREFIX, PRODUCT_HUNT } from "../content";

/**
 * A thin top bar announcing the Product Hunt launch, dismissible per browser.
 * The server reads the dismissal cookie and decides whether to render it at
 * all — no flash, no post-hydration jump. Click sets the cookie for 30 days.
 */
export function ProductHuntBanner({ variant }: Readonly<{ variant: "soon" | "live" }>) {
  const t = useTranslations("site.hero");
  const [dismissed, setDismissed] = useState(false);
  const cookieName = `${PH_BANNER_COOKIE_PREFIX}${variant}`;

  if (dismissed) return null;

  const message = variant === "live" ? t("productHuntBannerLive") : t("productHuntBannerSoon");
  const containerStyle = variant === "live" ? "bg-red-600 text-white" : "bg-[#DA552F] text-white";

  return (
    <div className={`relative w-full ${containerStyle}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-10 py-2 text-sm sm:px-6">
        {variant === "live" ? (
          <span aria-hidden className="size-2 shrink-0 rounded-full bg-white motion-safe:animate-pulse" />
        ) : (
          // The PH logo wordmark on its own orange ground, in white.
          <span aria-hidden className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-white font-bold text-[#DA552F] text-xs">
            P
          </span>
        )}
        <a
          href={PRODUCT_HUNT.postUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-1.5 font-medium"
        >
          <span>{message}</span>
          <IconArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>
      <button
        type="button"
        aria-label={t("productHuntBannerDismiss")}
        onClick={() => {
          // 30 days is well past the launch window; the cookie self-expires.
          document.cookie = `${cookieName}=1; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
          setDismissed(true);
        }}
        className="absolute inset-y-0 right-2 flex items-center px-2 text-white/70 hover:text-white sm:right-4"
      >
        <IconX className="size-4" />
      </button>
    </div>
  );
}
