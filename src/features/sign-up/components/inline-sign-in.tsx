"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { sessionUserKey } from "#/hooks/use-session-user";
import { sendOtp } from "#/lib/api/auth-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import { verifySession } from "#/lib/auth/session-client";
import { CodeInput, completeCode } from "./code-input";
import { FormError, StepActions } from "./form-bits";

const RESEND_SECONDS = 60;

/**
 * Signs in, right here, an account the sign-up created without handing back
 * a session (a backend older than rabotka-backend #934). The login code goes
 * to the same email by itself; the person types it and lands in their space
 * — no detour through the sign-in page.
 */
export function InlineSignIn({ email, onSignedIn }: Readonly<{ email: string; onSignedIn: () => void }>) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const sent = useRef(false);

  // Once per mount, Strict Mode's double effect included.
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    sendOtp(email).catch((err) => setError(friendlyError(err, "Impossible d'envoyer le code de connexion.")));
  }, [email]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function signIn() {
    const otp = completeCode(value);
    if (!otp) {
      setError("Saisissez les 6 chiffres du code.");
      return;
    }
    setError(null);
    setPending(true);
    try {
      const { user } = await verifySession({ email, otp });
      queryClient.setQueryData(sessionUserKey, user);
      onSignedIn();
      // A full load, for the reason SignUpDone gives: never the sign-in dialog.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- deliberate full load, see above
      globalThis.location.assign("/espace");
    } catch (err) {
      setError(friendlyError(err, "Ce code n'a pas fonctionné. Réessayez.", { keepUnauthorized: true }));
      setPending(false);
    }
  }

  async function resend() {
    setError(null);
    try {
      await sendOtp(email);
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
      className="space-y-5 rounded-2xl bg-page p-5"
      onSubmit={(e) => {
        e.preventDefault();
        void signIn();
      }}
    >
      <div className="space-y-1">
        <p className="font-semibold">Accédez à votre espace</p>
        <p className="text-muted-foreground text-sm">
          Nous venons d&apos;envoyer un code de connexion à <span className="font-medium text-foreground">{email}</span>.
        </p>
      </div>
      <CodeInput value={value} onChange={setValue} disabled={pending} boxClassName="bg-card" />
      <button
        type="button"
        onClick={() => void resend()}
        disabled={cooldown > 0}
        className="font-medium text-sm underline-offset-4 hover:underline disabled:text-muted-foreground disabled:no-underline"
      >
        {cooldown > 0 ? `Renvoyer dans ${cooldown} s` : "Renvoyer le code"}
      </button>
      <FormError message={error} />
      <StepActions continueLabel="Se connecter" pending={pending} />
    </form>
  );
}
