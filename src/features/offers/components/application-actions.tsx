"use client";

import type { ComponentType } from "react";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconAddressBook, IconDots, IconMessageCircle, IconStar, IconStarFilled, IconCircleCheckFilled, IconCircleDashed, IconLockOpen, IconX } from "@tabler/icons-react";
import { UserRoundCheck, UserRoundX } from "lucide-react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";

import { ActionDialog } from "#/components/action-dialog";
import { chattableApplicationId } from "#/features/discussions/chattable";
import { ContactDialog } from "#/features/contacts/components/contact-dialog";
import { RefusalMessageField } from "./refusal-message";
import { useOpenDiscussion } from "#/features/discussions/use-discussions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Skeleton } from "#/components/ui/skeleton";
import { Textarea } from "#/components/ui/textarea";
import {
  acceptApplication,
  applicationKey,
  cancelApplication,
  getApplication,
  payUnlockWithWallet,
  rateWorker,
  rejectApplication,
} from "#/lib/api/application-controller";
import { getMySubscription, mySubscriptionKey } from "#/lib/api/business-controller";
import { INTL_LOCALE, type Locale } from "#/i18n/config";
import { useFriendlyError } from "#/lib/api/use-friendly-error";
import { offersKey, type OfferApplicant } from "#/lib/api/offer-controller";
import { cn } from "#/lib/utils";
import { useWhyNot } from "#/lib/use-why-not";
import { showApplicationStatus } from "../application-cache";
import { fcfa } from "../offer-labels";
import { canHire } from "#/features/team/member-access";
import { useMember } from "#/features/team/use-member";

type Dialog = "accept" | "reject" | "cancel" | "unlock" | "rate" | "contact" | null;

type Action = {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  tone: "primary" | "accent" | "default" | "danger";
  onClick?: () => void;
  href?: string;
};

const TONE: Record<Action["tone"], string> = {
  primary: "bg-ink text-white hover:bg-ink/90",
  accent: "bg-brand-lime text-[#0f2414] hover:bg-brand-lime/80",
  default: "bg-card hover:bg-card/70",
  danger: "bg-card hover:text-destructive",
};

const button = "inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3.5 font-medium text-sm transition-colors";

/** Beside other buttons, on a row or a card: the long labels stay for the menu and the dialogs (offers.actions.short). */
const SHORT = new Set(["cancel", "unlock", "contact"] as const);

function ActionButton({ action: a, label }: Readonly<{ action: Action; label?: string }>) {
  const className = cn(button, TONE[a.tone]);
  const body = (
    <>
      <a.icon className="size-4 shrink-0" />
      <span className="truncate">{label ?? a.label}</span>
    </>
  );
  return a.href ? (
    <Link href={a.href} className={className}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={a.onClick} className={className}>
      {body}
    </button>
  );
}

/**
 * What the employer can do with one application, by its stage: retain or
 * turn down a new one; follow the contact unlock of a retained one; undo a
 * hire. The server decides — these only ask.
 */
/**
 * The conversation with an applicant, when its stage allows one: for a « ⋯ »
 * menu that offers « Message » outside the action buttons.
 */
export function useApplicationChat(applicant: Pick<OfferApplicant, "applicationId" | "status">) {
  const router = useRouter();
  const openChat = useOpenDiscussion();
  const t = useTranslations("offers.actions");
  const friendlyError = useFriendlyError();
  const chatId = chattableApplicationId(applicant.applicationId, applicant.status);
  return {
    available: !!chatId,
    pending: openChat.isPending,
    open: () => {
      if (!chatId) return;
      openChat.mutate(chatId, {
        onSuccess: ({ conversation }) => router.push(`/espace/discussions/${conversation.id}`),
        onError: (err) => toast.error(friendlyError(err, t("chatFailed"))),
      });
    },
  };
}

/** Retenir / Refuser and the rest: for those who hire, not for an Évaluateur. */
export function ApplicationActions(props: Parameters<typeof Actions>[0]) {
  const { role } = useMember();
  return canHire(role) ? <Actions {...props} /> : null;
}

function Actions({
  applicant,
  name,
  variant = "inline",
  recruiting = true,
  hideChat = false,
  request,
}: Readonly<{
  applicant: OfferApplicant;
  name: string;
  /** `dialogs`: no buttons, only the dialogs, opened by `request` (the board's drops). */
  variant?: "inline" | "card" | "compact" | "dialogs";
  /** False once the offer stopped hiring: refusing is all that is left. */
  recruiting?: boolean;
  /** « Message » lives elsewhere (a « ⋯ » menu, `useApplicationChat`). */
  hideChat?: boolean;
  /** Opens « Retenir » from outside (a card dropped on « Retenues »); a new `nonce` opens it again. */
  request?: { dialog: "accept"; nonce: number } | null;
}>) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const openChat = useOpenDiscussion();
  const t = useTranslations("offers.actions");
  const whyNot = useWhyNot();
  const friendlyError = useFriendlyError();
  const [dialog, setDialog] = useState<Dialog>(null);
  // Set during render, not in an effect: each new request opens its dialog once.
  const [handled, setHandled] = useState<number | null>(null);
  if (request && request.nonce !== handled) {
    setHandled(request.nonce);
    setDialog(request.dialog);
  }
  const [reason, setReason] = useState("");
  const id = applicant.applicationId;

  // The card changes at once (application-cache.ts); the refetch after the
  // answer brings the rest (counts, unlock), an error puts it back.
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: offersKey });
    void queryClient.invalidateQueries({ queryKey: mySubscriptionKey });
    void queryClient.invalidateQueries({ queryKey: ["business", "me", "stats"] });
    void queryClient.invalidateQueries({ queryKey: applicationKey(id) });
  };
  const done = (message: string) => {
    refresh();
    setDialog(null);
    setReason("");
    toast.success(message);
  };
  const decide = (status: string) => () => {
    setDialog(null);
    return { undo: showApplicationStatus(queryClient, id, status) };
  };
  const failed = (message: string) => (err: unknown, _vars: unknown, ctx?: { undo: () => void }) => {
    ctx?.undo();
    refresh();
    toast.error(friendlyError(err, message));
  };

  const accept = useMutation({
    mutationFn: () => acceptApplication(id),
    onMutate: decide("ACCEPTED"),
    onSuccess: (d) => {
      // The server's own word: accepted, or waiting for a payment.
      showApplicationStatus(queryClient, id, d.status);
      done(t("retained", { name }));
      // Straight to what happens next: who still has to pay.
      if (d.unlock) setDialog("unlock");
    },
    onError: failed(t("retainFailed")),
  });
  const reject = useMutation({
    mutationFn: () => rejectApplication(id, reason.trim() || undefined),
    onMutate: decide("REJECTED"),
    onSuccess: () => done(t("rejected")),
    onError: failed(t("rejectFailed")),
  });
  const cancel = useMutation({
    mutationFn: () => cancelApplication(id, reason.trim() || undefined),
    onMutate: decide("CANCELLED"),
    onSuccess: () => done(t("cancelled")),
    onError: failed(t("cancelFailed")),
  });

  const rate = useMutation({
    mutationFn: ({ score, note }: { score: number; note?: string }) => rateWorker(id, score, note),
    onSuccess: () => done(t("rated", { name })),
    onError: (err) => toast.error(friendlyError(err, t("rateFailed"))),
  });

  const status = applicant.status;
  const chatId = chattableApplicationId(id, status);
  const hired = ["ACCEPTED", "STARTED", "END"].includes(status);

  // What this stage allows, most useful first; the layout decides how they show.
  const actions: Action[] = [];
  if (status === "PENDING" || status === "VIEWED") {
    if (recruiting) {
      actions.push({ key: "accept", label: t("retain"), icon: UserRoundCheck, tone: "primary", onClick: () => setDialog("accept") });
    }
    actions.push({ key: "reject", label: t("refuse"), icon: UserRoundX, tone: "danger", onClick: () => setDialog("reject") });
  }
  if (status === "WAITING_PAYMENT") {
    actions.push({ key: "unlock", label: t("progress"), icon: IconLockOpen, tone: "default", onClick: () => setDialog("unlock") });
    actions.push({ key: "cancel", label: t("cancelHire"), icon: IconX, tone: "danger", onClick: () => setDialog("cancel") });
  }
  if (status === "END" && !applicant.ratedByEmployer) {
    actions.push({ key: "rate", label: t("rate"), icon: IconStar, tone: "accent", onClick: () => setDialog("rate") });
  }
  if (hired) actions.push({ key: "contact", label: t("contact"), icon: IconAddressBook, tone: "primary", onClick: () => setDialog("contact") });
  if (status === "ACCEPTED") {
    actions.push({ key: "cancel", label: t("cancelHire"), icon: IconX, tone: "danger", onClick: () => setDialog("cancel") });
  }

  const chat = chatId && !hideChat && (
    <button
      type="button"
      disabled={openChat.isPending}
      title={whyNot([openChat.isPending, "wait"])}
      onClick={() =>
        openChat.mutate(chatId, {
          onSuccess: ({ conversation }) => router.push(`/espace/discussions/${conversation.id}`),
          onError: (err) => toast.error(friendlyError(err, t("chatFailed"))),
        })
      }
      aria-label={t("writeTo", { name })}
      className={cn(button, "shrink-0 bg-card hover:bg-card/70")}
    >
      <IconMessageCircle className="size-4" />
      {t("message")}
    </button>
  );

  // Rows: everything as buttons, the danger one first (it was so before).
  // Cards: the same, at their own width, to the card's right: stretched,
  // they turned into long bars once the cards went two to a row.
  // Compact: the main action, the contact as an icon, the rest in a menu.
  const main = variant === "compact" ? actions.find((a) => a.tone !== "danger" && a.key !== "contact") : undefined;
  const contact = actions.find((a) => a.key === "contact");
  const rest = variant === "compact" ? actions.filter((a) => a !== main && a !== contact) : [];

  return (
    <>
      {variant === "dialogs" ? null : variant === "compact" ? (
        <div className="flex shrink-0 items-center gap-1.5">
          {chat}
          {contact && (
            <button
              type="button"
              onClick={contact.onClick}
              aria-label={t("contactOf", { name })}
              title={t("contact")}
              className={cn(button, "bg-card px-2.5 hover:bg-card/70")}
            >
              <IconAddressBook className="size-4" />
            </button>
          )}
          {main &&
            (main.key === "rate" || main.key === "accept" ? (
              <ActionButton action={main} />
            ) : (
              // Narrow rows: the icon, the words in its tooltip.
              <button
                type="button"
                onClick={main.onClick}
                aria-label={main.label}
                title={main.label}
                className={cn(button, TONE[main.tone], "px-2.5")}
              >
                <main.icon className="size-4" />
              </button>
            ))}
          {rest.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger aria-label={t("more")} className={cn(button, "bg-card px-2.5 outline-none hover:bg-card/70")}>
                <IconDots className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 rounded-2xl border-0 bg-card p-1.5 shadow-soft">
                {rest.map((a) => (
                  <DropdownMenuItem
                    key={a.key}
                    onSelect={a.onClick}
                    className={cn(
                      "cursor-pointer gap-2.5 rounded-xl px-3 py-2.5 text-sm focus:bg-page",
                      a.tone === "danger" && "text-destructive focus:bg-destructive/10 focus:text-destructive",
                    )}
                  >
                    <a.icon className="size-4" />
                    {a.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ) : (
        // On a card they share a row with « Avis de l'équipe », at its height.
        <div className={cn("flex flex-wrap gap-2", variant === "card" && "justify-end [&>button]:h-10")}>
          {chat}
          {[...actions]
            .sort((a, b) => Number(b.tone === "danger") - Number(a.tone === "danger"))
            .map((a) => (
              <ActionButton key={a.key} action={a} label={SHORT.has(a.key as "cancel") ? t(`short.${a.key as "cancel" | "unlock" | "contact"}`) : undefined} />
            ))}
        </div>
      )}

      <ContactDialog
        workerId={applicant.worker.id}
        name={name}
        open={dialog === "contact"}
        onOpenChange={(o) => setDialog(o ? "contact" : null)}
        applicationId={hired ? id : undefined}
      />

      <AcceptDialog
        open={dialog === "accept"}
        name={name}
        pending={accept.isPending}
        onOpenChange={(o) => setDialog(o ? "accept" : null)}
        onConfirm={() => accept.mutate()}
      />

      <ActionDialog
        open={dialog === "reject"}
        onOpenChange={(o) => setDialog(o ? "reject" : null)}
        tone="warning"
        icon={<UserRoundX className="size-5" />}
        title={t("refuseTitle", { name })}
        description={t("refuseText")}
        confirmLabel={t("refuse")}
        pending={reject.isPending}
        onConfirm={() => reject.mutate()}
      >
        <RefusalMessageField value={reason} onChange={setReason} />
      </ActionDialog>

      <ActionDialog
        open={dialog === "cancel"}
        onOpenChange={(o) => setDialog(o ? "cancel" : null)}
        tone="warning"
        title={t("cancelTitle", { name })}
        description={t("cancelText")}
        confirmLabel={t("cancelHire")}
        pending={cancel.isPending}
        onConfirm={() => cancel.mutate()}
      >
        <ReasonField value={reason} onChange={setReason} placeholder={t("cancelReason")} />
      </ActionDialog>

      <RateDialog
        open={dialog === "rate"}
        name={name}
        pending={rate.isPending}
        onOpenChange={(o) => setDialog(o ? "rate" : null)}
        onConfirm={(score, note) => rate.mutate({ score, note })}
      />

      <UnlockDialog
        open={dialog === "unlock"}
        applicationId={id}
        name={name}
        onOpenChange={(o) => setDialog(o ? "unlock" : null)}
        onCancelHire={() => setDialog("cancel")}
      />
    </>
  );
}

function ReasonField({ value, onChange, placeholder }: Readonly<{ value: string; onChange: (v: string) => void; placeholder: string }>) {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxLength={500}
      rows={3}
      placeholder={placeholder}
      className="min-h-20 rounded-xl border-0 bg-page px-4 py-3 shadow-none"
    />
  );
}

/** Retaining starts the contact unlock: covered by a running plan, paid without one. */
function AcceptDialog({
  open,
  name,
  pending,
  onOpenChange,
  onConfirm,
}: Readonly<{ open: boolean; name: string; pending: boolean; onOpenChange: (o: boolean) => void; onConfirm: () => void }>) {
  const subscription = useQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription, enabled: open });
  const t = useTranslations("offers.actions");
  const e = subscription.data?.entitlements;

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<UserRoundCheck className="size-5" />}
      title={t("retainTitle", { name })}
      description={t("retainText")}
      confirmLabel={t("retain")}
      pending={pending}
      onConfirm={onConfirm}
    >
      {!e ? (
        <Skeleton className="h-16 rounded-2xl" />
      ) : e.plan ? (
        <p className="rounded-2xl bg-chip-green p-4 text-chip-green-foreground text-sm">
          {t("included", { plan: e.plan.name })}
        </p>
      ) : (
        <p className="rounded-2xl bg-chip-amber p-4 text-chip-amber-foreground text-sm">
          {t("noPlan")}{" "}
          <Link href="/espace/abonnement" className="font-medium underline">
            {t("seePlans")}
          </Link>
        </p>
      )}
    </ActionDialog>
  );
}

/** Who has paid their side of the unlock, until when, and the employer's part when it is not covered. */
function UnlockDialog({
  open,
  applicationId,
  name,
  onOpenChange,
  onCancelHire,
}: Readonly<{ open: boolean; applicationId: string; name: string; onOpenChange: (o: boolean) => void; onCancelHire: () => void }>) {
  const queryClient = useQueryClient();
  const t = useTranslations("offers.actions");
  const locale = useLocale() as Locale;
  const friendlyError = useFriendlyError();
  const detail = useQuery({ queryKey: applicationKey(applicationId), queryFn: () => getApplication(applicationId), enabled: open });
  const u = detail.data?.unlock;
  const pay = useMutation({
    mutationFn: () => payUnlockWithWallet(applicationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offersKey });
      void queryClient.invalidateQueries({ queryKey: applicationKey(applicationId) });
      toast.success(t("paid"));
    },
    onError: (err) => toast.error(friendlyError(err, t("payFailed"))),
  });
  const canPay = !!u && !u.employerPaid && u.walletBalance >= u.employerFee;

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<IconLockOpen className="size-5" />}
      title={t("unlockTitle", { name })}
      description={t("unlockText")}
      confirmLabel={canPay ? t("pay", { amount: fcfa(u.employerFee, locale) }) : t("close")}
      pending={pay.isPending}
      onConfirm={() => (canPay ? pay.mutate() : onOpenChange(false))}
    >
      {detail.isLoading ? (
        <Skeleton className="h-28 rounded-2xl" />
      ) : !u ? (
        <p className="rounded-2xl bg-page p-4 text-muted-foreground text-sm">
          {detail.data?.status === "ACCEPTED"
            ? t("confirmed")
            : friendlyError(detail.error, t("nothingPending"))}
        </p>
      ) : (
        <div className="space-y-3">
          <ul className="space-y-2 rounded-2xl bg-page p-4 text-sm">
            <Step
              done={u.employerPaid}
              label={t("you")}
              hint={u.employerPaid ? (u.employerFee === 0 ? t("includedShort") : t("paidShort")) : t("toPay", { amount: fcfa(u.employerFee, locale) })}
            />
            <Step done={u.workerPaid} label={t("candidate")} hint={u.workerPaid ? t("didConfirm") : t("waitingConfirm")} />
          </ul>
          {u.status !== "UNLOCKED" && (
            <p className="text-muted-foreground text-xs">
              {t("expires", {
                date: new Date(u.expiresAt).toLocaleString(INTL_LOCALE[locale], { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }),
              })}
            </p>
          )}
          {!u.employerPaid && !canPay && (
            <p className="rounded-2xl bg-chip-amber p-3 text-chip-amber-foreground text-sm">
              {t.rich("lowBalance", {
                amount: fcfa(u.walletBalance, locale),
                link: (chunks) => (
                  <Link href="/espace/abonnement" className="font-medium underline">
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          )}
          <button type="button" onClick={onCancelHire} className="text-destructive text-sm hover:underline">
            {t("cancelThis")}
          </button>
        </div>
      )}
    </ActionDialog>
  );
}

function Step({ done, label, hint }: Readonly<{ done: boolean; label: string; hint: string }>) {
  return (
    <li className="flex items-center gap-3">
      {done ? (
        <IconCircleCheckFilled className="size-5 shrink-0 text-whatsapp-dark" />
      ) : (
        <IconCircleDashed className="size-5 shrink-0 text-muted-foreground" />
      )}
      <span className="flex-1 font-medium">{label}</span>
      <span className="text-muted-foreground">{hint}</span>
    </li>
  );
}

/** A finished mission's worker, rated 1 to 5 — what other employers will read. */
function RateDialog({
  open,
  name,
  pending,
  onOpenChange,
  onConfirm,
}: Readonly<{ open: boolean; name: string; pending: boolean; onOpenChange: (o: boolean) => void; onConfirm: (score: number, note?: string) => void }>) {
  const [score, setScore] = useState(0);
  const [note, setNote] = useState("");
  const t = useTranslations("offers.actions");
  const labels = ["", ...(t.raw("rateLabels") as string[])];
  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<IconStar className="size-5" />}
      title={t("rateTitle", { name })}
      description={t("rateText")}
      confirmLabel={t("rateConfirm")}
      confirmDisabled={score === 0}
      confirmDisabledReason={t("rateFirst")}
      pending={pending}
      onConfirm={() => onConfirm(score, note.trim() || undefined)}
    >
      <div className="space-y-3">
        <div role="radiogroup" aria-label={t("score")} className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={score === n}
              aria-label={t("outOf", { n })}
              onClick={() => setScore(n)}
              className="rounded-lg p-1 transition-transform hover:scale-110"
            >
              {n <= score ? <IconStarFilled className="size-8 text-amber-400" /> : <IconStar className="size-8 text-muted-foreground/50" />}
            </button>
          ))}
          <span className="ml-2 font-medium text-sm">{labels[score]}</span>
        </div>
        <ReasonField value={note} onChange={setNote} placeholder={t("rateNote")} />
      </div>
    </ActionDialog>
  );
}
