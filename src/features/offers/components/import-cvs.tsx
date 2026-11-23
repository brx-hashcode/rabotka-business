"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";

import { ActionDialog } from "#/components/action-dialog";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "#/components/ui/dialog";
import { CvLocked, CvUsedUp } from "#/features/cv-screening/components/cv-bits";
import { CvPicker } from "#/features/cv-screening/components/cv-picker";
import { MailCvSheet, useConnectMailbox } from "#/features/cv-screening/components/mail-import";
import type { MailPick } from "#/features/cv-screening/mail-picks";
import { CHUNK_MAX_FILES, chunkCvBatch, mailRefs, sendRest } from "#/features/cv-screening/send-cv-batch";
import { cvOutOfReach } from "#/features/subscription/packs";
import { trialLocks } from "#/features/subscription/trial-lock";
import { usePackOnSale } from "#/features/subscription/use-packs";
import { getMySubscription, mySubscriptionKey } from "#/lib/api/business-controller";
import { deleteImportedCvs, externalApplicationsKey, importOfferCvs } from "#/lib/api/careers-controller";
import { listMailboxes, mailboxesKey, type Mailboxes } from "#/lib/api/mailbox-controller";
import { useFriendlyError } from "#/lib/api/use-friendly-error";

/**
 * « Importer des CV » on an offer: CVs the business already has (its
 * computer, its Gmail) join the offer's candidates. Each is read like a
 * careers CV, on one « CV inclus », and takes its place in the list, ranked
 * with those who applied, as soon as its analysis lands. Nobody is written to.
 */

/** How many CVs the plan takes now; none when it has no CV analysis or none left. */
export function useCvRoom() {
  const subscription = useQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription });
  const e = subscription.data?.entitlements;
  const room = !e || cvOutOfReach(e) || e.cvRemaining === 0 ? 0 : Math.min(e.cvBatchMax, e.cvRemaining ?? e.cvBatchMax);
  return { e, room, loading: subscription.isLoading };
}

/** Why no CV can be analysed now; null while one can (or it is not known yet). */
export type CvBlock = { kind: "locked" | "usedUp"; trial: boolean; until: string | null; packOnSale: boolean };

/**
 * The plan's side of « Analyser »: left out of the plan, or its « CV inclus »
 * used up for the period. Said where the button would be, rather than a
 * button that can only fail.
 */
export function useCvBlock(): CvBlock | null {
  const { e, room, loading } = useCvRoom();
  const packOnSale = usePackOnSale("CV");
  if (loading || room > 0) return null;
  if (!e || cvOutOfReach(e)) return { kind: "locked", trial: trialLocks(e, "cvAnalysis"), until: null, packOnSale: false };
  return { kind: "usedUp", trial: false, until: e.countersResetAt ?? e.endsAt, packOnSale };
}

/** Sends the CVs in chunks (send-cv-batch.ts), then shows them on the offer. */
function useImportCvs(offerId: string, onDone: () => void) {
  const t = useTranslations("offers.importCvs");
  const friendlyError = useFriendlyError();
  const queryClient = useQueryClient();
  const [sent, setSent] = useState(0);
  const mutation = useMutation({
    mutationFn: async ({ files, mails }: { files: File[]; mails: MailPick[] }) => {
      setSent(0);
      const count = files.length + mails.length;
      const failed = await sendRest(
        chunkCvBatch(files, mails),
        (c) => importOfferCvs(offerId, c.files, mailRefs(c.mails)),
        (n) => setSent((s) => s + n),
      );
      const lost = failed.reduce((n, c) => n + c.files.length + c.mails.length, 0);
      if (lost === count) throw new Error(t("failed"));
      return { imported: count - lost, lost };
    },
    onSuccess: ({ imported, lost }) => {
      // The new rows show « Analyse du CV en cours… », and the list polls until each is scored.
      void queryClient.invalidateQueries({ queryKey: [...externalApplicationsKey, offerId] });
      void queryClient.invalidateQueries({ queryKey: mySubscriptionKey });
      if (lost > 0) toast.error(t("partlyFailed", { count: lost }));
      toast.success(t("done", { count: imported }));
      onDone();
    },
    onError: (err) => toast.error(friendlyError(err, t("failed"))),
  });
  return { ...mutation, sent };
}

/** From the computer: a dialog to drop the CVs in, and « Lancer l'analyse ». */
export function ImportCvsDialog({
  offerId,
  offerTitle,
  open,
  onOpenChange,
}: Readonly<{ offerId: string; offerTitle: string; open: boolean; onOpenChange: (open: boolean) => void }>) {
  const t = useTranslations("offers.importCvs");
  const packOnSale = usePackOnSale("CV");
  const { e, room, loading } = useCvRoom();
  const [files, setFiles] = useState<File[]>([]);
  const close = () => {
    setFiles([]);
    onOpenChange(false);
  };
  const send = useImportCvs(offerId, close);
  const count = files.length;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Not closed halfway through a batch.
        if (send.isPending) return;
        if (next) onOpenChange(true);
        else close();
      }}
    >
      <DialogContent className="flex max-h-[90svh] w-[calc(100vw-2rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-3xl border-0 bg-card p-0 shadow-soft">
        <div className="space-y-1.5 p-6 pb-4">
          <DialogTitle className="font-semibold text-xl">{t("deviceTitle")}</DialogTitle>
          <DialogDescription>{t("description", { title: offerTitle })}</DialogDescription>
        </div>
        <div className="space-y-5 overflow-y-auto px-6 pb-6">
          {loading ? null : !e || cvOutOfReach(e) ? (
            <CvLocked trial={trialLocks(e, "cvAnalysis")} packOnSale={packOnSale} />
          ) : room === 0 ? (
            <CvUsedUp until={e.countersResetAt ?? e.endsAt} packOnSale={packOnSale} />
          ) : (
            <form
              onSubmit={(ev) => {
                ev.preventDefault();
                if (count > 0) send.mutate({ files, mails: [] });
              }}
              className="space-y-5"
            >
              <CvPicker
                files={files}
                mails={[]}
                room={room}
                maxMb={e.cvFileMaxMb}
                disabled={send.isPending}
                onFiles={setFiles}
                onMails={() => undefined}
                withMail={false}
              />
              <p className="text-muted-foreground text-xs">{t("note")}</p>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={send.isPending}
                  onClick={close}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-page px-5 font-medium hover:bg-page/70 disabled:opacity-50"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={count === 0 || send.isPending}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-ink px-5 font-medium text-white hover:bg-ink/90 disabled:opacity-40"
                >
                  {send.isPending
                    ? count > CHUNK_MAX_FILES
                      ? t("sendingCount", { sent: send.sent, count })
                      : t("sending")
                    : t("start", { count: count ? String(count) : "none" })}
                </button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * From Gmail: the same mail sheet as « Analyse de CV ». `start` opens it, or
 * the consent screen first (on the click itself, or the browser blocks the
 * popup); its button imports what was ticked.
 */
export function useGmailImport(offerId: string) {
  const t = useTranslations("offers.importCvs");
  const queryClient = useQueryClient();
  const boxes = useQuery({ queryKey: mailboxesKey, queryFn: listMailboxes, staleTime: 60_000 });
  const { room } = useCvRoom();
  const [openId, setOpenId] = useState<string | null>(null);
  const gmailBox = (data: Mailboxes | undefined) => data?.mailboxes.findLast((b) => b.provider === "gmail" && !b.expired);
  const { connect, pending } = useConnectMailbox(() => {
    const box = gmailBox(queryClient.getQueryData<Mailboxes>(mailboxesKey));
    if (box) setOpenId(box.id);
  });
  const send = useImportCvs(offerId, () => setOpenId(null));
  const mailbox = boxes.data?.mailboxes.find((b) => b.id === openId);

  return {
    /** The server offers Gmail: the menu shows it. */
    available: !!boxes.data?.available.gmail,
    connecting: pending !== null,
    start: () => {
      const box = gmailBox(boxes.data);
      if (box) setOpenId(box.id);
      else void connect("gmail");
    },
    sheet: mailbox ? (
      <MailCvSheet
        key={mailbox.id}
        mailbox={mailbox}
        open={openId !== null}
        onOpenChange={(next) => !next && !send.isPending && setOpenId(null)}
        picks={[]}
        room={room}
        onDone={(mails) => mails.length > 0 && send.mutate({ files: [], mails })}
        onReconnect={() => {
          setOpenId(null);
          void connect(mailbox.provider);
        }}
        action={{
          label: (count) =>
            send.isPending
              ? count > CHUNK_MAX_FILES
                ? t("sendingCount", { sent: send.sent, count })
                : t("sending")
              : t("start", { count: count ? String(count) : "none" }),
          pending: send.isPending,
        }}
      />
    ) : null,
  };
}

/**
 * « Supprimer »: imported CVs taken off the offer, with their analysis and
 * file. Never someone who applied (they are refused), nor a retained one.
 */
export function DeleteImportedDialog({
  ids,
  name,
  open,
  onOpenChange,
  onDone,
}: Readonly<{
  ids: string[];
  /** One CV: its candidate's name in the title. */
  name?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
}>) {
  const t = useTranslations("offers.importCvs");
  const friendlyError = useFriendlyError();
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: () => deleteImportedCvs(ids),
    onSuccess: ({ deleted }) => {
      void queryClient.invalidateQueries({ queryKey: externalApplicationsKey });
      onOpenChange(false);
      onDone?.();
      toast.success(t("deleted", { count: deleted }));
    },
    onError: (err) => toast.error(friendlyError(err, t("deleteFailed"))),
  });
  return (
    <ActionDialog
      open={open}
      onOpenChange={(next) => !remove.isPending && onOpenChange(next)}
      tone="warning"
      icon={<IconTrash className="size-5" />}
      title={name ? t("deleteOneTitle", { name }) : t("deleteTitle", { count: ids.length })}
      description={t("deleteText", { count: ids.length })}
      confirmLabel={t("delete")}
      pending={remove.isPending}
      onConfirm={() => remove.mutate()}
    />
  );
}
