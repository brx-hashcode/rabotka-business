"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Link from "next/link";
import { IconAlertTriangle, IconCircleCheckFilled, IconClockHour4, IconDeviceMobileMessage } from "@tabler/icons-react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "#/components/ui/dialog";
import { INTL_LOCALE } from "#/i18n/config";
import type { PaymentOperator } from "#/lib/api/types";
import { cn } from "#/lib/utils";

export type PaymentPhase = "waiting" | "approved" | "failed" | "expired";

/** How long the operator keeps a request open; past it, the page offers to send again. */
export const REQUEST_SECONDS = 180;


/**
 * The moment the money moves, over the form: the request sent to the phone,
 * what to do there, how long it stays open — then the operator's answer.
 * The waiting dialog does not close on a stray click: leaving is a choice
 * (« Fermer »), and says that a validation made anyway still counts.
 */
export function PaymentDialog({
  phase,
  amount,
  phone,
  operator,
  sentAt,
  planName,
  startsAt,
  approvedText,
  back,
  failureText,
  onClose,
  onResend,
}: Readonly<{
  phase: PaymentPhase | null;
  /** Already said in the network's currency. */
  amount: string | null;
  /** As people read it: « +242 06 991 76 86 ». */
  phone: string;
  operator: PaymentOperator | null;
  sentAt: number;
  planName: string | null;
  /** When the plan paid for starts, if it follows the running one. */
  startsAt?: string | null;
  /** What the payment did, when not a plan's (a pack). */
  approvedText?: string;
  /** Where « paid » leads back to: the plans, or the packs for a pack. */
  back?: { href: string; label: string };
  /** Why the operator refused, when it said (« Solde mobile money insuffisant… »). */
  failureText?: string | null;
  onClose: () => void;
  onResend: () => void;
}>) {
  const t = useTranslations("subscription.dialog");
  const locale = useLocale();
  const left = useCountdown(phase === "waiting" ? sentAt : null);
  const backTo = back ?? { href: "/espace/abonnement", label: t("back") };

  return (
    <Dialog open={phase !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showClose={false}
        onInteractOutside={(e) => phase === "waiting" && e.preventDefault()}
        onEscapeKeyDown={(e) => phase === "waiting" && e.preventDefault()}
        className="w-[calc(100vw-2rem)] max-w-md gap-0 overflow-hidden rounded-3xl border-0 bg-card p-0 shadow-soft"
      >
        {phase === "waiting" && (
          <>
            <div className="space-y-5 px-6 pt-8 pb-6 text-center sm:px-8">
              <PhoneSignal />
              <div className="space-y-2">
                <DialogTitle className="font-semibold text-2xl tracking-tight">{t("title")}</DialogTitle>
                <DialogDescription className="text-muted-foreground text-sm">
                  {t("text")}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-page p-3 text-left">
                {operator?.logo ? (
                  // A gateway-hosted logo: nothing next/image could optimise.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={operator.logo} alt="" className="size-10 rounded-xl bg-white object-contain p-1" />
                ) : (
                  <span className="flex size-10 items-center justify-center rounded-xl bg-card">
                    <IconDeviceMobileMessage className="size-5" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{phone}</p>
                  <p className="text-muted-foreground text-xs">{operator?.label ?? t("mobileMoney")}</p>
                </div>
                <p className="font-semibold tabular-nums">{amount ?? ""}</p>
              </div>
            </div>
            <div className="space-y-3 bg-page/60 px-6 py-5 sm:px-8">
              <p className="flex items-center justify-center gap-1.5 text-muted-foreground text-sm">
                <IconClockHour4 className="size-4" />
                {left > 0
                  ? t.rich("validFor", {
                      time: clock(left),
                      b: (chunks) => <span className="font-semibold text-foreground tabular-nums">{chunks}</span>,
                    })
                  : t("maybeExpired")}
              </p>
              <p className="text-center text-muted-foreground text-xs">
                {t("autoUpdate")}
              </p>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onClose} className="h-11 flex-1 rounded-full bg-card font-medium text-sm hover:bg-card/70">
                  {t("close")}
                </button>
                <button
                  type="button"
                  onClick={onResend}
                  disabled={left > REQUEST_SECONDS - 30}
                  title={left > REQUEST_SECONDS - 30 ? t("resendHint") : undefined}
                  className="h-11 flex-1 rounded-full bg-ink font-medium text-sm text-white hover:bg-ink/90 disabled:opacity-40"
                >
                  {t("resend")}
                </button>
              </div>
            </div>
          </>
        )}

        {phase === "approved" && (
          <Outcome
            tone="good"
            title={t("approvedTitle")}
            text={
              approvedText ??
              t("approvedPlan", {
                named: planName ? "yes" : "no",
                plan: planName ?? "",
                queued: startsAt ? "yes" : "no",
                date: startsAt
                  ? new Date(startsAt).toLocaleDateString(INTL_LOCALE[locale], { day: "numeric", month: "long", year: "numeric" })
                  : "",
              })
            }
          >
            <Link href="/espace/factures" className="h-11 flex-1 rounded-full bg-page px-4 font-medium text-sm leading-[2.75rem] hover:bg-page/70">
              {t("seeInvoice")}
            </Link>
            <Link href={backTo.href} className="h-11 flex-1 rounded-full bg-ink px-4 font-medium text-sm text-white leading-[2.75rem] hover:bg-ink/90">
              {backTo.label}
            </Link>
          </Outcome>
        )}

        {(phase === "failed" || phase === "expired") && (
          <Outcome
            tone="bad"
            title={phase === "expired" ? t("expiredTitle") : t("failedTitle")}
            text={
              phase === "expired"
                ? t("expiredText")
                : failureText
                  ? t("failedWith", { reason: failureText })
                  : t("failedText")
            }
          >
            <button type="button" onClick={onClose} className="h-11 flex-1 rounded-full bg-page font-medium text-sm hover:bg-page/70">
              {t("changeNumber")}
            </button>
            <button type="button" onClick={onResend} className="h-11 flex-1 rounded-full bg-ink font-medium text-sm text-white hover:bg-ink/90">
              {t("retry")}
            </button>
          </Outcome>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** A phone with a slow halo: something is happening there, not here. */
function PhoneSignal() {
  return (
    <div className="relative mx-auto flex size-24 items-center justify-center">
      <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-brand-lime/40 [animation-duration:2.4s]" />
      <span aria-hidden className="absolute inset-0 rounded-full bg-brand-lime/40" />
      {/* Round inside the round halo: nothing sticks out of it. */}
      <span className="relative flex size-[4.5rem] items-center justify-center rounded-full bg-brand-lime text-[#0f2414]">
        <IconDeviceMobileMessage className="size-9" stroke={1.75} />
      </span>
    </div>
  );
}

function Outcome({
  tone,
  title,
  text,
  children,
}: Readonly<{ tone: "good" | "bad"; title: string; text: string; children: React.ReactNode }>) {
  const Icon = tone === "good" ? IconCircleCheckFilled : IconAlertTriangle;
  return (
    <div className="space-y-6 px-6 pt-8 pb-6 text-center sm:px-8">
      <span
        className={cn(
          "mx-auto flex size-16 items-center justify-center rounded-3xl",
          tone === "good" ? "bg-chip-green text-chip-green-foreground" : "bg-destructive/10 text-destructive",
        )}
      >
        <Icon className="size-8" />
      </span>
      <div className="space-y-2">
        <DialogTitle className="font-semibold text-2xl tracking-tight">{title}</DialogTitle>
        <DialogDescription className="text-muted-foreground text-sm">{text}</DialogDescription>
      </div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

/** Seconds left of the request, ticking once a second while it waits. */
function useCountdown(since: number | null): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (since === null) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [since]);
  if (since === null) return REQUEST_SECONDS;
  return Math.max(0, REQUEST_SECONDS - Math.floor((now - since) / 1000));
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
