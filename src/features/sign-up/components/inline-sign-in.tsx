"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { sessionUserKey } from "#/hooks/use-session-user";
import { sendOtp } from "#/lib/api/auth-controller";
import { useFriendlyError } from "#/lib/api/use-friendly-error";
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
export function InlineSignIn({ email }: Readonly<{ email: string }>) {
  const queryClient = useQueryClient();
  const t = useTranslations("signUp");
  const friendlyError = useFriendlyError();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const sent = useRef(false);

  // Once per mount, Strict Mode's double effect included.
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    sendOtp(email).catch((err) => setError(friendlyError(err, t("inlineSignIn.sendFailed"))));
    // Once per mount: a language change reloads the page anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function signIn() {
    const otp = completeCode(value);
    if (!otp) {
      setError(t("code.incomplete"));
      return;
    }
    setError(null);
    setPending(true);
    try {
      const { user } = await verifySession({ email, otp });
      queryClient.setQueryData(sessionUserKey, user);
      // `pending` stays on until the page is replaced; no store reset, which
      // would flash the empty first step (see SignUpDone).
      // A full load, for the reason SignUpDone gives.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- deliberate full load, see above
      globalThis.location.assign("/espace");
    } catch (err) {
      setError(friendlyError(err, t("code.failed"), { keepUnauthorized: true }));
      setPending(false);
    }
  }

  async function resend() {
    setError(null);
    try {
      await sendOtp(email);
      setValue("");
      setCooldown(RESEND_SECONDS);
      toast.success(t("code.resent"));
    } catch (err) {
      toast.error(friendlyError(err, t("code.resendFailed")));
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
        <p className="font-semibold">{t("inlineSignIn.title")}</p>
        <p className="text-muted-foreground text-sm">
          {t.rich("inlineSignIn.text", {
            email,
            strong: (chunks) => <span className="font-medium text-foreground">{chunks}</span>,
          })}
        </p>
      </div>
      <CodeInput value={value} onChange={setValue} disabled={pending} boxClassName="bg-card" />
      <button
        type="button"
        onClick={() => void resend()}
        disabled={cooldown > 0}
        className="font-medium text-sm underline-offset-4 hover:underline disabled:text-muted-foreground disabled:no-underline"
      >
        {cooldown > 0 ? t("code.resendIn", { seconds: cooldown }) : t("code.resend")}
      </button>
      <FormError message={error} />
      <StepActions continueLabel={t("inlineSignIn.submit")} pending={pending} />
    </form>
  );
}
