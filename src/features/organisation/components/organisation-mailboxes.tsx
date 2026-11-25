"use client";

import { useTranslations } from "next-intl";
import { useWhyNot } from "#/lib/use-why-not";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconPlus } from "@tabler/icons-react";
import { Loader } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ProviderTile } from "#/components/mail-provider-logos";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "#/components/ui/dialog";
import { useConnectMailbox } from "#/features/cv-screening/components/mail-import";
import { useFriendlyError } from "#/lib/api/use-friendly-error";
import { disconnectMailbox, listMailboxes, mailboxesKey, PROVIDER_LABEL, type Mailbox, type MailProviderSlug } from "#/lib/api/mailbox-controller";

/**
 * « Messageries connectées »: the mailboxes « Analyse de CV » picks CVs from,
 * to connect or disconnect. Hidden while no mail service can be connected.
 */
export function OrganisationMailboxes() {
  const t = useTranslations("organisation.mailboxes");
  const whyNot = useWhyNot();
  const friendlyError = useFriendlyError();
  const queryClient = useQueryClient();
  const boxes = useQuery({ queryKey: mailboxesKey, queryFn: listMailboxes });
  const { connect, pending } = useConnectMailbox((provider) => toast.success(t("connected", { provider: PROVIDER_LABEL[provider] })));
  const [confirm, setConfirm] = useState<Mailbox | null>(null);
  const disconnect = useMutation({
    mutationFn: disconnectMailbox,
    onSuccess: () => {
      setConfirm(null);
      void queryClient.invalidateQueries({ queryKey: mailboxesKey });
    },
    onError: (err) => toast.error(friendlyError(err, t("disconnectFailed"))),
  });

  const data = boxes.data;
  if (!data) return null;
  const providers = (Object.keys(data.available) as MailProviderSlug[]).filter((p) => data.available[p]);
  if (providers.length === 0) return null;
  const missing = providers.filter((p) => !data.mailboxes.some((b) => b.provider === p && !b.expired));

  return (
    <section className="space-y-4 rounded-3xl bg-card p-6">
      <div className="space-y-1">
        <h2 className="font-semibold text-lg">{t("title")}</h2>
        <p className="text-muted-foreground text-sm">
          {t("text")}
        </p>
      </div>

      {data.mailboxes.length > 0 && (
        <ul className="space-y-2">
          {data.mailboxes.map((box) => {
            return (
              <li key={box.id} className="flex items-center gap-3 rounded-2xl bg-page p-3">
                <ProviderTile provider={box.provider} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-sm">{box.email}</span>
                  <span className={box.expired ? "block text-chip-amber-foreground text-xs" : "block text-muted-foreground text-xs"}>
                    {box.expired ? t("expired") : PROVIDER_LABEL[box.provider]}
                  </span>
                </span>
                {box.expired && (
                  <button
                    type="button"
                    disabled={pending !== null}
                    title={whyNot([pending !== null, "wait"])}
                    onClick={() => void connect(box.provider)}
                    className="font-medium text-sm underline underline-offset-2 hover:no-underline disabled:opacity-50"
                  >
                    {t("reconnect")}
                  </button>
                )}
                <button
                  type="button"
                  disabled={disconnect.isPending}
                  title={whyNot([disconnect.isPending, "wait"])}
                  onClick={() => setConfirm(box)}
                  className="font-medium text-muted-foreground text-sm hover:text-foreground disabled:opacity-50"
                >
                  {t("disconnect")}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {missing.length > 0 && (
        <div className="space-y-2">
          {missing.map((provider) => (
            <button
              key={provider}
              type="button"
              disabled={pending !== null}
              title={whyNot([pending !== null, "wait"])}
              onClick={() => void connect(provider)}
              className="group flex w-full items-center gap-3 rounded-2xl bg-page p-3 text-left transition-colors hover:bg-page/70 disabled:opacity-50"
            >
              <ProviderTile provider={provider} />
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-sm">{PROVIDER_LABEL[provider]}</span>
                <span className="block text-muted-foreground text-xs">{t("connectAccount")}</span>
              </span>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card text-muted-foreground group-hover:text-foreground">
                {pending === provider ? <Loader className="size-4 animate-spin" /> : <IconPlus className="size-4" />}
              </span>
            </button>
          ))}
        </div>
      )}

      <Dialog open={confirm !== null} onOpenChange={(open) => !open && !disconnect.isPending && setConfirm(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md gap-0 overflow-hidden rounded-3xl border-0 bg-card p-0 shadow-soft">
          {confirm && (
            <div className="space-y-5 p-6">
              <div className="flex items-center gap-3">
                <ProviderTile provider={confirm.provider} />
                <span className="min-w-0">
                  <span className="block truncate font-medium text-sm">{confirm.email}</span>
                  <span className="block text-muted-foreground text-xs">{PROVIDER_LABEL[confirm.provider]}</span>
                </span>
              </div>
              <div className="space-y-1">
                <DialogTitle className="font-semibold text-xl">{t("confirmTitle")}</DialogTitle>
                <DialogDescription className="text-muted-foreground text-sm">
                  {t("confirmText")}
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={disconnect.isPending}
                  title={whyNot([disconnect.isPending, "wait"])}
                  onClick={() => setConfirm(null)}
                  className="h-12 flex-1 rounded-full bg-page font-medium hover:bg-page/70 disabled:opacity-50"
                >
                  {t("cancel")}
                </button>
                <button
                  type="button"
                  disabled={disconnect.isPending}
                  title={whyNot([disconnect.isPending, "wait"])}
                  onClick={() => disconnect.mutate(confirm.id)}
                  className="inline-flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-full bg-destructive font-medium text-white hover:bg-destructive/90 disabled:opacity-60"
                >
                  {disconnect.isPending && <Loader className="size-4 animate-spin" />}
                  {t("disconnect")}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
