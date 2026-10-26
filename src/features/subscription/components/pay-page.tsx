"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconCheck,
  IconCircleCheckFilled,
  IconDeviceMobile,
  IconFileInvoice,
  IconLock,
  IconRosetteDiscountCheck,
} from "@tabler/icons-react";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { Loader } from "lucide-react";

import { toast } from "sonner";

import { Bone } from "#/components/page-skeletons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import { getMySubscription, mySubscriptionKey } from "#/lib/api/business-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import { getPaymentByToken, getPaymentGateways, initiatePayment } from "#/lib/api/payment-controller";
import type { BusinessPlan, PaymentOperator } from "#/lib/api/types";
import { cn } from "#/lib/utils";
import { PaymentDialog, REQUEST_SECONDS, type PaymentPhase } from "./payment-dialog";


const POLL_MS = 3000;
/** Settled but no paid period after this many polls: it did not go through. */
const POLL_LIMIT = 8;

const fcfa = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;

/** « Abonnement Rabotka Business Pro — mensuel » → the plan's name and its period. */
function readDescription(description: string | null | undefined) {
  const m = description?.match(/Rabotka Business (.+?)\s+[—-]\s+(mensuel|annuel)/i);
  return m ? { planName: m[1], period: m[2].toLowerCase() as "mensuel" | "annuel" } : null;
}

/** What a plan brings, said as on the Abonnement page. */
function planLines(p: BusinessPlan): string[] {
  return [
    p.unlocksPerPeriod === null ? "Contacts illimités" : `${p.unlocksPerPeriod} contact${p.unlocksPerPeriod > 1 ? "s" : ""} inclus`,
    p.activeOffersLimit === null ? "Offres en ligne illimitées" : `${p.activeOffersLimit} offre${p.activeOffersLimit > 1 ? "s" : ""} en ligne`,
    ...(p.includesPreselection ? ["Recherche de profils"] : []),
    ...(p.includesFieldAgents ? ["Aide d'un agent sur le terrain"] : []),
    ...(p.priorityVisibility ? ["Offres affichées en premier"] : []),
  ];
}

/**
 * Paying a subscription, on the public pay API the client app uses
 * (`pay/:token`): the network, the number, the confirmation on the phone —
 * beside what is being paid for. Once the request is settled `GET pay/:token`
 * answers no more, so success is read from the subscription itself: a new
 * paid period means the payment went through.
 */
export function PayPage({ token }: Readonly<{ token: string }>) {
  const queryClient = useQueryClient();
  const payment = useQuery({ queryKey: ["payment", token], queryFn: () => getPaymentByToken(token), retry: false });
  const gateways = useQuery({ queryKey: ["payment-gateways"], queryFn: getPaymentGateways, staleTime: 10 * 60 * 1000 });
  const subscription = useQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription });

  const gateway = gateways.data?.gateways.find((g) => g.key === (gateways.data?.active ?? payment.data?.gateway));
  // Every country the gateway charges in, from its live configuration — none listed in code.
  const covered = useMemo(() => payCountries(gateway?.operators ?? []), [gateway]);
  const [pickedCountry, setPickedCountry] = useState<string | null>(null);
  const payerCountry = payment.data?.payerCountry ?? null;
  // The payer's own country when it is covered, else Congo, else the first one.
  const country =
    pickedCountry ??
    (covered.find((c) => c.code === payerCountry) ?? covered.find((c) => c.code === "COG") ?? covered[0])?.code ??
    null;
  const current = covered.find((c) => c.code === country) ?? null;
  const payerNotCovered = !!payerCountry && covered.length > 0 && !covered.some((c) => c.code === payerCountry);
  const operators = useMemo<PaymentOperator[]>(() => {
    const all = gateway?.operators ?? [];
    // A gateway that does not say where its networks operate gets its whole list.
    if (!country || all.every((o) => !o.country)) return all;
    return all.filter((o) => o.country === country);
  }, [gateway, country]);

  const [operator, setOperator] = useState<string | null>(null);
  const selected = operators.find((o) => o.code === operator) ?? operators[0] ?? null;
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<PaymentPhase | null>(null);
  const [sending, setSending] = useState(false);
  const [sentAt, setSentAt] = useState(0);
  const [phoneLabel, setPhoneLabel] = useState("");
  const [startsAt, setStartsAt] = useState<string | null>(null);
  const paidBefore = useRef<number | null>(null);
  const polls = useRef(0);

  const dial = selected?.dialCode ?? current?.dialCode ?? "242";

  function chooseCountry(next: string) {
    if (next === country) return;
    // The networks and the number typed were for the old country.
    setPickedCountry(next);
    setOperator(null);
    setDigits("");
    setError(null);
  }
  const amount = payment.data?.amount ?? null;
  const what = readDescription(payment.data?.description);
  const plan = what ? subscription.data?.plans.find((p) => p.name.toLowerCase() === what.planName.toLowerCase()) : undefined;

  async function pay() {
    // The country's own rules: in Congo the leading 0 is part of the number
    // (+242 06 …), where elsewhere it is a trunk prefix to drop.
    const number = parsePhoneNumberFromString(digits, { defaultCallingCode: dial });
    if (!number?.isValid()) {
      setError(dial === "242" ? "Saisissez un numéro de téléphone valide, par exemple 06 123 45 67." : "Saisissez un numéro de téléphone valide.");
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
        phone: number.number,
        ...(gateway?.requiresOperator && selected ? { operator: selected.code } : {}),
      });
      polls.current = 0;
      setPhoneLabel(number.formatInternational());
      setSentAt(Date.now());
      setPhase("waiting");
    } catch (err) {
      setError(friendlyError(err, "Le paiement n'a pas pu être lancé. Réessayez."));
    } finally {
      setSending(false);
    }
  }

  // While the phone confirms: the request settles, then the subscription says how.
  // Past the request's lifetime with nothing settled, it has expired.
  useEffect(() => {
    if (phase !== "waiting") return;
    const timer = setInterval(async () => {
      polls.current += 1;
      let done = false;
      try {
        const p = await getPaymentByToken(token);
        if (p.status === "REJECTED") {
          setPhase("failed");
          return;
        }
        done = p.status === "APPROVED";
      } catch {
        done = true; // Settled requests are no longer served by token.
      }
      if (!done) {
        if (Date.now() - sentAt > REQUEST_SECONDS * 1000) setPhase("expired");
        return;
      }
      const sub = await queryClient.fetchQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription, staleTime: 0 });
      const paidNow = sub.history.filter((p) => p.paid).length;
      if (paidNow > (paidBefore.current ?? 0)) {
        // A lower plan or a renewal is queued: say when it starts, not « now ».
        const queued = sub.upcoming.find((p) => p.planName.toLowerCase() === what?.planName.toLowerCase());
        setStartsAt(queued?.startsAt ?? null);
        setPhase("approved");
      }
      else if (polls.current > POLL_LIMIT) setPhase("failed");
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [phase, token, queryClient, sentAt, what?.planName]);

  return (
    <div className="w-full space-y-6 pt-2">
      <Link href="/espace/abonnement" className="inline-flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground">
        <IconArrowLeft className="size-4" />
        Abonnement
      </Link>
      <div className="space-y-1.5">
        <h1 className="font-semibold text-3xl tracking-tight">Paiement</h1>
        <p className="text-muted-foreground">Réglez votre formule par mobile money : vous validez le paiement sur votre téléphone.</p>
      </div>

      {payment.isError && phase === null ? (
        <section className="mx-auto max-w-xl rounded-3xl bg-card p-6 sm:p-8">
          <Result
            tone="muted"
            title="Ce lien de paiement n'est plus valide"
            text="Il a peut-être déjà été utilisé. Retrouvez votre formule sur la page Abonnement."
          />
        </section>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <section className="rounded-3xl bg-card p-6 sm:p-8">
            {payment.isLoading ? (
              <div className="space-y-6">
                <Bone className="h-4 w-24" />
                <div className="grid grid-cols-2 gap-3">
                  <Bone className="h-20 rounded-2xl" />
                  <Bone className="h-20 rounded-2xl" />
                </div>
                <Bone className="h-4 w-40" />
                <Bone className="h-14 rounded-2xl" />
                <Bone className="h-12 rounded-full" />
              </div>
            ) : (
              <div className="space-y-7">
                {covered.length > 1 && (
                  <div className="space-y-3">
                    <label htmlFor="pay-country" className="flex items-center gap-2 font-medium text-sm">
                      <StepNumber n={1} />
                      Pays du numéro
                    </label>
                    <Select value={country ?? undefined} onValueChange={chooseCountry}>
                      <SelectTrigger id="pay-country" className="!h-14 w-full rounded-2xl border-0 bg-page px-4 text-base shadow-none">
                        <SelectValue placeholder="Choisir un pays" />
                      </SelectTrigger>
                      <SelectContent>
                        {covered.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            <span className="flex items-center gap-2.5">
                              <Flag country={c} />
                              <span>{c.name}</span>
                              {c.dialCode && <span className="text-muted-foreground text-xs">+{c.dialCode}</span>}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {payerNotCovered && (
                      <p className="text-muted-foreground text-xs">
                        Le mobile money de votre pays n&apos;est pas encore accepté : payez avec un numéro d&apos;un des pays de la liste.
                      </p>
                    )}
                  </div>
                )}

                {operators.length > 0 && (
                  <fieldset className="space-y-3">
                    <legend className="mb-3 flex items-center gap-2 font-medium text-sm">
                      <StepNumber n={covered.length > 1 ? 2 : 1} />
                      Votre opérateur
                    </legend>
                    <div role="radiogroup" aria-label="Opérateur" className="grid grid-cols-2 gap-3">
                      {operators.map((o) => {
                        const on = selected?.code === o.code;
                        return (
                          <button
                            key={o.code}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => setOperator(o.code)}
                            className={cn(
                              "relative flex h-20 items-center gap-3 rounded-2xl bg-page px-4 text-left transition-shadow",
                              on ? "ring-2 ring-whatsapp-dark" : "hover:ring-2 hover:ring-foreground/10",
                            )}
                          >
                            {o.logo ? (
                              // A gateway-hosted logo: nothing next/image could optimise.
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={o.logo} alt="" className="size-11 rounded-xl bg-white object-contain p-1" />
                            ) : (
                              <span className="flex size-11 items-center justify-center rounded-xl bg-card">
                                <IconDeviceMobile className="size-5" />
                              </span>
                            )}
                            <span className="font-semibold">{o.label}</span>
                            {on && <IconCircleCheckFilled className="absolute top-2.5 right-2.5 size-5 text-whatsapp-dark" />}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                )}

                <div className="space-y-3">
                  <label htmlFor="pay-phone" className="flex items-center gap-2 font-medium text-sm">
                    <StepNumber n={(covered.length > 1 ? 1 : 0) + (operators.length > 0 ? 1 : 0) + 1} />
                    Numéro mobile money
                  </label>
                  <div className="flex h-14 items-center rounded-2xl bg-page focus-within:ring-2 focus-within:ring-whatsapp-dark">
                    <span className="flex h-full items-center gap-2 pr-3 pl-4 font-semibold text-base">
                      {current && <Flag country={current} />}+{dial}
                    </span>
                    <span aria-hidden className="h-6 w-px bg-foreground/10" />
                    <input
                      id="pay-phone"
                      inputMode="tel"
                      autoComplete="tel-national"
                      value={digits}
                      onChange={(e) => setDigits(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && void pay()}
                      placeholder={dial === "242" ? "06 123 45 67" : "Numéro"}
                      className="h-full flex-1 bg-transparent px-3 text-lg tracking-wide outline-none placeholder:text-muted-foreground/60"
                    />
                  </div>
                  <p className="text-muted-foreground text-xs">Le téléphone qui recevra la demande de validation.</p>
                </div>

                {error && <p className="rounded-2xl bg-destructive/8 px-4 py-3 text-destructive text-sm">{error}</p>}

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => void pay()}
                    disabled={sending || !gateways.data?.active}
                    className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-ink font-semibold text-base text-white transition-colors hover:bg-ink/90 disabled:opacity-60"
                  >
                    {sending ? (
                      <Loader className="size-5 animate-spin" />
                    ) : (
                      <>
                        <IconLock className="size-5" />
                        Payer {amount !== null ? fcfa(amount) : ""}
                      </>
                    )}
                  </button>
                  {!gateways.isLoading && !gateways.data?.active ? (
                    <p className="text-center text-muted-foreground text-sm">Le paiement est momentanément indisponible.</p>
                  ) : (
                    <p className="text-center text-muted-foreground text-xs">Rien n&apos;est prélevé sans votre validation sur le téléphone.</p>
                  )}
                </div>
              </div>
            )}
          </section>

          <PaymentDialog
            phase={phase}
            amount={amount}
            phone={phoneLabel}
            operator={selected}
            sentAt={sentAt}
            planName={what?.planName ?? null}
            startsAt={startsAt}
            onClose={() => {
              if (phase === "waiting") {
                toast("Si vous validez la demande sur votre téléphone, votre formule s'activera quand même.");
              }
              setPhase(null);
            }}
            onResend={() => {
              setPhase(null);
              void pay();
            }}
          />

          <Summary
            loading={payment.isLoading}
            amount={amount}
            description={payment.data?.description ?? null}
            planName={what?.planName ?? null}
            period={what?.period ?? null}
            plan={plan}
          />
        </div>
      )}
    </div>
  );
}

type PayCountry = { code: string; name: string; flag?: string; dialCode?: string };

/** Each country the gateway has networks in, once, in the gateway's order. */
function payCountries(all: readonly PaymentOperator[]): PayCountry[] {
  const out: PayCountry[] = [];
  for (const o of all) {
    if (!o.country || out.some((c) => c.code === o.country)) continue;
    out.push({ code: o.country, name: o.countryName ?? o.country, flag: o.countryFlag, dialCode: o.dialCode });
  }
  return out;
}

function Flag({ country }: Readonly<{ country: PayCountry }>) {
  return country.flag ? (
    // The gateway's flag image: nothing next/image could optimise.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={country.flag} alt="" className="h-4 w-6 shrink-0 rounded-[3px] object-cover" />
  ) : (
    <span className="flex h-4 w-6 shrink-0 items-center justify-center rounded-[3px] bg-foreground/10 font-semibold text-[9px]">
      {country.code.slice(0, 2)}
    </span>
  );
}

function StepNumber({ n }: Readonly<{ n: number }>) {
  return <span className="flex size-6 items-center justify-center rounded-full bg-brand-lime font-semibold text-[#0f2414] text-xs">{n}</span>;
}

/** What is being paid for, and what happens after. */
function Summary({
  loading,
  amount,
  description,
  planName,
  period,
  plan,
}: Readonly<{
  loading: boolean;
  amount: number | null;
  description: string | null;
  planName: string | null;
  period: "mensuel" | "annuel" | null;
  plan?: BusinessPlan;
}>) {
  return (
    <aside className="space-y-6 rounded-3xl bg-card p-6 lg:sticky lg:top-24">
      <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Récapitulatif</p>
      {loading ? (
        <div className="space-y-3">
          <Bone className="h-7 w-40" />
          <Bone className="h-4 w-24" />
          <Bone className="h-24 rounded-2xl" />
        </div>
      ) : (
        <>
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-lime text-[#0f2414]">
              <IconRosetteDiscountCheck className="size-6" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-lg">{planName ? `Formule ${planName}` : (description ?? "Abonnement")}</p>
              {period && <p className="text-muted-foreground text-sm">Abonnement {period}, renouvelable</p>}
            </div>
          </div>
          {plan && (
            <ul className="space-y-2 rounded-2xl bg-page p-4 text-sm">
              {planLines(plan).map((line) => (
                <li key={line} className="flex items-center gap-2">
                  <IconCheck className="size-4 shrink-0 text-whatsapp-dark" />
                  {line}
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-baseline justify-between rounded-2xl bg-page p-4">
            <span className="font-medium">Total à payer</span>
            <span className="font-semibold text-2xl tracking-tight">{amount !== null ? fcfa(amount) : "—"}</span>
          </div>
        </>
      )}
      <div className="space-y-3">
        <p className="font-medium text-sm">Et ensuite</p>
        <ul className="space-y-2.5 text-muted-foreground text-sm">
          <li className="flex gap-2.5">
            <IconDeviceMobile className="mt-0.5 size-4 shrink-0" />
            Vous validez la demande sur votre téléphone.
          </li>
          <li className="flex gap-2.5">
            <IconCircleCheckFilled className="mt-0.5 size-4 shrink-0" />
            Votre formule s&apos;active aussitôt.
          </li>
          <li className="flex gap-2.5">
            <IconFileInvoice className="mt-0.5 size-4 shrink-0" />
            La facture arrive par e-mail et dans Factures.
          </li>
        </ul>
      </div>
    </aside>
  );
}

function Result({
  tone,
  title,
  text,
  retry,
}: Readonly<{ tone: "good" | "bad" | "muted"; title: string; text: string; retry?: () => void }>) {
  const Icon = tone === "good" ? IconCircleCheckFilled : IconAlertTriangle;
  return (
    <div className="space-y-5 py-6 text-center">
      <span
        className={cn(
          "mx-auto flex size-16 items-center justify-center rounded-3xl",
          tone === "good" && "bg-chip-green text-chip-green-foreground",
          tone === "bad" && "bg-destructive/10 text-destructive",
          tone === "muted" && "bg-page text-muted-foreground",
        )}
      >
        <Icon className="size-8" />
      </span>
      <div className="space-y-1.5">
        <h2 className="font-semibold text-2xl tracking-tight">{title}</h2>
        <p className="mx-auto max-w-md text-muted-foreground text-sm">{text}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {retry && (
          <button type="button" onClick={retry} className="inline-flex h-12 items-center rounded-full bg-ink px-6 font-medium text-white hover:bg-ink/90">
            Réessayer
          </button>
        )}
        <Link
          href={tone === "good" ? "/espace" : "/espace/abonnement"}
          className={cn(
            "inline-flex h-12 items-center rounded-full px-6 font-medium",
            retry ? "bg-page hover:bg-page/70" : "bg-ink text-white hover:bg-ink/90",
          )}
        >
          {tone === "good" ? "Aller au tableau de bord" : "Voir mon abonnement"}
        </Link>
      </div>
    </div>
  );
}
