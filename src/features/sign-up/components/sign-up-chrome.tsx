"use client";

import Link from "next/link";
import { IconArrowLeft, IconCheck } from "@tabler/icons-react";
import { useTranslations } from "next-intl";

import { cn } from "#/lib/utils";
import { STEPS } from "../steps";

/**
 * Above the form: where you are, what is done and what is left. Steps by name
 * rather than a bare bar or a percentage — the usual advice for 3–6 steps —
 * coloured by state: done (green check), current (ink), to come (grey). A back
 * arrow, and the way to sign in instead. Below `sm` the names go and the
 * counter stays.
 */
export function ProgressHeader({
  index,
  done,
  onBack,
  showSignIn = true,
}: Readonly<{
  index: number;
  done: boolean;
  onBack?: () => void;
  showSignIn?: boolean;
}>) {
  const current = done ? STEPS.length : index;
  const t = useTranslations("signUp");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {onBack && !done && (
            <button
              type="button"
              onClick={onBack}
              aria-label={t("progress.previous")}
              className="-ml-1 flex size-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-page"
            >
              <IconArrowLeft className="size-4.5" />
            </button>
          )}
          <div className="min-w-0 leading-tight">
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              {done ? t("progress.finished") : t("progress.stepOf", { n: index + 1, total: STEPS.length })}
            </p>
            <p className="truncate font-semibold text-[15px]">
              {done ? t("progress.welcome") : t(`steps.${STEPS[index].id}.kicker`)}
            </p>
          </div>
        </div>
        {!done && showSignIn && (
          <p className="shrink-0 text-muted-foreground text-sm">
            <span className="hidden sm:inline">{t("progress.haveAccount")}</span>
            <Link href="/auth/sign-in" className="font-medium text-foreground underline-offset-4 hover:underline">
              {t("progress.signIn")}
            </Link>
          </p>
        )}
      </div>

      <ol aria-label={t("progress.steps")} className="grid grid-cols-5 gap-1.5">
        {STEPS.map((s, i) => {
          const complete = i < current;
          const isCurrent = i === current;
          return (
            <li key={s.id} aria-current={isCurrent ? "step" : undefined} className="min-w-0 space-y-2">
              <span className="block h-1 overflow-hidden rounded-full bg-page">
                <span
                  className={cn(
                    "block h-full rounded-full transition-[width,background-color] duration-500 ease-out",
                    complete ? "bg-whatsapp" : "bg-ink",
                  )}
                  style={{ width: complete || isCurrent ? "100%" : "0%" }}
                />
              </span>
              <span
                className={cn(
                  "hidden items-center gap-1 truncate text-xs transition-colors sm:flex",
                  complete && "text-whatsapp-dark",
                  isCurrent && "font-semibold text-foreground",
                  !complete && !isCurrent && "text-muted-foreground",
                )}
              >
                {complete && <IconCheck className="size-3.5 shrink-0" strokeWidth={3} />}
                <span className="truncate">{t(`steps.${s.id}.label`)}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
