"use client";

import { IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

import { useHydrated } from "#/hooks/use-hydrated";
import { cn } from "#/lib/utils";

/**
 * One round button: the theme that is not shown. Both icons are drawn and CSS
 * picks one, so the server's page is right whatever the device's theme.
 */
export function ThemeButton({ tone = "header", className }: Readonly<{ tone?: "header" | "card" | "inverse"; className?: string }>) {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations("layout.theme");
  return (
    <button
      type="button"
      aria-label={t("switch")}
      title={t("switch")}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        tone === "header" && "hover:bg-header-foreground/8",
        tone === "card" && "bg-page text-foreground hover:bg-page/70",
        tone === "inverse" && "size-8 bg-white/6 text-white/70 hover:bg-white/12 hover:text-white",
        className,
      )}
    >
      <IconMoon className="size-5 dark:hidden" />
      <IconSun className="hidden size-5 dark:block" />
    </button>
  );
}

/** Moon / sun, as a two-segment pill; the chosen side lit in brand lime. */
export function ThemeToggle({ className }: Readonly<{ className?: string }>) {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations("layout.theme");
  const hydrated = useHydrated();
  const dark = hydrated && resolvedTheme === "dark";

  const segment = (on: boolean) =>
    cn(
      "flex size-10 items-center justify-center rounded-xl transition-colors",
      on ? "bg-selected text-selected-foreground" : "text-muted-foreground hover:text-foreground",
    );

  return (
    <div role="radiogroup" aria-label={t("label")} className={cn("flex items-center gap-1 rounded-2xl bg-card p-1", className)}>
      <button type="button" role="radio" aria-checked={dark} aria-label={t("dark")} onClick={() => setTheme("dark")} className={segment(dark)}>
        <IconMoon className="size-5" />
      </button>
      <button type="button" role="radio" aria-checked={!dark} aria-label={t("light")} onClick={() => setTheme("light")} className={segment(!dark)}>
        <IconSun className="size-5" />
      </button>
    </div>
  );
}
