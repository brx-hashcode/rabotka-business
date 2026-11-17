"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconBrandApple, IconBrandGoogle, IconBrandWindows, IconCheck, IconCopy, IconRefresh } from "@tabler/icons-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "#/components/ui/dialog";
import { Skeleton } from "#/components/ui/skeleton";
import { useFriendlyError } from "#/lib/api/use-friendly-error";
import {
  getInterviewCalendar,
  interviewCalendarKey,
  resetInterviewCalendar,
  type InterviewCalendarLink,
} from "#/lib/api/interview-controller";

/** Where each agenda subscribes to a calendar by its address. */
function addLinks(link: InterviewCalendarLink, t: (key: "google" | "apple" | "outlookName") => string) {
  return [
    {
      label: t("google"),
      icon: IconBrandGoogle,
      href: `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(link.webcalUrl)}`,
    },
    {
      label: "Outlook",
      icon: IconBrandWindows,
      href: `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(link.url)}&name=${encodeURIComponent(t("outlookName"))}`,
    },
    { label: t("apple"), icon: IconBrandApple, href: link.webcalUrl },
  ];
}

/**
 * « Ajouter à mon agenda »: the private address of the interview calendar,
 * added once to Google, Outlook or Apple, which then keep every interview up
 * to date by themselves. « Changer le lien » cuts off an address shared too widely.
 */
export function CalendarLinkDialog({ open, onOpenChange }: Readonly<{ open: boolean; onOpenChange: (open: boolean) => void }>) {
  const queryClient = useQueryClient();
  const t = useTranslations("interviews.agenda");
  const friendlyError = useFriendlyError();
  const link = useQuery({ queryKey: interviewCalendarKey, queryFn: getInterviewCalendar, enabled: open, staleTime: Infinity });
  const [copied, setCopied] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const reset = useMutation({
    mutationFn: resetInterviewCalendar,
    onSuccess: (next) => {
      queryClient.setQueryData(interviewCalendarKey, next);
      setConfirmReset(false);
      toast.success(t("reset"));
    },
    onError: (err) => toast.error(friendlyError(err, t("resetFailed"))),
  });

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("copyFailed"));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setConfirmReset(false);
        onOpenChange(next);
      }}
    >
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg gap-0 overflow-hidden rounded-3xl border-0 bg-card p-0 shadow-soft">
        <div className="max-h-[85svh] space-y-5 overflow-y-auto px-6 pt-6 pb-6">
          <div className="space-y-1">
            <DialogTitle className="font-semibold text-xl">{t("title")}</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">{t("text")}</DialogDescription>
          </div>

          {link.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
            </div>
          ) : !link.data ? (
            <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-destructive text-sm">
              {friendlyError(link.error, t("unavailable"))}
            </p>
          ) : (
            <>
              <div className="grid gap-2 sm:grid-cols-3">
                {addLinks(link.data, t).map((a) => (
                  <a
                    key={a.label}
                    href={a.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center gap-2 rounded-2xl bg-page px-3 py-4 text-center font-medium text-sm hover:bg-page/70"
                  >
                    <a.icon className="size-5" />
                    {a.label}
                  </a>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-muted-foreground text-xs">{t("paste")}</p>
                <div className="flex items-center gap-2 rounded-2xl bg-page p-1.5 pl-4">
                  <input
                    readOnly
                    value={link.data.url}
                    onFocus={(e) => e.currentTarget.select()}
                    aria-label={t("address")}
                    className="min-w-0 flex-1 bg-transparent font-mono text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => void copy(link.data.url)}
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-card px-3.5 font-medium text-sm hover:bg-card/70"
                  >
                    {copied ? <IconCheck className="size-4 text-whatsapp-dark" /> : <IconCopy className="size-4" />}
                    {copied ? t("copied") : t("copy")}
                  </button>
                </div>
                <p className="text-muted-foreground text-xs">
                  {t("keep")}
                </p>
              </div>

              {confirmReset ? (
                <div className="space-y-3 rounded-2xl bg-chip-amber/60 p-4 text-chip-amber-foreground text-sm">
                  <p>{t("resetWarning")}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="h-10 flex-1 rounded-full bg-card font-medium text-foreground hover:bg-card/70"
                    >
                      {t("cancel")}
                    </button>
                    <button
                      type="button"
                      disabled={reset.isPending}
                      onClick={() => reset.mutate()}
                      className="h-10 flex-1 rounded-full bg-ink font-medium text-white hover:bg-ink/90 disabled:opacity-60"
                    >
                      {reset.isPending ? t("changing") : t("change")}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground"
                >
                  <IconRefresh className="size-4" />
                  {t("change")}
                </button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
