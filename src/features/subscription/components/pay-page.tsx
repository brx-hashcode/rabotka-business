"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { IconAlertTriangle, IconCircleCheck, IconDeviceMobile } from "@tabler/icons-react";
import { Loader } from "lucide-react";

import { Skeleton } from "#/components/ui/skeleton";
import { getMySubscription, mySubscriptionKey } from "#/lib/api/business-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import { getPaymentByToken, getPaymentGateways, initiatePayment } from "#/lib/api/payment-controller";
import type { PaymentOperator } from "#/lib/api/types";
import { cn } from "#/lib/utils";

type Step = "form" | "processing" | "approved" | "failed";

const POLL_MS = 3000;
/** Past this, the screen says the payment is still being confirmed. */
const POLL_LIMIT = 60;

const fcfa = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;

/**
 * The dashboard's own pay page for a subscription, on the public pay API the
 * client app uses (`pay/:token`). Mobile money: pick the network, type the
 * number, confirm on the phone. Once the request is settled `GET pay/:token`
 * answers no more, so success is read from the subscription itself: a new
 * paid period means the payment went through.
 */
export function PayPage({ token }: Readonly<{ token: string }>) {
  const queryClient = useQueryClient();
  const payment = useQuery({ queryKey: ["payment", token], queryFn: () => getPaymentByToken(token), retry: false });
  const gateways = useQuery({ queryKey: ["payment-gateways"], queryFn: getPaymentGateways, staleTime: 10 * 60 * 1000 });
  const subscription = useQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription });

  const gateway = gateways.data?.gateways.find((g) => g.key === (gateways.data?.active ?? payment.data?.gateway));
  const operators = useMemo<PaymentOperator[]>(() => {
    const all = gateway?.operators ?? [];
    // Congo first: the networks of the payer's country, when the gateway says.
    const home = all.filter((o) => o.country === (payment.data?.payerCountry ?? "COG"));
    return home.length > 0 ? home : all;
  }, [gateway, payment.data?.payerCountry]);

  const [operator, setOperator] = useState<string | null>(null);
  const selected = operators.find((o) => o.code === operator) ?? operators[0] ?? null;
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("form");
  const [sending, setSending] = useState(false);
  const [slow, setSlow] = useState(false);
  const paidBefore = useRef<number | null>(null);
  const polls = useRef(0);

  const dial = selected?.dialCode ?? "242";

  async function pay() {
    const local = digits.replace(/\D/g, "").replace(/^0(?=\d{8,})/, "");
    if (local.length < 8) {
      setError("Saisissez un numéro de téléphone valide.");
      return;
    }
    if (gateway?.requiresOperator && !selected) {
      setError("Choisissez votre opérateur.");
      return;
    }
    setError(null);
    setSending(true);
    paidBefore.current = (subscription.data?.history ?? []).filter((p) => p.paid).length;
    try {
      await initiatePayment(token, {
        phone: `+${dial}${local}`,
        ...(gateway?.requiresOperator && selected ? { operator: selected.code } : {}),
      });
      polls.current = 0;
      setStep("processing");
    } catch (err) {
      setError(friendlyError(err, "Le paiement n'a pas pu être lancé. Réessayez."));
    } finally {
      setSending(false);
    }
  }

  // While the phone confirms: the request settles, then the subscription says how.
  useEffect(() => {
    if (step !== "processing") return;
    const timer = setInterval(async () => {
      polls.current += 1;
      if (polls.current > POLL_LIMIT) setSlow(true);
      let settled = false;
      try {
        const p = await getPaymentByToken(token);
        if (p.status === "REJECTED") {
          setStep("failed");
          return;
        }
        settled = p.status === "APPROVED";
      } catch {
        settled = true; // Settled requests are no longer served by token.
      }
      if (!settled) return;
      const sub = await queryClient.fetchQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription, staleTime: 0 });
      const paidNow = sub.history.filter((p) => p.paid).length;
      if (paidNow > (paidBefore.current ?? 0)) setStep("approved");
      else if (polls.current > 4) setStep("failed");
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [step, token, queryClient]);

  const amount = payment.data?.amount ?? null;

  return (
    <div className="mx-auto w-full max-w-xl pt-6">
      <div className="space-y-6 rounded-3xl bg-card p-6 sm:p-8">
        {step === "approved" ? (
          <Result
            icon={IconCircleCheck}
            tone="text-whatsapp-dark"
            title="Paiement confirmé"
            text="Votre abonnement est actif. La facture vous est envoyée par e-mail."
          />
        ) : step === "failed" ? (
          <Result
            icon={IconAlertTriangle}
            tone="text-destructive"
            title="Le paiement n'a pas abouti"
            text="Aucun montant n'a été prélevé. Vous pouvez réessayer depuis la page Abonnement."
          />
        ) : payment.isLoading ? (
          <Skeleton className="h-80 rounded-2xl" />
        ) : payment.isError ? (
          <Result
            icon={IconAlertTriangle}
            tone="text-muted-foreground"
            title="Ce lien de paiement n'est plus valide"
            text="Il a peut-être déjà été utilisé. Retrouvez votre abonnement sur la page Abonnement."
          />
        ) : step === "processing" ? (
          <div className="space-y-4 py-6 text-center">
            <Loader className="mx-auto size-10 animate-spin text-ink" />
            <h1 className="font-semibold text-xl">Confirmez sur votre téléphone</h1>
            <p className="text-muted-foreground text-sm">
              Une demande de paiement de {amount !== null ? fcfa(amount) : "votre abonnement"} a été envoyée au +{dial}{" "}
              {digits}. Validez-la avec votre code mobile money.
              {slow ? " La confirmation prend plus de temps que prévu ; vous pouvez revenir plus tard." : ""}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">{payment.data?.description}</p>
              <h1 className="font-semibold text-3xl tracking-tight">{amount !== null ? fcfa(amount) : "—"}</h1>
            </div>

            {operators.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium text-sm">Opérateur</p>
                <div className="grid grid-cols-2 gap-2">
                  {operators.map((o) => (
                    <button
                      key={o.code}
                      type="button"
                      onClick={() => setOperator(o.code)}
                      className={cn(
                        "flex h-14 items-center gap-3 rounded-2xl px-4 text-left text-sm transition-colors",
                        selected?.code === o.code ? "bg-ink text-white" : "bg-page hover:bg-page/70",
                      )}
                    >
                      {o.logo ? (
                        // A gateway-hosted logo: nothing next/image could optimise.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={o.logo} alt="" className="size-7 rounded-md bg-white object-contain" />
                      ) : (
                        <IconDeviceMobile className="size-5" />
                      )}
                      <span className="font-medium">{o.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="pay-phone" className="font-medium text-sm">
                Numéro mobile money
              </label>
              <div className="flex h-12 items-center rounded-xl bg-page focus-within:ring-2 focus-within:ring-whatsapp/40">
                <span className="flex h-full items-center pr-3 pl-4 font-medium text-[15px] text-muted-foreground">+{dial}</span>
                <span aria-hidden className="h-5 w-px bg-foreground/10" />
                <input
                  id="pay-phone"
                  inputMode="tel"
                  autoComplete="tel-national"
                  value={digits}
                  onChange={(e) => setDigits(e.target.value)}
                  placeholder="06 123 45 67"
                  className="h-full flex-1 bg-transparent px-3 text-base outline-none md:text-[15px]"
                />
              </div>
            </div>

            {error && <p className="rounded-xl bg-destructive/8 px-4 py-3 text-destructive text-sm">{error}</p>}

            <button
              type="button"
              onClick={() => void pay()}
              disabled={sending || !gateways.data?.active}
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-ink font-medium text-[15px] text-white transition-colors hover:bg-ink/90 disabled:opacity-60"
            >
              {sending ? <Loader className="size-5 animate-spin text-white" /> : "Payer"}
            </button>
            {!gateways.isLoading && !gateways.data?.active && (
              <p className="text-center text-muted-foreground text-sm">Le paiement est momentanément indisponible.</p>
            )}
          </>
        )}

        {(step === "approved" || step === "failed" || payment.isError) && (
          <Link
            href="/espace/abonnement"
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-ink font-medium text-[15px] text-white hover:bg-ink/90"
          >
            Voir mon abonnement
          </Link>
        )}
      </div>
    </div>
  );
}

function Result({
  icon: Icon,
  tone,
  title,
  text,
}: Readonly<{ icon: typeof IconCircleCheck; tone: string; title: string; text: string }>) {
  return (
    <div className="space-y-3 py-4 text-center">
      <Icon className={cn("mx-auto size-12", tone)} />
      <h1 className="font-semibold text-xl">{title}</h1>
      <p className="text-muted-foreground text-sm">{text}</p>
    </div>
  );
}
