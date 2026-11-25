import Link from "next/link";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { BusinessLockup } from "#/components/business-lockup";
import { ThemeButton } from "#/components/theme-toggle";
import { PUBLIC_SITE } from "#/features/landing/content";
import { cn } from "#/lib/utils";

/**
 * The frame of the sign-in and sign-up pages, the same as rabotka-analytics'
 * import screen: on the left the form column (brand at the top, a small
 * footer at the bottom), on the right a wall of cards saying what the space
 * does.
 *
 * The cards state what Rabotka Business does today, in the landing's words
 * (features/landing/content.ts): no figures without a source, no
 * testimonials until a real customer gives one.
 *
 * `wide` gives the sign-up's forms (organisation, documents) the room they
 * need; sign-in keeps a narrow column.
 */
export type Spotlight = { label: string; title: string; text: string };

export function AuthShell({
  children,
  wide = false,
  footer,
  spotlight,
}: Readonly<{
  children: ReactNode;
  wide?: boolean;
  footer?: ReactNode;
  /** What the ink card says instead of its default — the sign-up's current step. */
  spotlight?: Spotlight;
}>) {
  const t = useTranslations("auth.shell");
  return (
    <div className="grid min-h-svh bg-card lg:grid-cols-2">
      <section className="flex min-h-svh min-w-0 flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label={t("home")}>
            <BusinessLockup compact />
          </Link>
          <ThemeButton tone="card" className="size-9" />
        </div>

        <div className={cn("mx-auto flex w-full flex-1 flex-col", wide ? "max-w-136" : "max-w-md")}>
          {children}
        </div>

        <footer className="mt-6 flex flex-wrap gap-x-5 gap-y-1 font-mono text-muted-foreground text-xs">
          <span>© Rabotka {new Date().getFullYear()}</span>
          <a href={PUBLIC_SITE} className="no-underline hover:text-foreground">
            www.rabotka.work
          </a>
          <a
            href={`${PUBLIC_SITE}/privacy`}
            target="_blank"
            rel="noreferrer"
            className="no-underline hover:text-foreground"
          >
            {t("privacy")}
          </a>
          {footer}
        </footer>
      </section>

      <FeatureWall spotlight={spotlight} />
    </div>
  );
}

/** A few words underlined in lime, as with a highlighter; lime text on the ink card and in the dark theme, where the line would hide white letters. */
function Mark({ children, onDark = false }: Readonly<{ children: ReactNode; onDark?: boolean }>) {
  return onDark ? (
    <span className="text-brand-lime">{children}</span>
  ) : (
    <span className="box-decoration-clone bg-[linear-gradient(transparent_58%,var(--brand-lime)_58%)] dark:bg-none dark:text-brand-lime">
      {children}
    </span>
  );
}

function Statement({
  children,
  label,
  size = "md",
  dark = false,
}: Readonly<{ children: ReactNode; label: string; size?: "md" | "lg"; dark?: boolean }>) {
  return (
    <>
      <span
        aria-hidden
        className={cn(
          "font-bold font-display leading-none",
          size === "lg" ? "text-4xl" : "text-2xl",
          dark ? "text-brand-lime" : "text-foreground/25",
        )}
      >
        “
      </span>
      <p className={cn("mt-3 tracking-tight", size === "lg" ? "text-[1.7rem] leading-snug" : "leading-relaxed")}>
        {children}
      </p>
      <p className={cn("mt-4 text-xs", dark ? "text-white/55" : "text-muted-foreground")}>{label}</p>
    </>
  );
}

/**
 * Two columns of cards in a grey frame: white ones, one lime (the figure),
 * one ink. Hidden below `lg`, where the form takes the whole screen.
 */
function FeatureWall({ spotlight }: Readonly<{ spotlight?: Spotlight }>) {
  const card = "flex flex-col justify-center rounded-3xl p-8";
  const t = useTranslations("auth.shell");
  const mark = (chunks: ReactNode) => <Mark>{chunks}</Mark>;
  const markDark = (chunks: ReactNode) => <Mark onDark>{chunks}</Mark>;
  return (
    <aside aria-label={t("wall")} className="hidden p-3 lg:sticky lg:top-0 lg:block lg:h-svh">
      <div className="grid h-full grid-cols-2 gap-3 rounded-[28px] bg-page p-3">
        <div className="flex min-h-0 flex-col gap-3">
          <div className={cn(card, "flex-[5] bg-card")}>
            <Statement label={t("offersLabel")} size="lg">
              {t.rich("offers", { mark })}
            </Statement>
          </div>
          <div className={cn(card, "flex-[2.5] bg-ink text-white")}>
            {spotlight ? (
              // Keyed: each step's message fades in instead of swapping in place.
              <div
                key={spotlight.title}
                className="space-y-2 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500"
              >
                <p className="font-medium text-brand-lime text-sm">{spotlight.label}</p>
                <p className="font-semibold text-xl leading-snug tracking-tight">{spotlight.title}</p>
                <p className="text-sm text-white/70 leading-relaxed">{spotlight.text}</p>
              </div>
            ) : (
              <Statement label={t("verifiedLabel")} dark>
                {t.rich("verified", { mark: markDark })}
              </Statement>
            )}
          </div>
          <div className={cn(card, "flex-[2.5] bg-card")}>
            <Statement label={t("rankedLabel")}>
              {t.rich("ranked", { mark })}
            </Statement>
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-3">
          <div className={cn(card, "flex-[2.5] bg-brand-lime text-brand-lime-foreground")}>
            <p className="font-bold font-display text-7xl leading-none">
              100
            </p>
            <p className="mt-4 max-w-56 text-sm">
              {t("score")}
            </p>
          </div>
          <div className={cn(card, "flex-[2.5] bg-card")}>
            <Statement label={t("mailboxLabel")}>
              {t.rich("mailbox", { mark })}
            </Statement>
          </div>
          <div className={cn(card, "flex-[5] bg-card")}>
            <Statement label={t("interviewsLabel")} size="lg">
              {t.rich("interviews", { mark })}
            </Statement>
          </div>
        </div>
      </div>
    </aside>
  );
}
