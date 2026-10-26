"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconAddressBook, IconCheck, IconMessageCircle, IconStar, IconStarFilled, IconCircleCheckFilled, IconCircleDashed, IconLockOpen, IconX } from "@tabler/icons-react";
import { toast } from "sonner";

import { ActionDialog } from "#/components/action-dialog";
import { chattableApplicationId } from "#/features/discussions/chattable";
import { useOpenDiscussion } from "#/features/discussions/use-discussions";
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

type Dialog = "accept" | "reject" | "cancel" | "unlock" | "rate" | null;

const button = "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 font-medium text-sm transition-colors";

/**
 * What the employer can do with one application, by its stage: retain or
 * turn down a new one; follow the contact unlock of a retained one; undo a
 * hire. The server decides — these only ask.
 */
export function ApplicationActions({ applicant, name }: Readonly<{ applicant: OfferApplicant; name: string }>) {
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
      done(`${name} est retenu·e.`);
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
  return (
    <>
      {chatId && (
        <button
          type="button"
          disabled={openChat.isPending}
          onClick={() =>
            openChat.mutate(chatId, {
              onSuccess: ({ conversation }) => router.push(`/espace/discussions/${conversation.id}`),
              onError: (err) => toast.error(friendlyError(err, "La discussion n'a pas pu être ouverte.")),
            })
          }
          aria-label={`Écrire à ${name}`}
          title="Écrire"
          className={cn(button, "bg-card px-2.5 hover:bg-card/70")}
        >
          <IconMessageCircle className="size-4" />
        </button>
      )}
      {(status === "PENDING" || status === "VIEWED") && (
        <div className="flex gap-2">
          <button type="button" onClick={() => setDialog("reject")} className={cn(button, "bg-card hover:text-destructive")}>
            <IconX className="size-4" />
            Refuser
          </button>
          <button type="button" onClick={() => setDialog("accept")} className={cn(button, "bg-ink text-white hover:bg-ink/90")}>
            <IconCheck className="size-4" />
            Retenir
          </button>
        </div>
      )}
      {status === "WAITING_PAYMENT" && (
        <button type="button" onClick={() => setDialog("unlock")} className={cn(button, "bg-card hover:bg-card/70")}>
          <IconLockOpen className="size-4" />
          Suivre le déblocage
        </button>
      )}
      {["ACCEPTED", "STARTED", "END"].includes(status) && (
        <div className="flex gap-2">
          {status === "ACCEPTED" && (
            <button type="button" onClick={() => setDialog("cancel")} className={cn(button, "bg-card hover:text-destructive")}>
              Annuler
            </button>
          )}
          {status === "END" && !applicant.ratedByEmployer && (
            <button type="button" onClick={() => setDialog("rate")} className={cn(button, "bg-brand-lime text-[#0f2414] hover:bg-brand-lime/80")}>
              <IconStar className="size-4" />
              Noter
            </button>
          )}
          <Link href={`/espace/contacts#w-${applicant.worker.id}`} className={cn(button, "bg-ink text-white hover:bg-ink/90")}>
            <IconAddressBook className="size-4" />
            Voir le contact
          </Link>
        </div>
      )}

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
        description="Le candidat est prévenu et le poste se libère. Une annulation de votre part pèse sur votre fiabilité d'employeur."
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
      description="Le candidat est prévenu. Vos coordonnées sont échangées dès que sa part du déblocage est réglée."
      confirmLabel="Retenir"
      pending={pending}
      onConfirm={onConfirm}
    >
      {!e ? (
        <Skeleton className="h-16 rounded-2xl" />
      ) : covered ? (
        <p className="rounded-2xl bg-chip-green p-4 text-chip-green-foreground text-sm">
          Déblocage couvert par votre formule {e.plan!.name}
          {e.unlocksRemaining === null
            ? "."
            : ` : il vous restera ${e.unlocksRemaining - 1} contact${e.unlocksRemaining - 1 > 1 ? "s" : ""} sur cette période.`}
        </p>
      ) : (
        <p className="rounded-2xl bg-chip-amber p-4 text-chip-amber-foreground text-sm">
          {e.plan ? "Le quota de contacts de votre formule est épuisé" : "Vous n'avez pas de formule en cours"} : les frais de
          déblocage s&apos;appliqueront.{" "}
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
      toast.success("Votre part du déblocage est réglée.");
    },
    onError: (err) => toast.error(friendlyError(err, "Le paiement n'a pas abouti.")),
  });
  const canPay = !!u && !u.employerPaid && u.walletBalance >= u.employerFee;

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<IconLockOpen className="size-5" />}
      title={`Déblocage du contact — ${name}`}
      description="Les coordonnées sont échangées quand les deux parts sont réglées."
      confirmLabel={canPay ? `Payer ${fcfa(u.employerFee)} avec mon solde` : "Fermer"}
      pending={pay.isPending}
      onConfirm={() => (canPay ? pay.mutate() : onOpenChange(false))}
    >
      {detail.isLoading ? (
        <Skeleton className="h-28 rounded-2xl" />
      ) : !u ? (
        <p className="rounded-2xl bg-page p-4 text-muted-foreground text-sm">
          {detail.data?.status === "ACCEPTED"
            ? "Le déblocage est terminé : le recrutement est confirmé. Ses coordonnées sont dans vos profils contactés."
            : friendlyError(detail.error, "Aucun déblocage en cours pour cette candidature.")}
        </p>
      ) : (
        <div className="space-y-3">
          <ul className="space-y-2 rounded-2xl bg-page p-4 text-sm">
            <Step
              done={u.employerPaid}
              label="Votre part"
              hint={u.employerPaid ? (u.employerFee === 0 ? "couverte par votre formule" : "réglée") : `${fcfa(u.employerFee)} à régler`}
            />
            <Step done={u.workerPaid} label="La part du candidat" hint={u.workerPaid ? "réglée" : "en attente"} />
          </ul>
          {u.status !== "UNLOCKED" && (
            <p className="text-muted-foreground text-xs">
              À régler avant le{" "}
              {new Date(u.expiresAt).toLocaleString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}, sinon
              la candidature est libérée.
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
