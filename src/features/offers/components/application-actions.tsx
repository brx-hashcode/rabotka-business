"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconAddressBook, IconCheck, IconDots, IconMessageCircle, IconStar, IconStarFilled, IconCircleCheckFilled, IconCircleDashed, IconLockOpen, IconX } from "@tabler/icons-react";
import { toast } from "sonner";

import { ActionDialog } from "#/components/action-dialog";
import { chattableApplicationId } from "#/features/discussions/chattable";
import { ContactDialog } from "#/features/contacts/components/contact-dialog";
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
import { friendlyError } from "#/lib/api/friendly-error";
import { offersKey, type OfferApplicant } from "#/lib/api/offer-controller";
import { cn } from "#/lib/utils";
import { fcfa } from "../offer-labels";

type Dialog = "accept" | "reject" | "cancel" | "unlock" | "rate" | "contact" | null;

type Action = {
  key: string;
  label: string;
  icon: typeof IconCheck;
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

/** Beside other buttons, on a row or a card: the long labels stay for the menu and the dialogs. */
const SHORT: Record<string, string> = { cancel: "Annuler", unlock: "Suivi", contact: "Contact" };

function ActionButton({ action: a, stretch, label }: Readonly<{ action: Action; stretch?: boolean; label?: string }>) {
  const className = cn(button, TONE[a.tone], stretch && "min-w-0 flex-1");
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
export function ApplicationActions({
  applicant,
  name,
  variant = "inline",
}: Readonly<{ applicant: OfferApplicant; name: string; variant?: "inline" | "card" | "compact" }>) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const openChat = useOpenDiscussion();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [reason, setReason] = useState("");
  const id = applicant.applicationId;

  const done = (message: string) => {
    void queryClient.invalidateQueries({ queryKey: offersKey });
    void queryClient.invalidateQueries({ queryKey: mySubscriptionKey });
    void queryClient.invalidateQueries({ queryKey: ["business", "me", "stats"] });
    void queryClient.invalidateQueries({ queryKey: applicationKey(id) });
    setDialog(null);
    setReason("");
    toast.success(message);
  };

  const accept = useMutation({
    mutationFn: () => acceptApplication(id),
    onSuccess: (d) => {
      done(`Candidature de ${name} retenue.`);
      // Straight to what happens next: who still has to pay.
      if (d.unlock) setDialog("unlock");
    },
    onError: (err) => toast.error(friendlyError(err, "La candidature n'a pas pu être acceptée.")),
  });
  const reject = useMutation({
    mutationFn: () => rejectApplication(id, reason.trim() || undefined),
    onSuccess: () => done("Candidature refusée. Le candidat en est prévenu."),
    onError: (err) => toast.error(friendlyError(err, "La candidature n'a pas pu être refusée.")),
  });
  const cancel = useMutation({
    mutationFn: () => cancelApplication(id, reason.trim() || undefined),
    onSuccess: () => done("Recrutement annulé. Le candidat en est prévenu."),
    onError: (err) => toast.error(friendlyError(err, "Le recrutement n'a pas pu être annulé.")),
  });

  const rate = useMutation({
    mutationFn: ({ score, note }: { score: number; note?: string }) => rateWorker(id, score, note),
    onSuccess: () => done(`Merci : votre note pour ${name} est enregistrée.`),
    onError: (err) => toast.error(friendlyError(err, "La note n'a pas pu être enregistrée.")),
  });

  const status = applicant.status;
  const chatId = chattableApplicationId(id, status);
  const hired = ["ACCEPTED", "STARTED", "END"].includes(status);

  // What this stage allows, most useful first; the layout decides how they show.
  const actions: Action[] = [];
  if (status === "PENDING" || status === "VIEWED") {
    actions.push({ key: "accept", label: "Retenir", icon: IconCheck, tone: "primary", onClick: () => setDialog("accept") });
    actions.push({ key: "reject", label: "Refuser", icon: IconX, tone: "danger", onClick: () => setDialog("reject") });
  }
  if (status === "WAITING_PAYMENT") {
    actions.push({ key: "unlock", label: "Voir l'avancement", icon: IconLockOpen, tone: "default", onClick: () => setDialog("unlock") });
    actions.push({ key: "cancel", label: "Annuler le recrutement", icon: IconX, tone: "danger", onClick: () => setDialog("cancel") });
  }
  if (status === "END" && !applicant.ratedByEmployer) {
    actions.push({ key: "rate", label: "Noter", icon: IconStar, tone: "accent", onClick: () => setDialog("rate") });
  }
  if (hired) actions.push({ key: "contact", label: "Voir le contact", icon: IconAddressBook, tone: "primary", onClick: () => setDialog("contact") });
  if (status === "ACCEPTED") {
    actions.push({ key: "cancel", label: "Annuler le recrutement", icon: IconX, tone: "danger", onClick: () => setDialog("cancel") });
  }

  const chat = chatId && (
    <button
      type="button"
      disabled={openChat.isPending}
      onClick={() =>
        openChat.mutate(chatId, {
          onSuccess: ({ conversation }) => router.push(`/espace/discussions/${conversation.id}`),
          onError: (err) => toast.error(friendlyError(err, "La conversation n'a pas pu être ouverte.")),
        })
      }
      aria-label={`Écrire à ${name}`}
      title="Écrire"
      className={cn(button, "shrink-0 bg-card px-2.5 hover:bg-card/70")}
    >
      <IconMessageCircle className="size-4" />
    </button>
  );

  // Rows: everything as buttons, the danger one first (it was so before).
  // Cards: the same, stretched to the card's width.
  // Compact: the main action, the contact as an icon, the rest in a menu.
  const main = variant === "compact" ? actions.find((a) => a.tone !== "danger" && a.key !== "contact") : undefined;
  const contact = actions.find((a) => a.key === "contact");
  const rest = variant === "compact" ? actions.filter((a) => a !== main && a !== contact) : [];

  return (
    <>
      {variant === "compact" ? (
        <div className="flex shrink-0 items-center gap-1.5">
          {chat}
          {contact && (
            <button
              type="button"
              onClick={contact.onClick}
              aria-label={`Voir le contact de ${name}`}
              title="Voir le contact"
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
              <DropdownMenuTrigger aria-label="Plus d'actions" className={cn(button, "bg-card px-2.5 outline-none hover:bg-card/70")}>
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
        <div className={cn("flex gap-2", variant === "card" && "w-full")}>
          {chat}
          {[...actions]
            .sort((a, b) => Number(b.tone === "danger") - Number(a.tone === "danger"))
            .map((a) => (
              <ActionButton key={a.key} action={a} stretch={variant === "card"} label={SHORT[a.key]} />
            ))}
        </div>
      )}

      <ContactDialog
        workerId={applicant.worker.id}
        name={name}
        open={dialog === "contact"}
        onOpenChange={(o) => setDialog(o ? "contact" : null)}
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
        icon={<IconX className="size-5" />}
        title={`Refuser la candidature de ${name} ?`}
        description="Le candidat est prévenu. Vous pouvez lui dire pourquoi, en quelques mots."
        confirmLabel="Refuser"
        pending={reject.isPending}
        onConfirm={() => reject.mutate()}
      >
        <ReasonField value={reason} onChange={setReason} placeholder="Ex. : profil ne correspondant pas aux horaires (facultatif)" />
      </ActionDialog>

      <ActionDialog
        open={dialog === "cancel"}
        onOpenChange={(o) => setDialog(o ? "cancel" : null)}
        tone="warning"
        title={`Annuler le recrutement de ${name} ?`}
        description="Le candidat est prévenu et le poste se libère. Attention : annuler baisse votre note d'employeur."
        confirmLabel="Annuler le recrutement"
        pending={cancel.isPending}
        onConfirm={() => cancel.mutate()}
      >
        <ReasonField value={reason} onChange={setReason} placeholder="Ce qui a changé (facultatif)" />
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

/** Retaining starts the contact unlock: say what it costs before, from the plan. */
function AcceptDialog({
  open,
  name,
  pending,
  onOpenChange,
  onConfirm,
}: Readonly<{ open: boolean; name: string; pending: boolean; onOpenChange: (o: boolean) => void; onConfirm: () => void }>) {
  const subscription = useQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription, enabled: open });
  const e = subscription.data?.entitlements;
  const covered = e?.plan && (e.unlocksRemaining === null || e.unlocksRemaining > 0);

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<IconCheck className="size-5" />}
      title={`Retenir ${name} ?`}
      description="Le candidat est prévenu. Vous obtenez son contact dès qu'il a confirmé."
      confirmLabel="Retenir"
      pending={pending}
      onConfirm={onConfirm}
    >
      {!e ? (
        <Skeleton className="h-16 rounded-2xl" />
      ) : covered ? (
        <p className="rounded-2xl bg-chip-green p-4 text-chip-green-foreground text-sm">
          Contact inclus dans votre formule {e.plan!.name}
          {e.unlocksRemaining === null
            ? "."
            : ` : il vous restera ${e.unlocksRemaining - 1} contact${e.unlocksRemaining - 1 > 1 ? "s" : ""} inclus.`}
        </p>
      ) : (
        <p className="rounded-2xl bg-chip-amber p-4 text-chip-amber-foreground text-sm">
          {e.plan ? "Vous avez utilisé tous les contacts inclus dans votre formule" : "Vous n'avez pas de formule en cours"} : ce
          contact sera payant.{" "}
          <Link href="/espace/abonnement" className="font-medium underline">
            Voir les formules
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
  const detail = useQuery({ queryKey: applicationKey(applicationId), queryFn: () => getApplication(applicationId), enabled: open });
  const u = detail.data?.unlock;
  const pay = useMutation({
    mutationFn: () => payUnlockWithWallet(applicationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: offersKey });
      void queryClient.invalidateQueries({ queryKey: applicationKey(applicationId) });
      toast.success("Paiement effectué.");
    },
    onError: (err) => toast.error(friendlyError(err, "Le paiement n'a pas abouti.")),
  });
  const canPay = !!u && !u.employerPaid && u.walletBalance >= u.employerFee;

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<IconLockOpen className="size-5" />}
      title={`Contact de ${name} : avancement`}
      description="Vous obtenez le contact dès que le candidat a confirmé."
      confirmLabel={canPay ? `Payer ${fcfa(u.employerFee)} avec mon solde` : "Fermer"}
      pending={pay.isPending}
      onConfirm={() => (canPay ? pay.mutate() : onOpenChange(false))}
    >
      {detail.isLoading ? (
        <Skeleton className="h-28 rounded-2xl" />
      ) : !u ? (
        <p className="rounded-2xl bg-page p-4 text-muted-foreground text-sm">
          {detail.data?.status === "ACCEPTED"
            ? "Le candidat a confirmé : son contact s'affiche avec « Contact »."
            : friendlyError(detail.error, "Rien en attente pour cette candidature.")}
        </p>
      ) : (
        <div className="space-y-3">
          <ul className="space-y-2 rounded-2xl bg-page p-4 text-sm">
            <Step
              done={u.employerPaid}
              label="Vous"
              hint={u.employerPaid ? (u.employerFee === 0 ? "inclus dans votre formule" : "payé") : `${fcfa(u.employerFee)} à payer`}
            />
            <Step done={u.workerPaid} label="Le candidat" hint={u.workerPaid ? "a confirmé" : "confirmation en attente"} />
          </ul>
          {u.status !== "UNLOCKED" && (
            <p className="text-muted-foreground text-xs">
              Sans confirmation avant le{" "}
              {new Date(u.expiresAt).toLocaleString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}, la
              candidature est annulée.
            </p>
          )}
          {!u.employerPaid && !canPay && (
            <p className="rounded-2xl bg-chip-amber p-3 text-chip-amber-foreground text-sm">
              Solde insuffisant ({fcfa(u.walletBalance)}).{" "}
              <Link href="/espace/abonnement" className="font-medium underline">
                Passez à une formule qui couvre plus de contacts
              </Link>
              .
            </p>
          )}
          <button type="button" onClick={onCancelHire} className="text-destructive text-sm hover:underline">
            Annuler ce recrutement
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
  const labels = ["", "Décevant", "Moyen", "Bien", "Très bien", "Excellent"];
  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<IconStar className="size-5" />}
      title={`Noter ${name}`}
      description="Votre note compte pour sa fiabilité et aide les autres employeurs."
      confirmLabel="Enregistrer la note"
      confirmDisabled={score === 0}
      pending={pending}
      onConfirm={() => onConfirm(score, note.trim() || undefined)}
    >
      <div className="space-y-3">
        <div role="radiogroup" aria-label="Note" className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={score === n}
              aria-label={`${n} sur 5`}
              onClick={() => setScore(n)}
              className="rounded-lg p-1 transition-transform hover:scale-110"
            >
              {n <= score ? <IconStarFilled className="size-8 text-amber-400" /> : <IconStar className="size-8 text-muted-foreground/50" />}
            </button>
          ))}
          <span className="ml-2 font-medium text-sm">{labels[score]}</span>
        </div>
        <ReasonField value={note} onChange={setNote} placeholder="Un mot sur la mission (facultatif)" />
      </div>
    </ActionDialog>
  );
}
