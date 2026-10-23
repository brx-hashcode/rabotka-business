"use client";

import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { toast } from "sonner";

import { friendlyError } from "#/lib/api/friendly-error";
import { sendSignUpCode, verifySignUpCode } from "#/lib/api/signup-controller";
import { cn } from "#/lib/utils";
import type { AccountValues } from "./account-step";
import { FormError, StepActions, StepHeading } from "./form-bits";

const LENGTH = 6;
const RESEND_SECONDS = 60;

/** The 6-digit code sent to the account email; it hands back the signup token. */
export function VerifyStep({
  account,
  onBack,
  onDone,
}: Readonly<{
  account: AccountValues;
  onBack: () => void;
  onDone: (signupToken: string) => void;
}>) {
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const code = digits.join("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function setAt(index: number, value: string) {
    setDigits((prev) => prev.map((d, i) => (i === index ? value : d)));
  }

  function onChange(index: number, raw: string) {
    const char = raw.replace(/\D/g, "").slice(-1);
    setAt(index, char);
    if (char && index < LENGTH - 1) inputs.current[index + 1]?.focus();
  }

  function onKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) inputs.current[index - 1]?.focus();
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    if (!pasted) return;
    e.preventDefault();
    setDigits(Array.from({ length: LENGTH }, (_, i) => pasted[i] ?? ""));
    inputs.current[Math.min(pasted.length, LENGTH - 1)]?.focus();
  }

  async function verify() {
    if (code.length !== LENGTH) {
      setError("Saisissez les 6 chiffres du code.");
      return;
    }
    setError(null);
    setPending(true);
    try {
      const { signupToken } = await verifySignUpCode(account.email, code);
      onDone(signupToken);
    } catch (err) {
      setError(friendlyError(err, "Ce code n'a pas fonctionné. Réessayez.", { keepUnauthorized: true }));
      setPending(false);
    }
  }

  async function resend() {
    setError(null);
    try {
      await sendSignUpCode({ email: account.email, firstName: account.firstName, lastName: account.lastName });
      setDigits(Array(LENGTH).fill(""));
      setCooldown(RESEND_SECONDS);
      inputs.current[0]?.focus();
      toast.success("Nouveau code envoyé");
    } catch (err) {
      toast.error(friendlyError(err, "Impossible de renvoyer le code."));
    }
  }

  return (
    <form
      noValidate
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        void verify();
      }}
    >
      <StepHeading
        title="Vérifiez votre adresse email"
        text={`Nous avons envoyé un code à 6 chiffres à ${account.email}. Il est valable quelques minutes.`}
      />

      <div className="flex gap-2 sm:gap-2.5">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            value={digit}
            onChange={(e) => onChange(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            onPaste={onPaste}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            autoFocus={i === 0}
            maxLength={1}
            aria-label={`Chiffre ${i + 1}`}
            disabled={pending}
            className={cn(
              "size-12 shrink-0 rounded-xl bg-page text-center font-semibold text-lg outline-none transition-shadow sm:size-14 sm:text-xl",
              "focus-visible:ring-2 focus-visible:ring-whatsapp/40",
            )}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="text-muted-foreground">Vous n&apos;avez rien reçu ?</span>
        <button
          type="button"
          onClick={() => void resend()}
          disabled={cooldown > 0}
          className="font-medium underline-offset-4 hover:underline disabled:text-muted-foreground disabled:no-underline"
        >
          {cooldown > 0 ? `Renvoyer dans ${cooldown} s` : "Renvoyer le code"}
        </button>
        <button type="button" onClick={onBack} className="font-medium underline-offset-4 hover:underline">
          Modifier l&apos;adresse
        </button>
      </div>

      <FormError message={error} />
      <StepActions onBack={onBack} continueLabel="Vérifier" pending={pending} />
    </form>
  );
}
