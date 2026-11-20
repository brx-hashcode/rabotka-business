import { IconArrowRight, IconWorld } from "@tabler/icons-react";
import { useTranslations } from "next-intl";

import { GoogleLogo, LinkedInLogo, ProductHuntLogo } from "#/components/brand-logos";

import type { BusinessCountryName } from "#/lib/api/catalog-server";
import { isProductHuntLaunchDay, isProductHuntLaunched, PRODUCT_HUNT } from "../content";
import { DemoButton, SignUpButton } from "./demo-button";
import { flagUrl } from "../globe/country-places";
import { HeroMockup } from "../mockups/mockups";
import { Highlighter } from "./highlighter";
import { ProductHuntBadge } from "./product-hunt-badge";

/**
 * The opening: an ATS, said plainly; the demo first and the account beside
 * it; the product itself on the right. Then the four steps of a hire as
 * cards, each a link to its feature page.
 */
export function LandingHero({
  countries,
  productHuntVotes,
}: Readonly<{ countries: BusinessCountryName[]; productHuntVotes: number | null }>) {
  const t = useTranslations("site.hero");
  const isLaunched = isProductHuntLaunched();
  const isLaunchDay = isProductHuntLaunchDay();
  const productHuntLabel = isLaunchDay ? t("productHuntLive") : isLaunched ? t("productHuntFeatured") : t("productHuntSoon");
  return (
    <section className="overflow-hidden bg-header text-header-foreground">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 pt-10 pb-14 sm:px-6 md:pt-16 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:pb-20">
        <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700">
          <h1 className="isolate font-semibold text-4xl leading-[1.12] tracking-tight sm:text-5xl lg:text-[3.5rem]">
            {t.rich("title", {
              mark: (chunks) => (
                <Highlighter action="underline" color="#FF9800" strokeWidth={3} delay={700}>
                  {chunks}
                </Highlighter>
              ),
            })}
          </h1>
          <p className="isolate max-w-lg text-header-muted text-lg">
            {t.rich("text", {
              mark: (chunks) => (
                <Highlighter action="highlight" color="#87CEFA" delay={1600}>
                  {chunks}
                </Highlighter>
              ),
            })}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <DemoButton />
            <SignUpButton />
          </div>
          {/* One quiet line: where the offers go, and where Rabotka is open. */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-2 text-header-muted text-sm">
            <span className="inline-flex items-center gap-2">
              <span className="font-medium">{t("publishedOn")}</span>
              <span className="flex -space-x-1.5">
                {[
                  { label: "Google", icon: <GoogleLogo className="size-4" /> },
                  { label: "LinkedIn", icon: <LinkedInLogo className="size-4" /> },
                  { label: t("careersPage"), icon: <IconWorld className="size-4 text-whatsapp-dark" /> },
                ].map((b) => (
                  <span
                    key={b.label}
                    title={b.label}
                    aria-label={b.label}
                    role="img"
                    className="flex size-7 items-center justify-center rounded-full bg-white shadow-[0_0_0_2px_var(--header)]"
                  >
                    {b.icon}
                  </span>
                ))}
              </span>
            </span>
            <span aria-hidden className="hidden h-4 w-px bg-header-foreground/20 sm:block" />
            {/* Where it is open, from the backend's list: not one country's tool. The map is further down. */}
            <a href="#pays" className="group inline-flex items-center gap-2">
              <span className="flex -space-x-1.5">
                {countries.slice(0, 5).map((c) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={c.code} src={flagUrl(c.code, 80)} alt="" className="size-6 rounded-full object-cover shadow-[0_0_0_2px_var(--header)]" />
                ))}
              </span>
              <span className="font-medium group-hover:text-header-foreground">{t("countries", { count: countries.length })}</span>
              <IconArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
          <a
            href={PRODUCT_HUNT.postUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={
              isLaunched && productHuntVotes !== null
                ? `${productHuntLabel} · ${t("productHuntVotes", { count: productHuntVotes })}`
                : productHuntLabel
            }
            className="group inline-flex items-center gap-3"
          >
            {isLaunchDay && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1.5 font-bold text-white text-xs uppercase tracking-wider motion-safe:animate-pulse">
                <span aria-hidden className="size-2 rounded-full bg-white" />
                {t("productHuntLiveShort")}
              </span>
            )}
            {isLaunched ? (
              <ProductHuntBadge live={isLaunchDay} votes={productHuntVotes} />
            ) : (
              <span className="group inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm shadow-soft">
                <ProductHuntLogo className="size-5" />
                <span className="font-medium text-foreground">{t("productHuntSoon")}</span>
                <IconArrowRight className="size-4 text-foreground transition-transform group-hover:translate-x-0.5" />
              </span>
            )}
          </a>
        </div>

        <div className="min-w-0 text-foreground motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-6 motion-safe:delay-150 motion-safe:duration-700 motion-safe:fill-mode-both">
          <HeroMockup />
        </div>
      </div>

    </section>
  );
}
