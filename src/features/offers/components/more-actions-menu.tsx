"use client";

import type { ComponentType } from "react";
import { IconDots } from "@tabler/icons-react";
import { useTranslations } from "next-intl";

import { Fragment } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import type { Translator } from "#/i18n/translator";
import { useWhyNot } from "#/lib/use-why-not";
import { cn } from "#/lib/utils";

export type MoreAction = {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  onSelect: () => void;
  disabled?: boolean;
  /** A word on why it is not available yet. */
  hint?: string;
  /** Irreversible: shown in red, apart from the rest. */
  tone?: "danger";
};

/**
 * « ⋯ » : what a candidate's card offers beyond reading the CV and deciding.
 * Not modal, so the sheet an item opens takes the focus as it closes.
 */
export function MoreActionsMenu({
  actions,
  name,
  className,
  wide = false,
}: Readonly<{
  actions: MoreAction[];
  name: string;
  className?: string;
  /** An offer's own menu: longer labels, each on one line. */
  wide?: boolean;
}>) {
  const t = useTranslations("offers.candidate");
  const whyNot = useWhyNot();
  if (actions.length === 0) return null;
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label={t("moreActions", { name })}
        className={cn(
          "inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-card outline-none hover:bg-card/70",
          className,
        )}
      >
        <IconDots className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn(
          "rounded-2xl border-0 bg-card p-1.5 shadow-soft",
          wide ? "w-[min(21rem,calc(100vw-2rem))]" : "w-64",
        )}
      >
        {actions.map((a, i) => (
          <Fragment key={a.key}>
            {a.tone === "danger" && i > 0 && actions[i - 1].tone !== "danger" && <DropdownMenuSeparator className="my-1" />}
            <DropdownMenuItem
              disabled={a.disabled}
              title={a.disabled ? (a.hint ?? whyNot([true, "wait"])) : undefined}
              onSelect={a.onSelect}
              className={cn(
                "cursor-pointer items-start gap-2.5 rounded-xl px-3 py-2.5 text-sm focus:bg-page",
                a.tone === "danger" && "text-destructive focus:bg-destructive/10 focus:text-destructive",
                a.disabled && "opacity-60",
              )}
            >
              <a.icon className="mt-0.5 size-4 shrink-0" />
              <span className="min-w-0">
                <span className="block">{a.label}</span>
                {a.hint && <span className="block text-muted-foreground text-xs">{a.hint}</span>}
              </span>
            </DropdownMenuItem>
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** « Avis de l'équipe », with how many gave one. */
export function opinionLabel(summary: { YES: number; MAYBE: number; NO: number } | undefined, t: Translator<"offers.candidate">): string {
  const total = summary ? summary.YES + summary.MAYBE + summary.NO : 0;
  return total > 0 ? t("teamOpinionCount", { count: total }) : t("teamOpinion");
}
