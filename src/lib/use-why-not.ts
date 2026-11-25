"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";

import type { Messages } from "next-intl";

/** The shared reasons (ui.whyNot), or a sentence of the screen's own. */
export type WhyNot = keyof Messages["ui"]["whyNot"] | { say: string };

/**
 * The `title` of a control that can be disabled: the first reason that holds,
 * in order, or nothing when it can be used (then `otherwise`, its usual title).
 */
export function firstReason<T>(reasons: readonly (readonly [unknown, T])[]): T | undefined {
  return reasons.find(([holds]) => Boolean(holds))?.[1];
}

/** `title={whyNot([save.isPending, "wait"], [!name, { say: t("nameFirst") }])}` */
export function useWhyNot() {
  const t = useTranslations("ui.whyNot");
  return useCallback(
    (...reasons: (readonly [unknown, WhyNot])[]): string | undefined => {
      const reason = firstReason(reasons);
      if (reason === undefined) return undefined;
      return typeof reason === "string" ? t(reason) : reason.say;
    },
    [t],
  );
}
