import { IconTriangleFilled } from "@tabler/icons-react";
import { useLocale, useTranslations } from "next-intl";

import { INTL_LOCALE, type Locale } from "#/i18n/config";

/**
 * Our own « Product Hunt » badge: one block of Product Hunt's orange, the
 * kitten as a white disc, « Featured on / Live on Product Hunt » and the live
 * upvote count in white. Without a count (the launch's first hours, or
 * Product Hunt unreachable) the ▲ says « Voter ». Sits inside the hero's link
 * to the post, whose label reads the count out.
 */
export function ProductHuntBadge({ live, votes }: Readonly<{ live: boolean; votes: number | null }>) {
  const t = useTranslations("site.hero");
  const locale = useLocale() as Locale;
  return (
    <span className="inline-flex items-center gap-3 rounded-2xl bg-[#FF6154] py-2.5 pr-5 pl-3 text-white transition-[translate,filter] group-hover:-translate-y-0.5 group-hover:brightness-105">
      {/* The kitten's disc in white: its « P » is a hole, so the orange shows through. */}
      <svg viewBox="0 0 24 24" aria-hidden className="size-10 shrink-0">
        <path
          fill="#FFFFFF"
          d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm1.604 14.4H10.2V18H7.8V6h5.804c2.319 0 4.2 1.881 4.2 4.2 0 2.319-1.881 4.2-4.2 4.2zm0-6.3H10.2V12h3.404c.994 0 1.801-.806 1.801-1.8 0-.994-.807-1.8-1.801-1.8z"
        />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="font-bold text-[10px] uppercase tracking-[0.08em]">
          {live ? t("productHuntEyebrowLive") : t("productHuntEyebrowFeatured")}
        </span>
        <span className="mt-1 font-bold text-[1.375rem] tracking-tight">Product Hunt</span>
      </span>
      <span className="ml-3 flex flex-col items-center gap-1 leading-none">
        <IconTriangleFilled aria-hidden className="size-3.5" />
        <span className="font-bold text-base tabular-nums">
          {votes === null ? t("productHuntUpvote") : new Intl.NumberFormat(INTL_LOCALE[locale]).format(votes)}
        </span>
      </span>
    </span>
  );
}
