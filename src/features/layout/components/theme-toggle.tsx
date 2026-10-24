"use client";

import { IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "next-themes";

import { useHydrated } from "#/hooks/use-hydrated";
import { cn } from "#/lib/utils";

/** Moon / sun, as a two-segment pill; the chosen side lit in brand lime. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const dark = hydrated && resolvedTheme === "dark";

  const segment = (on: boolean) =>
    cn(
      "flex size-10 items-center justify-center rounded-xl transition-colors",
      on ? "bg-brand-lime text-[#0f2414]" : "text-muted-foreground hover:text-foreground",
    );

  return (
    <div role="radiogroup" aria-label="Thème" className="flex items-center gap-1 rounded-2xl bg-card p-1">
      <button type="button" role="radio" aria-checked={dark} aria-label="Sombre" onClick={() => setTheme("dark")} className={segment(dark)}>
        <IconMoon className="size-5" />
      </button>
      <button type="button" role="radio" aria-checked={!dark} aria-label="Clair" onClick={() => setTheme("light")} className={segment(!dark)}>
        <IconSun className="size-5" />
      </button>
    </div>
  );
}
