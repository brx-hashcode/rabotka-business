"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconAlertTriangle,
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
import { BackLink } from "#/components/back-link";
import { getMyPacks, getMySubscription, myBusinessKey, myPacksKey, mySubscriptionKey } from "#/lib/api/business-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import { getPaymentByToken, getPaymentGateways, initiatePayment } from "#/lib/api/payment-controller";
import type { BusinessPlan, PaymentOperator } from "#/lib/api/types";
import { cn } from "#/lib/utils";
import { formatMoney } from "#/features/money/money";
import { CountryPicker, Flag, type PayCountry } from "./country-picker";
import { PaymentDialog, REQUEST_SECONDS, type PaymentPhase } from "./payment-dialog";
import { cvLine } from "./subscription-page";
import { offersPerPeriodLabel } from "../offers-quota";
import { PACKS_HREF, readPackDescription } from "../packs";
import { phonePlaceholder } from "../phone-placeholder";
import { usePacks } from "../use-packs";


const POLL_MS = 3000;
/** Settled but no paid period after this many polls: it did not go through. */
const POLL_LIMIT = 8;


/** « Abonnement Rabotka Business Pro — mensuel » → the plan's name and its period. */
function readDescription(description: string | null | undefined) {
  const m = description?.match(/Rabotka Business (.+?)\s+[—-]\s+(mensuel|annuel)/i);
  return m ? { planName: m[1], period: m[2].toLowerCase() as "mensuel" | "annuel" } : null;
}

/** What a plan brings, said as on the Abonnement page. */
function planLines(p: BusinessPlan): string[] {
  return [
    p.unlocksPerPeriod === null ? "Contacts illimités" : `${p.unlocksPerPeriod} contact${p.unlocksPerPeriod > 1 ? "s" : ""} inclus`,
    offersPerPeriodLabel(p.activeOffersLimit),
    ...(cvLine(p) ? [cvLine(p) as string] : []),
    ...(p.includesPreselection ? ["Recherche de profils"] : []),
    ...(p.priorityVisibility ? ["Offres affichées en premier"] : []),
    ...(p.linkedinPosting ? ["Publication sur LinkedIn"] : []),
    ...(p.hrExports ? ["Exports RH"] : []),
  ];
}

/**
 * Paying a subscription or a pack, on the public pay API the client app uses
 * (`pay/:token`): the network, the number, the confirmation on the phone —
 * beside what is being paid for. Once the request is settled `GET pay/:token`
 * answers no more, so success is read from what it bought: a new paid period,
 * or for a pack (told by its description) new credits.
 */
export function PayPage({ token }: Readonly<{ token: string }>) {
  const queryClient = useQueryClient();
  const payment = useQuery({ queryKey: ["payment", token], queryFn: () => getPaymentByToken(token), retry: false });
  const gateways = useQuery({ queryKey: ["payment-gateways"], queryFn: getPaymentGateways, staleTime: 10 * 60 * 1000 });
  const subscription = useQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription });
  const packs = usePacks();

  const gateway = gateways.data?.gateways?.find((g) => g.key === (gateways.data?.active ?? payment.data?.gateway));
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
  // The operator's reason for refusing, when it gave one worth telling.
  const [failure, setFailure] = useState<string | null>(null);
  // The paid periods known before paying, by id: a new one is the payment's.
  // Counted, they stopped changing once the history (24 rows) was full.
  const paidBefore = useRef<Set<string>>(new Set());
  // A pack's: the credits known before paying.
  const creditsBefore = useRef<Set<string>>(new Set());
  const polls = useRef(0);

  const dial = selected?.dialCode ?? current?.dialCode ?? "242";
  // The network's own prefix (MTN 06, Airtel 05 in Congo).
  const placeholder = phonePlaceholder(selected?.code, dial);

  function chooseCountry(next: string) {
    if (next === country) return;
    // The networks and the number typed were for the old country.
    setPickedCountry(next);
    setOperator(null);
    setDigits("");
    setError(null);
  }
  const amount = payment.data?.amount ?? null;
  // What the chosen network is charged: the price itself in the CFA zone,
  // converted in its own currency elsewhere (dollars in the DRC).
  const charge = payment.data?.prices?.find((p) => p.currency === (selected?.currency ?? "XAF"));
  const amountLabel = charge
    ? formatMoney(charge.amount, charge.currency)
    : amount !== null
      ? formatMoney(amount, "XAF")
      : null;
  const what = readDescription(payment.data?.description);
  /** « 100 CV à analyser » when paying a pack, else null. */
  const pack = readPackDescription(payment.data?.description);
  const plan = what ? subscription.data?.plans.find((p) => p.name.toLowerCase() === what.planName.toLowerCase()) : undefined;

  async function pay() {
    // The country's own rules: in Congo the leading 0 is part of the number
    // (+242 06 …), where elsewhere it is a trunk prefix to drop.
    const number = parsePhoneNumberFromString(digits, { defaultCallingCode: dial });
    if (!number?.isValid()) {
      setError(
        placeholder === "Numéro"
          ? "Saisissez un numéro de téléphone valide."
          : `Saisissez un numéro de téléphone valide, par exemple ${placeholder}.`,
      );
      return;
    }
    if (gateway?.requiresOperator && !selected) {
      setError("Choisissez votre opérateur.");
      return;
    }
    setError(null);
    setSending(true);
    paidBefore.current = new Set((subscription.data?.history ?? []).filter((p) => p.paid).map((p) => p.id));
    creditsBefore.current = new Set((packs.data?.credits ?? []).map((c) => c.id));
    try {
      await initiatePayment(token, {
        phone: number.number,
        ...(gateway?.requiresOperator && selected ? { operator: selected.code } : {}),
      });
      polls.current = 0;
      setFailure(null);
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
          setFailure(p.failureReason ?? null);
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
      if (pack) {
        const now = await queryClient.fetchQuery({ queryKey: myPacksKey, queryFn: getMyPacks, staleTime: 0 });
        if (now.credits.some((c) => !creditsBefore.current.has(c.id))) {
          setPhase("approved");
          // What is left to use, everywhere it shows.
          void queryClient.invalidateQueries({ queryKey: myBusinessKey });
        } else if (polls.current > POLL_LIMIT) setPhase("failed");
        return;
      }
      const sub = await queryClient.fetchQuery({ queryKey: mySubscriptionKey, queryFn: getMySubscription, staleTime: 0 });
      // A new period starts now or after the others: always among the newest 24.
      if (sub.history.some((p) => p.paid && !paidBefore.current.has(p.id))) {
        // A lower plan or a renewal is queued: say when it starts, not « now ».
        const queued = sub.upcoming.find((p) => p.planName.toLowerCase() === what?.planName.toLowerCase());
        setStartsAt(queued?.startsAt ?? null);
        setPhase("approved");
        // Quotas, offers allowed, dashboard figures: everything the plan sets.
        void queryClient.invalidateQueries({ queryKey: myBusinessKey });
      }
      else if (polls.current > POLL_LIMIT) setPhase("failed");
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [phase, token, queryClient, sentAt, what?.planName, pack]);

  return (
    <div className="w-full space-y-6 pt-2">
      <BackLink href="/espace/abonnement" label="Abonnement" current={"Paiement"} />
      <div className="space-y-1.5">
        <h1 className="font-semibold text-3xl tracking-tight">Paiement</h1>
        <p className="text-muted-foreground">
          Réglez votre {pack ? "pack" : "formule"} par mobile money : vous validez le paiement sur votre téléphone.
        </p>
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
                    <CountryPicker
                      id="pay-country"
                      value={country}
                      onChange={chooseCountry}
                      countries={covered}
                      payerCountry={payerCountry}
                    />
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
                      placeholder={placeholder}
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
                        Payer {amountLabel ?? ""}
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
            amount={amountLabel}
            phone={phoneLabel}
            operator={selected}
            sentAt={sentAt}
            planName={what?.planName ?? null}
            startsAt={startsAt}
            failureText={failure}
            back={pack ? { href: PACKS_HREF, label: "Retour aux packs" } : undefined}
            approvedText={
              pack ? `Votre pack est ajouté : ${pack}, valables 12 mois. La facture arrive par e-mail et dans Factures.` : undefined
            }
            onClose={() => {
              if (phase === "waiting") {
                toast(
                  pack
                    ? "Si vous validez la demande sur votre téléphone, votre pack sera ajouté quand même."
                    : "Si vous validez la demande sur votre téléphone, votre formule s'activera quand même.",
                );
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
            amount={amountLabel}
            description={payment.data?.description ?? null}
            planName={what?.planName ?? null}
            period={what?.period ?? null}
            plan={plan}
            pack={pack}
          />
        </div>
      )}
    </div>
  );
}

/** Each country the gateway has networks in, once, in the gateway's order. */
function payCountries(all: readonly PaymentOperator[]): PayCountry[] {
  const out: PayCountry[] = [];
  for (const o of all) {
    if (!o.country || out.some((c) => c.code === o.country)) continue;
    out.push({
      code: o.country,
      name: o.countryName ?? o.country,
      flag: o.countryFlag,
      dialCode: o.dialCode,
      currency: o.currency,
    });
  }
  return out;
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
  pack,
}: Readonly<{
  loading: boolean;
  /** Said in the chosen network's currency. */
  amount: string | null;
  description: string | null;
  planName: string | null;
  period: "mensuel" | "annuel" | null;
  plan?: BusinessPlan;
  /** « 100 CV à analyser » when paying a pack. */
  pack: string | null;
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
              <p className="font-semibold text-lg">
                {pack ? "Pack Rabotka Business" : planName ? `Formule ${planName}` : (description ?? "Abonnement")}
              </p>
              {pack && <p className="text-muted-foreground text-sm">{pack}</p>}
              {period && <p className="text-muted-foreground text-sm">Abonnement {period}, renouvelable</p>}
            </div>
          </div>
          {(plan || pack) && (
            <ul className="space-y-2 rounded-2xl bg-page p-4 text-sm">
              {(pack
                ? ["En plus de votre formule, sans en changer", "Utilisé une fois ceux de votre formule épuisés", "Valable 12 mois"]
                : planLines(plan as BusinessPlan)
              ).map((line) => (
                <li key={line} className="flex items-center gap-2">
                  <IconCheck className="size-4 shrink-0 text-whatsapp-dark" />
                  {line}
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-baseline justify-between rounded-2xl bg-page p-4">
            <span className="font-medium">Total à payer</span>
            <span className="font-semibold text-2xl tracking-tight">{amount ?? "—"}</span>
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
            {pack ? "Votre pack s'ajoute aussitôt." : "Votre formule s'active aussitôt."}
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
