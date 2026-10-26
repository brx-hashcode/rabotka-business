"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { friendlyError } from "#/lib/api/friendly-error";
import { sendSignUpCode, verifySignUpCode } from "#/lib/api/signup-controller";
import type { AccountValues } from "./account-step";
import { CodeInput, completeCode } from "./code-input";
import { FormError, StepActions, StepHeading } from "./form-bits";

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
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function verify() {
    const code = completeCode(value);
    if (!code) {
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
      setValue("");
      setCooldown(RESEND_SECONDS);
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
        title="Vérifiez votre adresse e-mail"
        text={`Nous avons envoyé un code à 6 chiffres à ${account.email}. Il est valable quelques minutes.`}
      />

      <CodeInput value={value} onChange={setValue} disabled={pending} />

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
