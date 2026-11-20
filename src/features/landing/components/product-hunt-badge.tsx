import { IconTriangleFilled } from "@tabler/icons-react";
import { useLocale, useTranslations } from "next-intl";

import { ProductHuntLogo } from "#/components/brand-logos";
import { INTL_LOCALE, type Locale } from "#/i18n/config";

/**
 * Our own « Product Hunt » badge, in the site's look rather than Product
 * Hunt's grey embed: the kitten, where we are, and the live upvote count in
 * Product Hunt's orange. Without a count (the launch's first hours, or
 * Product Hunt unreachable) the counter says « Voter ». Sits inside the
 * hero's link to the post, whose label reads the count out.
 */
export function ProductHuntBadge({ live, votes }: Readonly<{ live: boolean; votes: number | null }>) {
  const t = useTranslations("site.hero");
  const locale = useLocale() as Locale;
  return (
    <span className="inline-flex items-center gap-3 rounded-2xl bg-white py-2 pr-2 pl-2.5 text-foreground transition-transform group-hover:-translate-y-0.5">
      <ProductHuntLogo className="size-10 shrink-0" />
      <span className="flex flex-col pr-1 leading-none">
        <span className="font-semibold text-[10px] text-muted-foreground uppercase tracking-[0.14em]">
          {live ? t("productHuntEyebrowLive") : t("productHuntEyebrowFeatured")}
        </span>
        <span className="mt-1.5 font-bold text-lg tracking-tight">Product Hunt</span>
      </span>
      <span className="flex min-w-14 flex-col items-center justify-center gap-0.5 rounded-xl bg-[#DA552F]/10 px-3 py-1.5 text-[#DA552F] transition-colors group-hover:bg-[#DA552F] group-hover:text-white">
        <IconTriangleFilled aria-hidden className="size-3" />
        <span className="font-bold text-sm tabular-nums leading-none">
          {votes === null ? t("productHuntUpvote") : new Intl.NumberFormat(INTL_LOCALE[locale]).format(votes)}
        </span>
      </span>
    </span>
  );
}
